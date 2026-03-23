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

const NO_API = process.argv.includes('--no-api');

async function main() {
  await mkdir(OUT, { recursive: true });

  // 1. Providers — get from running server, source, or existing static file
  let providers;
  if (!NO_API) {
    try {
      const res = await fetch('http://localhost:18800/api/providers');
      providers = await res.json();
      console.log(`OK: Providers from API (${providers.total})`);
    } catch { /* fall through */ }
  }
  if (!providers) {
    // Try existing static file first (works in CI without backend)
    try {
      const existing = await readFile(join(OUT, 'providers.json'), 'utf-8');
      providers = JSON.parse(existing);
      console.log(`OK: Providers from existing static (${providers.total})`);
    } catch {
      // Last resort: generate from TypeScript source
      try {
        console.log('NOTE: Generating providers from source...');
        const out = execSync('npx tsx -e "import{listProviders}from\'./src/providers/index.js\';console.log(JSON.stringify({total:listProviders().length,providers:listProviders()}))"', {
          cwd: PROJECT, encoding: 'utf-8',
        });
        providers = JSON.parse(out);
        console.log(`OK: Providers from source (${providers.total})`);
      } catch {
        console.log('WARN: Could not load providers, using empty');
        providers = { total: 0, providers: [] };
      }
    }
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

  // 3. Skills — prefer unified-index.json, fallback to clawhub-skills.json
  let skillsData;
  try {
    const raw = await readFile(join(PROJECT, 'data', 'unified-index.json'), 'utf-8');
    skillsData = JSON.parse(raw);
    console.log(`OK: Using unified index (${skillsData.skills.length} entries from ${Object.keys(skillsData.meta.bySource || {}).join('+')})`);
  } catch {
    try {
      const raw = await readFile(join(PROJECT, 'data', 'clawhub-skills.json'), 'utf-8');
      skillsData = JSON.parse(raw);
      console.log(`OK: Using ClawHub-only data (${skillsData.skills.length} skills)`);
    } catch {
      // Last resort: preserve existing static file (don't overwrite with empty)
      try {
        const existing = await readFile(join(OUT, 'skills.json'), 'utf-8');
        const parsed = JSON.parse(existing);
        if (parsed.skills?.length > 0) {
          console.log(`OK: Keeping existing static skills (${parsed.skills.length} entries)`);
          // Write categories and exit early for skills
          await writeFile(join(OUT, 'skills-categories.json'), JSON.stringify({
            categories: parsed.meta?.byCategory || {},
          }));
          console.log(`OK: Skill categories (preserved)`);
          console.log(`OK: Static data written to ${OUT}`);
          return;
        }
      } catch { /* no existing file either */ }
      console.log('WARN: No skills data found and no existing static file');
      skillsData = { meta: {}, skills: [] };
    }
  }

  // Static prebuild: top 1500 skills + top 500 MCP servers (separate pools)
  // Full dataset served via Workers API for search/pagination
  const SKILL_N = 1500;
  const MCP_N = 500;

  const clawSkills = skillsData.skills
    .filter(s => (s.source || 'clawhub') !== 'mcp-registry')
    .sort((a, b) => (b.score || 0) - (a.score || 0))
    .slice(0, SKILL_N);

  const mcpServers = skillsData.skills
    .filter(s => s.source === 'mcp-registry')
    .sort((a, b) => (b.score || 0) - (a.score || 0))
    .slice(0, MCP_N);

  const topSkills = [...clawSkills, ...mcpServers]
    .sort((a, b) => (b.score || 0) - (a.score || 0));

  await writeFile(join(OUT, 'skills.json'), JSON.stringify({
    meta: { ...skillsData.meta, prebuildSkills: SKILL_N, prebuildMcp: MCP_N },
    total: skillsData.skills.length,
    offset: 0,
    limit: topSkills.length,
    skills: topSkills,
  })); // ~2MB
  console.log(`OK: Skills (${skillsData.skills.length})`);

  // Categories
  await writeFile(join(OUT, 'skills-categories.json'), JSON.stringify({
    categories: skillsData.meta.byCategory || {},
  }));
  console.log(`OK: Skill categories (${Object.keys(skillsData.meta.byCategory || {}).length})`);

  console.log(`OK: Static data written to ${OUT}`);
}

main().catch(err => {
  console.error('ERROR:', err.message);
  process.exit(1);
});
