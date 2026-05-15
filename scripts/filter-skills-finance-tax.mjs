#!/usr/bin/env node
/**
 * filter-skills-finance-tax.mjs
 *
 * Restricts the marketplace skill catalog to the 财税 (finance & tax) AI
 * platform domain. Excludes categories that are out-of-scope for the
 * compliance/accounting/tax/business workflows that openclaw-foundry serves.
 *
 * Out-of-scope categories (excluded explicitly):
 *   - 区块链 Web3        (blockchain/Web3/DeFi/NFT — outside compliance scope)
 *   - 金融交易            (trading/stocks/forex — outside accounting scope)
 *   - 电商营销            (e-commerce/marketing — different vertical)
 *   - 游戏娱乐            (gaming/entertainment — outside platform scope)
 *   - 生活服务            (lifestyle services — outside platform scope)
 *
 * Reads:
 *   web/public/data/skills.json
 *   web/public/data/skills-categories.json
 * Writes (in place):
 *   web/public/data/skills.json
 *   web/public/data/skills-categories.json
 *
 * Backups written to web/public/data/_backup-pre-domain-filter/
 *
 * Run after curate-skills.mjs, before prebuild static.
 *
 * Usage: node scripts/filter-skills-finance-tax.mjs
 */

import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');
const SKILLS_PATH = join(ROOT, 'web', 'public', 'data', 'skills.json');
const CATEGORIES_PATH = join(ROOT, 'web', 'public', 'data', 'skills-categories.json');
const BACKUP_DIR = join(ROOT, 'web', 'public', 'data', '_backup-pre-domain-filter');

const EXCLUDED_CATEGORIES = new Set([
  '区块链 Web3',
  '金融交易',
  '电商营销',
  '游戏娱乐',
  '生活服务',
]);

function backup(path, label) {
  if (!existsSync(BACKUP_DIR)) mkdirSync(BACKUP_DIR, { recursive: true });
  const dest = join(BACKUP_DIR, `${label}.json`);
  writeFileSync(dest, readFileSync(path, 'utf-8'));
  console.log(`  backup: ${dest}`);
}

function main() {
  console.log('filter-skills-finance-tax.mjs — domain restriction to 财税 AI platform');
  console.log('================================================================\n');

  const skillsData = JSON.parse(readFileSync(SKILLS_PATH, 'utf-8'));
  const categoriesData = JSON.parse(readFileSync(CATEGORIES_PATH, 'utf-8'));

  const beforeTotal = skillsData.skills.length;
  console.log(`Before: ${beforeTotal} skills across ${Object.keys(categoriesData.categories).length} categories\n`);

  console.log('Excluded categories:');
  for (const cat of EXCLUDED_CATEGORIES) {
    const count = categoriesData.categories[cat] || 0;
    console.log(`  - ${cat.padEnd(20)} ${count} skills`);
  }
  console.log();

  backup(SKILLS_PATH, 'skills');
  backup(CATEGORIES_PATH, 'skills-categories');

  const filteredSkills = skillsData.skills.filter(
    (s) => !EXCLUDED_CATEGORIES.has(s.category),
  );
  const filteredCategories = Object.fromEntries(
    Object.entries(categoriesData.categories).filter(
      ([cat]) => !EXCLUDED_CATEGORIES.has(cat),
    ),
  );

  const removed = beforeTotal - filteredSkills.length;
  const pct = ((removed / beforeTotal) * 100).toFixed(1);

  // Recompute meta.byCategory from kept skills (don't trust pre-filter meta)
  const newByCategory = {};
  for (const s of filteredSkills) {
    newByCategory[s.category] = (newByCategory[s.category] || 0) + 1;
  }

  // Recompute byRating
  const newByRating = {};
  for (const s of filteredSkills) {
    const r = s.rating || '?';
    newByRating[r] = (newByRating[r] || 0) + 1;
  }

  const newSkillsData = {
    ...skillsData,
    total: filteredSkills.length,
    meta: {
      ...skillsData.meta,
      total: filteredSkills.length,
      byCategory: newByCategory,
      byRating: newByRating,
      domainFilteredAt: new Date().toISOString(),
      domainFilter: '财税 AI platform — excludes blockchain/trading/e-commerce/gaming/lifestyle',
      excludedCategories: [...EXCLUDED_CATEGORIES],
    },
    skills: filteredSkills,
  };

  const newCategoriesData = { categories: filteredCategories };

  writeFileSync(SKILLS_PATH, JSON.stringify(newSkillsData, null, 2));
  writeFileSync(CATEGORIES_PATH, JSON.stringify(newCategoriesData, null, 2));

  console.log(`After: ${filteredSkills.length} skills (-${removed}, -${pct}%)`);
  console.log(`Kept categories: ${Object.keys(filteredCategories).length}`);
  console.log('\nKept category breakdown:');
  for (const [cat, count] of Object.entries(newByCategory).sort((a, b) => b[1] - a[1])) {
    console.log(`  ${cat.padEnd(20)} ${count}`);
  }
}

main();
