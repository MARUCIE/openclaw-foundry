#!/usr/bin/env node

/**
 * Agent-ecosystem NEWS collection engine → web/public/data/news.json
 *
 * WHY: web/lib/news-data.ts was a STATIC seed (frozen 2026-03, machine-garbled
 * placeholder copy) carrying `// TODO: Replace with /api/news endpoint backed by
 * D1` that was never wired. The daily CI rail (deploy.yml `sync-data`, cron
 * `0 6 * * *`) refreshed skills.json but NEVER news — so /news showed 4-month-old
 * fabricated items. This engine gives the feed REAL, daily-varying content from two
 * grounded lanes. NO fabrication (CLAUDE.md no-mock + rule-14 anti-hallucination:
 * every field is copied verbatim from an upstream source; no LLM injects a fact,
 * so the L1-L4 gates are satisfied by construction):
 *
 *   Lane A — Ecosystem releases: GitHub Releases API for curated REAL agent / MCP /
 *            coding-CLI repos. Real title, date, version, body excerpt. Fresh-filtered.
 *   Lane B — Foundry activity: derived from the already-daily-fresh skills.json
 *            (new-this-week count, newest skills). 100% real, changes every sync.
 *
 * Output contract (web/public/data/news.json) — consumed by web/lib/api.ts getNews():
 *   { generatedAt, featured, items[], versionTracker[], tags[], stats{}, sources{} }
 *
 * Usage:
 *   node scripts/scrape-agent-news.mjs                   # fetch + write news.json
 *   GITHUB_TOKEN=... node scripts/scrape-agent-news.mjs  # authed (5000/hr in CI)
 */

import { readFile, writeFile, mkdir } from 'fs/promises';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const PROJECT = join(__dirname, '..');
const OUT_FILE = join(PROJECT, 'web', 'public', 'data', 'news.json');
const SKILLS_FILE = join(PROJECT, 'web', 'public', 'data', 'skills.json');

// Curated REAL agent / MCP / coding-CLI ecosystem repos that cut frequent releases.
// On-theme: Agent Foundry curates skills for exactly this ecosystem, so real
// ecosystem release news is directly relevant (not off-brand fabrication).
const CURATED_REPOS = [
  { repo: 'anthropics/claude-code', label: 'Claude Code', color: 'bg-orange-100 text-orange-600' },
  { repo: 'openai/codex', label: 'Codex', color: 'bg-slate-100 text-slate-600' },
  { repo: 'modelcontextprotocol/servers', label: 'MCP', color: 'bg-blue-100 text-blue-700' },
  { repo: 'block/goose', label: 'Goose', color: 'bg-emerald-100 text-emerald-700' },
  { repo: 'All-Hands-AI/OpenHands', label: 'OpenHands', color: 'bg-purple-100 text-purple-600' },
  { repo: 'sst/opencode', label: 'opencode', color: 'bg-cyan-100 text-cyan-700' },
  { repo: 'cline/cline', label: 'Cline', color: 'bg-indigo-100 text-indigo-700' },
  { repo: 'browser-use/browser-use', label: 'browser-use', color: 'bg-teal-100 text-teal-700' },
  { repo: 'RooCodeInc/Roo-Code', label: 'Roo Code', color: 'bg-pink-100 text-pink-600' },
  { repo: 'google-gemini/gemini-cli', label: 'Gemini CLI', color: 'bg-red-100 text-red-600' },
];

const FRESH_DAYS = 120; // rule-14 L4 freshness: drop releases older than this window
const MAX_ITEMS = 24;
const GITHUB_TOKEN = process.env.GITHUB_TOKEN || process.env.GH_TOKEN || '';
const TRANSIENT = new Set([500, 502, 503, 504]);
const MAX_RETRIES = 4;

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }
function backoff(a) { return Math.min(30_000, 2 ** a * 1500); }
function daysAgo(iso) { return (Date.now() - new Date(iso).getTime()) / 86_400_000; }
function ymd(iso) { return (iso || '').slice(0, 10); }

function ghHeaders() {
  const h = {
    'Accept': 'application/vnd.github+json',
    'User-Agent': 'OpenClaw-Foundry/1.0 (news-sync)',
    'X-GitHub-Api-Version': '2022-11-28',
  };
  if (GITHUB_TOKEN) h.Authorization = `Bearer ${GITHUB_TOKEN}`;
  return h;
}

async function ghReleases(repo, attempt = 0) {
  const url = `https://api.github.com/repos/${repo}/releases?per_page=5`;
  let res;
  try {
    res = await fetch(url, { headers: ghHeaders() });
  } catch (e) {
    if (attempt >= MAX_RETRIES) { console.log(`  WARN: ${repo} fetch failed (${e.message})`); return []; }
    await sleep(backoff(attempt));
    return ghReleases(repo, attempt + 1);
  }
  if (res.status === 404) return []; // no releases / repo moved
  if (res.status === 403 || res.status === 429) {
    console.log(`  WARN: ${repo} rate-limited (${res.status}), skipping`);
    return [];
  }
  if (TRANSIENT.has(res.status)) {
    if (attempt >= MAX_RETRIES) { console.log(`  WARN: ${repo} HTTP ${res.status} (gave up)`); return []; }
    await sleep(backoff(attempt));
    return ghReleases(repo, attempt + 1);
  }
  if (!res.ok) { console.log(`  WARN: ${repo} HTTP ${res.status}`); return []; }
  try { return await res.json(); } catch { return []; }
}

