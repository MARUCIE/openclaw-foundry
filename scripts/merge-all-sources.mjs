#!/usr/bin/env node

/**
 * Merge All Sources — Unified Skill/Server Index
 *
 * Merges:
 *   1. ClawHub skills (data/clawhub-skills.json)
 *   2. Official MCP Registry servers (data/mcp-registry-servers.json)
 *
 * Output: data/unified-index.json
 *
 * Dedup: by name similarity (exact match on normalized slug)
 *
 * Usage:
 *   node scripts/merge-all-sources.mjs
 */

import { readFile, writeFile, mkdir } from 'fs/promises';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const PROJECT = join(__dirname, '..');
const DATA_DIR = join(PROJECT, 'data');

// Same category rules as sync-clawhub-skills.mjs
const CATEGORY_RULES = [
  { category: '区块链 Web3', keywords: ['crypto', 'bitcoin', 'tron', 'pancakeswap', 'swap', 'farming', 'staking', 'onchain', 'blockchain', 'web3', 'nft', 'defi', 'wallet', 'bnb', 'token', 'polymarket', 'solana', 'ethereum'] },
  { category: '金融交易', keywords: ['stock', 'trading', 'forex', 'finance', 'investment', 'quant', 'portfolio', 'market', 'banking', 'payment', 'stripe', 'paypal'] },
  { category: '电商营销', keywords: ['ecommerce', 'amazon', 'shopify', 'seo', 'marketing', 'ads', 'google ads', 'meta ads', 'analytics', 'campaign'] },
  { category: '办公文档', keywords: ['word', 'docx', 'excel', 'pdf', 'slide', 'powerpoint', 'google docs', 'google sheets', 'notion', 'confluence'] },
  { category: '教育学习', keywords: ['learn', 'education', 'course', 'quiz', 'language', 'tutor'] },
  { category: '游戏娱乐', keywords: ['game', 'music', 'spotify', 'media', 'entertainment', 'steam'] },
  { category: '生活服务', keywords: ['travel', 'weather', 'health', 'medical', 'food', 'recipe', 'home', 'iot', 'smart home'] },
  { category: 'HR 人才', keywords: ['hr', 'recruit', 'hiring', 'resume', 'job'] },
  { category: 'Agent 基建', keywords: ['agent', 'memory', 'context', 'skill', 'orchestrat', 'workflow', 'prompt'] },
  { category: '安全合规', keywords: ['security', 'auth', 'oauth', 'vault', 'secret', 'compliance', 'audit'] },
  { category: 'AI 模型', keywords: ['llm', 'openai', 'gemini', 'claude', 'whisper', 'tts', 'stt', 'image gen', 'vision', 'ocr', 'hugging'] },
  { category: '浏览器自动化', keywords: ['browser', 'playwright', 'puppeteer', 'selenium', 'scrape', 'crawl', 'headless'] },
  { category: '搜索与研究', keywords: ['search', 'research', 'google', 'brave', 'tavily', 'exa', 'bing'] },
  { category: '通讯集成', keywords: ['email', 'slack', 'discord', 'telegram', 'teams', 'chat', 'smtp', 'imap', 'twilio', 'sms'] },
  { category: '数据分析', keywords: ['data', 'analytics', 'sql', 'database', 'postgres', 'mysql', 'mongodb', 'redis', 'clickhouse', 'bigquery', 'snowflake', 'supabase'] },
  { category: '内容创作', keywords: ['write', 'blog', 'cms', 'wordpress', 'content', 'translation'] },
  { category: '效率工具', keywords: ['todo', 'task', 'calendar', 'schedule', 'productivity', 'jira', 'linear', 'asana', 'trello', 'obsidian'] },
  { category: '多媒体', keywords: ['audio', 'video', 'image', 'photo', 'youtube', 'ffmpeg', 'camera'] },
  { category: 'DevOps 部署', keywords: ['deploy', 'docker', 'kubernetes', 'ci', 'cd', 'terraform', 'cloudflare', 'vercel', 'aws', 'azure', 'gcp', 'server', 'nginx', 'monitor'] },
  { category: '代码开发', keywords: ['code', 'git', 'github', 'gitlab', 'debug', 'test', 'lint', 'build', 'compiler', 'npm', 'pip'] },
  { category: '系统工具', keywords: ['file', 'filesystem', 'os', 'shell', 'terminal', 'cli', 'process', 'ssh', 'ftp'] },
  { category: 'API 网关', keywords: ['api', 'gateway', 'rest', 'graphql', 'webhook', 'proxy', 'mcp server'] },
];

function inferCategory(name, desc) {
  const text = `${name} ${desc}`.toLowerCase();
  for (const rule of CATEGORY_RULES) {
    if (rule.keywords.some(kw => text.includes(kw))) {
      return rule.category;
    }
  }
  return '其他';
}

// Dedup key: source + author + name (not just name — different authors can have same name)
function dedupKey(source, author, name) {
  const norm = `${source}:${author}/${name}`.replace(/\s+/g, '-').toLowerCase();
  return norm;
}

