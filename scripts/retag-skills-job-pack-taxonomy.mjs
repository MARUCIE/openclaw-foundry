#!/usr/bin/env node
/**
 * retag-skills-job-pack-taxonomy.mjs
 *
 * Re-classifies every skill in web/public/data/skills.json under the
 * 8-tier Job Pack taxonomy + a 9th cross-cutting "Agent 工具" bucket.
 *
 * Categories:
 *   写代码     — coding (frontend/backend/test/architecture/devops)
 *   做数据     — data + AI/ML (algorithm, model, training, inference)
 *   做产品     — product (PM, PRD, journey, persona, brainstorm)
 *   做业务     — business (compliance, tax, accounting, legal, audit)
 *   定策略     — strategy (executive, valuation, multi-advisor)
 *   做研究     — research (SOTA, competitor, paper, market scan)
 *   场景规划   — scenario (flow, workflow, SOP, process design)
 *   看数据     — analytics (dashboard, metrics, KPI, A/B, observability)
 *   Agent 工具 — cross-cutting (MCP server, hook, plugin, automation)
 *
 * Classification: priority-ordered keyword match. First matching category wins.
 * Manual override map at top of file for known special cases.
 *
 * Writes backup to _backup-pre-retag/. Run after resync-skills-from-local.mjs.
 */

import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');
const SKILLS_PATH = join(ROOT, 'web', 'public', 'data', 'skills.json');
const CATEGORIES_PATH = join(ROOT, 'web', 'public', 'data', 'skills-categories.json');
const BACKUP_DIR = join(ROOT, 'web', 'public', 'data', '_backup-pre-retag');

// Manual override map: skill name -> category (highest priority)
const OVERRIDES = {
  'customer-journey-map': '做产品',
  'positioning-ideas': '做产品',
  'draft-nda': '做业务',
  'prose': '做产品',
  'cinematic-script-writer': '做产品',
  'avatar-video': '做产品',
  'feishu-bridge': 'Agent 工具',
  'browser-automation': 'Agent 工具',
  'chrome-bridge-automation': 'Agent 工具',
  'security-threat-model': '做业务',
  'swot-analysis': '定策略',
  'interview-script': '做产品',
  'anthropic-official-skills': 'Agent 工具',
  'week-planner': '其他',
  'adulting-coach': '其他',
  'meltdown-mode': '其他',
};

const ICONS = {
  '写代码': 'code',
  '做数据': 'analytics',
  '做产品': 'lightbulb',
  '做业务': 'verified_user',
  '定策略': 'insights',
  '做研究': 'science',
  '场景规划': 'account_tree',
  '看数据': 'monitoring',
  'Agent 工具': 'smart_toy',
  '其他': 'extension',
};

// Priority-ordered classifier: stops at first match
const CLASSIFIERS = [
  {
    cat: '做业务',
    nameKeywords: ['tax', 'invoice', 'compliance', 'audit', 'legal', 'nda', 'contract', 'kyc', 'aml', 'accounting', 'gaap', 'ifrs', 'finance-tax', 'regulation', 'policy', 'expense', 'reimburse'],
    descKeywords: ['财税', '合规', '会计', '审计', '法律', '合同', '发票', '税务', 'compliance', 'tax compliance', 'audit', 'accounting', 'regulation', 'legal', 'non-disclosure', 'NDA', 'invoice', 'expense report'],
  },
  {
    cat: '定策略',
    nameKeywords: ['advisor', 'strategy', 'executive', 'ceo', 'cfo', 'cto', 'swot', 'valuation', 'investment', 'board', 'multi-perspective', 'mckinsey', 'bcg', 'roadmap'],
    descKeywords: ['executive', 'strategy', 'strategic decision', 'investment thesis', 'board', 'valuation', 'multi-advisor', 'multi-perspective'],
  },
  {
    cat: '做研究',
    nameKeywords: ['research', 'study', 'sota', 'benchmark', 'competitor', 'competitive', 'lit-review', 'paper', 'scout', 'intel', 'survey', 'autoresearch'],
    descKeywords: ['research', 'literature', 'competitive analysis', 'market scan', 'SOTA', 'survey paper'],
  },
  {
    cat: '看数据',
    nameKeywords: ['dashboard', 'metrics', 'kpi', 'analytics', 'ab-test', 'observability', 'monitoring', 'cohort-analysis', 'chart', 'viz', 'dataviz', 'mdv-'],
    descKeywords: ['dashboard', 'KPI', 'A/B test', 'observability', 'monitoring', 'metrics', 'analytics platform'],
  },
  {
    cat: '场景规划',
    nameKeywords: ['scenario', 'flow', 'workflow', 'process', 'sop', 'blueprint', 'pipeline', 'orchestrat', 'design-thinking', 'jtbd', 'journey-map', 'business-flow'],
    descKeywords: ['scenario', 'workflow design', 'business flow', 'SOP', 'process design', 'orchestrate'],
  },
  {
    cat: '做产品',
    nameKeywords: ['pm-', 'prd', 'product', 'persona', 'brainstorm', 'ideate', 'positioning', 'opportunity', 'customer', 'jobs-to-be-done', 'ux-', 'ui-', 'figma', 'wireframe', 'mockup', 'prototype', 'storyboard', 'design-system', 'critique', 'distill', 'clarify', 'typeset', 'animate', 'impeccable-design'],
    descKeywords: ['product manager', 'PRD', 'brainstorm', 'customer journey', 'persona', 'positioning', 'UX', 'product design', 'prototype'],
  },
  {
    cat: '做数据',
    nameKeywords: ['ml-', 'model-', 'embedding', 'vector', 'train', 'inference', 'llm', 'prompt-eval', 'rag-', 'search-engine', 'algorithm', 'big-data'],
    descKeywords: ['machine learning', 'AI model training', 'embedding', 'vector database', 'fine-tune', 'inference', 'RAG'],
  },
  {
    cat: '写代码',
    nameKeywords: ['code', 'coding', 'build', 'compile', 'deploy', 'devops', 'infra', 'kubernetes', 'docker', 'lint', 'test-', 'frontend', 'backend', 'fullstack', 'react', 'vue', 'next', 'node', 'python', 'rust', 'golang', 'ci-cd', 'github-action', 'git-', 'merge', 'commit', 'pr-review', 'code-review', 'refactor', 'sqlmesh', 'database-', 'sql-'],
    descKeywords: ['write code', 'build APIs', 'frontend dev', 'backend dev', 'deploy', 'CI/CD', 'lint', 'code review', 'refactor', 'merge'],
  },
  {
    cat: 'Agent 工具',
    nameKeywords: ['agent', 'swarm', 'hook', 'plugin', 'mcp-', 'mcp_', '-mcp', 'integration', 'bridge', 'connector', 'webhook', 'automation', 'cron', 'scheduler', 'queue', 'task-', 'skill-', 'router', 'orchestrat', 'spellbook', 'bmad-'],
    descKeywords: ['MCP server', 'agent infrastructure', 'plugin', 'hook', 'automation', 'cron', 'scheduler', 'webhook', 'integration'],
  },
];

