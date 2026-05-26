#!/usr/bin/env node

import { createHash } from 'node:crypto';
import { existsSync, mkdtempSync, readFileSync, readdirSync, rmSync, statSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { spawnSync } from 'node:child_process';

const ROOT = resolve(new URL('..', import.meta.url).pathname);
const PACKS_JSON = join(ROOT, 'web', 'public', 'data', 'packs.json');
const PACKS_DIR = join(ROOT, 'web', 'public', 'packs');
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

function matchConst(source, name) {
  const regex = new RegExp(`(?:const|export const)\\s+${name}\\s*=\\s*(?:process\\.env\\.[A-Z0-9_]+\\s*\\|\\|\\s*)?['"]([^'"]+)['"]`);
  return source.match(regex)?.[1] || '';
}

function parseConfig() {
  const guideSource = readText(GUIDE_SCRIPT);
  const protectedSource = readText(PROTECTED_DOWNLOADS);
  const guideUrl = matchConst(guideSource, 'ROLE_PACKS_GIT_URL');
  const guideRef = matchConst(guideSource, 'ROLE_PACKS_GIT_REF');
  const protectedUrl = matchConst(protectedSource, 'ROLE_PACKS_GIT_URL');
  const protectedRef = matchConst(protectedSource, 'ROLE_PACKS_GIT_REF');
  return { guideUrl, guideRef, protectedUrl, protectedRef };
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
if (!config.guideUrl || !config.guideRef) fail('could not parse role-pack Git config from generate-pack-guides.mjs');
if (config.guideUrl !== config.protectedUrl) {
  fail('role-pack Git URL mismatch', [`guide=${config.guideUrl}`, `protected=${config.protectedUrl}`]);
}
if (config.guideRef !== config.protectedRef) {
  fail('role-pack Git ref mismatch', [`guide=${config.guideRef}`, `protected=${config.protectedRef}`]);
}

const publicIds = publicPackIds();
const allPackIds = packDirs();
const guideProblems = [];
const gitNeedle = `git clone --depth 1 --branch ${config.guideRef} ${config.guideUrl}`;
for (const packId of allPackIds) {
  const guidePath = join(PACKS_DIR, packId, 'guide.html');
  if (!existsSync(guidePath)) {
    guideProblems.push(`${packId}: missing guide.html`);
    continue;
  }
  const guide = readText(guidePath);
  if (!guide.includes(gitNeedle)) guideProblems.push(`${packId}: guide missing pinned Git command ${config.guideRef}`);
}
if (guideProblems.length) fail('guide Git command audit failed', guideProblems);

const tmpRoot = mkdtempSync(join(tmpdir(), 'role-pack-git-release-'));
const cloneDir = join(tmpRoot, 'openclaw-role-packs');
try {
  run('git', ['clone', '--depth', '1', '--branch', config.guideRef, config.guideUrl, cloneDir]);
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
    `OK role-pack Git release ${config.guideRef}: `
    + `${publicIds.length} public packs, ${allPackIds.length} distribution dirs, `
    + `${itemTotal} manifest items, ${checkedFiles} payload files matched`,
  );
} finally {
  if (!keepTemp) rmSync(tmpRoot, { recursive: true, force: true });
  else console.log(`Temp kept: ${tmpRoot}`);
}
