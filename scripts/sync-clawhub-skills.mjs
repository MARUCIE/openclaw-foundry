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
// Order matters: more specific rules FIRST, generic catch-alls LAST
const CATEGORY_RULES = [
  // -- Domain-specific (most specific, check first) --
  // -- Domain-specific (most specific, check first) --
  { category: '区块链 Web3', keywords: ['crypto', 'bitcoin', 'tron', 'pancakeswap', 'swap', 'farming', 'staking', 'onchain', 'blockchain', 'web3', 'nft', 'defi', 'wallet', 'bnb', 'token', 'polymarket'] },
  { category: '金融交易', keywords: ['stock', 'trading', 'forex', 'finance', 'investment', 'quant', 'portfolio', 'market snapshot', 'a股', '股票', '基金', 'lof', 'baostock', 'futu', '金价', '黄金', 'gold price', '东方财富', 'eastmoney', 'etf', '可转债', '个税', '报税'] },
  { category: '电商营销', keywords: ['ecommerce', 'amazon', 'listing', 'shopify', 'jd.com', 'meituan', 'tiktok', 'xiaohongshu', '小红书', '带货', 'seo', 'marketing', 'growth', 'ads', 'ad intel', 'klaviyo', 'job board', 'post job', 'customer service', '客服', 'shopping', 'dropship', '闲鱼', '砍价', '优惠券', 'coupon', 'competitor analy'] },
  { category: '办公文档', keywords: ['word', 'docx', 'excel', 'xlsx', 'powerpoint', 'pptx', 'ppt', 'pdf', 'slide', 'presentation', '公文', '周报', '论文', 'thesis', 'resume', 'business plan', '商业计划', '翻译', 'translat'] },
  { category: '教育学习', keywords: ['vocabulary', 'language', 'classical chinese', '文言文', 'training plan', 'learn', 'curriculum', 'quiz', 'interview simul', '面试', 'mock interview', '诗词', 'poetry', '棋谱', 'weiqi', '起名', 'name gen', '八字', 'bazi', 'color palette', '传统色', 'career roadmap', '副业', '阅读', 'reading', 'mindfulness', '清除中文ai'] },
  { category: '游戏娱乐', keywords: ['game', 'arena', 'music', 'playlist', 'spotify', '歌单', 'soundcloud', 'dj', 'track', 'pet', 'lobster', 'fight', 'battle', 'gift', 'genshin', '新番', 'bilibili', 'anime', 'manga', '漫画', '漫剧'] },
  { category: '生活服务', keywords: ['travel', 'trip', 'flight', '12306', 'train', 'hotel', 'ninebot', '九号', '3d print', 'bambu', 'garmin', 'health', 'medical', 'recipe', '外呼', 'phone call', 'new york', 'weather', '天气', '快递', '物流', '油价', 'tesla', 'roomba', 'iot', '摄像头', 'camera', '生日', 'birthday', 'nutrition', '宠物', 'tarot', 'fortune', 'dream interpret', '彩票', '易经', 'i ching', 'hiking', 'hike', '时间胶囊', '施工', 'construction', 'homeassistant', 'whois', 'geoi'] },
  { category: 'HR 人才', keywords: ['hr', 'recruit', 'hiring', 'onboard', 'employee', '员工', '招聘', 'jd writer', 'job desc', 'product manager toolkit'] },
  { category: 'Agent 基建', keywords: ['skill finder', 'clawhub', 'clawdhub', 'provider sync', 'auto-update', 'clawtoclaw', 'agent census', 'clawfinder', 'scaffold', 'wip repo', 'agent economy', 'self-improv', 'proactiv', 'compact', 'memory manag', 'context compress', 'memory augment', 'cognition', 'expertpack', 'handover', 'iteration pattern', 'agent persona', 'subagent', 'team collab', 'coherence network', 'darkmatter', 'open-memory', '记忆索引', 'memory memoria', 'zombie heal', 'aura for', 'i-skill'] },

  // -- Technical verticals --
  { category: '安全合规', keywords: ['security', 'guard', 'antivirus', 'injection', 'vulnerability', 'audit', 'compliance', 'vetter', 'aegis', 'moltguard', 'rollback', 'safe memory'] },
  { category: 'AI 模型', keywords: ['llm', 'openai', 'gemini', 'claude', 'whisper', 'tts', 'stt', 'image gen', 'vision', 'ocr', 'transcri', 'asr', 'deepseek', 'qwen', 'model route', 'free ai', 'wodeapp'] },
  { category: '浏览器自动化', keywords: ['browser', 'playwright', 'puppeteer', 'selenium', 'scrape', 'crawl', 'headless', 'dom', 'screenshot', 'web scrap', 'crawl4ai', 'scrapling'] },
  { category: '搜索与研究', keywords: ['search', 'research', 'web search', 'google', 'baidu', 'exa', 'tavily', 'bing', 'brave search', 'deep research', 'academic search', 'news'] },
  { category: '通讯集成', keywords: ['email', 'slack', 'discord', 'telegram', 'wechat', 'feishu', 'dingtalk', 'imap', 'smtp', 'chat', 'message', 'twitter', 'weibo', '微信', '微博'] },
  { category: '数据分析', keywords: ['data analy', 'analytics', 'sql', 'database', 'csv', 'chart', 'visualization', 'etl', 'pandas', 'cohort', 'a/b test'] },
  { category: '内容创作', keywords: ['write', 'blog', 'translate', 'article', 'content', 'copywriting', 'humanize', 'prompt gen', 'image prompt', 'video gen', 'prd', 'product analy', '需求分析', 'press coverage', '掘金', 'juejin'] },
  { category: '效率工具', keywords: ['todo', 'task', 'calendar', 'schedule', 'obsidian', 'notion', 'note', 'bookmark', 'clipboard', 'productivity', 'workflow', 'automation'] },
  { category: '多媒体', keywords: ['audio', 'video', 'image', 'photo', 'camera', 'recording', 'subtitle', 'srt', 'video summar', 'seedance', 'lyrics'] },

  // -- Infrastructure (generic, check last) --
  { category: 'DevOps 部署', keywords: ['deploy', 'docker', 'ci', 'cd', 'kubernetes', 'terraform', 'cloudflare', 'vercel', 'aws', 'infra', 'wordpress', 'server', 'container', 'cert', 'acmesh', 'nginx', 'redis'] },
  { category: '代码开发', keywords: ['code', 'git', 'debug', 'refactor', 'test', 'lint', 'build', 'compiler', 'sdk', 'react', 'typescript', 'python', 'rust', 'component', 'golang', 'go ', 'full stack'] },
  { category: '系统工具', keywords: ['file', 'filesystem', 'os', 'macos', 'linux', 'windows', 'shell', 'process', 'disk', 'terminal', 'cli'] },
  { category: 'API 网关', keywords: ['api', 'gateway', 'oauth', 'rest', 'graphql', 'webhook', 'proxy', 'mcp'] },
];