function classify(skill) {
  if (OVERRIDES[skill.name]) return OVERRIDES[skill.name];
  const nameLower = (skill.name || '').toLowerCase();
  const descLower = (skill.description || '').toLowerCase();

  for (const { cat, nameKeywords, descKeywords } of CLASSIFIERS) {
    const nameHit = nameKeywords.some((kw) => nameLower.includes(kw.toLowerCase()));
    const descHit = descKeywords.some((kw) => descLower.includes(kw.toLowerCase()));
    if (nameHit || descHit) return cat;
  }
  return '其他';
}

function backup(path, label) {
  if (!existsSync(BACKUP_DIR)) mkdirSync(BACKUP_DIR, { recursive: true });
  if (!existsSync(path)) return;
  writeFileSync(join(BACKUP_DIR, `${label}.json`), readFileSync(path, 'utf-8'));
}

function main() {
  console.log('retag-skills-job-pack-taxonomy.mjs');
  console.log('====================================\n');

  const d = JSON.parse(readFileSync(SKILLS_PATH, 'utf-8'));
  backup(SKILLS_PATH, 'skills');
  backup(CATEGORIES_PATH, 'skills-categories');

  const transitions = {};  // old_cat -> new_cat -> count
  for (const s of d.skills) {
    const oldCat = s.category;
    const newCat = classify(s);
    s.category = newCat;
    s.icon = ICONS[newCat] || s.icon;
    if (!transitions[oldCat]) transitions[oldCat] = {};
    transitions[oldCat][newCat] = (transitions[oldCat][newCat] || 0) + 1;
  }

  // Recompute
  const byCategory = {};
  for (const s of d.skills) {
    byCategory[s.category] = (byCategory[s.category] || 0) + 1;
  }

  d.meta = {
    ...d.meta,
    byCategory,
    reTaggedAt: new Date().toISOString(),
    taxonomy: 'Job Pack 8 + Agent 工具',
  };

  writeFileSync(SKILLS_PATH, JSON.stringify(d, null, 2));
  writeFileSync(CATEGORIES_PATH, JSON.stringify({ categories: byCategory }, null, 2));

  console.log('New category distribution:');
  for (const [cat, n] of Object.entries(byCategory).sort((a, b) => b[1] - a[1])) {
    const bar = '█'.repeat(Math.round(n / 5));
    console.log(`  ${cat.padEnd(12)} ${String(n).padStart(4)}  ${bar}`);
  }

  console.log('\nTop 5 transitions (old → new):');
  const flat = [];
  for (const [oldC, news] of Object.entries(transitions)) {
    for (const [newC, count] of Object.entries(news)) {
      if (oldC !== newC) flat.push({ oldC, newC, count });
    }
  }
  flat.sort((a, b) => b.count - a.count);
  for (const { oldC, newC, count } of flat.slice(0, 10)) {
    console.log(`  ${oldC.padEnd(15)} → ${newC.padEnd(12)} ${count}`);
  }
}

main();
