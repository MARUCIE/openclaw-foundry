#!/usr/bin/env node

/**
 * ClawHub Skills Sync — Scrape → Filter → Rate → Package
 *
 * Source: https://clawhub.ai/skills?sort=downloads&nonSuspicious=true
 * Output: data/clawhub-skills.json (curated, rated, categorized)
 *
 * Usage:
 *   node scripts/sync-clawhub-skills.mjs              # Full scrape + process
 *   node scripts/sync-clawhub-skills.mjs --process-only  # Re-process existing raw data
 *
 * Cron: daily at 06:00 via LaunchAgent or fleet-pipeline
 */

import { readFile, writeFile, mkdir } from 'fs/promises';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const PROJECT_ROOT = join(__dirname, '..');
const DATA_DIR = join(PROJECT_ROOT, 'data');
const RAW_FILE = join(DATA_DIR, 'clawhub-skills-raw.json');
const OUTPUT_FILE = join(DATA_DIR, 'clawhub-skills.json');

// ── Category inference from description + name ──
const CATEGORY_RULES = [
  { category: '开发工具', keywords: ['code', 'git', 'debug', 'refactor', 'test', 'lint', 'build', 'ci', 'deploy', 'docker', 'cli', 'terminal', 'compiler', 'sdk'] },
  { category: '浏览器自动化', keywords: ['browser', 'playwright', 'puppeteer', 'selenium', 'scrape', 'crawl', 'headless', 'dom', 'screenshot'] },
  { category: '搜索与研究', keywords: ['search', 'research', 'web search', 'google', 'baidu', 'exa', 'tavily', 'bing'] },
  { category: '数据分析', keywords: ['data', 'analytics', 'sql', 'database', 'excel', 'csv', 'chart', 'visualization', 'etl', 'pipeline'] },
  { category: '内容创作', keywords: ['write', 'document', 'ppt', 'powerpoint', 'word', 'pdf', 'markdown', 'blog', 'translate', 'seo'] },
  { category: '通讯集成', keywords: ['email', 'slack', 'discord', 'telegram', 'wechat', 'feishu', 'dingtalk', 'imap', 'smtp', 'chat', 'message'] },
  { category: 'AI 模型', keywords: ['llm', 'model', 'openai', 'gemini', 'claude', 'whisper', 'tts', 'stt', 'image gen', 'vision'] },
  { category: '安全合规', keywords: ['security', 'guard', 'antivirus', 'injection', 'vulnerability', 'audit', 'compliance'] },
  { category: '效率工具', keywords: ['todo', 'task', 'calendar', 'schedule', 'obsidian', 'notion', 'note', 'bookmark', 'clipboard'] },
  { category: '系统工具', keywords: ['file', 'filesystem', 'os', 'macos', 'linux', 'windows', 'shell', 'process', 'memory', 'disk'] },
  { category: '多媒体', keywords: ['audio', 'video', 'music', 'spotify', 'image', 'photo', 'camera', 'screen', 'recording'] },
  { category: 'API 网关', keywords: ['api', 'gateway', 'oauth', 'rest', 'graphql', 'webhook', 'proxy', 'mcp'] },
];

const ICON_MAP = {
  '开发工具': 'code',
  '浏览器自动化': 'web',
  '搜索与研究': 'search',
  '数据分析': 'query_stats',
  '内容创作': 'description',
  '通讯集成': 'chat_bubble',
  'AI 模型': 'smart_toy',
  '安全合规': 'security',
  '效率工具': 'task_alt',
  '系统工具': 'terminal',
  '多媒体': 'movie',
  'API 网关': 'api',
  '其他': 'widgets',
};

function inferCategory(skill) {
  const text = `${skill.name} ${skill.desc} ${skill.slug}`.toLowerCase();
  for (const rule of CATEGORY_RULES) {
    if (rule.keywords.some(kw => text.includes(kw))) {
      return rule.category;
    }
  }
  return '其他';
}

function parseDownloads(str) {
  if (!str) return 0;
  const clean = str.replace(/,/g, '');
  if (clean.endsWith('k')) return parseFloat(clean) * 1000;
  return parseFloat(clean) || 0;
}

