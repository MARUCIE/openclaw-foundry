#!/usr/bin/env node
/**
 * resync-skills-from-local.mjs
 *
 * Rebuilds web/public/data/skills.json from CURRENT local skill sources:
 *   - ~/.claude/skills/           (primary)
 *   - AI-Fleet/layers/L3-intelligence/skills/skills/  (curated)
 *
 * Preserves existing catalog metadata (rating, stars, downloads, deployCount,
 * reviewUp/Down) where skill name matches. Drops catalog entries that point to
 * sources no longer present locally (was previously sourced from ~/.agents/skills/
 * which no longer exists).
 *
 * Writes backup to web/public/data/_backup-pre-resync/ before overwriting.
 *
 * Run:  node scripts/resync-skills-from-local.mjs
 */

import { readFileSync, writeFileSync, mkdirSync, existsSync, readdirSync, statSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { homedir } from 'os';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');
const SKILLS_PATH = join(ROOT, 'web', 'public', 'data', 'skills.json');
const CATEGORIES_PATH = join(ROOT, 'web', 'public', 'data', 'skills-categories.json');
const BACKUP_DIR = join(ROOT, 'web', 'public', 'data', '_backup-pre-resync');

const SOURCES = [
  {
    label: 'claude',
    root: join(homedir(), '.claude', 'skills'),
  },
  {
    label: 'ai-fleet',
    root: join(homedir(), '00-AI-Fleet', 'layers', 'L3-intelligence', 'skills', 'skills'),
  },
];

const SKIP_DIRS = new Set([
  '__pycache__',
  '.claude',
  '_lib',
  'base',
  'node_modules',
]);

// Hors-domain filters (apply on description content)
const HORS_DOMAIN_KEYWORDS = [
  'blockchain', 'web3', 'defi', 'nft', 'bitcoin', 'ethereum',
  'stock trading', 'forex', 'crypto trading',
  'e-commerce', 'shopify', 'amazon seller',
  'gaming', 'esports', 'twitch streaming',
];

function parseFrontmatter(content) {
  const m = content.match(/^---\n([\s\S]+?)\n---/);
  if (!m) return null;
  const lines = m[1].split('\n');
  const fm = {};
  for (const line of lines) {
    const kv = line.match(/^(\w+):\s*"?(.+?)"?$/);
    if (kv) fm[kv[1]] = kv[2].trim();
  }
  return fm;
}

function isHorsDomain(description) {
  if (!description) return false;
  const lower = description.toLowerCase();
  return HORS_DOMAIN_KEYWORDS.some((kw) => lower.includes(kw));
}

function readLocalSkill(label, root, dirName) {
  const dirPath = join(root, dirName);
  const skillMd = join(dirPath, 'SKILL.md');
  if (!existsSync(skillMd)) return null;
  let content;
  try {
    content = readFileSync(skillMd, 'utf-8');
  } catch (e) {
    return null;
  }
  const fm = parseFrontmatter(content);
  if (!fm) return null;
  const name = fm.name || dirName;
  const description = fm.description || '';
  if (isHorsDomain(description)) return null;
  return {
    name,
    description,
    sourceLocal: label,
    url: '',
  };
}

function backup(path, label) {
  if (!existsSync(BACKUP_DIR)) mkdirSync(BACKUP_DIR, { recursive: true });
  if (!existsSync(path)) return;
  const dest = join(BACKUP_DIR, `${label}.json`);
  writeFileSync(dest, readFileSync(path, 'utf-8'));
  console.log(`  backup: ${dest}`);
}

function main() {
  console.log('resync-skills-from-local.mjs');
  console.log('==============================\n');

  // 1. Scan local sources
  const localByName = new Map();
  for (const { label, root } of SOURCES) {
    if (!existsSync(root)) {
      console.log(`  WARN: source missing ${root}`);
      continue;
    }
    const dirs = readdirSync(root).filter((d) => {
      if (SKIP_DIRS.has(d)) return false;
      const p = join(root, d);
      try { return statSync(p).isDirectory(); } catch { return false; }
    });
    let added = 0;
    let skipped = 0;
    for (const d of dirs) {
      const sk = readLocalSkill(label, root, d);
      if (!sk) {
        skipped += 1;
        continue;
      }
      // Dedup by name — first source wins (claude > ai-fleet by SOURCES order)
      if (!localByName.has(sk.name)) {
        localByName.set(sk.name, sk);
        added += 1;
      }
    }
    console.log(`  ${label.padEnd(10)} ${added} added, ${skipped} skipped (no SKILL.md / hors-domain / parse-fail)`);
  }
  console.log(`  ----`);
  console.log(`  total unique local skills: ${localByName.size}\n`);

  // 2. Load existing catalog (will harvest metadata where name matches)
  const oldCatalog = JSON.parse(readFileSync(SKILLS_PATH, 'utf-8'));
  const oldByName = new Map();
  for (const s of oldCatalog.skills) {
    if (!oldByName.has(s.name)) oldByName.set(s.name, s);
  }

  // 3. Build new catalog
  backup(SKILLS_PATH, 'skills');
  backup(CATEGORIES_PATH, 'skills-categories');

  const newSkills = [];
  let metaPreserved = 0;
  let freshEntry = 0;
  for (const local of localByName.values()) {
    const old = oldByName.get(local.name);
    if (old) {
      newSkills.push({
        ...old,
        url: local.url,
        sourceLocal: local.sourceLocal,
        description: local.description || old.description,
      });
      metaPreserved += 1;
    } else {
      newSkills.push({
        id: `local/${local.name}`,
        name: local.name,
        author: 'local',
        source: 'local',
        sourceLocal: local.sourceLocal,
        description: local.description,
        category: '其他',
        rating: 'B',
        url: local.url,
        stars: 0,
        downloads: 0,
        versions: 1,
        editorialTagline: (local.description || '').slice(0, 80),
        icon: 'extension',
        tags: [],
        stale: false,
        deployCount: 0,
        deploySuccessRate: 0,
        reviewUp: 0,
        reviewDown: 0,
        compositeScore: 0,
        permissionManifest: {},
      });
      freshEntry += 1;
    }
  }

  console.log(`Re-sync results:`);
  console.log(`  metadata preserved from old catalog: ${metaPreserved}`);
  console.log(`  fresh entries (new since last sync):  ${freshEntry}`);
  console.log(`  dropped stale entries (no longer in local): ${oldCatalog.skills.length - metaPreserved}`);
  console.log(`  new catalog total: ${newSkills.length}\n`);

  // 4. Recompute category counts
  const byCategory = {};
  const byRating = {};
  for (const s of newSkills) {
    byCategory[s.category] = (byCategory[s.category] || 0) + 1;
    byRating[s.rating] = (byRating[s.rating] || 0) + 1;
  }

  const newCatalog = {
    ...oldCatalog,
    total: newSkills.length,
    meta: {
      ...oldCatalog.meta,
      total: newSkills.length,
      byCategory,
      byRating,
      sources: { local: newSkills.length },
      reSyncedAt: new Date().toISOString(),
      reSyncSource: 'resync-skills-from-local.mjs',
    },
    skills: newSkills,
  };

  const newCategories = { categories: byCategory };

  writeFileSync(SKILLS_PATH, JSON.stringify(newCatalog, null, 2));
  writeFileSync(CATEGORIES_PATH, JSON.stringify(newCategories, null, 2));

  console.log('Top 10 categories after re-sync:');
  for (const [cat, n] of Object.entries(byCategory).sort((a, b) => b[1] - a[1]).slice(0, 10)) {
    console.log(`  ${cat.padEnd(20)} ${n}`);
  }
}

main();
