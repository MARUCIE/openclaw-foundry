#!/usr/bin/env node
// Remove protected pack payloads from the static export. This prevents direct
// unauthenticated Pages URLs such as /packs/<id>/install.sh from bypassing the
// Worker auth gate.

import { readdirSync, rmSync, statSync } from 'node:fs';
import { join, resolve } from 'node:path';

const ROOT = resolve(new URL('..', import.meta.url).pathname);
const PACKS_DIR = resolve(process.env.PACKS_DIR || join(ROOT, 'web', 'out', 'packs'));
const PUBLIC_ONLY = new Set(['guide.html']);

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
  rmSync(file);
  removed += 1;
}

console.log(`OK pruned ${removed} protected pack payload file(s) from ${PACKS_DIR}`);
