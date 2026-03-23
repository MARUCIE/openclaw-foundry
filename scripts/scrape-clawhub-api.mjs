#!/usr/bin/env node

/**
 * ClawHub Skills Scraper — REST API (replaces Playwright scroll)
 *
 * Endpoint: GET https://clawhub.ai/api/v1/skills
 * Pagination: cursor-based, max 200 per page
 * Rate limit: 120 reads/min (anonymous)
 *
 * Output: data/clawhub-skills-raw.json
 *
 * Usage:
 *   node scripts/scrape-clawhub-api.mjs                    # full fetch
 *   node scripts/scrape-clawhub-api.mjs --process           # fetch + process
 *   node scripts/scrape-clawhub-api.mjs --sort downloads    # single sort mode
 */

import { readFile, writeFile, mkdir } from 'fs/promises';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';

const __dirname = dirname(fileURLToPath(import.meta.url));
const PROJECT = join(__dirname, '..');
const DATA_DIR = join(PROJECT, 'data');
const RAW_FILE = join(DATA_DIR, 'clawhub-skills-raw.json');

const BASE_URL = 'https://clawhub.ai/api/v1/packages';
const LIMIT = 100; // conservative batch size
const DELAY_MS = 600; // ~100 req/min, well under 120/min limit
const SORT_MODES = ['updated']; // packages endpoint uses updatedAt ordering by default

const RUN_PROCESS = process.argv.includes('--process');
const SINGLE_SORT = process.argv.find((a, i) => process.argv[i - 1] === '--sort');

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

async function fetchPage(sort, cursor) {
  const params = new URLSearchParams({
    limit: String(LIMIT),
    family: 'skill',
  });
  if (cursor) params.set('cursor', cursor);

  const url = `${BASE_URL}?${params}`;
  const res = await fetch(url, {
    headers: {
      'Accept': 'application/json',
      'User-Agent': 'OpenClaw-Foundry/1.0 (skill-registry-sync)',
    },
  });

  if (res.status === 429) {
    const retryAfter = parseInt(res.headers.get('Retry-After') || '60');
    console.log(`  WARN: Rate limited, waiting ${retryAfter}s...`);
    await sleep(retryAfter * 1000);
    return fetchPage(sort, cursor); // retry
  }

  if (!res.ok) {
    throw new Error(`HTTP ${res.status}: ${res.statusText} for ${url}`);
  }

  return res.json();
}

// Generic names that should be replaced with slug
const GENERIC_NAMES = new Set([
  'skill', 'tool', 'plugin', 'test', 'my skill', 'agent', 'bot', 'app',
  'demo', 'example', 'hello', 'server', 'client', 'openclaw', 'openclaw skill',
]);

function titleCase(slug) {
  return slug.replace(/[-_]/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
}

function resolveDisplayName(displayName, slug) {
  // Use slug title-case if displayName is missing, generic, or too short
  if (!displayName || displayName.length <= 2 ||
      GENERIC_NAMES.has(displayName.toLowerCase())) {
    return titleCase(slug);
  }
  return displayName;
}

function normalizeSkill(item) {
  const slug = `${item.ownerHandle}/${item.name}`;
  return {
    name: resolveDisplayName(item.displayName, item.name),
    slug: item.name || '',
    author: item.ownerHandle || 'unknown',
    desc: item.summary || '',
    downloads: '0', // packages endpoint doesn't expose download counts
    stars: '0',
    versions: 0,
    platforms: [],
    official: item.isOfficial || item.channel === 'official' || false,
    url: `https://clawhub.ai/${slug}`,
    tags: item.capabilityTags || [],
    createdAt: item.createdAt ? new Date(item.createdAt).toISOString() : '',
    updatedAt: item.updatedAt ? new Date(item.updatedAt).toISOString() : '',
    version: item.latestVersion || '',
    channel: item.channel || 'community',
    executesCode: item.executesCode || false,
  };
}

async function main() {
  await mkdir(DATA_DIR, { recursive: true });

  const allSkills = new Map();
  const modes = SINGLE_SORT ? [SINGLE_SORT] : SORT_MODES;

  for (const sort of modes) {
    console.log(`NOTE: Fetching ClawHub API [${sort}]...`);
    let cursor = null;
    let page = 0;
    let newInMode = 0;

    while (true) {
      page++;
      const data = await fetchPage(sort, cursor);
      const items = data.items || [];

      if (items.length === 0) break;

      for (const item of items) {
        const key = `${item.ownerHandle}/${item.name}`;
        if (!allSkills.has(key)) {
          allSkills.set(key, normalizeSkill(item));
          newInMode++;
        }
      }

      if (page % 10 === 0 || items.length < LIMIT) {
        console.log(`  Page ${page}: ${items.length} items (mode new: ${newInMode}, total: ${allSkills.size})`);
      }

      cursor = data.nextCursor;
      if (!cursor) break;

      await sleep(DELAY_MS);
    }

    console.log(`OK: [${sort}] done — ${newInMode} new (total: ${allSkills.size})`);

    // Checkpoint save after each sort mode
    const checkpoint = Array.from(allSkills.values());
    await writeFile(RAW_FILE, JSON.stringify(checkpoint, null, 2));
    console.log(`OK: Checkpoint saved (${checkpoint.length} skills)`);
  }

  const merged = Array.from(allSkills.values());
  console.log(`\nOK: Total unique skills: ${merged.length}`);
  await writeFile(RAW_FILE, JSON.stringify(merged, null, 2));

  if (RUN_PROCESS) {
    console.log('NOTE: Running processing pipeline...');
    execSync(`node ${join(__dirname, 'sync-clawhub-skills.mjs')} --process-only`, {
      stdio: 'inherit',
      cwd: PROJECT,
    });
  }

  console.log('OK: ClawHub API sync complete');
}

main().catch(err => {
  console.error('ERROR:', err.message);
  process.exit(1);
});
