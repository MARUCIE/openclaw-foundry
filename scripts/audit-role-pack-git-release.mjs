#!/usr/bin/env node

import { createHash } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { existsSync, mkdtempSync, readFileSync, readdirSync, rmSync, statSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { spawnSync } from 'node:child_process';

const ROOT = resolve(fileURLToPath(new URL('..', import.meta.url)));
const PACKS_JSON = join(ROOT, 'web', 'public', 'data', 'packs.json');
const PACKS_DIR = join(ROOT, 'web', 'public', 'packs');
const RELEASE_CONFIG = join(ROOT, 'web', 'public', 'data', 'role-pack-release.json');
const GUIDE_SCRIPT = join(ROOT, 'scripts', 'generate-pack-guides.mjs');
const PROTECTED_DOWNLOADS = join(ROOT, 'web', 'lib', 'protected-downloads.ts');

const args = new Set(process.argv.slice(2));
const keepTemp = args.has('--keep-temp');

function readJson(path) {
  return JSON.parse(readFileSync(path, 'utf8'));
}

function readText(path) {
  return readFileSync(path, 'utf8');
}

function parseConfig() {
  const release = readJson(RELEASE_CONFIG);
  return { gitUrl: release.gitUrl || '', gitRef: release.gitRef || '', version: release.version || '' };
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

function sha256(path) {
  return createHash('sha256').update(readFileSync(path)).digest('hex');
}

function shellQuote(value) {
  return `'${String(value).replace(/'/g, `'\\''`)}'`;
}

function packDirs() {
  return readdirSync(PACKS_DIR)
    .filter((name) => statSync(join(PACKS_DIR, name)).isDirectory())
    .sort();
}

function publicPackIds() {
  const raw = readJson(PACKS_JSON);
  const packs = Array.isArray(raw) ? raw : raw.packs;
  if (!Array.isArray(packs) || packs.length === 0) fail('web/public/data/packs.json has no public packs');
  return packs.map((pack) => pack.id).sort();
}

function comparePackPayload(localRoot, remoteRoot, packId, problems) {
  const localPack = join(localRoot, packId);
  const remotePack = join(remoteRoot, packId);
  if (!existsSync(remotePack)) {
    problems.push(`${packId}: missing remote pack directory`);
    return { items: 0, checkedFiles: 0 };
  }

  const required = ['CLAUDE.md', 'AGENTS.md', 'settings.json', 'prompts.md', 'install.sh', 'manifest.json', 'guide.html'];
  for (const file of required) {
    const localPath = join(localPack, file);
    const remotePath = join(remotePack, file);
    if (!existsSync(localPath)) problems.push(`${packId}: missing local ${file}`);
    if (!existsSync(remotePath)) problems.push(`${packId}: missing remote ${file}`);
    if (existsSync(localPath) && existsSync(remotePath) && sha256(localPath) !== sha256(remotePath)) {
      problems.push(`${packId}: ${file} differs between Foundry and Git release`);
    }
  }

  if (!existsSync(join(localPack, 'manifest.json')) || !existsSync(join(remotePack, 'manifest.json'))) {
    return { items: 0, checkedFiles: 0 };
  }

  const localManifest = readJson(join(localPack, 'manifest.json'));
  const remoteManifest = readJson(join(remotePack, 'manifest.json'));
  const localItems = localManifest.items || [];
  const remoteItems = remoteManifest.items || [];
  if (JSON.stringify(localItems) !== JSON.stringify(remoteItems)) {
    problems.push(`${packId}: manifest items differ between Foundry and Git release`);
  }

  let checkedFiles = 0;
  for (const item of localItems) {
    const localPath = join(localPack, item.src || '');
    const remotePath = join(remotePack, item.src || '');
    if (!existsSync(localPath)) {
      problems.push(`${packId}: missing local manifest source ${item.src}`);
      continue;
    }
    if (!existsSync(remotePath)) {
      problems.push(`${packId}: missing remote manifest source ${item.src}`);
      continue;
    }
    checkedFiles += 1;
    if (sha256(localPath) !== sha256(remotePath)) {
      problems.push(`${packId}: manifest source differs ${item.src}`);
    }
  }

  return { items: localItems.length, checkedFiles };
}

const config = parseConfig();
if (!config.gitUrl || !config.gitRef) fail('web/public/data/role-pack-release.json must define gitUrl and gitRef');
const guideSource = readText(GUIDE_SCRIPT);
const protectedSource = readText(PROTECTED_DOWNLOADS);
for (const [file, source] of [
  ['scripts/generate-pack-guides.mjs', guideSource],
  ['web/lib/protected-downloads.ts', protectedSource],
]) {
  if (!source.includes('role-pack-release.json')) {
    fail('role-pack release config is not the single source of truth', [`${file} does not read role-pack-release.json`]);
  }
}

const publicIds = publicPackIds();
const allPackIds = packDirs();
const guideProblems = [];
const gitNeedle = `git clone --depth 1 --branch ${shellQuote(config.gitRef)} ${shellQuote(config.gitUrl)}`;
const htmlGitNeedle = gitNeedle.replace(/'/g, '&#39;');
for (const packId of allPackIds) {
  const guidePath = join(PACKS_DIR, packId, 'guide.html');
  if (!existsSync(guidePath)) {
    guideProblems.push(`${packId}: missing guide.html`);
    continue;
  }
  const guide = readText(guidePath);
  if (!guide.includes(htmlGitNeedle)) guideProblems.push(`${packId}: guide missing pinned Git command ${config.gitRef}`);
}
if (guideProblems.length) fail('guide Git command audit failed', guideProblems);

const tmpRoot = mkdtempSync(join(tmpdir(), 'role-pack-git-release-'));
const cloneDir = join(tmpRoot, 'openclaw-role-packs');
try {
  run('git', ['clone', '--depth', '1', '--branch', config.gitRef, config.gitUrl, cloneDir]);
  run('npm', ['run', 'validate'], { cwd: cloneDir });
  run('npm', ['run', 'smoke:install'], { cwd: cloneDir });

  const remotePacksDir = join(cloneDir, 'packs');
  const remotePackIds = readdirSync(remotePacksDir)
    .filter((name) => statSync(join(remotePacksDir, name)).isDirectory())
    .sort();
  const missingRemoteIds = allPackIds.filter((id) => !remotePackIds.includes(id));
  const extraRemoteIds = remotePackIds.filter((id) => !allPackIds.includes(id));

  const problems = [
    ...missingRemoteIds.map((id) => `${id}: missing from remote Git release`),
    ...extraRemoteIds.map((id) => `${id}: extra in remote Git release`),
  ];
  let itemTotal = 0;
  let checkedFiles = 0;
  for (const packId of allPackIds) {
    const result = comparePackPayload(PACKS_DIR, remotePacksDir, packId, problems);
    itemTotal += result.items;
    checkedFiles += result.checkedFiles;
  }

  if (problems.length) fail('role-pack Git release drift detected', problems.slice(0, 80));

  console.log(
    `OK role-pack Git release ${config.gitRef}: `
    + `${publicIds.length} public packs, ${allPackIds.length} distribution dirs, `
    + `${itemTotal} manifest items, ${checkedFiles} payload files matched`,
  );
} finally {
  if (!keepTemp) rmSync(tmpRoot, { recursive: true, force: true });
  else console.log(`Temp kept: ${tmpRoot}`);
}
