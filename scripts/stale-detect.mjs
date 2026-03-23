#!/usr/bin/env node

/**
 * Stale Skill Detector
 *
 * Marks skills as stale if:
 *   - No version updates in 6+ months (based on ClawHub metadata)
 *   - Low activity signal: 0 downloads + 0 stars + 0 versions
 *   - Description too short (<20 chars) = likely abandoned placeholder
 *
 * Usage:
 *   node scripts/stale-detect.mjs
 */

import { readFile, writeFile } from 'fs/promises';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const DATA_DIR = join(__dirname, '..', 'data');

const STALE_THRESHOLD_DAYS = 180; // 6 months

function isStale(skill) {
  // Rule 1: Zero activity signals
  const downloads = skill.downloads || 0;
  const stars = skill.stars || 0;
  const versions = skill.versions || 0;
  if (downloads === 0 && stars === 0 && versions === 0) {
    // Only if description is also short — avoid false positives on new but legit skills
    if (!skill.description || skill.description.length < 20) return true;
  }

  // Rule 2: Published date too old with no engagement
  if (skill.publishedAt) {
    const published = new Date(skill.publishedAt);
    const age = (Date.now() - published.getTime()) / (1000 * 60 * 60 * 24);
    if (age > STALE_THRESHOLD_DAYS && downloads === 0 && stars === 0) return true;
  }

  // Rule 3: Very low score + D rating = effectively dead
  if (skill.rating === 'D' && (skill.score || 0) < 5) return true;

  return false;
}

async function main() {
  const unified = JSON.parse(await readFile(join(DATA_DIR, 'unified-index.json'), 'utf-8'));
  const skills = unified.skills;
  console.log(`OK: Loaded ${skills.length} skills`);

  let staleCount = 0;
  let freshCount = 0;
  const staleByRating = { S: 0, A: 0, B: 0, C: 0, D: 0 };

  for (const skill of skills) {
    const stale = isStale(skill);
    skill.stale = stale;
    if (stale) {
      staleCount++;
      staleByRating[skill.rating] = (staleByRating[skill.rating] || 0) + 1;
    } else {
      freshCount++;
    }
  }

  await writeFile(join(DATA_DIR, 'unified-index.json'), JSON.stringify(unified, null, 2));

  console.log(`OK: ${staleCount} stale / ${freshCount} fresh`);
  console.log(`  Stale by rating: ${JSON.stringify(staleByRating)}`);
  console.log(`  Stale rate: ${(staleCount / skills.length * 100).toFixed(1)}%`);
}

main().catch(err => { console.error('ERROR:', err.message); process.exit(1); });
