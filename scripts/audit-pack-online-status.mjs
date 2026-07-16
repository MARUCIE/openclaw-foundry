#!/usr/bin/env node
// audit-pack-online-status.mjs
//
// Verifies the user-facing "all job packs are live" contract:
// - every pack listed in the public packs.json catalog has a public pack directory
// - every catalog pack ships the install/download baseline files
// - every catalog card has a guide.html target
// - the /packs page does not treat `tier === "stub"` as offline
// Deprecated alias directories may remain on disk as historical install targets,
// but they must be excluded from packs.json by generate-packs.mjs and guarded by
// audit-pack-public-dedup.mjs.

import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { join, resolve } from 'node:path';

const ROOT = resolve(fileURLToPath(new URL('..', import.meta.url)));
const PACKS_JSON = join(ROOT, 'web', 'public', 'data', 'packs.json');
const PACKS_DIR = join(ROOT, 'web', 'public', 'packs');
const PACKS_PAGE = join(ROOT, 'web', 'app', 'packs', 'page.tsx');
const REQUIRED_FILES = ['CLAUDE.md', 'AGENTS.md', 'settings.json', 'prompts.md', 'install.sh', 'manifest.json', 'guide.html'];

function readJson(path) {
  return JSON.parse(readFileSync(path, 'utf-8'));
}

function fail(message, details = []) {
  console.error(`ERROR: ${message}`);
  for (const detail of details) console.error(`  - ${detail}`);
  process.exit(1);
}

if (!existsSync(PACKS_JSON)) fail(`missing ${PACKS_JSON}`);
if (!existsSync(PACKS_DIR)) fail(`missing ${PACKS_DIR}`);
if (!existsSync(PACKS_PAGE)) fail(`missing ${PACKS_PAGE}`);

const data = readJson(PACKS_JSON);
const packs = Array.isArray(data) ? data : data.packs;
if (!Array.isArray(packs) || packs.length === 0) fail('packs.json has no packs[] array');

function deprecatedAliasOf(id) {
  const manifestPath = join(PACKS_DIR, id, 'manifest.json');
  if (!existsSync(manifestPath)) return '';
  const manifest = readJson(manifestPath);
  const aliasOf = manifest?.deprecated_alias_of;
  return typeof aliasOf === 'string' ? aliasOf : '';
}

const ids = packs.map(p => p?.id).filter(Boolean);
const duplicateIds = ids.filter((id, index) => ids.indexOf(id) !== index);
if (duplicateIds.length > 0) fail('duplicate pack ids in packs.json', [...new Set(duplicateIds)]);

const listedIds = new Set(ids);
const publicDirs = readdirSync(PACKS_DIR)
  .filter(name => statSync(join(PACKS_DIR, name)).isDirectory())
  .sort();
const orphanDirs = publicDirs.filter(id => !listedIds.has(id) && !deprecatedAliasOf(id));
if (orphanDirs.length > 0) fail('public pack directories are not listed in packs.json', orphanDirs);

const missing = [];
for (const id of ids) {
  const packDir = join(PACKS_DIR, id);
  if (!existsSync(packDir)) {
    missing.push(`${id}/`);
    continue;
  }
  for (const file of REQUIRED_FILES) {
    if (!existsSync(join(packDir, file))) missing.push(`${id}/${file}`);
  }
}
if (missing.length > 0) fail('pack online artifacts are incomplete', missing);

const pageSource = readFileSync(PACKS_PAGE, 'utf-8');
const releaseFn = pageSource.match(/const isReleasedPack[\s\S]+?;\n/);
if (!releaseFn) fail('could not locate isReleasedPack in packs page');
if (/tier\s*!==\s*['"]stub['"]/.test(releaseFn[0]) || /tier\s*===\s*['"]stub['"]/.test(releaseFn[0])) {
  fail('isReleasedPack must not use PACK_SPEC tier as availability state', [releaseFn[0].trim()]);
}

console.log(`OK pack online status audit passed: packs=${ids.length}, requiredFiles=${REQUIRED_FILES.length}`);
