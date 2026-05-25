#!/usr/bin/env node
// inject-pack-tiers.mjs
// Post-processor for packs.json that injects per-pack tier (stub|enriched|certified).
//
// Single source of truth for tier classification: scripts/pack-spec-audit.py.
// This wrapper invokes the audit script, parses its JSON report, and copies each
// pack's `tier` field into packs.json. Avoids re-implementing the 4-pillar logic
// in JavaScript (which would drift from the canonical Python check).
//
// Runs in npm prebuild after generate-packs.mjs.

import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'node:fs';
import { join, dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { execFileSync } from 'node:child_process';

const __dirname = dirname(fileURLToPath(import.meta.url));
const PROJECT_ROOT = resolve(__dirname, '..');
const PACKS_JSON = join(PROJECT_ROOT, 'web', 'public', 'data', 'packs.json');
const AUDIT_SCRIPT = join(PROJECT_ROOT, 'scripts', 'pack-spec-audit.py');
const AUDIT_CACHE_DIR = join(PROJECT_ROOT, 'state');
const AUDIT_CACHE = join(AUDIT_CACHE_DIR, 'pack-spec-audit-latest.json');

function readJsonSafe(path) {
  try { return JSON.parse(readFileSync(path, 'utf-8')); } catch { return null; }
}

function runAudit() {
  mkdirSync(AUDIT_CACHE_DIR, { recursive: true });
  try {
    execFileSync('python3', [AUDIT_SCRIPT, '--out', AUDIT_CACHE], { stdio: ['ignore', 'pipe', 'pipe'] });
  } catch (e) {
    console.error(`ERROR: pack-spec-audit.py failed: ${e.message}`);
    process.exit(1);
  }
  const audit = readJsonSafe(AUDIT_CACHE);
  if (!audit || !Array.isArray(audit.results)) {
    console.error(`ERROR: audit output malformed at ${AUDIT_CACHE}`);
    process.exit(1);
  }
  return audit;
}

function main() {
  if (!existsSync(PACKS_JSON)) {
    console.error(`ERROR: ${PACKS_JSON} not found — run generate-packs.mjs first.`);
    process.exit(1);
  }
  if (!existsSync(AUDIT_SCRIPT)) {
    console.error(`ERROR: ${AUDIT_SCRIPT} not found.`);
    process.exit(1);
  }
  const data = readJsonSafe(PACKS_JSON);
  if (!data || !Array.isArray(data.packs)) {
    console.error(`ERROR: ${PACKS_JSON} malformed.`);
    process.exit(1);
  }
  const audit = runAudit();
  const tierBySlug = Object.fromEntries(audit.results.map(r => [r.slug, {
    tier: r.tier,
    specVersion: r.manifest?.spec_version || null,
    hasFirstUseDemo: !!r.manifest?.has_first_use_demo,
    hasE2eEvidence: !!r.e2e_evidence?.present,
  }]));
  const counts = { stub: 0, enriched: 0, certified: 0 };
  for (const pack of data.packs) {
    const info = tierBySlug[pack.id] || { tier: 'stub', specVersion: null, hasFirstUseDemo: false, hasE2eEvidence: false };
    pack.tier = info.tier;
    pack.specVersion = info.specVersion;
    pack.hasFirstUseDemo = info.hasFirstUseDemo;
    pack.hasE2eEvidence = info.hasE2eEvidence;
    counts[info.tier] = (counts[info.tier] || 0) + 1;
  }
  data.tierSummary = counts;
  data.tierInjectedAt = data.tierInjectedAt || new Date().toISOString();
  writeFileSync(PACKS_JSON, JSON.stringify(data, null, 2));
  console.log(`OK injected tiers into ${data.packs.length} packs (source: pack-spec-audit.py): certified=${counts.certified || 0} enriched=${counts.enriched || 0} stub=${counts.stub || 0}`);
}

main();
