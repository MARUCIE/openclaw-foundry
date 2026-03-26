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
  // Stats: will be enriched with skills count after skills processing
  const stats = {
    providers: {
      total: providers.total,
      byType: {},
    },
    skills: { total: 0 },
    deploys: { recent: 0, jobs: [] },
    arena: { recent: 0, matches: [] },
    uptime: 0,
  };
  for (const p of providers.providers) {
    stats.providers.byType[p.type] = (stats.providers.byType[p.type] || 0) + 1;
  }

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

  // Static prebuild: top skills + MCP servers from separate pools
  // Ensures both sources are represented in static data
  const SKILL_N = 3500;
  const MCP_N = 1500;

  const clawSkills = skillsData.skills
    .filter(s => (s.source || 'clawhub') !== 'mcp-registry')
    .sort((a, b) => (b.score || 0) - (a.score || 0))
    .slice(0, SKILL_N);

  const mcpServers = skillsData.skills
    .filter(s => s.source === 'mcp-registry')
    .sort((a, b) => (b.score || 0) - (a.score || 0))
    .slice(0, MCP_N);

  const allSorted = [...clawSkills, ...mcpServers]
    .sort((a, b) => (b.score || 0) - (a.score || 0));
  const staticSkills = allSorted;

  await writeFile(join(OUT, 'skills.json'), JSON.stringify({
    meta: { ...skillsData.meta, staticSkills: SKILL_N, staticMcp: MCP_N, totalAvailable: allSorted.length },
    total: allSorted.length,
    offset: 0,
    limit: staticSkills.length,
    skills: staticSkills,
  }));
  console.log(`OK: Skills (${staticSkills.length} static / ${allSorted.length} total)`);

  // Update stats with skills count
  stats.skills = { total: allSorted.length, static: staticSkills.length };
  await writeFile(join(OUT, 'stats.json'), JSON.stringify(stats, null, 2));
  console.log(`OK: Stats (${allSorted.length} skills, ${providers.total} providers)`);

  // Categories
  await writeFile(join(OUT, 'skills-categories.json'), JSON.stringify({
    categories: skillsData.meta.byCategory || {},
  }));
  console.log(`OK: Skill categories (${Object.keys(skillsData.meta.byCategory || {}).length})`);

  // 4. Collections — static seed (read from seed-collections.sql or generate empty)
  const collections = {
    total: 8,
    collections: [
      { id: 'indie-survival-kit', name: '独立开发者生存包', tagline: '一个人做完产品+营销+发布的最小技能集', skillIds: ['lean-canvas','frontend-design','agentic-seo','launch-checklist','gtm-strategy'], curator: 'Maurice', featured: true, installCount: 0 },
      { id: 'code-audit-pipeline', name: '全自动代码审计流水线', tagline: '三个 skill 组成端到端安全审计管道', skillIds: ['security-best-practices','code-review','adversarial-review'], curator: 'Maurice', featured: true, installCount: 0 },
      { id: 'ai-researcher-kit', name: 'AI 研究员套装', tagline: '从搜索到分析到输出的完整研究工作流', skillIds: ['deep-research','agent-fetch','baoyu-translate'], curator: 'Maurice', featured: true, installCount: 0 },
      { id: 'frontend-craftsman', name: '前端工匠五件套', tagline: '设计到原型到开发到测试到发布一条龙', skillIds: ['frontend-design','react-best-practices','ui-ux-polish','frontend-testing','deploy-preview'], curator: 'Maurice', featured: true, installCount: 0 },
      { id: 'pm-toolkit', name: '产品经理全家桶', tagline: '从发现到定义到验证的产品管理工具箱', skillIds: ['create-prd','user-stories','competitor-analysis','ab-test-analysis'], curator: 'Maurice', featured: false, installCount: 0 },
      { id: 'content-creator-suite', name: '内容创作工作站', tagline: '从选题到写作到发布的全链路内容管线', skillIds: ['deep-research','baoyu-translate','wechat-article-writer'], curator: 'Maurice', featured: false, installCount: 0 },
      { id: 'devops-autopilot', name: 'DevOps 自动驾驶', tagline: '基础设施巡检+部署预览+发布检查三合一', skillIds: ['infra-patrol','deploy-preview','release-checklist'], curator: 'Maurice', featured: false, installCount: 0 },
      { id: 'browser-automation-pro', name: '浏览器自动化专家包', tagline: '从 HTTP 提取到视觉驱动再到持久登录的全层覆盖', skillIds: ['agent-fetch','agent-browser-session','browser-automation'], curator: 'Maurice', featured: false, installCount: 0 },
    ],
  };
  await writeFile(join(OUT, 'collections.json'), JSON.stringify(collections, null, 2));
  console.log(`OK: Collections (${collections.total})`);

  console.log(`OK: Static data written to ${OUT}`);
}

main().catch(err => {
  console.error('ERROR:', err.message);
  process.exit(1);
});
