#!/usr/bin/env node
// Upload pack payload files to R2 so CF Pages can stop serving them as public
// static assets. Public guide.html remains on Pages; install/config/artifact
// payloads are served by the Worker after session/token validation.

import { readdirSync, statSync } from 'node:fs';
import { join, relative, resolve } from 'node:path';
import { spawnSync } from 'node:child_process';

const ROOT = resolve(new URL('..', import.meta.url).pathname);
const PACKS_DIR = resolve(process.env.PACKS_DIR || join(ROOT, 'web', 'public', 'packs'));
const WORKER_DIR = join(ROOT, 'worker');
const BUCKET = process.env.FOUNDRY_PACKS_R2_BUCKET || 'openclaw-foundry-files';

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

function contentType(path) {
  if (path.endsWith('.json')) return 'application/json; charset=utf-8';
  if (path.endsWith('.html')) return 'text/html; charset=utf-8';
  if (path.endsWith('.sh')) return 'text/x-shellscript; charset=utf-8';
  if (path.endsWith('.md')) return 'text/markdown; charset=utf-8';
  if (path.endsWith('.csv')) return 'text/csv; charset=utf-8';
  return 'application/octet-stream';
}

const files = walk(PACKS_DIR).filter((file) => {
  const rel = relative(PACKS_DIR, file).replaceAll('\\', '/');
  return !PUBLIC_ONLY.has(rel.split('/').pop() || '');
});

console.log(`Uploading ${files.length} protected pack file(s) to R2 bucket ${BUCKET}`);
for (const file of files) {
  const rel = relative(PACKS_DIR, file).replaceAll('\\', '/');
  const key = `packs/${rel}`;
  const result = spawnSync('npx', [
    'wrangler',
    'r2',
    'object',
    'put',
    `${BUCKET}/${key}`,
    '--file',
    file,
    '--content-type',
    contentType(file),
    '--remote',
  ], {
    cwd: WORKER_DIR,
    stdio: 'inherit',
    env: process.env,
  });
  if (result.status !== 0) {
    process.exit(result.status || 1);
  }
}

console.log('OK protected pack files uploaded to R2');