const ICON_MAP = {
  '区块链 Web3': 'currency_bitcoin',
  '金融交易': 'trending_up',
  '电商营销': 'storefront',
  'Agent 基建': 'hub',
  '办公文档': 'article',
  '教育学习': 'school',
  '游戏娱乐': 'sports_esports',
  '生活服务': 'local_activity',
  'HR 人才': 'people',
  '安全合规': 'security',
  'AI 模型': 'smart_toy',
  '浏览器自动化': 'web',
  '搜索与研究': 'search',
  '通讯集成': 'chat_bubble',
  '数据分析': 'query_stats',
  '内容创作': 'description',
  '效率工具': 'task_alt',
  '多媒体': 'movie',
  'DevOps 部署': 'cloud_upload',
  '代码开发': 'code',
  '系统工具': 'terminal',
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
// v3: works for 30K+ skills where most have no download/star stats
function computeScore(skill) {
  const downloads = parseDownloads(skill.downloads);
  const stars = parseStars(skill.stars);
  const versions = skill.versions || 0;
  const descLen = (skill.desc || '').length;
  const hasPlatforms = skill.platforms && skill.platforms.length > 0 ? 1 : 0;
  const platformCount = (skill.platforms || []).length;
  const isOfficial = skill.official ? 1 : 0;
  const hasVersion = skill.version && skill.version !== '1.0.0';
  const hasTags = (skill.tags || []).length;

  // --- Stats-based signals (only ~6% of skills have these) ---
  const dlScore = Math.min(Math.sqrt(downloads) / 500, 1) * 25;       // max 25 pts
  const starScore = Math.min(Math.sqrt(stars) / 50, 1) * 20;          // max 20 pts

  // --- Universal signals (available for all skills) ---
  // Description quality: continuous scale, not bucketed
  const descScore = Math.min(descLen / 25, 10);                        // max 10 pts (250 chars = max)

  // Maturity signals
  const versionScore = Math.min(versions / 15, 1) * 10;               // max 10 pts
  const versionBump = hasVersion ? 3 : 0;                             // iterated past v1.0.0

  // Ecosystem signals
  const ecosystemScore =
    (hasPlatforms ? 2 : 0) +
    (platformCount >= 3 ? 3 : platformCount >= 2 ? 1 : 0) +
    (isOfficial ? 8 : 0) +
    Math.min(hasTags, 3);                                              // max 16 pts

  // Engagement ratio
  const ratio = downloads > 100 ? stars / downloads : 0;
  const ratioBonus = Math.min(ratio * 100, 5);                         // max 5 pts

  // Name quality: specific names > generic names (adds variance)
  const nameLen = (skill.name || '').length;
  const nameScore = nameLen > 5 && nameLen < 60 ? 2 : 0;              // max 2 pts

  // Recency bonus: newer skills get a small bump to add variance
  const updatedAt = skill.updatedAt ? new Date(skill.updatedAt).getTime() : 0;
  const daysSinceUpdate = updatedAt ? (Date.now() - updatedAt) / 86400000 : 999;
  const recencyScore = daysSinceUpdate < 7 ? 4 :
                       daysSinceUpdate < 30 ? 3 :
                       daysSinceUpdate < 90 ? 2 :
                       daysSinceUpdate < 365 ? 1 : 0;                  // max 4 pts

  // Channel bonus
  const channelScore = skill.channel === 'official' ? 5 : 0;          // max 5 pts

  return Math.round(dlScore + starScore + descScore + versionScore + versionBump +
                    ecosystemScore + ratioBonus + nameScore + recencyScore + channelScore);
}

// ── Rating tier: percentile-based for natural distribution ──
// Computed dynamically in processSkills() after all scores are calculated
function assignRatings(skills) {
  const sorted = [...skills].sort((a, b) => b.score - a.score);
  const n = sorted.length;
  // Target: S ~5%, A ~15%, B ~35%, C ~35%, D ~10%
  const cutoffs = {
    S: Math.floor(n * 0.05),
    A: Math.floor(n * 0.20),
    B: Math.floor(n * 0.55),
    C: Math.floor(n * 0.90),
  };

  const thresholds = {
    S: sorted[cutoffs.S]?.score ?? 100,
    A: sorted[cutoffs.A]?.score ?? 80,
    B: sorted[cutoffs.B]?.score ?? 50,
    C: sorted[cutoffs.C]?.score ?? 20,
  };

  for (const skill of skills) {
    if (skill.score >= thresholds.S) skill.rating = 'S';
    else if (skill.score >= thresholds.A) skill.rating = 'A';
    else if (skill.score >= thresholds.B) skill.rating = 'B';
    else if (skill.score >= thresholds.C) skill.rating = 'C';
    else skill.rating = 'D';
  }

  return skills;
}

// ── Name sanitization ──
const GENERIC_NAMES = new Set([
  'skill', 'tool', 'plugin', 'test', 'my skill', 'agent', 'bot', 'app',
  'demo', 'example', 'hello', 'server', 'client', 'openclaw', 'openclaw skill',
]);

function titleCase(slug) {
  return slug.replace(/[-_]/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
}

function sanitizeName(name, slug) {
  if (!name || name.length <= 2 || GENERIC_NAMES.has(name.toLowerCase())) {
    return titleCase(slug || name || 'Unknown');
  }
  return name;
}

// ── Main processing pipeline ──
async function processSkills(rawSkills) {
  const processed = rawSkills
    .filter(s => s.name && (s.desc || s.slug))
    .map(s => {
      const category = inferCategory(s);
      const score = computeScore(s);
      return {
        id: `${s.author}/${s.slug}`,
        name: sanitizeName(s.name, s.slug),
        slug: s.slug,
        author: s.author,
        description: s.desc || s.slug,
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
        rating: 'C', // placeholder, overwritten by assignRatings()
        url: s.url,
      };
    })
    .sort((a, b) => b.score - a.score);

  // Assign ratings using percentile distribution
  assignRatings(processed);

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
