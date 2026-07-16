#!/usr/bin/env node
// Upload pack payload files to R2 so CF Pages can stop serving them as public
// static assets. Public guide.html remains on Pages; install/config/artifact
// payloads are served by the Worker after session/token validation.

import { existsSync, readdirSync, statSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { join, relative, resolve } from 'node:path';
import { spawn } from 'node:child_process';

const ROOT = resolve(fileURLToPath(new URL('..', import.meta.url)));
const PACKS_DIR = resolve(process.env.PACKS_DIR || join(ROOT, 'web', 'public', 'packs'));
const WORKER_DIR = join(ROOT, 'worker');
const BUCKET = process.env.FOUNDRY_PACKS_R2_BUCKET || 'openclaw-foundry-files';
const DRY_RUN = process.argv.includes('--dry-run');
const CONCURRENCY = parsePositiveInt(process.env.R2_UPLOAD_CONCURRENCY, 4);
const RETRIES = parsePositiveInt(process.env.R2_UPLOAD_RETRIES, 4);
const RETRY_BASE_MS = parsePositiveInt(process.env.R2_UPLOAD_RETRY_BASE_MS, 1_000);
const LOCAL_WRANGLER = join(
  WORKER_DIR,
  'node_modules',
  '.bin',
  process.platform === 'win32' ? 'wrangler.cmd' : 'wrangler',
);

const PUBLIC_ONLY = new Set(['guide.html']);

function parsePositiveInt(value, fallback) {
  const parsed = Number.parseInt(String(value || ''), 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

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

function wranglerArgs(file, key) {
  return [
    'r2',
    'object',
    'put',
    `${BUCKET}/${key}`,
    '--file',
    file,
    '--content-type',
    contentType(file),
    '--remote',
  ];
}

function sleep(ms) {
  return new Promise((resolveSleep) => setTimeout(resolveSleep, ms));
}

function isRetryableUploadError(error) {
  const message = error instanceof Error ? error.message : String(error);
  return /\b(429|500|502|503|504)\b|Bad Gateway|Gateway Timeout|ECONNRESET|ETIMEDOUT|EAI_AGAIN/i.test(
    message,
  );
}

function retryDelayMs(attempt) {
  return RETRY_BASE_MS * 2 ** Math.max(0, attempt - 1);
}

function uploadOneAttempt(file, key, index, total) {
  const startedAt = Date.now();
  return new Promise((resolveUpload, rejectUpload) => {
    const child = spawn(LOCAL_WRANGLER, wranglerArgs(file, key), {
      cwd: WORKER_DIR,
      stdio: ['ignore', 'pipe', 'pipe'],
      env: process.env,
    });

    let output = '';
    const collect = (chunk) => {
      output += chunk.toString();
      if (output.length > 20_000) output = output.slice(-20_000);
    };
    child.stdout.on('data', collect);
    child.stderr.on('data', collect);
    child.on('error', rejectUpload);
    child.on('close', (code) => {
      if (code === 0) {
        const elapsed = ((Date.now() - startedAt) / 1000).toFixed(1);
        console.log(`OK [${index}/${total}] ${key} (${elapsed}s)`);
        resolveUpload();
        return;
      }
      rejectUpload(new Error(`wrangler failed for ${key} with code ${code}\n${output}`));
    });
  });
}

async function uploadOne(file, index, total) {
  const rel = relative(PACKS_DIR, file).replaceAll('\\', '/');
  const key = `packs/${rel}`;
  if (DRY_RUN) {
    console.log(`DRY-RUN [${index}/${total}] ${key}`);
    return;
  }

  for (let attempt = 1; attempt <= RETRIES + 1; attempt += 1) {
    try {
      await uploadOneAttempt(file, key, index, total);
      return;
    } catch (error) {
      const retryable = isRetryableUploadError(error);
      if (!retryable || attempt > RETRIES) throw error;
      const delay = retryDelayMs(attempt);
      console.warn(
        `RETRY [${index}/${total}] ${key} after transient R2 upload error ` +
          `(attempt ${attempt}/${RETRIES + 1}, wait ${delay}ms)`,
      );
      await sleep(delay);
    }
  }
}

async function uploadAll(files) {
  let next = 0;
  let completed = 0;
  async function worker() {
    while (next < files.length) {
      const current = next;
      next += 1;
      await uploadOne(files[current], current + 1, files.length);
      completed += 1;
      if (completed % 25 === 0 || completed === files.length) {
        const verb = DRY_RUN ? 'planned' : 'uploaded';
        console.log(`Progress: ${completed}/${files.length} protected pack file(s) ${verb}`);
      }
    }
  }

  const workerCount = Math.min(CONCURRENCY, files.length);
  await Promise.all(Array.from({ length: workerCount }, () => worker()));
}

const files = walk(PACKS_DIR).filter((file) => {
  const rel = relative(PACKS_DIR, file).replaceAll('\\', '/');
  return !PUBLIC_ONLY.has(rel.split('/').pop() || '');
});

if (!existsSync(LOCAL_WRANGLER)) {
  console.error(`ERROR: local Wrangler binary not found: ${LOCAL_WRANGLER}`);
  console.error('Run `cd worker && npm ci` before uploading protected pack files.');
  process.exit(1);
}

console.log(`Uploading ${files.length} protected pack file(s) to R2 bucket ${BUCKET}`);
console.log(`Wrangler command: ${LOCAL_WRANGLER}`);
console.log(`Concurrency: ${CONCURRENCY}${DRY_RUN ? ' (dry-run)' : ''}`);
console.log(`Retries: ${RETRIES}${DRY_RUN ? ' (dry-run)' : ''}`);

try {
  await uploadAll(files);
  console.log(DRY_RUN ? 'OK protected pack R2 upload plan verified' : 'OK protected pack files uploaded to R2');
} catch (error) {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
}
