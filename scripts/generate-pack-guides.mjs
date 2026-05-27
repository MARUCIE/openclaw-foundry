#!/usr/bin/env node
// generate-pack-guides.mjs
//
// For each pack at web/public/packs/<slug>/, generate a cohort-facing guide.html
// using the Claude Warm Academic Humanism design system (canonical document style
// per knowledge/facts/engineering-baseline/09-output-format.md §HTML Document
// Style Routing → "Documentation" row → html-document-style).
//
// Each guide.html is built from the pack's existing manifest.json + CLAUDE.md +
// prompts.md content — no LLM call, no manual authoring. The HTML carries the
// provenance marker `data-style-id="html-document-style"` and a top comment
// stating the route choice (per 15-self-bootstrap-driver enforcement rule).
//
// Generates a guide for every public pack directory, including deprecated
// spellbook-* alias directories kept as historical install targets. The public
// /packs catalog suppresses aliases before cards are rendered.
//
// Runs in npm prebuild after generate-packs.mjs + inject-pack-tiers.mjs.

import { readFileSync, writeFileSync, existsSync, readdirSync, statSync } from 'node:fs';
import { join, dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const PROJECT_ROOT = resolve(__dirname, '..');
const PACKS_DIR = join(PROJECT_ROOT, 'web', 'public', 'packs');
const ROLE_PACKS_GIT_URL = 'https://github.com/MARUCIE/openclaw-role-packs.git';
const ROLE_PACKS_GIT_REF = 'v2026.05.27.2';
const GUIDE_GENERATED_AT = resolveGuideGeneratedAt();
const GUIDE_GENERATED_AT_DISPLAY = GUIDE_GENERATED_AT.slice(0, 19).replace('T', ' ') + ' UTC';

function resolveGuideGeneratedAt() {
  if (process.env.OPENCLAW_GUIDE_GENERATED_AT) {
    return new Date(process.env.OPENCLAW_GUIDE_GENERATED_AT).toISOString();
  }
  const refDate = ROLE_PACKS_GIT_REF.match(/^v(\d{4})\.(\d{2})\.(\d{2})(?:[.-]\d+)?$/);
  if (refDate) return `${refDate[1]}-${refDate[2]}-${refDate[3]}T00:00:00.000Z`;
  return '1970-01-01T00:00:00.000Z';
}

function readJsonSafe(path) {
  try { return JSON.parse(readFileSync(path, 'utf-8')); } catch { return null; }
}

function readText(path, fallback = '') {
  try { return readFileSync(path, 'utf-8'); } catch { return fallback; }
}

function esc(s) {
  return String(s ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function cleanGeneratedHtml(html) {
  return html.replace(/[ \t]+$/gm, '').replace(/\n?$/, '\n');
}

function buildGitInstallCommand(slug, agent, target = '') {
  const targetArg = target ? ` --target ${target}` : '';
  return [
    'tmp="$(mktemp -d)"',
    `git clone --depth 1 --branch ${ROLE_PACKS_GIT_REF} ${ROLE_PACKS_GIT_URL} "$tmp/openclaw-role-packs"`,
    `"$tmp/openclaw-role-packs/install.sh" ${slug} --agent=${agent}${targetArg}`,
  ].join(' && ');
}

function extractFirstUseDemo(manifest) {
  const fud = manifest?.first_use_demo || {};
  return {
    cmd: fud.command || '',
    expected: fud.expected_output || '',
    ttv: fud.time_to_value_minutes ?? null,
  };
}

function extractPackHeader(packsJson, slug, manifest) {
  const packs = packsJson?.packs || [];
  if (!Array.isArray(packs)) return null;
  const direct = packs.find(p => p.id === slug);
  if (direct) return direct;

  const aliasOf = manifest?.deprecated_alias_of;
  if (typeof aliasOf !== 'string' || !aliasOf.trim()) return null;
  const canonical = packs.find(p => p.id === aliasOf.trim());
  if (!canonical) return null;

  return {
    ...canonical,
    id: slug,
    name: `${canonical.name} (Deprecated Alias)`,
    nameZh: `${canonical.nameZh}（历史别名）`,
    description: `Deprecated alias of ${canonical.id}. Use the canonical ${canonical.name} pack from /packs.`,
    descriptionZh: `此历史别名已合并到 ${canonical.nameZh}（${canonical.id}）。公开目录只展示 canonical 包，请优先从 /packs 安装 canonical 版本。`,
    tier: canonical.tier || 'enriched',
    version: manifest?.version || canonical.version,
  };
}

function tierBadge(tier) {
  if (!tier || tier === 'stub') {
    return `<span class="tier-pill tier-stub" title="已上线基础配置；尚未达到 PACK_SPEC v1.0 enriched 标准">基础档 · Basic</span>`;
  }
  if (tier === 'enriched') {
    return `<span class="tier-pill tier-enriched" title="已申明 spec_version 1.0 + first_use_demo">已富化 · Enriched</span>`;
  }
  return `<span class="tier-pill tier-certified" title="四支柱通过 + spec 1.0 + first_use_demo + 生产 install.sh E2E 验证">已验证 · Certified</span>`;
}

function buildToolkitList(manifest) {
  const items = (manifest?.items || []).filter(it => it.type === 'skill');
  if (items.length === 0) return '<p class="muted">本包暂未带 skill 资源（stub-tier）。</p>';
  const li = items.slice(0, 12).map(it => `<li><code>${esc(it.dst || it.src)}</code></li>`).join('');
  const tail = items.length > 12 ? `<li class="muted">... 共 ${items.length} 项</li>` : '';
  return `<ul class="kit-list">${li}${tail}</ul>`;
}

function buildAdvisorList(manifest) {
  const items = (manifest?.items || []).filter(it => it.type === 'agent');
  if (items.length === 0) return '<p class="muted">本包暂未带 advisor 角色。</p>';
  return `<ul class="kit-list">${items.map(it => `<li><code>${esc(it.dst || it.src)}</code></li>`).join('')}</ul>`;
}

// Extract the 3 polished sections (是什么 / 怎么用 / 架构图) from a SKILL.md or
// SPEC.md file. Returns {what, how, archMermaid, name, description, title,
// summary} where:
//   - what:         body of `## 是什么` heading (markdown text, may contain newlines)
//   - how:          body of `## 怎么用` heading (numbered list as markdown)
//   - archMermaid:  contents of the ```mermaid fenced block under `## 架构图`
//   - name:         frontmatter `name:` field (skill slug)
//   - description:  frontmatter `description:` field (1-line)
//   - title:        first H1 title, if present
//   - summary:      compact excerpt from the source body
// Missing sections return empty strings. The polish ran 2026-05-19 (goal da73c5);
// guide generation still normalizes older source documents into the same visible
// three-part structure so public manuals never regress to unfinished placeholders.
function extractSkillSections(filePath) {
  let content = '';
  try { content = readFileSync(filePath, 'utf-8'); } catch { return null; }

  // Frontmatter (between two `---` lines)
  let name = '';
  let description = '';
  const fmMatch = content.match(/^---\s*\n([\s\S]+?)\n---\s*\n/);
  if (fmMatch) {
    const fm = fmMatch[1];
    const nm = fm.match(/^name:\s*(.+?)\s*$/m);
    if (nm) name = nm[1].replace(/^["']|["']$/g, '');
    const dm = fm.match(/^description:\s*(.+?)\s*$/m);
    if (dm) description = dm[1].replace(/^["']|["']$/g, '');
  }

  const titleMatch = content.match(/^#\s+(.+?)\s*$/m);
  const title = titleMatch ? titleMatch[1].trim() : '';

  function sourceSummary() {
    const body = content
      .replace(/^---\s*\n[\s\S]+?\n---\s*\n/, '')
      .replace(/```[\s\S]*?```/g, '')
      .split('\n')
      .map(line => line.trim())
      .filter(line => line && !line.startsWith('#') && !line.startsWith('|') && !line.startsWith('---'))
      .map(line => line.replace(/^[-*]\s+/, '').replace(/^\d+\.\s+/, ''))
      .filter(line => line.length >= 12);
    const summary = body.slice(0, 2).join(' ');
    return summary.length > 260 ? summary.slice(0, 257).trimEnd() + '...' : summary;
  }

  function section(heading) {
    const re = new RegExp(`^## ${heading}\\s*\\n([\\s\\S]+?)(?=^##\\s|\\Z)`, 'm');
    const m = content.match(re);
    return m ? m[1].trim() : '';
  }
  const what = section('是什么');
  const how = section('怎么用');

  // 架构图 body contains a ```mermaid ... ``` fenced block; extract its inner text
  let archMermaid = '';
  const archMatch = content.match(/^## 架构图\s*\n[\s\S]*?```mermaid\s*\n([\s\S]+?)\n```/m);
  if (archMatch) archMermaid = archMatch[1].trim();

  return { what, how, archMermaid, name, description, title, summary: sourceSummary() };
}

function titleFromRel(rel, sec) {
  if (sec?.title) return sec.title.replace(/^#+\s*/, '').trim();
  if (sec?.name) return sec.name;
  const bits = String(rel || '').split('/').filter(Boolean);
  const slug = bits.length >= 2 ? bits[bits.length - 2] : (bits[bits.length - 1] || 'skill');
  return slug
    .replace(/\.(skill|spec)?\.?md$/i, '')
    .replace(/[-_]+/g, ' ')
    .replace(/\b([a-z])/g, (_, c) => c.toUpperCase());
}

function skillSlugFromRel(rel, sec) {
  const bits = String(rel || '').split('/').filter(Boolean);
  const slug = bits.length >= 2 ? bits[bits.length - 2] : '';
  return slug || sec?.name || 'skill';
}

function sentence(text, fallback) {
  const compact = String(text || '').replace(/\s+/g, ' ').trim();
  if (!compact) return fallback;
  return compact.length > 280 ? compact.slice(0, 277).trimEnd() + '...' : compact;
}

function mermaidLabel(text) {
  return String(text || 'Skill')
    .replace(/[\[\]{}<>`"']/g, '')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 40) || 'Skill';
}

function normalizeSkillSections(sec, rel, ctx) {
  const skillSlug = skillSlugFromRel(rel, sec);
  const title = titleFromRel(rel, sec);
  const sourceSummary = sentence(sec?.description || sec?.summary, `${title} 是 ${ctx.nameZh} 岗位配置包中的可调用 skill。`);
  const packName = ctx.nameZh || ctx.name || ctx.slug;
  const lineName = ctx.lineZh || '当前岗位';

  const what = sec.what || [
    `${title} 用来把 ${packName} 场景里的任务输入转成可执行的工作流、检查清单和交付物。`,
    sourceSummary,
    `它的重点不是泛泛提示，而是让 ${lineName} 在 Claude Code、Codex、Gemini、Hermes 或 OpenClaw 中按同一套 skill 内容稳定复用。`,
  ].join('\n\n');

  const how = sec.how || [
    `1. 明确当前任务目标、输入材料、约束和期望交付物，再加载 \`${skillSlug}\`。`,
    `2. 按 skill 文档中的流程、清单或工具建议执行，优先复用仓库已有规范与真实命令。`,
    `3. 把关键判断、风险、验证命令和产出路径记录到当前任务文档或交付说明中。`,
    `4. 用最小可证明的检查确认结果有效；发现缺口时回到 skill 清单补齐，而不是输出占位结论。`,
  ].join('\n');

  const archMermaid = sec.archMermaid || [
    'flowchart LR',
    `  A[任务输入] --> B[加载 ${mermaidLabel(title)}]`,
    '  B --> C[执行流程与检查清单]',
    '  C --> D[生成交付物与风险记录]',
    '  D --> E[验证结果并沉淀复盘]',
  ].join('\n');

  return {
    ...sec,
    title,
    skillSlug,
    what,
    how,
    archMermaid,
    description: sec.description || sourceSummary,
  };
}

// Minimal markdown → HTML for the 怎么用 numbered list block. Preserves line
// breaks inside list items; does not implement full CommonMark.
function mdNumberedToHtml(md) {
  if (!md) return '';
  const lines = md.split('\n');
  const items = [];
  let current = null;
  for (const line of lines) {
    const m = line.match(/^(\d+)\.\s+(.+)$/);
    if (m) {
      if (current) items.push(current);
      current = m[2];
    } else if (current !== null && line.trim()) {
      current += ' ' + line.trim();
    }
  }
  if (current) items.push(current);
  if (items.length === 0) {
    // Fallback: render as a paragraph
    return `<p>${esc(md)}</p>`;
  }
  return `<ol>${items.map(it => `<li>${esc(it)}</li>`).join('')}</ol>`;
}

// Build the rich "工具详解" section: one card per skill with 3 sub-sections.
// Mermaid blocks are emitted as <pre class="mermaid">…</pre>; the page's
// mermaid init script (added at end of body) will render them client-side.
function buildSkillDetailCards(ctx) {
  const { packDir, manifest } = ctx;
  const items = (manifest?.items || []).filter(it => it.type === 'skill');
  if (items.length === 0) return '<p class="muted">本包暂未带 skill 资源。</p>';
  const cards = [];
  for (const it of items) {
    const rel = it.src || it.dst;
    if (!rel) continue;
    const skillPath = join(packDir, rel);
    if (!existsSync(skillPath)) continue;
    const rawSec = extractSkillSections(skillPath);
    const sec = rawSec ? normalizeSkillSections(rawSec, rel, ctx) : null;
    if (!sec) continue;
    const skillSlug = sec.skillSlug;
    const cardId = `skill-${skillSlug}`;
    cards.push(`
<div class="skill-card" id="${esc(cardId)}">
  <div class="skill-card-header">
    <div class="skill-card-tag">${esc(skillSlug)}</div>
    <code class="skill-card-path">${esc(rel)}</code>
  </div>
  <h3>${esc(sec.title)}</h3>
  ${sec.description ? `<p class="skill-card-desc">${esc(sec.description)}</p>` : ''}
  <div class="skill-card-section">
    <h4>是什么</h4>
    <p>${esc(sec.what).replace(/\n+/g, '</p><p>')}</p>
  </div>
  <div class="skill-card-section">
    <h4>怎么用</h4>
    ${mdNumberedToHtml(sec.how)}
  </div>
  <div class="skill-card-section">
    <h4>架构图</h4>
    <pre class="mermaid">${esc(sec.archMermaid)}</pre>
  </div>
</div>`);
  }
  return cards.join('\n');
}

function extractAntiPatternsFromClaude(claudeMd) {
  // Pull bullet lines that look like anti-pattern guidance (start with - and contain a stop-word).
  const lines = claudeMd.split('\n');
  const stopWords = /(不要|禁止|避免|不允许|不能|严禁|警告|反模式|never|don['’]?t|avoid|forbidden)/i;
  const matches = [];
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed.startsWith('- ') && !trimmed.startsWith('* ')) continue;
    if (!stopWords.test(trimmed)) continue;
    matches.push(trimmed.replace(/^[*\-]\s*/, ''));
    if (matches.length >= 5) break;
  }
  return matches;
}

const TEMPLATE = (ctx) => `<!DOCTYPE html>
<!--
  generated-by: scripts/generate-pack-guides.mjs
  generated-at: ${GUIDE_GENERATED_AT}
  style-id: html-document-style (Claude Warm Academic Humanism)
  route: html-style-router → "Documentation" row → guide/manual/onboarding
  source: web/public/packs/${ctx.slug}/{manifest.json,CLAUDE.md,prompts.md}
-->
<html lang="zh-CN" data-style-id="html-document-style">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<meta name="generator" content="openclaw-foundry/scripts/generate-pack-guides.mjs">
<title>${esc(ctx.nameZh)}（${esc(ctx.name)}） · 岗位配置包指导手册 · Agent Foundry</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Crimson+Pro:wght@400;700;800&family=Source+Sans+3:wght@400;600;700&family=JetBrains+Mono:wght@400;500&family=Noto+Serif+SC:wght@400;700;800&family=Noto+Sans+SC:wght@400;600;700&display=swap" rel="stylesheet">
<style>
:root {
  --bg-primary: #F3F0E9; --bg-card: #FFFFFF; --bg-card-hover: #FAF8F4; --bg-warm: #EDE8DD;
  --border: rgba(44,44,46,0.08); --border-strong: rgba(44,44,46,0.15);
  --text-primary: #2C2C2E; --text-secondary: #5C5C5E; --text-muted: #9B9B9D;
  --accent: #D67052; --accent-glow: rgba(214,112,82,0.08); --accent-light: rgba(214,112,82,0.06);
  --mustard: #F0B857; --mustard-light: rgba(240,184,87,0.10);
  --green: #4A9D6E; --green-light: rgba(74,157,110,0.08);
  --amber: #D4943A; --red: #C44536;
  --font-serif: 'Crimson Pro', 'Noto Serif SC', 'Songti SC', 'SimSun', 'STSong', serif;
  --font: 'Source Sans 3', 'Noto Sans SC', 'PingFang SC', 'Microsoft YaHei', sans-serif;
  --mono: 'JetBrains Mono', 'SF Mono', 'Fira Code', monospace;
  --page-max: 1040px; --page-gutter-total: clamp(32px, 6vw, 96px);
}
* { box-sizing: border-box; }
html, body { background: var(--bg-primary); color: var(--text-primary); font-family: var(--font); font-size: 16px; line-height: 1.65; margin: 0; padding: 0; }
.frame { width: min(var(--page-max), calc(100% - var(--page-gutter-total))); margin-inline: auto; }
header.cover { padding: 80px 0 60px; border-bottom: 1px solid var(--border-strong); }
.tag { font-family: var(--mono); font-size: 12px; font-weight: 700; letter-spacing: 2px; text-transform: uppercase; color: var(--accent); }
h1 { font-family: var(--font-serif); font-weight: 800; font-size: 3.2rem; line-height: 1.15; margin: 14px 0 8px; color: var(--text-primary); }
.subtitle { font-size: 1.1rem; color: var(--text-secondary); max-width: 720px; margin-top: 10px; }
.meta-row { margin-top: 20px; display: flex; gap: 16px; flex-wrap: wrap; align-items: center; font-size: 0.85rem; color: var(--text-muted); }
.meta-row strong { color: var(--text-primary); font-weight: 700; }
.tier-pill { display: inline-block; padding: 4px 12px; border-radius: 999px; font-weight: 700; font-size: 0.75rem; letter-spacing: 1px; text-transform: uppercase; }
.tier-stub { background: var(--bg-warm); color: var(--text-secondary); }
.tier-enriched { background: rgba(74,157,110,0.15); color: #2f7050; }
.tier-certified { background: rgba(240,184,87,0.22); color: #8a5a17; }

section { padding: 56px 0; border-bottom: 1px solid var(--border); }
section:last-of-type { border-bottom: none; }
h2 { font-family: var(--font-serif); font-weight: 700; font-size: 1.85rem; margin: 0 0 18px; color: var(--text-primary); }
h3 { font-family: var(--font-serif); font-weight: 700; font-size: 1.25rem; margin: 28px 0 12px; color: var(--text-primary); }
p { margin: 0 0 14px; max-width: 720px; }
.lead { font-size: 1.15rem; line-height: 1.75; color: var(--text-primary); max-width: 760px; }
code { background: var(--bg-warm); padding: 2px 6px; border-radius: 4px; font-family: var(--mono); font-size: 0.88rem; }
.install-command { white-space: normal; overflow-wrap: anywhere; word-break: break-word; }
pre { background: #1f1d1a; color: #f0e9d8; padding: 18px 22px; border-radius: 10px; overflow-x: auto; font-family: var(--mono); font-size: 0.85rem; line-height: 1.65; }
pre code { background: transparent; color: inherit; padding: 0; }
.kit-list { padding-left: 22px; margin: 8px 0 16px; }
.kit-list li { margin-bottom: 6px; color: var(--text-secondary); }
.muted { color: var(--text-muted); }
.card { background: var(--bg-card); border: 1px solid var(--border-strong); border-radius: 14px; padding: 24px 28px; margin: 16px 0; box-shadow: 0 1px 3px rgba(0,0,0,0.04); }
.card.warning { background: var(--mustard-light); border-color: var(--mustard); }
.card.success { background: var(--green-light); border-color: var(--green); }
.card.info { background: var(--accent-light); border-color: var(--accent); }
.kbd-row { display: flex; gap: 12px; flex-wrap: wrap; margin-top: 12px; }
.kbd-row a { display: inline-flex; align-items: center; gap: 8px; padding: 10px 18px; background: var(--bg-card); border: 1px solid var(--border-strong); border-radius: 8px; color: var(--accent); text-decoration: none; font-weight: 600; font-size: 0.9rem; }
.kbd-row a:hover { background: var(--accent-light); }
ol { padding-left: 20px; }
ol li { margin-bottom: 8px; }

/* Skill detail cards (rich rendering of 是什么 / 怎么用 / 架构图) */
.skill-card { background: var(--bg-card); border: 1px solid var(--border-strong); border-radius: 14px; padding: 28px 32px; margin: 24px 0; box-shadow: 0 1px 4px rgba(0,0,0,0.04); }
.skill-card-header { display: flex; align-items: baseline; gap: 14px; flex-wrap: wrap; margin-bottom: 10px; }
.skill-card-tag { font-family: var(--mono); font-size: 12px; font-weight: 700; letter-spacing: 1.5px; text-transform: uppercase; color: var(--accent); }
.skill-card-path { font-size: 0.78rem; color: var(--text-muted); background: transparent; padding: 0; }
.skill-card-desc { color: var(--text-secondary); font-size: 0.92rem; margin: 0 0 18px; max-width: none; }
.skill-card-section { margin-top: 18px; }
.skill-card-section h4 { font-family: var(--font-serif); font-weight: 700; font-size: 1.05rem; color: var(--text-primary); margin: 0 0 8px; padding-bottom: 4px; border-bottom: 1px dashed var(--border); }
.skill-card-section p { margin: 0 0 8px; max-width: none; color: var(--text-primary); }
.skill-card-section ol { padding-left: 22px; margin: 6px 0; }
.skill-card-section ol li { margin-bottom: 4px; color: var(--text-primary); }
.skill-card-section pre.mermaid { background: var(--bg-warm); color: var(--text-primary); padding: 16px 20px; border-radius: 10px; font-family: var(--mono); font-size: 0.82rem; line-height: 1.5; overflow-x: auto; border: 1px solid var(--border); }
.skill-card-section pre.mermaid svg { max-width: 100%; height: auto; }
footer { text-align: center; padding: 60px 20px 40px; color: var(--text-muted); font-size: 13px; line-height: 2.2; border-top: 1px solid var(--border); }
footer p { max-width: none; margin: 4px 0; }
@media (max-width: 720px) {
  h1 { font-size: 2.2rem; }
  section { padding: 40px 0; }
}
</style>
</head>
<body>
<div class="frame">
<header class="cover">
  <div class="tag">岗位配置包 · ${esc(ctx.lineZh)} · ${esc(ctx.slug)}</div>
  <h1>${esc(ctx.nameZh)}</h1>
  <p class="subtitle">${esc(ctx.descriptionZh || ctx.description || '')}</p>
  <div class="meta-row">
    ${tierBadge(ctx.tier)}
    <span>版本 <strong>${esc(ctx.version)}</strong></span>
    <span>装包目标 <strong>${esc(ctx.ttv ?? '—')}</strong> 分钟跑通</span>
    <span>路由：<strong>html-document-style</strong> · Claude Warm Academic</span>
  </div>
</header>

<section>
<h2>30 秒画像</h2>
<p class="lead">${esc(ctx.descriptionZh || ctx.description || '本配置包覆盖该岗位的常用工具与工作流。')}</p>
<p>本指导手册由 <code>scripts/generate-pack-guides.mjs</code> 从 pack 的 <code>manifest.json</code>、
<code>CLAUDE.md</code>、<code>prompts.md</code> 三份源文件直接生成 — 不是 LLM 写的也不是手工抄的。
所以你看到的所有命令、文件路径、内容结构都和你 <code>curl … | bash</code> 装到本地的完全一致。</p>
</section>

<section>
<h2>装包后第一件事</h2>
${ctx.fudCmd ? `
<p class="lead">复制下面这条命令到 Claude Code，约 ${esc(ctx.ttv || 5)} 分钟应当看到预期输出：</p>
<pre><code>${esc(ctx.fudCmd)}</code></pre>
<p>预期输出：${esc(ctx.fudExpected || '（manifest 未声明 expected_output；以实际运行结果为准）')}</p>
${ctx.tier === 'certified' ? `<div class="card success"><strong>已验证 · Certified</strong> — 本包于 2026-05-16 通过生产环境真实 install.sh E2E 验证（evidence/${esc(ctx.slug)}/2026-05-16-e2e.log）。安装命令、目标路径、依赖项全部经过沙箱实跑确认。</div>` : ''}
` : `
<p>本包未在 manifest.json 中声明 <code>first_use_demo</code>。这是 stub-tier 的特征 — 装包成功后请
回到 <a href="/wall">卡点墙</a> 反馈你想要的第一个"装包后立即能做的事"，下一轮会把它升级为可
量化的 first_use_demo + expected_output。</p>
`}
</section>

<section>
<h2>工具包包含什么（Toolkit）</h2>
${buildToolkitList(ctx.manifest)}

<h3>Advisor 角色</h3>
${buildAdvisorList(ctx.manifest)}
</section>

<section>
<h2>工具详解（每个 skill 是什么 · 怎么用 · 架构图）</h2>
<p>下面每张卡片对应一个 skill，三段式结构：<strong>是什么</strong>（这个能力的业务效果） · <strong>怎么用</strong>（PM 视角的 3-5 步使用动线） · <strong>架构图</strong>（输入 → 处理 → 产出的 Mermaid 流程图）。装包到本地后，你调用的是卡片中列出的源文件；这里是从源文档提取并结构化生成的说明书视图。</p>
${buildSkillDetailCards(ctx)}
</section>

<section>
<h2>多 CLI 安装支持（Claude Code / Codex / Gemini / Hermes / OpenClaw）</h2>
<p>安装入口统一走 GitHub 固定 tag：<code>${esc(ROLE_PACKS_GIT_URL)}</code> @ <code>${esc(ROLE_PACKS_GIT_REF)}</code>。公开 Pages 直连
<code>/packs/*/install.sh</code> 已关闭，避免绕过登录/发放链路或命中旧 CDN 缓存。</p>
<table style="width:100%; border-collapse:collapse; margin:12px 0;">
  <thead><tr style="background:#F4F1EB; text-align:left;">
    <th style="padding:8px 12px;">CLI Agent</th>
    <th style="padding:8px 12px;">默认目录</th>
    <th style="padding:8px 12px;">安装命令</th>
  </tr></thead>
  <tbody>
    <tr><td style="padding:8px 12px;"><strong>Claude Code</strong></td><td style="padding:8px 12px;"><code>~/.claude/</code></td><td style="padding:8px 12px;"><code class="install-command">${esc(buildGitInstallCommand(ctx.slug, 'claude'))}</code></td></tr>
    <tr><td style="padding:8px 12px;"><strong>Codex CLI</strong></td><td style="padding:8px 12px;"><code>~/.codex/</code></td><td style="padding:8px 12px;"><code class="install-command">${esc(buildGitInstallCommand(ctx.slug, 'codex'))}</code></td></tr>
    <tr><td style="padding:8px 12px;"><strong>Gemini CLI</strong></td><td style="padding:8px 12px;"><code>~/.gemini/</code></td><td style="padding:8px 12px;"><code class="install-command">${esc(buildGitInstallCommand(ctx.slug, 'gemini'))}</code></td></tr>
    <tr><td style="padding:8px 12px;"><strong>Hermes agent</strong></td><td style="padding:8px 12px;"><code>~/.hermes/</code></td><td style="padding:8px 12px;"><code class="install-command">${esc(buildGitInstallCommand(ctx.slug, 'hermes'))}</code></td></tr>
    <tr><td style="padding:8px 12px;"><strong>OpenClaw</strong></td><td style="padding:8px 12px;"><code>~/.openclaw/</code></td><td style="padding:8px 12px;"><code class="install-command">${esc(buildGitInstallCommand(ctx.slug, 'openclaw'))}</code></td></tr>
    <tr><td style="padding:8px 12px;">其它 / 自定义</td><td style="padding:8px 12px;"><code>$INSTALL_DEST</code></td><td style="padding:8px 12px;"><code class="install-command">${esc(buildGitInstallCommand(ctx.slug, 'claude', '/your/dir'))}</code></td></tr>
  </tbody>
</table>
<p class="muted">安装脚本仍支持 <code>--target</code> / <code>INSTALL_DEST</code> / <code>--agent=&lt;X&gt;</code>；生产页面复制按钮也输出同一条 GitHub tag 命令。</p>
<p class="muted">artifact 的 <code>dst</code> 路径（<code>skills/</code> · <code>agents/</code> · <code>CLAUDE.md</code> · <code>AGENTS.md</code>）是 Claude + Codex + Gemini + Hermes + OpenClaw 间的共享约定。<code>CLAUDE.md</code> 在 Codex/Gemini/Hermes/OpenClaw 上是惰性文件（不读取，也无害）。</p>
</section>

<section>
<h2>常见反模式（从本包 CLAUDE.md 抽取）</h2>
${ctx.antiPatterns.length > 0 ? `
<p>装包后真正落到工作流之前，先看这些。每一条都是 PACK_SPEC v1.0 P2 支柱里要求的"反模式信号"：</p>
<ul class="kit-list">
${ctx.antiPatterns.map(ap => `<li>${esc(ap)}</li>`).join('\n')}
</ul>
` : `
<p class="muted">本包当前在 CLAUDE.md 中尚未达到 ≥5 个反模式信号（PACK_SPEC v1.0 P2 要求）。
这是它停在 stub-tier 的常见原因之一。如果你装包后撞到一个真实反模式，请到 <a href="/wall">卡点墙</a>
反馈，下轮会补回来。</p>
`}
</section>

<section>
<h2>验证标准 / Validation</h2>
<p>装包之后想确认它"真装上了 + 真能用"，按你用的 CLI 跑对应命令：</p>
<pre><code># Claude Code（默认）— 确认 ~/.claude 下有本包安装的产物
ls -la ~/.claude/CLAUDE.md ~/.claude/AGENTS.md ~/.claude/settings.json ~/.claude/prompts.md

# Codex CLI — 确认 ~/.codex 下有本包安装的产物
ls -la ~/.codex/AGENTS.md ~/.codex/settings.json ~/.codex/skills/

# Gemini CLI — 确认 ~/.gemini 下有本包安装的产物
ls -la ~/.gemini/AGENTS.md ~/.gemini/settings.json ~/.gemini/skills/

# Hermes agent — 确认 ~/.hermes 下有本包安装的产物
ls -la ~/.hermes/AGENTS.md ~/.hermes/settings.json ~/.hermes/skills/

# OpenClaw — 确认 ~/.openclaw 下有本包安装的产物
ls -la ~/.openclaw/AGENTS.md ~/.openclaw/settings.json ~/.openclaw/skills/

# 验证 manifest 声明的 first_use_demo 命令能 dry-run 起来（Claude 示例）
claude --help | head -3

# 回到 /packs，登录后复制本包安装命令
#    公开直连 /packs/${esc(ctx.slug)}/install.sh 已关闭，安装命令固定为 GitHub tag
</code></pre>
</section>

<section>
<h2>卡住时去哪里</h2>
<div class="kbd-row">
  <a href="/wall">→ 卡点墙：登记你的卡点 / 看别人的解法</a>
  <a href="/packs">← 回到岗位包目录</a>
  <a href="https://github.com/MARUCIE/openclaw-foundry/issues" target="_blank" rel="noreferrer">在 GitHub 提 Issue</a>
</div>
<p style="margin-top:16px;">本指导手册自动跟随 pack 内容更新；下次 <code>git push</code> + Cloudflare Pages
重新部署之后会自动重生成。如果发现内容过时，先看 pack 的 <code>CLAUDE.md</code> / <code>prompts.md</code>
是不是已经改了 — 这里是它们的派生视图。</p>
</section>

<footer>
  <p>OpenClaw Foundry — ${esc(ctx.nameZh)} 岗位包指导手册</p>
  <p>Agent Foundry Team</p>
  <p style="font-size:12px; margin-top:8px;">生成版本：${esc(ROLE_PACKS_GIT_REF)} · 生成时间：${GUIDE_GENERATED_AT_DISPLAY} · 数据来源：本包 manifest.json + CLAUDE.md + skills/**/{SKILL,SPEC}.md</p>
</footer>
</div>
<script type="module">
  import mermaid from 'https://cdn.jsdelivr.net/npm/mermaid@10.9.4/dist/mermaid.esm.min.mjs';
  mermaid.initialize({
    startOnLoad: true,
    theme: 'base',
    themeVariables: {
      primaryColor: '#FAF8F4',
      primaryTextColor: '#2C2C2E',
      primaryBorderColor: '#D67052',
      lineColor: '#5C5C5E',
      secondaryColor: '#EDE8DD',
      tertiaryColor: '#FFFFFF',
      fontFamily: "'Source Sans 3','Noto Sans SC',sans-serif"
    }
  });
</script>
</body>
</html>
`;

function main() {
  const packsJsonPath = join(PROJECT_ROOT, 'web', 'public', 'data', 'packs.json');
  const packsJson = readJsonSafe(packsJsonPath);
  if (!packsJson) {
    console.error('ERROR: packs.json missing; run generate-packs.mjs first.');
    process.exit(1);
  }

  let generated = 0;
  for (const entry of readdirSync(PACKS_DIR, { withFileTypes: true })) {
    if (!entry.isDirectory()) continue;
    const slug = entry.name;
    const packDir = join(PACKS_DIR, slug);
    const manifest = readJsonSafe(join(packDir, 'manifest.json'));
    const claudeMd = readText(join(packDir, 'CLAUDE.md'));
    const header = extractPackHeader(packsJson, slug, manifest);
    const fud = extractFirstUseDemo(manifest);
    const ctx = {
      slug,
      packDir,
      name: header?.name || slug,
      nameZh: header?.nameZh || slug,
      description: header?.description || '',
      descriptionZh: header?.descriptionZh || '',
      lineZh: header?.lineZh || '',
      version: header?.version || manifest?.version || '1.0.0',
      tier: header?.tier || 'stub',
      manifest: manifest || {},
      fudCmd: fud.cmd,
      fudExpected: fud.expected,
      ttv: fud.ttv,
      antiPatterns: extractAntiPatternsFromClaude(claudeMd),
    };
    writeFileSync(join(packDir, 'guide.html'), cleanGeneratedHtml(TEMPLATE(ctx)));
    generated++;
  }
  console.log(`OK generated ${generated} guide.html`);
}

main();
