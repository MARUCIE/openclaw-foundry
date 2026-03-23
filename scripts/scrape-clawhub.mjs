#!/usr/bin/env node

/**
 * ClawHub Skills Scraper — Headless Playwright
 *
 * Scrapes https://clawhub.ai/skills?sort=downloads&nonSuspicious=true
 * Scrolls to load ~250+ top skills, extracts structured data, saves to data/clawhub-skills-raw.json
 *
 * Requires: playwright (globally installed)
 *   npm install -g playwright
 *
 * Usage:
 *   node scripts/scrape-clawhub.mjs                    # scrape + process
 *   node scripts/scrape-clawhub.mjs --scrape-only      # scrape only (no processing)
 *   node scripts/scrape-clawhub.mjs --target 500       # load more skills (default: 250)
 */

import { readFile, writeFile, mkdir } from 'fs/promises';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';
import { createRequire } from 'module';

const require = createRequire(import.meta.url);
const __dirname = dirname(fileURLToPath(import.meta.url));
const PROJECT_ROOT = join(__dirname, '..');
const DATA_DIR = join(PROJECT_ROOT, 'data');
const RAW_FILE = join(DATA_DIR, 'clawhub-skills-raw.json');

const TARGET_SKILLS = parseInt(process.argv.find(a => a.startsWith('--target'))?.split('=')[1]
  || process.argv[process.argv.indexOf('--target') + 1]
  || '1000');
const SCRAPE_ONLY = process.argv.includes('--scrape-only');
const MULTI_SORT = !process.argv.includes('--single-sort');

// Multiple sort dimensions to maximize coverage
const SORT_MODES = [
  { sort: 'downloads', label: 'downloads' },
  { sort: 'stars', label: 'stars' },
  { sort: 'newest', label: 'newest' },
  { sort: 'updated', label: 'updated' },
];

function buildUrl(sort) {
  return `https://clawhub.ai/skills?sort=${sort}&nonSuspicious=true`;
}

// Resolve playwright from global install
let chromium;
try {
  const globalRoot = execSync('npm root -g', { encoding: 'utf-8' }).trim();
  const pw = require(join(globalRoot, 'playwright'));
  chromium = pw.chromium;
} catch (err) {
  console.error('ERROR: playwright not found. Install with: npm install -g playwright');
  console.error('  Detail:', err.message);
  process.exit(1);
}

async function scrape(url, label) {
  console.log(`NOTE: Scraping ClawHub [${label}] (target: ${TARGET_SKILLS} skills)...`);

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1280, height: 900 },
    userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36',
  });
  const page = await context.newPage();

  await page.goto(url, { waitUntil: 'networkidle', timeout: 30000 }).catch(() => {});
  await page.waitForTimeout(3000);

  // Scroll to load skills
  let prevCount = 0;
  let stableRounds = 0;
  for (let i = 0; i < 30; i++) {
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await page.waitForTimeout(1500);

    const count = await page.evaluate(() => {
      let c = 0;
      for (const l of document.querySelectorAll('a[href]')) {
        const parts = (l.getAttribute('href') || '').split('/').filter(Boolean);
        if (parts.length === 2 && !['skills', 'packages', 'upload', 'import'].includes(parts[0]) && (l.innerText || '').length > 20) c++;
      }
      return c;
    });

    console.log(`  Scroll ${i + 1}: ${count} skills loaded`);

    if (count >= TARGET_SKILLS) break;
    if (count === prevCount) {
      stableRounds++;
      if (stableRounds >= 3) break; // no more content
    } else {
      stableRounds = 0;
    }
    prevCount = count;
  }

  // Extract all skill data
  const skills = await page.evaluate(() => {
    const links = document.querySelectorAll('a[href]');
    const results = [];

    for (const link of links) {
      const href = link.getAttribute('href') || '';
      const parts = href.split('/').filter(Boolean);
      if (parts.length !== 2 || ['skills', 'packages', 'upload', 'import'].includes(parts[0])) continue;

      const text = link.innerText || '';
      if (text.length < 20) continue;

      const lines = text.split('\n').map(l => l.trim()).filter(Boolean);
      const downloadMatch = text.match(/([\d,.]+k?)\n★/);
      const starMatch = text.match(/★\s*([\d,.]+k?)/);
      const versionMatch = text.match(/(\d+)\s*v$/m);
      const authorMatch = text.match(/@(\S+)/);

      const name = lines[0] || '';
      const slug = (lines.find(l => l.startsWith('/')) || '').replace('/', '');
      const desc = lines.find(l => l.length > 30 && !l.startsWith('/') && !l.startsWith('by') && l !== name) || '';

      const platforms = [];
      if (text.includes('Linux')) platforms.push('Linux');
      if (text.includes('macOS')) platforms.push('macOS');
      if (text.includes('Windows')) platforms.push('Windows');

      results.push({
        name, slug,
        author: authorMatch ? authorMatch[1] : parts[0],
        desc: desc.slice(0, 250),
        downloads: downloadMatch ? downloadMatch[1] : '',
        stars: starMatch ? starMatch[1] : '',
        versions: versionMatch ? parseInt(versionMatch[1]) : 0,
        platforms,
        official: text.includes('Official'),
        url: 'https://clawhub.ai' + href,
      });
    }
    return results;
  });

  await browser.close();
  return skills;
}

async function main() {
  await mkdir(DATA_DIR, { recursive: true });

  const allSkills = new Map(); // key: author/slug -> skill

  // Try loading existing raw data for incremental merge
  try {
    const existing = JSON.parse(await readFile(RAW_FILE, 'utf-8'));
    for (const s of existing) {
      const key = `${s.author}/${s.slug}`;
      if (!allSkills.has(key)) allSkills.set(key, s);
    }
    console.log(`NOTE: Loaded ${allSkills.size} existing skills for incremental merge`);
  } catch { /* first run, no existing data */ }

  const modes = MULTI_SORT ? SORT_MODES : [SORT_MODES[0]];

  for (const mode of modes) {
    try {
      const url = buildUrl(mode.sort);
      const skills = await scrape(url, mode.label);
      let newCount = 0;
      for (const s of skills) {
        const key = `${s.author}/${s.slug}`;
        if (!allSkills.has(key)) {
          allSkills.set(key, s);
          newCount++;
        }
      }
      console.log(`OK: [${mode.label}] ${skills.length} scraped, ${newCount} new (total: ${allSkills.size})`);

      // Save after each sort mode to prevent data loss
      const checkpoint = Array.from(allSkills.values());
      await writeFile(RAW_FILE, JSON.stringify(checkpoint, null, 2));
      console.log(`OK: Checkpoint saved (${checkpoint.length} skills)`);
    } catch (err) {
      console.error(`WARN: [${mode.label}] scrape failed: ${err.message} — continuing with next mode`);
    }
  }

  const merged = Array.from(allSkills.values());
  console.log(`OK: Total unique skills: ${merged.length}`);

  await writeFile(RAW_FILE, JSON.stringify(merged, null, 2));
  console.log(`OK: Saved raw data to ${RAW_FILE}`);

  if (!SCRAPE_ONLY) {
    console.log('NOTE: Running processing pipeline...');
    execSync(`node ${join(__dirname, 'sync-clawhub-skills.mjs')} --process-only`, {
      stdio: 'inherit',
      cwd: PROJECT_ROOT,
    });
  }

  console.log('OK: ClawHub sync complete');
}

main().catch(err => {
  console.error('ERROR:', err.message);
  process.exit(1);
});
