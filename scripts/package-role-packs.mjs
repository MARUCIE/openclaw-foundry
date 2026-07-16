#!/usr/bin/env node

import { existsSync, mkdirSync, mkdtempSync, readFileSync, readdirSync, rmSync, statSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { tmpdir } from 'node:os';
import { basename, join, resolve } from 'node:path';
import { spawnSync } from 'node:child_process';

const ROOT = resolve(fileURLToPath(new URL('..', import.meta.url)));
const PACKS_JSON = join(ROOT, 'web', 'public', 'data', 'packs.json');
const PACKS_DIR = join(ROOT, 'web', 'public', 'packs');
const RELEASE_CONFIG = join(ROOT, 'web', 'public', 'data', 'role-pack-release.json');

const args = process.argv.slice(2);

function argValue(name, fallback = '') {
  const eq = args.find((arg) => arg.startsWith(`${name}=`));
  if (eq) return eq.slice(name.length + 1);
  const index = args.indexOf(name);
  return index >= 0 ? args[index + 1] || fallback : fallback;
}

const scope = argValue('--scope', 'public');
const explicitOut = argValue('--out');
const skipVerify = args.includes('--no-verify');
const keepTemp = args.includes('--keep-temp');

function readJson(path) {
  return JSON.parse(readFileSync(path, 'utf8'));
}

function readText(path) {
  return readFileSync(path, 'utf8');
}

function fail(message, details = []) {
  console.error(`ERROR ${message}`);
  for (const detail of details) console.error(`- ${detail}`);
  process.exit(1);
}

function run(command, args, options = {}) {
  const result = spawnSync(command, args, {
    cwd: ROOT,
    encoding: 'utf8',
    stdio: options.stdio || 'pipe',
    ...options,
  });
  if (result.status !== 0) {
    const output = [result.stdout, result.stderr].filter(Boolean).join('\n').trim();
    fail(`${command} ${args.join(' ')} failed`, output ? [output] : []);
  }
  return result;
}

function configuredGitRef() {
  return readJson(RELEASE_CONFIG).gitRef || 'unknown';
}

function stamp() {
  return new Date().toISOString().replace(/[-:]/g, '').replace(/\..+/, '').replace('T', '-');
}

function publicPackIds() {
  const raw = readJson(PACKS_JSON);
  const packs = Array.isArray(raw) ? raw : raw.packs;
  if (!Array.isArray(packs) || packs.length === 0) fail('web/public/data/packs.json has no packs[] array');
  return packs.map((pack) => pack.id).sort();
}

function allPackIds() {
  return readdirSync(PACKS_DIR)
    .filter((name) => statSync(join(PACKS_DIR, name)).isDirectory())
    .sort();
}

function selectedPackIds() {
  if (scope === 'public') return publicPackIds();
  if (scope === 'all') return allPackIds();
  fail('unsupported --scope value', ['Use --scope public or --scope all']);
}

function manifestFor(packId) {
  return readJson(join(PACKS_DIR, packId, 'manifest.json'));
}

function zipSourcesFor(packId) {
  const manifest = manifestFor(packId);
  const sources = [packId];
  if (manifest.deprecated_alias_of && existsSync(join(PACKS_DIR, manifest.deprecated_alias_of))) {
    sources.push(manifest.deprecated_alias_of);
  }
  return [...new Set(sources)];
}

function expectedManifestFor(packId) {
  const manifest = manifestFor(packId);
  if (manifest.deprecated_alias_of && existsSync(join(PACKS_DIR, manifest.deprecated_alias_of, 'manifest.json'))) {
    return manifestFor(manifest.deprecated_alias_of);
  }
  return manifest;
}

function validatePackBeforeZip(packId, gitRef) {
  const packDir = join(PACKS_DIR, packId);
  const required = ['CLAUDE.md', 'AGENTS.md', 'settings.json', 'prompts.md', 'install.sh', 'manifest.json', 'guide.html'];
  const problems = [];
  for (const file of required) {
    if (!existsSync(join(packDir, file))) problems.push(`${packId}: missing ${file}`);
  }
  if (problems.length) return problems;

  const manifest = manifestFor(packId);
  for (const item of manifest.items || []) {
    if (!item.src || item.src.includes('..')) problems.push(`${packId}: unsafe manifest src ${item.src}`);
    else if (!existsSync(join(packDir, item.src))) problems.push(`${packId}: missing manifest source ${item.src}`);
  }

  const guide = readText(join(packDir, 'guide.html'));
  if (!guide.includes(`--branch &#39;${gitRef}&#39;`)) problems.push(`${packId}: guide missing configured Git ref ${gitRef}`);
  return problems;
}

function countInstalledFiles(target) {
  const result = run('find', [target, '-type', 'f']);
  const output = result.stdout.trim();
  return output ? output.split('\n').length : 0;
}

const gitRef = configuredGitRef();
const ids = selectedPackIds();
const outDir = resolve(explicitOut || join(ROOT, 'dist', `role-pack-zips-${stamp()}-${scope}`));
mkdirSync(outDir, { recursive: true });

const preflightProblems = [];
for (const id of ids) preflightProblems.push(...validatePackBeforeZip(id, gitRef));
if (preflightProblems.length) fail('role-pack zip preflight failed', preflightProblems.slice(0, 80));

const rows = [];
for (const id of ids) {
  const zipPath = join(outDir, `${id}.zip`);
  const sources = zipSourcesFor(id);
  run('zip', ['-qr', zipPath, ...sources], { cwd: PACKS_DIR, stdio: 'inherit' });
  const manifest = expectedManifestFor(id);
  const items = manifest.items || [];
  rows.push({
    id,
    zip: basename(zipPath),
    zipSources: sources,
    deprecatedAliasOf: manifestFor(id).deprecated_alias_of || '',
    bytes: statSync(zipPath).size,
    expectedInstalledFiles: items.length,
    skills: items.filter((item) => item.type === 'skill').length,
    agents: items.filter((item) => item.type === 'agent').length,
    references: items.filter((item) => item.type === 'reference').length,
  });
}

const bundleName = `openclaw-role-packs-${scope}-${gitRef.replace(/[^A-Za-z0-9.-]+/g, '-')}.zip`;
run('zip', ['-qr', join(outDir, bundleName), ...ids], { cwd: PACKS_DIR, stdio: 'inherit' });

const checksumOutput = run(
  'shasum',
  ['-a', '256', ...rows.map((row) => join(outDir, row.zip)), join(outDir, bundleName)],
  { cwd: ROOT },
).stdout;
writeFileSync(join(outDir, 'SHA256SUMS.txt'), checksumOutput);

const verifyFailures = [];
let verifyRoot = '';
if (!skipVerify) {
  verifyRoot = mkdtempSync(join(tmpdir(), 'role-pack-zip-smoke-'));
  try {
    for (const row of rows) {
      const zipPath = join(outDir, row.zip);
      const list = run('zipinfo', ['-1', zipPath]).stdout.split('\n').filter(Boolean);
      for (const required of [`${row.id}/manifest.json`, `${row.id}/install.sh`, `${row.id}/guide.html`, `${row.id}/CLAUDE.md`, `${row.id}/AGENTS.md`]) {
        if (!list.includes(required)) verifyFailures.push(`${row.id}: zip missing ${required}`);
      }

      const extractDir = join(verifyRoot, 'extract', row.id);
      mkdirSync(extractDir, { recursive: true });
      run('unzip', ['-q', zipPath, '-d', extractDir]);
      const target = join(verifyRoot, 'install', row.id);
      run('bash', [join(extractDir, row.id, 'install.sh'), '--agent=codex', '--target', target]);
      const installed = countInstalledFiles(target);
      if (installed !== row.expectedInstalledFiles) {
        verifyFailures.push(`${row.id}: installed ${installed}, expected ${row.expectedInstalledFiles}`);
      }
    }
  } finally {
    if (!keepTemp) rmSync(verifyRoot, { recursive: true, force: true });
  }
}

if (verifyFailures.length) fail('role-pack zip smoke failed', verifyFailures.slice(0, 80));

const summary = {
  generatedAt: new Date().toISOString(),
  gitRef,
  scope,
  packCount: rows.length,
  allInOneZip: bundleName,
  verified: !skipVerify,
  packs: rows,
};
writeFileSync(join(outDir, 'manifest-summary.json'), `${JSON.stringify(summary, null, 2)}\n`);
writeFileSync(
  join(outDir, 'README.md'),
  [
    '# OpenClaw Role Pack Zips',
    '',
    `Generated at: ${summary.generatedAt}`,
    `Git install ref: ${gitRef}`,
    `Scope: ${scope}`,
    `Pack count: ${rows.length}`,
    `All-in-one archive: ${bundleName}`,
    '',
    'Each per-pack zip contains one complete role/job pack directory.',
    'Deprecated alias zips include their canonical sibling directory when needed.',
    '',
  ].join('\n'),
);

console.log(
  `OK role-pack zips: ${rows.length} per-pack archives + ${bundleName} `
  + `(${scope}, verified=${!skipVerify}) -> ${outDir}`,
);
