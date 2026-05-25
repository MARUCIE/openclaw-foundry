#!/usr/bin/env node
// Tombstone protected pack payloads in the static export. This prevents direct
// unauthenticated Pages URLs such as /packs/<id>/install.sh from bypassing the
// Worker/R2 auth gate, while also overwriting stale Cloudflare Pages assets from
// older deployments.

import { readdirSync, statSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';

const ROOT = resolve(new URL('..', import.meta.url).pathname);
const PACKS_DIR = resolve(process.env.PACKS_DIR || join(ROOT, 'web', 'out', 'packs'));
const PUBLIC_ONLY = new Set(['guide.html']);
const TOMBSTONE = [
  '# Protected pack payload',
  '',
  'This public Pages URL intentionally does not serve pack payload content.',
  'Use the authenticated Agent Foundry install or download flow so the file is issued from the Worker/R2 gate.',
  '',
].join('\n');

function walk(dir) {
  const out = [];
  for (const name of readdirSync(dir)) {
    const path = join(dir, name);
    const st = statSync(path);
    if (st.isDirectory()) out.push(...walk(path));
    else out.push(path);
  }
  return out;
}

let removed = 0;
for (const file of walk(PACKS_DIR)) {
  const name = file.split('/').pop() || '';
  if (PUBLIC_ONLY.has(name)) continue;
  writeFileSync(file, TOMBSTONE);
  removed += 1;
}

console.log(`OK tombstoned ${removed} protected pack payload file(s) in ${PACKS_DIR}`);
