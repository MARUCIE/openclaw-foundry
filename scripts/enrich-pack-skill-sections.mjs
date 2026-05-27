#!/usr/bin/env node
// Enforce the role-pack guide contract at the source layer.
//
// Every distributed skill must carry the three guide sections rendered in
// guide.html: 是什么 / 怎么用 / 架构图. This script appends deterministic sections
// to legacy source skills so the generator never needs hidden fallbacks.

import { existsSync, readFileSync, readdirSync, statSync, writeFileSync } from 'node:fs';
import { dirname, join, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const PROJECT_ROOT = resolve(__dirname, '..');
const PACKS_DIR = join(PROJECT_ROOT, 'web', 'public', 'packs');
const PACKS_JSON = join(PROJECT_ROOT, 'web', 'public', 'data', 'packs.json');
const CHECK_ONLY = process.argv.includes('--check');

function readJson(path) {
  return JSON.parse(readFileSync(path, 'utf-8'));
}

function readText(path) {
  return readFileSync(path, 'utf-8');
}

function writeText(path, text) {
  writeFileSync(path, text.replace(/\n?$/, '\n'), 'utf-8');
}

function packEntries() {
  const raw = readJson(PACKS_JSON);
  const packs = Array.isArray(raw) ? raw : raw.packs || [];
  return new Map(packs.map((pack) => [pack.id, pack]));
}

function hasHeading(content, heading) {
  return new RegExp(`^## ${heading}\\s*$`, 'm').test(content);
}

function hasArchMermaid(content) {
  return /^## 架构图\s*\n[\s\S]*?```mermaid\s*\n[\s\S]+?\n```/m.test(content);
}

function extractMeta(content) {
  const fmMatch = content.match(/^---\s*\n([\s\S]+?)\n---\s*\n/);
  const fm = fmMatch?.[1] || '';
  const frontmatterName = fm.match(/^name:\s*(.+?)\s*$/m)?.[1]?.replace(/^["']|["']$/g, '').trim() || '';
  const description = fm.match(/^description:\s*(.+?)\s*$/m)?.[1]?.replace(/^["']|["']$/g, '').trim() || '';
  const title = content.match(/^#\s+(.+?)\s*$/m)?.[1]?.trim() || frontmatterName || 'Skill';
  const summary = content
    .replace(/^---\s*\n[\s\S]+?\n---\s*\n/, '')
    .replace(/```[\s\S]*?```/g, '')
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line && !line.startsWith('#') && !line.startsWith('|') && !line.startsWith('---'))
    .map((line) => line.replace(/^[-*]\s+/, '').replace(/^\d+\.\s+/, ''))
    .filter((line) => line.length >= 12)
    .slice(0, 2)
    .join(' ');
  return { name: frontmatterName, description, title, summary };
}

function skillSlugFromRel(rel, meta) {
  const parts = String(rel || '').split('/').filter(Boolean);
  if (parts.length >= 2) return parts[parts.length - 2];
  return meta.name || 'skill';
}

function isGuideSkillDoc(rel) {
  return /\/(SKILL|README|SPEC)\.md$/i.test(String(rel || ''));
}

function compact(text, fallback, max = 240) {
  const value = String(text || '').replace(/\s+/g, ' ').trim() || fallback;
  return value.length > max ? `${value.slice(0, max - 3).trimEnd()}...` : value;
}

function mermaidLabel(text) {
  return String(text || 'Skill')
    .replace(/[\[\]{}<>`"']/g, '')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 40) || 'Skill';
}

function sectionBlock({ rel, meta, pack, manifest }) {
  const skillSlug = skillSlugFromRel(rel, meta);
  const title = meta.title || skillSlug;
  const packName = pack?.nameZh || manifest?.nameZh || pack?.name || manifest?.name || '当前岗位配置包';
  const lineName = pack?.lineZh || '当前岗位';
  const summary = compact(meta.description || meta.summary, `${title} 是 ${packName} 的可调用 skill。`);

  return [
    '',
    '## 是什么',
    '',
    `${title} 用来把 ${packName} 场景里的任务输入转成可执行的流程、检查清单和交付物。`,
    '',
    summary,
    '',
    `它的价值在于让 ${lineName} 在 Claude Code、Codex、Gemini、Hermes 或 OpenClaw 中复用同一套岗位能力，而不是依赖一次性的聊天提示词。`,
    '',
    '## 怎么用',
    '',
    `1. 明确当前任务目标、输入材料、约束和期望交付物，再加载 \`${skillSlug}\`。`,
    '2. 按 skill 文档中的流程、检查清单或工具建议执行，优先复用仓库已有规范与真实命令。',
    '3. 把关键判断、风险、验证命令和产出路径记录到当前任务文档或交付说明中。',
    '4. 用最小可证明的检查确认结果有效；发现缺口时回到 skill 清单补齐。',
    '',
    '## 架构图',
    '',
    '```mermaid',
    'flowchart LR',
    `  A[任务输入] --> B[加载 ${mermaidLabel(title)}]`,
    '  B --> C[执行流程与检查清单]',
    '  C --> D[生成交付物与风险记录]',
    '  D --> E[验证结果并沉淀复盘]',
    '```',
    '',
  ].join('\n');
}

function skillGaps(content) {
  const gaps = [];
  if (!hasHeading(content, '是什么')) gaps.push('是什么');
  if (!hasHeading(content, '怎么用')) gaps.push('怎么用');
  if (!hasHeading(content, '架构图') || !hasArchMermaid(content)) gaps.push('架构图');
  return gaps;
}

if (!existsSync(PACKS_DIR)) {
  throw new Error(`packs directory missing: ${PACKS_DIR}`);
}

const packsById = packEntries();
const failures = [];
let scanned = 0;
let changed = 0;

for (const entry of readdirSync(PACKS_DIR, { withFileTypes: true }).sort((a, b) => a.name.localeCompare(b.name))) {
  if (!entry.isDirectory()) continue;
  const slug = entry.name;
  const packDir = join(PACKS_DIR, slug);
  const manifestPath = join(packDir, 'manifest.json');
  if (!existsSync(manifestPath)) continue;

  const manifest = readJson(manifestPath);
  const pack = packsById.get(slug) || packsById.get(manifest.deprecated_alias_of) || null;
  for (const item of manifest.items || []) {
    if (item?.type !== 'skill') continue;
    const rel = item.src || item.dst;
    if (!isGuideSkillDoc(rel)) continue;
    const filePath = join(packDir, rel || '');
    scanned += 1;
    if (!rel || !existsSync(filePath) || !statSync(filePath).isFile()) {
      failures.push(`${slug}: missing skill file ${rel || '<empty>'}`);
      continue;
    }
    const content = readText(filePath);
    const gaps = skillGaps(content);
    if (gaps.length === 0) continue;
    if (CHECK_ONLY) {
      failures.push(`${relative(PROJECT_ROOT, filePath)}: missing ${gaps.join(', ')}`);
      continue;
    }
    const next = `${content.replace(/\s+$/, '')}\n${sectionBlock({ rel, meta: extractMeta(content), pack, manifest })}`;
    writeText(filePath, next);
    changed += 1;
  }
}

if (failures.length > 0) {
  console.error(`ERROR source skill section audit failed (${failures.length} findings):`);
  for (const failure of failures.slice(0, 120)) console.error(`- ${failure}`);
  process.exit(1);
}

console.log(
  CHECK_ONLY
    ? `OK source skill sections: skills=${scanned}`
    : `OK enriched source skill sections: skills=${scanned} changed=${changed}`,
);