function parseStars(str) {
  if (!str) return 0;
  const clean = str.replace(/,/g, '');
  if (clean.endsWith('k')) return parseFloat(clean) * 1000;
  return parseFloat(clean) || 0;
}

// ── Quality score (0-100): weighted formula ──
function computeScore(skill) {
  const downloads = parseDownloads(skill.downloads);
  const stars = parseStars(skill.stars);
  const versions = skill.versions || 0;
  const hasDesc = skill.desc && skill.desc.length > 30 ? 1 : 0;
  const hasPlatforms = skill.platforms && skill.platforms.length > 0 ? 1 : 0;
  const isOfficial = skill.official ? 1 : 0;

  // Logarithmic scaling for downloads and stars
  const dlScore = Math.min(Math.log10(downloads + 1) / 6, 1) * 40;   // max 40 pts
  const starScore = Math.min(Math.log10(stars + 1) / 4, 1) * 25;     // max 25 pts
  const versionScore = Math.min(versions / 20, 1) * 15;               // max 15 pts
  const qualityScore = (hasDesc * 8) + (hasPlatforms * 5) + (isOfficial * 7); // max 20 pts

  return Math.round(dlScore + starScore + versionScore + qualityScore);
}

// ── Rating tier from score ──
function computeRating(score) {
  if (score >= 70) return 'S';
  if (score >= 55) return 'A';
  if (score >= 40) return 'B';
  if (score >= 25) return 'C';
  return 'D';
}

// ── Main processing pipeline ──
async function processSkills(rawSkills) {
  const processed = rawSkills
    .filter(s => s.name && s.desc && s.downloads) // must have core fields
    .map(s => {
      const category = inferCategory(s);
      const score = computeScore(s);
      return {
        id: `${s.author}/${s.slug}`,
        name: s.name,
        slug: s.slug,
        author: s.author,
        description: s.desc,
        category,
        icon: ICON_MAP[category] || 'widgets',
        downloads: parseDownloads(s.downloads),
        downloadsDisplay: s.downloads,
        stars: parseStars(s.stars),
        starsDisplay: s.stars,
        versions: s.versions,
        platforms: s.platforms || [],
        official: s.official || false,
        score,
        rating: computeRating(score),
        url: s.url,
      };
    })
    .sort((a, b) => b.score - a.score); // sort by quality score

  return processed;
}

// ── Output ──
async function main() {
  const processOnly = process.argv.includes('--process-only');

  await mkdir(DATA_DIR, { recursive: true });

  // Read raw data
  let rawSkills;
  try {
    const raw = await readFile(RAW_FILE, 'utf-8');
    rawSkills = JSON.parse(raw);
    console.log(`OK: Read ${rawSkills.length} raw skills from ${RAW_FILE}`);
  } catch {
    console.error(`ERROR: Cannot read ${RAW_FILE}. Run full scrape first.`);
    process.exit(1);
  }

  // Process
  const processed = await processSkills(rawSkills);

  // Stats
  const byCategory = {};
  const byRating = {};
  for (const s of processed) {
    byCategory[s.category] = (byCategory[s.category] || 0) + 1;
    byRating[s.rating] = (byRating[s.rating] || 0) + 1;
  }

  const output = {
    meta: {
      source: 'https://clawhub.ai/skills?sort=downloads&nonSuspicious=true',
      syncedAt: new Date().toISOString(),
      totalRaw: rawSkills.length,
      totalProcessed: processed.length,
      byCategory,
      byRating,
    },
    skills: processed,
  };

  await writeFile(OUTPUT_FILE, JSON.stringify(output, null, 2));

  console.log(`OK: Wrote ${processed.length} skills to ${OUTPUT_FILE}`);
  console.log(`   Categories: ${JSON.stringify(byCategory)}`);
  console.log(`   Ratings: ${JSON.stringify(byRating)}`);
  console.log(`   Top 5: ${processed.slice(0, 5).map(s => `${s.name} (${s.rating}:${s.score})`).join(', ')}`);
}

main().catch(err => {
  console.error('ERROR:', err.message);
  process.exit(1);
});
