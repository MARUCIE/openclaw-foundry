#!/usr/bin/env node

/**
 * Enrich ClawHub API data with stats from scroll scrape
 *
 * The packages API doesn't expose downloads/stars.
 * The scroll scrape has downloads/stars for top ~2,100 skills.
 * This script merges both: API data (full coverage) + scroll data (stats).
 *
 * Also re-scores using available signals when no stats exist:
 *   - version count, description quality, official status, age
 *
 * Usage:
 *   node scripts/enrich-clawhub-data.mjs
 */

import { readFile, writeFile } from 'fs/promises';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const DATA_DIR = join(__dirname, '..', 'data');

async function main() {
  // 1. Load API data (full coverage, no stats)
  const apiData = JSON.parse(await readFile(join(DATA_DIR, 'clawhub-skills-raw.json'), 'utf-8'));
  console.log(`OK: API data: ${apiData.length} skills`);

  // 2. Load scroll data backup (has downloads/stars for top ~2,100)
  // We need to preserve this from before the API scrape overwrote it
  let scrollStats = new Map();
  try {
    // Try to load the scroll-scraped data that had stats
    // Run scrape-clawhub.mjs first to get this, or use existing data
    const scrollRaw = JSON.parse(await readFile(join(DATA_DIR, 'clawhub-scroll-backup.json'), 'utf-8'));
    for (const s of scrollRaw) {
      const key = `${s.author}/${s.slug || s.name}`.toLowerCase();
      if (s.downloads && s.downloads !== '0') {
        scrollStats.set(key, {
          downloads: s.downloads,
          stars: s.stars || '0',
          versions: s.versions || 0,
        });
      }
    }
    console.log(`OK: Scroll stats: ${scrollStats.size} skills with download data`);
  } catch {
    console.log('WARN: No scroll backup found. Run: cp data/clawhub-skills-raw.json data/clawhub-scroll-backup.json');
    console.log('  (before running scrape-clawhub-api.mjs next time)');
  }

  // 3. Enrich: merge stats from scroll into API data
  let enriched = 0;
  for (const skill of apiData) {
    const key = `${skill.author}/${skill.slug || skill.name}`.toLowerCase();
    const stats = scrollStats.get(key);
    if (stats) {
      skill.downloads = stats.downloads;
      skill.stars = stats.stars;
      skill.versions = stats.versions || skill.versions;
      enriched++;
    }
  }
  console.log(`OK: Enriched ${enriched} skills with download/star data`);

  // 4. Save enriched data
  await writeFile(join(DATA_DIR, 'clawhub-skills-raw.json'), JSON.stringify(apiData, null, 2));
  console.log(`OK: Saved enriched raw data (${apiData.length} skills)`);
}

main().catch(err => { console.error('ERROR:', err.message); process.exit(1); });
