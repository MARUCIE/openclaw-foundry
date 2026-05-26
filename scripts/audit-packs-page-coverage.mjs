#!/usr/bin/env node
// Verify that every public catalog job pack is reachable from /packs.
//
// The /packs page intentionally renders all non-deprecated catalog packs.
// PACK_SPEC tier is a maturity signal only; `stub` packs must remain visible as
// Basic live packs when their generated artifacts exist. Deprecated alias packs
// are suppressed before packs.json is written and guarded by
// audit-pack-public-dedup.mjs.
// The question tree groups packs by task domain, so every pack must be assigned
// to at least one packIds cluster or covered by an explicit dynamic line rule.

import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const root = resolve(new URL('..', import.meta.url).pathname);
const packsPath = resolve(root, 'web/public/data/packs.json');
const pagePath = resolve(root, 'web/app/packs/page.tsx');

const packsData = JSON.parse(readFileSync(packsPath, 'utf-8'));
const packs = packsData.packs || [];
const page = readFileSync(pagePath, 'utf-8');

const explicitPackIds = new Set([...page.matchAll(/packId:\s*'([^']+)'/g)].map(match => match[1]));
for (const match of page.matchAll(/packIds:\s*\[([^\]]*)\]/g)) {
  for (const idMatch of match[1].matchAll(/'([^']+)'/g)) {
    explicitPackIds.add(idMatch[1]);
  }
}
const tabLineIds = new Set([...page.matchAll(/\{\s*id:\s*'([^']+)'\s*,\s*labelKey:\s*'packs\.tab/g)].map(match => match[1]));
const dynamicLineIds = new Set();

for (const item of page.matchAll(/\{\s*id:\s*'[^']+'[\s\S]*?browseTabId:\s*'([^']+)'[\s\S]*?includeLinePacks:\s*true[\s\S]*?options:\s*\[/g)) {
  dynamicLineIds.add(item[1]);
}

const findings = [];
const catalogIds = new Set(packs.map(pack => pack.id).filter(Boolean));
for (const explicitId of explicitPackIds) {
  if (!catalogIds.has(explicitId)) {
    findings.push(`${explicitId}: referenced in /packs question tree but missing from packs.json`);
  }
}

for (const pack of packs) {
  if (!pack?.id || !pack?.line) {
    findings.push(`invalid pack metadata: ${JSON.stringify(pack)}`);
    continue;
  }
  const coveredByExplicitOption = explicitPackIds.has(pack.id);
  const coveredByDynamicLine = dynamicLineIds.has(pack.line);
  if (!coveredByExplicitOption && !coveredByDynamicLine) {
    findings.push(`${pack.id}: not reachable from question tree or dynamic line expansion`);
  }
  if (!tabLineIds.has(pack.line) && pack.line !== 'all') {
    findings.push(`${pack.id}: line "${pack.line}" missing from browse tabs`);
  }
}

if (findings.length > 0) {
  console.error(`ERROR: /packs page coverage audit failed (${findings.length} findings).`);
  for (const finding of findings) console.error(`- ${finding}`);
  process.exit(1);
}

console.log(`OK /packs page coverage audit passed: packs=${packs.length} lines=${new Set(packs.map(p => p.line)).size}`);
