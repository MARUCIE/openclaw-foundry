#!/usr/bin/env node
/**
 * curate-skills.mjs — Skill Curation Pipeline v4
 *
 * Phase 1: Dedup + Rename (P0)
 * Phase 2: Rating Calibration (P0)
 * Phase 4 (partial): Icon assignment by category
 *
 * Reads web/public/data/skills.json, outputs curated version in-place.
 * Run after merge, before next build.
 *
 * Usage: node scripts/curate-skills.mjs
 */

import { readFileSync, writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');
const SKILLS_PATH = join(ROOT, 'web', 'public', 'data', 'skills.json');
const CATEGORIES_PATH = join(ROOT, 'web', 'public', 'data', 'skills-categories.json');

// ============================================================
// Category → Icon mapping (Material Symbols)
// ============================================================
const CATEGORY_ICONS = {
  '区块链 Web3': 'currency_bitcoin',
  '电商营销': 'shopping_cart',
  'Agent 基建': 'smart_toy',
  '游戏娱乐': 'sports_esports',
  '搜索与研究': 'search',
  'DevOps 部署': 'cloud_upload',
  '办公文档': 'description',
  '金融交易': 'trending_up',
  '生活服务': 'home',
  'AI 模型': 'psychology',
  '教育学习': 'school',
  'HR 人才': 'person_search',
  '通讯集成': 'chat',
  '其他': 'extension',
  '数据分析': 'analytics',
  '效率工具': 'bolt',
  '安全合规': 'security',
  '系统工具': 'settings',
  '代码开发': 'code',
  '浏览器自动化': 'open_in_browser',
  '内容创作': 'edit_note',
  'API 网关': 'api',
  '多媒体': 'video_library',
};

// ============================================================
// Phase 1: Dedup + Rename
// ============================================================

function dedup(skills) {
  const seen = new Map(); // key: dedup_key → best skill
  let removed = 0;
  let renamed = 0;

  for (const skill of skills) {
    // Generate unique display name from author + original name
    const author = skill.author || 'unknown';
    const origName = skill.name || 'unnamed';

    // Rename generic names: "mcp", "mcp-server", "server", "docs"
    const genericNames = new Set(['mcp', 'mcp-server', 'server', 'docs', 'mcp-hub']);
    if (genericNames.has(origName.toLowerCase())) {
      // Use description first 40 chars as slug, fallback to author
      const descSlug = (skill.description || '')
        .replace(/[^a-zA-Z0-9\s]/g, '')
        .trim()
        .split(/\s+/)
        .slice(0, 5)
        .join(' ');
      skill.name = descSlug || `${author}/${origName}`;
      renamed++;
    }

    // Dedup key: lowercase name + author (different authors can have same-named skills)
    const dedupKey = `${skill.name.toLowerCase()}::${author.toLowerCase()}`;

    if (seen.has(dedupKey)) {
      const existing = seen.get(dedupKey);
      // Keep the one with higher downloads
      const existingDl = parseDownloads(existing.downloadsDisplay);
      const currentDl = parseDownloads(skill.downloadsDisplay);
      if (currentDl > existingDl) {
        seen.set(dedupKey, skill);
      }
      removed++;
    } else {
      seen.set(dedupKey, skill);
    }
  }

  const result = Array.from(seen.values());
  console.log(`Phase 1 Dedup: ${skills.length} → ${result.length} (removed ${removed}, renamed ${renamed})`);
  return result;
}

function parseDownloads(display) {
  if (!display) return 0;
  const s = display.toString().replace(/,/g, '');
  if (s.endsWith('k')) return parseFloat(s) * 1000;
  if (s.endsWith('M')) return parseFloat(s) * 1000000;
  return parseFloat(s) || 0;
}

// ============================================================
// Phase 2: Rating Calibration (percentile-based)
// ============================================================

function calibrateRatings(skills) {
  // Calculate composite scores
  const maxDownloads = Math.max(...skills.map(s => parseDownloads(s.downloadsDisplay)), 1);
  const maxStars = Math.max(...skills.map(s => parseDownloads(s.starsDisplay)), 1);
  const maxPlatforms = Math.max(...skills.map(s => (s.platforms || []).length), 1);
  const now = Date.now();

  for (const skill of skills) {
    const downloads = parseDownloads(skill.downloadsDisplay);
    const stars = parseDownloads(skill.starsDisplay);
    const descLen = (skill.description || '').length;
    const platforms = (skill.platforms || []).length;

    // Normalized inputs (0-1)
    const normDl = Math.log10(downloads + 1) / Math.log10(maxDownloads + 1);
    const normStars = Math.log10(stars + 1) / Math.log10(maxStars + 1);
    const freshness = 1.0; // Can't calculate without update date; default to fresh
    const descQuality = Math.min(1, descLen / 200);
    const normPlatforms = platforms / maxPlatforms;

    // Composite score
    skill.compositeScore = (
      normDl * 0.30 +
      normStars * 0.25 +
      freshness * 0.20 +
      descQuality * 0.15 +
      normPlatforms * 0.10
    );
  }

  // Sort by composite score descending
  skills.sort((a, b) => b.compositeScore - a.compositeScore);

  // Assign ratings by percentile
  const n = skills.length;
  const counts = { S: 0, A: 0, B: 0, C: 0, D: 0 };

  for (let i = 0; i < n; i++) {
    const percentile = i / n; // 0 = top, 1 = bottom
    let rating;
    if (percentile < 0.05) rating = 'S';
    else if (percentile < 0.20) rating = 'A';
    else if (percentile < 0.60) rating = 'B';
    else if (percentile < 0.90) rating = 'C';
    else rating = 'D';

    skills[i].rating = rating;
    skills[i].score = Math.round(skills[i].compositeScore * 100);
    counts[rating]++;
  }

  console.log(`Phase 2 Ratings: S=${counts.S} A=${counts.A} B=${counts.B} C=${counts.C} D=${counts.D} (total ${n})`);
  return skills;
}

// ============================================================
// Phase 4 (partial): Assign icons by category
// ============================================================

function assignIcons(skills) {
  let assigned = 0;
  for (const skill of skills) {
    const icon = CATEGORY_ICONS[skill.category] || 'extension';
    if (!skill.icon || skill.icon === '' || skill.icon === 'extension') {
      skill.icon = icon;
      assigned++;
    }
  }
  console.log(`Phase 4 Icons: ${assigned} icons assigned from category mapping`);
  return skills;
}

// ============================================================
// Rebuild categories with counts from curated data
// ============================================================

function rebuildCategories(skills) {
  const cats = {};
  for (const s of skills) {
    const cat = s.category || '其他';
    cats[cat] = (cats[cat] || 0) + 1;
  }

  // Also compute composite scores per category
  const catScores = {};
  for (const s of skills) {
    const cat = s.category || '其他';
    catScores[cat] = (catScores[cat] || 0) + (s.compositeScore || 0);
  }

  const result = {
    categories: catScores,
    counts: cats,
    totalSkills: skills.length,
    curatedAt: new Date().toISOString(),
  };

  return result;
}

// ============================================================
// Main
// ============================================================

function main() {
  console.log('Skill Curation Pipeline v4');
  console.log('==========================\n');

  // Read current data
  const data = JSON.parse(readFileSync(SKILLS_PATH, 'utf-8'));
  let skills = data.skills || [];
  console.log(`Input: ${skills.length} skills\n`);

  // Phase 1: Dedup + Rename
  skills = dedup(skills);

  // Phase 2: Rating Calibration
  skills = calibrateRatings(skills);

  // Phase 4 (partial): Icons
  skills = assignIcons(skills);

  // Clean up internal fields
  for (const s of skills) {
    delete s.compositeScore; // Don't expose raw score
  }

  // Write curated skills.json
  const output = {
    ...data,
    skills,
    meta: {
      ...data.meta,
      source: 'curated-v4',
      curatedAt: new Date().toISOString(),
      totalProcessed: skills.length,
      byRating: {
        S: skills.filter(s => s.rating === 'S').length,
        A: skills.filter(s => s.rating === 'A').length,
        B: skills.filter(s => s.rating === 'B').length,
        C: skills.filter(s => s.rating === 'C').length,
        D: skills.filter(s => s.rating === 'D').length,
      },
    },
  };
  writeFileSync(SKILLS_PATH, JSON.stringify(output, null, 2), 'utf-8');
  console.log(`\nWrote: ${SKILLS_PATH}`);

  // Rebuild categories
  const cats = rebuildCategories(skills);
  writeFileSync(CATEGORIES_PATH, JSON.stringify(cats, null, 2), 'utf-8');
  console.log(`Wrote: ${CATEGORIES_PATH}`);

  // Summary
  console.log(`\nDone: ${skills.length} curated skills.`);

  // Verify: check for remaining duplicates
  const names = skills.map(s => s.name);
  const dupes = names.filter((n, i) => names.indexOf(n) !== i);
  if (dupes.length > 0) {
    console.log(`\nWARN: ${dupes.length} remaining duplicate names (different authors):`);
    [...new Set(dupes)].slice(0, 5).forEach(d => console.log(`  ${d}`));
  } else {
    console.log('\nOK: Zero same-author duplicates.');
  }
}

main();
