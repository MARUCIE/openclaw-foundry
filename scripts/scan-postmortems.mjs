#!/usr/bin/env node
import { execFileSync } from 'node:child_process';
import { dirname, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { readFileSync, readdirSync, existsSync } from 'node:fs';

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const args = new Set(process.argv.slice(2));
const argList = process.argv.slice(2);

function argValue(name) {
  const index = argList.indexOf(name);
  return index >= 0 ? argList[index + 1] : undefined;
}

function git(args, options = {}) {
  return execFileSync('git', args, {
    cwd: repoRoot,
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', options.allowFailure ? 'pipe' : 'inherit'],
  });
}

function hasDirtyWorktree() {
  return git(['status', '--porcelain'], { allowFailure: true }).trim().length > 0;
}

function resolveBase() {
  const explicit = argValue('--base');
  if (explicit) return explicit;
  if (hasDirtyWorktree()) return 'HEAD';
  if (process.env.GITHUB_EVENT_BEFORE && !/^0+$/.test(process.env.GITHUB_EVENT_BEFORE)) {
    return process.env.GITHUB_EVENT_BEFORE;
  }
  if (process.env.GITHUB_BASE_REF) return `origin/${process.env.GITHUB_BASE_REF}`;
  return 'HEAD~1';
}

function tryGit(args) {
  try {
    return git(args, { allowFailure: true });
  } catch {
    return '';
  }
}

function listChangedFiles(base) {
  const tracked = tryGit(['diff', '--name-only', '--diff-filter=ACMRTUXB', base, '--'])
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean);
  const untracked = tryGit(['ls-files', '--others', '--exclude-standard'])
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean);
  return [...new Set([...tracked, ...untracked])];
}

function readDiff(base, changedFiles) {
  const trackedDiff = tryGit(['diff', '--unified=0', base, '--']);
  const untrackedText = changedFiles
    .filter((file) => tryGit(['ls-files', '--error-unmatch', file]).trim() === '')
    .map((file) => {
      const abs = resolve(repoRoot, file);
      if (!existsSync(abs)) return '';
      try {
        return `\n--- untracked:${file}\n${readFileSync(abs, 'utf8')}\n`;
      } catch {
        return `\n--- untracked:${file}\n`;
      }
    })
    .join('\n');
  return `${trackedDiff}\n${untrackedText}`;
}

function stripYamlValue(value) {
  const trimmed = value.trim();
  if (!trimmed) return '';
  if ((trimmed.startsWith('"') && trimmed.endsWith('"')) || (trimmed.startsWith("'") && trimmed.endsWith("'"))) {
    try {
      return JSON.parse(trimmed);
    } catch {
      return trimmed.slice(1, -1);
    }
  }
  return trimmed;
}

function parseTriggers(markdown) {
  const block = markdown.match(/## Machine Triggers\s*```yaml\n([\s\S]*?)\n```/);
  if (!block) return { paths: [], keywords: [], regex: [] };
  const triggers = { paths: [], keywords: [], regex: [] };
  let section = '';
  for (const rawLine of block[1].split('\n')) {
    const line = rawLine.trim();
    if (!line || line.startsWith('#')) continue;
    if (/^(paths|keywords|regex):\s*$/.test(line)) {
      section = line.replace(/:\s*$/, '');
      continue;
    }
    if (line.startsWith('- ') && section) {
      triggers[section].push(stripYamlValue(line.slice(2)));
    }
  }
  return triggers;
}

function pathMatches(pattern, file) {
  if (pattern.endsWith('/**')) {
    return file.startsWith(pattern.slice(0, -3));
  }
  if (pattern.endsWith('**')) {
    return file.startsWith(pattern.slice(0, -2));
  }
  return file === pattern || file.startsWith(`${pattern}/`);
}

function loadPostmortems() {
  const dir = resolve(repoRoot, 'postmortem');
  if (!existsSync(dir)) return [];
  return readdirSync(dir)
    .filter((name) => /^PM-.*\.md$/.test(name))
    .sort()
    .map((name) => {
      const abs = resolve(dir, name);
      const rel = relative(repoRoot, abs);
      const body = readFileSync(abs, 'utf8');
      return { id: name.replace(/\.md$/, ''), path: rel, triggers: parseTriggers(body) };
    });
}

function evaluate(postmortem, changedFiles, diffText) {
  const matches = [];
  for (const pattern of postmortem.triggers.paths) {
    const hit = changedFiles.find((file) => pathMatches(pattern, file));
    if (hit) matches.push(`path:${pattern} -> ${hit}`);
  }
  for (const keyword of postmortem.triggers.keywords) {
    if (keyword && diffText.includes(keyword)) matches.push(`keyword:${keyword}`);
  }
  for (const pattern of postmortem.triggers.regex) {
    if (!pattern) continue;
    try {
      if (new RegExp(pattern, 'm').test(diffText)) matches.push(`regex:${pattern}`);
    } catch (error) {
      matches.push(`invalid-regex:${pattern}:${error.message}`);
    }
  }
  return matches;
}

const strict = args.has('--strict');
const base = resolveBase();
const changedFiles = listChangedFiles(base);
const diffText = readDiff(base, changedFiles);
const postmortems = loadPostmortems();
const triggered = [];
const blocked = [];

for (const postmortem of postmortems) {
  const matches = evaluate(postmortem, changedFiles, diffText);
  if (matches.length === 0) continue;
  const acknowledgedInDiff = changedFiles.includes(postmortem.path);
  const item = { ...postmortem, matches, acknowledgedInDiff };
  triggered.push(item);
  if (strict && !acknowledgedInDiff) blocked.push(item);
}

console.log(`postmortem scan base=${base}`);
console.log(`changed files: ${changedFiles.length}`);
console.log(`postmortems:   ${postmortems.length}`);
console.log(`triggered:     ${triggered.length}`);

for (const item of triggered) {
  const state = item.acknowledgedInDiff ? 'ACKED_IN_DIFF' : strict ? 'BLOCK' : 'WARN';
  console.log(`\n${state} ${item.id}`);
  for (const match of item.matches.slice(0, 12)) console.log(`  - ${match}`);
  if (item.matches.length > 12) console.log(`  - ... ${item.matches.length - 12} more`);
}

if (blocked.length > 0) {
  console.error('\nFAIL postmortem scan: historical regression trigger(s) matched without updating the matching PM file.');
  process.exit(1);
}

console.log('\nOK postmortem scan passed');