// Reduce a GitHub release body (markdown) to a plain, safe, truncated excerpt.
function cleanBody(body) {
  if (!body) return '';
  let t = String(body)
    .replace(/```[\s\S]*?```/g, ' ')           // fenced code
    .replace(/!\[[^\]]*\]\([^)]*\)/g, ' ')      // images
    .replace(/\[([^\]]*)\]\([^)]*\)/g, '$1')     // links → text
    .replace(/<[^>]+>/g, ' ')                    // html
    .replace(/https?:\/\/\S+/g, ' ')             // bare urls
    .replace(/[#>*_`~|]+/g, ' ')                 // md punctuation
    .replace(/\r?\n+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  if (t.length > 180) t = `${t.slice(0, 177).trimEnd()}…`;
  return t;
}

async function collectReleases() {
  const items = [];
  const versionTracker = [];
  for (const { repo, label, color } of CURATED_REPOS) {
    const rels = await ghReleases(repo);
    const latest = Array.isArray(rels) ? rels.find(r => !r.draft) : null;
    if (latest) {
      versionTracker.push({
        name: label,
        version: latest.tag_name || latest.name || '',
        date: ymd(latest.published_at || latest.created_at),
      });
    }
    for (const r of (Array.isArray(rels) ? rels : [])) {
      if (r.draft) continue;
      const iso = r.published_at || r.created_at;
      const date = ymd(iso);
      if (!date) continue;
      if (daysAgo(iso) > FRESH_DAYS) continue;
      const version = r.tag_name || r.name || '';
      const named = r.name && r.name !== version ? `${label} ${version} — ${r.name}` : `${label} ${version} 发布`;
      items.push({
        tag: label.toUpperCase(),
        tagColor: color,
        date,
        title: named.slice(0, 90),
        desc: cleanBody(r.body) || `${label} 发布了新版本 ${version}。`,
        category: 'releases',
        url: r.html_url || `https://github.com/${repo}/releases`,
        prerelease: Boolean(r.prerelease),
        source: repo,
      });
    }
    await sleep(200);
  }
  return { items, versionTracker };
}

async function foundryActivity() {
  // Lane B — REAL activity derived from the already-daily-fresh skills.json.
  let skills = [];
  let meta = {};
  try {
    const raw = JSON.parse(await readFile(SKILLS_FILE, 'utf8'));
    skills = raw.skills || [];
    meta = raw.meta || {};
  } catch {
    return { items: [], stats: { skillsTotal: 0, newLast7d: 0, syncedAt: '' } };
  }

  const skillsTotal = skills.length;
  const withDate = skills.filter(s => s.createdAt || s.updatedAt);
  const newLast7d = withDate.filter(s => {
    const d = s.createdAt || s.updatedAt;
    return d && daysAgo(d) <= 7;
  }).length;

  const items = [];
  if (newLast7d > 0) {
    items.push({
      tag: 'FOUNDRY',
      tagColor: 'bg-yellow-100 text-yellow-700',
      date: ymd(new Date().toISOString()),
      title: `本周新增 ${newLast7d} 个技能，Agent Foundry 目录持续扩张`,
      desc: `ClawHub 生态本周新增 ${newLast7d} 个可安装技能，当前目录共 ${skillsTotal} 个。首页浏览即可一键复制安装命令。`,
      category: 'community',
      url: '/',
      source: 'foundry-activity',
    });
  }

  const newest = [...withDate]
    .sort((a, b) => new Date(b.createdAt || b.updatedAt) - new Date(a.createdAt || a.updatedAt))
    .slice(0, 2);
  for (const s of newest) {
    const iso = s.createdAt || s.updatedAt;
    if (!iso || daysAgo(iso) > 30) continue;
    items.push({
      tag: 'NEW SKILL',
      tagColor: 'bg-green-100 text-green-600',
      date: ymd(iso),
      title: `新技能上架：${s.name}`,
      desc: (s.description || s.editorialTagline || `${s.author} 发布的新技能，现已可在 Agent Foundry 一键安装。`).slice(0, 180),
      category: 'community',
      url: s.url || '/',
      source: 'foundry-activity',
    });
  }

  return { items, stats: { skillsTotal, newLast7d, syncedAt: meta.syncedAt || '' } };
}

async function main() {
  console.log('NOTE: collecting agent-ecosystem news...');
  const [{ items: relItems, versionTracker }, activity] = await Promise.all([
    collectReleases(),
    foundryActivity(),
  ]);

  const merged = [...relItems, ...activity.items]
    .filter(i => i.date)
    .sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : 0))
    .slice(0, MAX_ITEMS);

  // Featured = newest release-category item, else newest item.
  const featured = merged.find(i => i.category === 'releases') || merged[0] || null;
  const feedItems = featured ? merged.filter(i => i !== featured) : merged;

  const out = {
    generatedAt: new Date().toISOString(),
    featured,
    items: feedItems,
    versionTracker: versionTracker.slice(0, 6),
    tags: ['#MCP', '#Skills', '#ClawHub', '#Agent', '#CLI', '#开源'],
    stats: activity.stats,
    sources: {
      releases: relItems.length,
      foundry: activity.items.length,
      repos: CURATED_REPOS.length,
    },
  };

  await mkdir(dirname(OUT_FILE), { recursive: true });
  await writeFile(OUT_FILE, JSON.stringify(out, null, 2));
  console.log(
    `OK: news.json — ${feedItems.length} feed + ${featured ? 1 : 0} featured, ` +
    `${versionTracker.length} versions, skillsTotal=${activity.stats.skillsTotal} newLast7d=${activity.stats.newLast7d}`,
  );
  if (!featured) {
    console.log('WARN: no fresh items collected (upstreams empty/rate-limited). news.json written with empty feed; UI falls back to seed.');
  }
}

main().catch(err => {
  console.error('ERROR:', err.message);
  process.exit(1);
});
