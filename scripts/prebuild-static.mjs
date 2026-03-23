#!/usr/bin/env node

/**
 * Pre-build: bake backend data into static JSON files for CF Pages deployment.
 * Reads from data/ and src/ to generate web/public/data/*.json
 * These files are served as static assets — no backend needed.
 *
 * Run before `next build`: node scripts/prebuild-static.mjs
 */

import { readFile, writeFile, mkdir } from 'fs/promises';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';

const __dirname = dirname(fileURLToPath(import.meta.url));
const PROJECT = join(__dirname, '..');
const OUT = join(PROJECT, 'web', 'public', 'data');

async function main() {
  await mkdir(OUT, { recursive: true });

  // 1. Providers — get from running server or generate from source
  let providers;
  try {
    const res = await fetch('http://localhost:18800/api/providers');
    providers = await res.json();
    console.log(`OK: Providers from API (${providers.total})`);
  } catch {
    // Fallback: generate from TypeScript source
    console.log('NOTE: API unavailable, generating providers from source...');
    const out = execSync('npx tsx -e "import{listProviders}from\'./src/providers/index.js\';console.log(JSON.stringify({total:listProviders().length,providers:listProviders()}))"', {
      cwd: PROJECT, encoding: 'utf-8',
    });
    providers = JSON.parse(out);
    console.log(`OK: Providers from source (${providers.total})`);
  }
  await writeFile(join(OUT, 'providers.json'), JSON.stringify(providers, null, 2));

  // 2. Stats
  const stats = {
    providers: {
      total: providers.total,
      byType: {},
    },
    deploys: { recent: 0, jobs: [] },
    arena: { recent: 0, matches: [] },
    uptime: 0,
  };
  for (const p of providers.providers) {
    stats.providers.byType[p.type] = (stats.providers.byType[p.type] || 0) + 1;
  }
  await writeFile(join(OUT, 'stats.json'), JSON.stringify(stats, null, 2));
  console.log(`OK: Stats generated`);

  // 3. Skills (from clawhub-skills.json)
  try {
    const raw = await readFile(join(PROJECT, 'data', 'clawhub-skills.json'), 'utf-8');
    const skillsData = JSON.parse(raw);
    // Full dataset for client-side filtering
    await writeFile(join(OUT, 'skills.json'), JSON.stringify({
      meta: skillsData.meta,
      total: skillsData.skills.length,
      offset: 0,
      limit: skillsData.skills.length,
      skills: skillsData.skills,
    }, null, 2));
    console.log(`OK: Skills (${skillsData.skills.length})`);

    // Categories
    await writeFile(join(OUT, 'skills-categories.json'), JSON.stringify({
      categories: skillsData.meta.byCategory,
    }));
    console.log(`OK: Skill categories`);
  } catch {
    console.log('WARN: No clawhub-skills.json found, skills will be empty');
    await writeFile(join(OUT, 'skills.json'), JSON.stringify({ meta: {}, total: 0, offset: 0, limit: 0, skills: [] }));
    await writeFile(join(OUT, 'skills-categories.json'), JSON.stringify({ categories: {} }));
  }

  console.log(`OK: Static data written to ${OUT}`);
}

main().catch(err => {
  console.error('ERROR:', err.message);
  process.exit(1);
});
