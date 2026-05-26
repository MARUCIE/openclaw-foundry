#!/usr/bin/env node
// Verify that every generated job pack is reachable from /packs.
//
// The /packs page intentionally renders all catalog packs: released packs are
// installable, while stub packs are visible as pending. This audit prevents a
// generated pack from existing in packs.json but disappearing from the guide UI.

import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const root = resolve(new URL('..', import.meta.url).pathname);
const packsPath = resolve(root, 'web/public/data/packs.json');
const pagePath = resolve(root, 'web/app/packs/page.tsx');

const packsData = JSON.parse(readFileSync(packsPath, 'utf-8'));
const packs = packsData.packs || [];
const page = readFileSync(pagePath, 'utf-8');

const explicitPackIds = new Set([...page.matchAll(/packId:\s*'([^']+)'/g)].map(match => match[1]));
const tabLineIds = new Set([...page.matchAll(/\{\s*id:\s*'([^']+)'\s*,\s*labelKey:\s*'packs\.tab/g)].map(match => match[1]));
const dynamicLineIds = new Set();

for (const item of page.matchAll(/\{\s*id:\s*'[^']+'[\s\S]*?browseTabId:\s*'([^']+)'[\s\S]*?includeLinePacks:\s*true[\s\S]*?options:\s*\[/g)) {
  dynamicLineIds.add(item[1]);
}

const findings = [];
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
