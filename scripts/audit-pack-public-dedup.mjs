#!/usr/bin/env node
// audit-pack-public-dedup.mjs
//
// Public /packs must show one best entry per role. Deprecated alias packs can
// remain on disk for historical install targets, but they must not enter the
// public catalog, question tree, or visible duplicate-name set.

import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import { join, resolve } from 'node:path';

const ROOT = resolve(new URL('..', import.meta.url).pathname);
const PACKS_JSON = join(ROOT, 'web', 'public', 'data', 'packs.json');
const PACKS_DIR = join(ROOT, 'web', 'public', 'packs');
const PACKS_PAGE = join(ROOT, 'web', 'app', 'packs', 'page.tsx');

function readJson(path) {
  return JSON.parse(readFileSync(path, 'utf-8'));
}

function readJsonSafe(path) {
  try {
    return readJson(path);
  } catch {
    return null;
  }
}

function normalize(value) {
  return String(value || '')
    .replace(/\([^)]*\)/g, '')
    .replace(/（[^）]*）/g, '')
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase();
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

const catalogIds = new Set(packs.map(p => p?.id).filter(Boolean));
const deprecatedAliases = [];

for (const id of readdirSync(PACKS_DIR).sort()) {
  const dir = join(PACKS_DIR, id);
  if (!statSync(dir).isDirectory()) continue;
  const manifest = readJsonSafe(join(dir, 'manifest.json'));
  const aliasOf = manifest?.deprecated_alias_of;
  if (typeof aliasOf === 'string' && aliasOf.trim()) {
    deprecatedAliases.push({ id, aliasOf: aliasOf.trim() });
  }
}

const findings = [];
for (const { id, aliasOf } of deprecatedAliases) {
  if (catalogIds.has(id)) {
    findings.push(`${id}: deprecated alias is still present in public packs.json`);
  }
  if (!catalogIds.has(aliasOf)) {
    findings.push(`${id}: canonical target "${aliasOf}" is missing from public packs.json`);
  }
}

const page = readFileSync(PACKS_PAGE, 'utf-8');
const explicitPackIds = new Set([...page.matchAll(/packId:\s*'([^']+)'/g)].map(match => match[1]));
for (const match of page.matchAll(/packIds:\s*\[([^\]]*)\]/g)) {
  for (const idMatch of match[1].matchAll(/'([^']+)'/g)) {
    explicitPackIds.add(idMatch[1]);
  }
}
for (const { id } of deprecatedAliases) {
  if (explicitPackIds.has(id)) {
    findings.push(`${id}: deprecated alias is still referenced by /packs question tree`);
  }
}

for (const key of ['nameZh', 'name']) {
  const groups = new Map();
  for (const pack of packs) {
    const norm = normalize(pack?.[key]);
    if (!norm) continue;
    const bucket = groups.get(norm) || [];
    bucket.push(pack.id);
    groups.set(norm, bucket);
  }
  for (const [norm, ids] of groups.entries()) {
    if (ids.length > 1) {
      findings.push(`${key} "${norm}": duplicate visible role packs ${ids.join(', ')}`);
    }
  }
}

if (findings.length > 0) {
  fail(`public pack dedup audit failed (${findings.length} findings)`, findings);
}

console.log(`OK public pack dedup audit passed: publicPacks=${packs.length}, suppressedAliases=${deprecatedAliases.length}`);
