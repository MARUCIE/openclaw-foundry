#!/usr/bin/env node
/**
 * tag-skills-llm.mjs — LLM-powered skill tagging + tagline generation
 *
 * Phase 3: Tag 2000 skills with 3D tags (tech-stack, scenario, platform)
 * Phase 4: Generate editorial taglines for S/A skills
 * Phase 5: Reclassify "Other" category
 *
 * Uses Gemini Flash for speed + cost efficiency.
 * Batch: 10 skills per API call = ~200 calls total.
 *
 * Usage: node scripts/tag-skills-llm.mjs [--tags-only] [--taglines-only] [--reclassify-only]
 */

import { readFileSync, writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');
const SKILLS_PATH = join(ROOT, 'web', 'public', 'data', 'skills.json');
const CATEGORIES_PATH = join(ROOT, 'web', 'public', 'data', 'skills-categories.json');

const API_KEY = process.env.GOOGLE_API_KEY || process.env.GEMINI_API_KEY;
const BASE_URL = process.env.GEMINI_BASE_URL || 'https://generativelanguage.googleapis.com';
const MODEL = 'gemini-2.0-flash';
const BATCH_SIZE = 10;
const DELAY_MS = 200; // Rate limit safety

if (!API_KEY) {
  console.log('NOTE: GOOGLE_API_KEY / GEMINI_API_KEY not set — LLM enrichment skipped (tags/taglines/reclassify will be empty for new skills)');
  process.exit(0);
}

// ============================================================
// Gemini API caller
// ============================================================

async function callGemini(prompt) {
  const url = `${BASE_URL}/v1beta/models/${MODEL}:generateContent?key=${API_KEY}`;
  const body = {
    contents: [{ parts: [{ text: prompt }] }],
    generationConfig: {
      temperature: 0.1,
      maxOutputTokens: 4096,
      responseMimeType: 'application/json',
    },
  };

  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Gemini API error ${res.status}: ${err.substring(0, 200)}`);
  }

  const data = await res.json();
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text || '[]';
  try {
    return JSON.parse(text);
  } catch {
    console.warn('WARN: Failed to parse Gemini response as JSON, attempting cleanup...');
    const cleaned = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    return JSON.parse(cleaned);
  }
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// ============================================================
// Phase 3: Tag skills
// ============================================================

const TAG_PROMPT = `You are a skill/tool classifier for an AI Coding Agent marketplace.

For each skill below, assign tags in 3 dimensions:
1. tech_stack: programming languages, frameworks, databases, cloud platforms (e.g. "python", "react", "docker", "postgresql")
2. scenario: use cases (e.g. "code-review", "deployment", "data-analysis", "content-creation", "security-audit")
3. platform: which AI coding platforms support it (default: ["remote"] if unclear)

Rules:
- 3-5 tags total per skill (across all dimensions)
- Use lowercase English for all tags
- Only use tags from the allowed lists below
- If unsure, omit rather than guess

Allowed tech_stack tags: python, typescript, javascript, go, rust, java, kotlin, swift, react, vue, nextjs, angular, fastapi, django, express, spring, docker, kubernetes, terraform, aws, gcp, azure, cloudflare, postgresql, mysql, redis, mongodb, sqlite, supabase, firebase, pytorch, tensorflow, langchain, openai, anthropic, gemini, solidity, graphql, grpc

Allowed scenario tags: code-review, deployment, monitoring, testing, debugging, data-analysis, visualization, etl, sql-query, content-creation, seo, marketing, social-media, project-management, documentation, translation, security-audit, compliance, authentication, ai-agent, llm-integration, rag, embedding, web-scraping, browser-automation, file-management, communication, finance, blockchain, gaming, education, healthcare, ecommerce, devops, ci-cd

Allowed platform tags: claude-code, cursor, windsurf, vscode, cline, remote

Input skills (JSON array):
SKILLS_INPUT

Output: JSON array, same order, each element: {"tags": {"tech_stack": [...], "scenario": [...], "platform": [...]}}`;

async function tagSkills(skills) {
  const untagged = skills.filter(s => !s.tags || Object.keys(s.tags).length === 0 || (s.tags.tech_stack === undefined && s.tags.scenario === undefined));
  if (untagged.length === 0) {
    console.log('Phase 3: All skills already tagged, skipping.\n');
    return skills;
  }
  console.log(`Phase 3: Tagging ${untagged.length} NEW skills (${Math.ceil(untagged.length / BATCH_SIZE)} batches, ${skills.length - untagged.length} already tagged)...\n`);

  let tagged = 0;
  let errors = 0;

  for (let i = 0; i < untagged.length; i += BATCH_SIZE) {
    const batch = untagged.slice(i, i + BATCH_SIZE);
    const input = batch.map(s => ({ name: s.name, description: (s.description || '').substring(0, 150), category: s.category }));

    try {
      const prompt = TAG_PROMPT.replace('SKILLS_INPUT', JSON.stringify(input));
      const results = await callGemini(prompt);

      if (Array.isArray(results) && results.length === batch.length) {
        for (let j = 0; j < batch.length; j++) {
          batch[j].tags = results[j].tags || {};
          tagged++;
        }
      } else {
        console.warn(`WARN: Batch ${i / BATCH_SIZE + 1} returned ${Array.isArray(results) ? results.length : 'non-array'}, expected ${batch.length}`);
        errors++;
      }
    } catch (err) {
      console.warn(`WARN: Batch ${i / BATCH_SIZE + 1} failed: ${err.message}`);
      errors++;
    }

    if (i % (BATCH_SIZE * 10) === 0 && i > 0) {
      console.log(`  Progress: ${i}/${untagged.length} (${tagged} tagged, ${errors} errors)`);
    }

    await sleep(DELAY_MS);
  }

  console.log(`Phase 3 done: ${tagged} tagged, ${errors} errors\n`);
  return skills;
}

// ============================================================
// Phase 4: Generate editorial taglines for S/A skills
// ============================================================

const TAGLINE_PROMPT = `You are an editorial writer for an AI tool marketplace (Chinese audience).

For each S-rated or A-rated skill below, write a one-line Chinese editorial tagline (推荐语).
Requirements:
- Max 30 Chinese characters
- Highlight the key value proposition
- No emoji, no exclamation marks
- Professional but concise tone

Input skills (JSON array):
SKILLS_INPUT

Output: JSON array, same order, each element: {"tagline": "一句话中文推荐语"}`;

async function generateTaglines(skills) {
  const sa = skills.filter(s => (s.rating === 'S' || s.rating === 'A') && !s.editorialTagline);
  if (sa.length === 0) {
    console.log('Phase 4: All S/A skills already have taglines, skipping.\n');
    return skills;
  }
  console.log(`Phase 4: Generating taglines for ${sa.length} NEW S/A skills...\n`);

  let generated = 0;
  let errors = 0;

  for (let i = 0; i < sa.length; i += BATCH_SIZE) {
    const batch = sa.slice(i, i + BATCH_SIZE);
    const input = batch.map(s => ({ name: s.name, description: (s.description || '').substring(0, 200), rating: s.rating, category: s.category }));

    try {
      const prompt = TAGLINE_PROMPT.replace('SKILLS_INPUT', JSON.stringify(input));
      const results = await callGemini(prompt);

      if (Array.isArray(results) && results.length === batch.length) {
        for (let j = 0; j < batch.length; j++) {
          batch[j].editorialTagline = results[j].tagline || '';
          if (results[j].tagline) generated++;
        }
      } else {
        errors++;
      }
    } catch (err) {
      console.warn(`WARN: Tagline batch ${i / BATCH_SIZE + 1} failed: ${err.message}`);
      errors++;
    }

    await sleep(DELAY_MS);
  }

  console.log(`Phase 4 done: ${generated} taglines generated, ${errors} errors\n`);
  return skills;
}

// ============================================================
// Phase 5: Reclassify "Other" category
// ============================================================

const RECLASSIFY_PROMPT = `You are a skill classifier for an AI coding agent marketplace.

These skills are currently in the "其他" (Other) category. Reclassify each into the BEST matching category from this list:

Categories: 区块链 Web3, 电商营销, Agent 基建, 游戏娱乐, 搜索与研究, DevOps 部署, 办公文档, 金融交易, 生活服务, AI 模型, 教育学习, HR 人才, 通讯集成, 数据分析, 效率工具, 安全合规, 系统工具, 代码开发, 浏览器自动化, 内容创作, API 网关, 多媒体

Rules:
- Only use "其他" if NONE of the above categories fit at all
- Consider the skill's name and description carefully
- Be generous in matching — better to classify than leave in "其他"

Input skills (JSON array):
SKILLS_INPUT

Output: JSON array, same order, each element: {"category": "最佳分类"}`;

async function reclassifyOther(skills) {
  const others = skills.filter(s => s.category === '其他');
  console.log(`Phase 5: Reclassifying ${others.length} "其他" skills...\n`);

  let reclassified = 0;
  let errors = 0;

  for (let i = 0; i < others.length; i += BATCH_SIZE) {
    const batch = others.slice(i, i + BATCH_SIZE);
    const input = batch.map(s => ({ name: s.name, description: (s.description || '').substring(0, 150) }));

    try {
      const prompt = RECLASSIFY_PROMPT.replace('SKILLS_INPUT', JSON.stringify(input));
      const results = await callGemini(prompt);

      if (Array.isArray(results) && results.length === batch.length) {
        for (let j = 0; j < batch.length; j++) {
          const newCat = results[j].category;
          if (newCat && newCat !== '其他') {
            batch[j].category = newCat;
            reclassified++;
          }
        }
      } else {
        errors++;
      }
    } catch (err) {
      console.warn(`WARN: Reclassify batch ${i / BATCH_SIZE + 1} failed: ${err.message}`);
      errors++;
    }

    await sleep(DELAY_MS);
  }

  console.log(`Phase 5 done: ${reclassified}/${others.length} reclassified, ${errors} errors\n`);
  return skills;
}

// ============================================================
// Main
// ============================================================

async function main() {
  console.log('Skill Curation Pipeline v4 — LLM Enhancement');
  console.log('==============================================\n');

  const args = process.argv.slice(2);
  const tagsOnly = args.includes('--tags-only');
  const taglinesOnly = args.includes('--taglines-only');
  const reclassifyOnly = args.includes('--reclassify-only');
  const runAll = !tagsOnly && !taglinesOnly && !reclassifyOnly;

  const data = JSON.parse(readFileSync(SKILLS_PATH, 'utf-8'));
  let skills = data.skills || [];
  console.log(`Input: ${skills.length} skills\n`);

  if (runAll || tagsOnly) {
    skills = await tagSkills(skills);
  }

  if (runAll || taglinesOnly) {
    skills = await generateTaglines(skills);
  }

  if (runAll || reclassifyOnly) {
    skills = await reclassifyOther(skills);
  }

  // Update meta
  const taggedCount = skills.filter(s => s.tags && Object.keys(s.tags).length > 0).length;
  const taglineCount = skills.filter(s => s.editorialTagline).length;
  const otherCount = skills.filter(s => s.category === '其他').length;

  data.skills = skills;
  data.meta = {
    ...data.meta,
    taggedAt: new Date().toISOString(),
    taggedCount,
    taglineCount,
    otherCategoryCount: otherCount,
    otherCategoryPercent: ((otherCount / skills.length) * 100).toFixed(1) + '%',
  };

  writeFileSync(SKILLS_PATH, JSON.stringify(data, null, 2), 'utf-8');
  console.log(`Wrote: ${SKILLS_PATH}`);

  // Rebuild categories (categories = counts, frontend reads this for sidebar)
  const cats = {};
  for (const s of skills) {
    const cat = s.category || '其他';
    cats[cat] = (cats[cat] || 0) + 1;
  }
  writeFileSync(CATEGORIES_PATH, JSON.stringify({ categories: cats, totalSkills: skills.length, curatedAt: new Date().toISOString() }, null, 2), 'utf-8');
  console.log(`Wrote: ${CATEGORIES_PATH}`);

  console.log(`\nSummary:`);
  console.log(`  Tagged: ${taggedCount}/${skills.length}`);
  console.log(`  Taglines: ${taglineCount}`);
  console.log(`  "其他" remaining: ${otherCount} (${((otherCount / skills.length) * 100).toFixed(1)}%)`);
}

main().catch(err => {
  console.error('FATAL:', err);
  process.exit(1);
});
