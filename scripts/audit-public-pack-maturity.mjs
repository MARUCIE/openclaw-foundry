#!/usr/bin/env node
// audit-public-pack-maturity.mjs
//
// Public /packs cards must not regress to the Basic/stub tier. The tier itself
// is still injected by scripts/inject-pack-tiers.mjs from the canonical Python
// audit. This script only enforces the public catalog minimum.

import { existsSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { join, resolve } from 'node:path';

const ROOT = resolve(fileURLToPath(new URL('..', import.meta.url)));
const PACKS_JSON = join(ROOT, 'web', 'public', 'data', 'packs.json');

function fail(message, details = []) {
  console.error(`ERROR: ${message}`);
  for (const detail of details) console.error(`  - ${detail}`);
  process.exit(1);
}

if (!existsSync(PACKS_JSON)) fail(`missing ${PACKS_JSON}`);

const data = JSON.parse(readFileSync(PACKS_JSON, 'utf-8'));
const packs = Array.isArray(data) ? data : data.packs;
if (!Array.isArray(packs) || packs.length === 0) fail('packs.json has no packs[] array');

const stubs = packs
  .filter(pack => pack?.tier === 'stub')
  .map(pack => `${pack.id} (${pack.nameZh || pack.name || 'unnamed'})`);

if (stubs.length > 0) {
  fail('public pack maturity audit failed: public catalog still contains Basic/stub packs', stubs);
}

const enriched = packs.filter(pack => pack?.tier === 'enriched').length;
const certified = packs.filter(pack => pack?.tier === 'certified').length;
console.log(`OK public pack maturity audit passed: packs=${packs.length}, enriched=${enriched}, certified=${certified}, stub=0`);