// Cross-source dedup: match by normalized name + description similarity
function crossSourceKey(name, desc) {
  // Only match if name is specific enough (>= 3 words or 15 chars)
  const n = name.toLowerCase().replace(/[^a-z0-9\s]/g, '').trim();
  if (n.length < 15 && n.split(/\s+/).length < 3) return null;
  return n;
}

async function main() {
  await mkdir(DATA_DIR, { recursive: true });

  const unified = new Map();
  const stats = { clawhub: 0, mcpRegistry: 0, duplicates: 0 };

  // 1. Load ClawHub skills
  try {
    const raw = JSON.parse(await readFile(join(DATA_DIR, 'clawhub-skills.json'), 'utf-8'));
    const skills = raw.skills || [];
    for (const s of skills) {
      const key = dedupKey('clawhub', s.author, s.name);
      unified.set(key, {
        id: s.id,
        name: s.name,
        slug: s.slug,
        author: s.author,
        description: s.description,
        category: s.category,
        source: 'clawhub',
        sourceUrl: s.url,
        downloads: s.downloads,
        stars: s.stars,
        score: s.score,
        rating: s.rating,
        versions: s.versions,
        repositoryUrl: '',
        remoteUrl: '',
        publishedAt: '',
      });
    }
    stats.clawhub = skills.length;
    console.log(`OK: Loaded ${skills.length} ClawHub skills`);
  } catch { console.log('WARN: No ClawHub data'); }

  // 2. Load MCP Registry servers
  try {
    const raw = JSON.parse(await readFile(join(DATA_DIR, 'mcp-registry-servers.json'), 'utf-8'));
    const servers = raw.servers || [];
    // Build cross-source dedup set from ClawHub names
    const crossKeys = new Set();
    for (const [, v] of unified) {
      const ck = crossSourceKey(v.name, v.description);
      if (ck) crossKeys.add(ck);
    }

    for (const s of servers) {
      const key = dedupKey('mcp', s.author, s.name);
      if (unified.has(key)) { stats.duplicates++; continue; }

      // Cross-source dedup: skip if an identical name already exists in ClawHub
      const ck = crossSourceKey(s.name, s.description);
      if (ck && crossKeys.has(ck)) { stats.duplicates++; continue; }
      const category = inferCategory(s.name, s.description);
      unified.set(key, {
        id: s.id,
        name: s.name,
        slug: s.slug,
        author: s.author,
        description: s.description,
        category,
        source: 'mcp-registry',
        sourceUrl: s.sourceUrl,
        downloads: 0,
        stars: 0,
        score: s.remoteUrl ? 15 : 10, // remote-capable gets bonus
        rating: 'C', // will be reassigned
        versions: 0,
        repositoryUrl: s.repositoryUrl,
        remoteUrl: s.remoteUrl,
        publishedAt: s.publishedAt,
      });
    }
    stats.mcpRegistry = servers.length;
    console.log(`OK: Loaded ${servers.length} MCP Registry servers (${stats.duplicates} duplicates skipped)`);
  } catch { console.log('WARN: No MCP Registry data'); }

  // 3. Assign percentile ratings
  const all = Array.from(unified.values());
  const sorted = [...all].sort((a, b) => b.score - a.score);
  const n = sorted.length;
  const cutoffs = {
    S: sorted[Math.floor(n * 0.05)]?.score ?? 100,
    A: sorted[Math.floor(n * 0.20)]?.score ?? 80,
    B: sorted[Math.floor(n * 0.55)]?.score ?? 50,
    C: sorted[Math.floor(n * 0.90)]?.score ?? 20,
  };
  for (const item of all) {
    if (item.score >= cutoffs.S) item.rating = 'S';
    else if (item.score >= cutoffs.A) item.rating = 'A';
    else if (item.score >= cutoffs.B) item.rating = 'B';
    else if (item.score >= cutoffs.C) item.rating = 'C';
    else item.rating = 'D';
  }

  // 4. Category stats
  const byCategory = {};
  const bySource = {};
  const byRating = {};
  for (const item of all) {
    byCategory[item.category] = (byCategory[item.category] || 0) + 1;
    bySource[item.source] = (bySource[item.source] || 0) + 1;
    byRating[item.rating] = (byRating[item.rating] || 0) + 1;
  }

  const output = {
    meta: {
      syncedAt: new Date().toISOString(),
      total: all.length,
      sources: stats,
      byCategory,
      bySource,
      byRating,
    },
    skills: all.sort((a, b) => b.score - a.score),
  };

  await writeFile(join(DATA_DIR, 'unified-index.json'), JSON.stringify(output, null, 2));
  console.log(`\nOK: Unified index: ${all.length} entries`);
  console.log('   Sources:', JSON.stringify(bySource));
  console.log('   Ratings:', JSON.stringify(byRating));
  console.log('   Categories:', Object.keys(byCategory).length, 'categories');
  console.log('   Duplicates removed:', stats.duplicates);
}

main().catch(err => { console.error('ERROR:', err.message); process.exit(1); });
