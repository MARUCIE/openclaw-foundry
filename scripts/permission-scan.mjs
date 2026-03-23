#!/usr/bin/env node

/**
 * Permission Manifest Auto-Scanner
 *
 * Analyzes skill descriptions, categories, and names to infer permission requirements.
 * Heuristic-based (not code analysis) — covers 80%+ of skills automatically.
 *
 * Output: Updates unified-index.json with permissionManifest field.
 *
 * Usage:
 *   node scripts/permission-scan.mjs
 */

import { readFile, writeFile } from 'fs/promises';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const DATA_DIR = join(__dirname, '..', 'data');

// Permission inference rules (order matters: first match wins for each dimension)
const NETWORK_RULES = [
  { pattern: /\b(http|api|fetch|request|url|endpoint|webhook|rest|graphql|oauth|smtp|imap)\b/i, level: 'full' },
  { pattern: /\b(google|github|slack|discord|telegram|twitter|aws|azure|gcp|cloudflare|stripe|paypal)\b/i, level: 'full' },
  { pattern: /\b(scrape|crawl|download|browse|headless|playwright|puppeteer|selenium)\b/i, level: 'full' },
  { pattern: /\b(search|bing|brave|tavily|exa|serp|duckduckgo)\b/i, level: 'outbound_only' },
  { pattern: /\b(llm|openai|anthropic|gemini|claude|gpt|whisper|tts|stt)\b/i, level: 'outbound_only' },
  { pattern: /\b(database|postgres|mysql|mongodb|redis|supabase|firebase|clickhouse)\b/i, level: 'outbound_only' },
];

const FILESYSTEM_RULES = [
  { pattern: /\b(file|filesystem|fs|read.*file|write.*file|directory|folder|path)\b/i, level: 'write' },
  { pattern: /\b(git|clone|checkout|commit|repo)\b/i, level: 'write' },
  { pattern: /\b(docker|container|volume|mount)\b/i, level: 'write' },
  { pattern: /\b(deploy|install|build|compile|npm|pip|cargo)\b/i, level: 'write' },
  { pattern: /\b(config|settings|env|\.env)\b/i, level: 'read' },
  { pattern: /\b(pdf|excel|csv|json|xml|yaml|markdown)\b/i, level: 'read' },
  { pattern: /\b(image|photo|video|audio|media)\b/i, level: 'read' },
];

const SHELL_RULES = [
  { pattern: /\b(shell|bash|terminal|cli|command|exec|subprocess|spawn)\b/i },
  { pattern: /\b(docker|kubernetes|terraform|ansible)\b/i },
  { pattern: /\b(deploy|build|compile|test|lint)\b/i },
  { pattern: /\b(ssh|scp|rsync|ftp)\b/i },
  { pattern: /\b(process|kill|daemon|service|systemd)\b/i },
];

const SENSITIVITY_RULES = [
  { pattern: /\b(secret|credential|password|token|key|auth|oauth|jwt|session)\b/i, level: 'confidential' },
  { pattern: /\b(payment|stripe|paypal|billing|invoice|bank|finance)\b/i, level: 'confidential' },
  { pattern: /\b(medical|health|patient|diagnosis)\b/i, level: 'confidential' },
  { pattern: /\b(personal|pii|user.*data|profile|account)\b/i, level: 'internal' },
  { pattern: /\b(email|contact|phone|address)\b/i, level: 'internal' },
  { pattern: /\b(database|storage|cache|memory)\b/i, level: 'internal' },
];

// Category-based defaults (fallback when text analysis is insufficient)
const CATEGORY_DEFAULTS = {
  '浏览器自动化': { network: 'full', filesystem: 'read', shell: true, sensitivity: 'internal' },
  'DevOps 部署': { network: 'full', filesystem: 'write', shell: true, sensitivity: 'internal' },
  '代码开发': { network: 'outbound_only', filesystem: 'write', shell: true, sensitivity: 'internal' },
  '系统工具': { network: 'none', filesystem: 'write', shell: true, sensitivity: 'internal' },
  '安全合规': { network: 'outbound_only', filesystem: 'read', shell: false, sensitivity: 'confidential' },
  '金融交易': { network: 'full', filesystem: 'read', shell: false, sensitivity: 'confidential' },
  '区块链 Web3': { network: 'full', filesystem: 'none', shell: false, sensitivity: 'confidential' },
  '通讯集成': { network: 'full', filesystem: 'none', shell: false, sensitivity: 'internal' },
  '搜索与研究': { network: 'outbound_only', filesystem: 'none', shell: false, sensitivity: 'public' },
  'AI 模型': { network: 'outbound_only', filesystem: 'none', shell: false, sensitivity: 'internal' },
  '数据分析': { network: 'outbound_only', filesystem: 'read', shell: false, sensitivity: 'internal' },
  '电商营销': { network: 'full', filesystem: 'none', shell: false, sensitivity: 'internal' },
  '教育学习': { network: 'outbound_only', filesystem: 'none', shell: false, sensitivity: 'public' },
  '游戏娱乐': { network: 'outbound_only', filesystem: 'none', shell: false, sensitivity: 'public' },
  '生活服务': { network: 'outbound_only', filesystem: 'none', shell: false, sensitivity: 'public' },
  'HR 人才': { network: 'full', filesystem: 'read', shell: false, sensitivity: 'confidential' },
  'Agent 基建': { network: 'outbound_only', filesystem: 'write', shell: true, sensitivity: 'internal' },
  '办公文档': { network: 'outbound_only', filesystem: 'write', shell: false, sensitivity: 'internal' },
  '内容创作': { network: 'outbound_only', filesystem: 'write', shell: false, sensitivity: 'public' },
  '效率工具': { network: 'outbound_only', filesystem: 'read', shell: false, sensitivity: 'public' },
  '多媒体': { network: 'outbound_only', filesystem: 'write', shell: false, sensitivity: 'public' },
  'API 网关': { network: 'full', filesystem: 'none', shell: false, sensitivity: 'internal' },
};

function inferPermission(skill) {
  const text = `${skill.name} ${skill.description || ''} ${skill.category || ''}`;
  const catDefault = CATEGORY_DEFAULTS[skill.category] || {
    network: 'none', filesystem: 'none', shell: false, sensitivity: 'public',
  };

  // Network access
  let network = catDefault.network;
  for (const rule of NETWORK_RULES) {
    if (rule.pattern.test(text)) { network = rule.level; break; }
  }

  // Filesystem access
  let filesystem = catDefault.filesystem;
  for (const rule of FILESYSTEM_RULES) {
    if (rule.pattern.test(text)) { filesystem = rule.level; break; }
  }

  // Shell execution
  let shell = catDefault.shell;
  for (const rule of SHELL_RULES) {
    if (rule.pattern.test(text)) { shell = true; break; }
  }

  // Data sensitivity
  let sensitivity = catDefault.sensitivity;
  for (const rule of SENSITIVITY_RULES) {
    if (rule.pattern.test(text)) { sensitivity = rule.level; break; }
  }

  // Extract external APIs mentioned
  const apiPatterns = [
    /\b(google|github|slack|discord|telegram|twitter|notion|jira|linear)\b/gi,
    /\b(aws|azure|gcp|cloudflare|vercel|supabase|firebase|stripe)\b/gi,
    /\b(openai|anthropic|gemini|huggingface|replicate)\b/gi,
    /\b(postgres|mysql|mongodb|redis|clickhouse|bigquery|snowflake)\b/gi,
  ];
  const apis = new Set();
  for (const pat of apiPatterns) {
    const matches = text.match(pat);
    if (matches) matches.forEach(m => apis.add(m.toLowerCase()));
  }

  return {
    network_access: network,
    filesystem_access: filesystem,
    data_sensitivity: sensitivity,
    shell_execution: shell,
    external_apis: [...apis].sort(),
    auto_detected: true,
    last_audited: new Date().toISOString().slice(0, 10),
  };
}

// Completeness score (0-1) for rating formula v2
function permissionCompleteness(manifest) {
  let score = 0;
  if (manifest.network_access !== undefined) score += 0.2;
  if (manifest.filesystem_access !== undefined) score += 0.2;
  if (manifest.data_sensitivity !== undefined) score += 0.2;
  if (manifest.shell_execution !== undefined) score += 0.2;
  if (manifest.external_apis?.length > 0) score += 0.1;
  if (manifest.auto_detected !== undefined) score += 0.1;
  return score;
}

async function main() {
  // Load unified index
  const unified = JSON.parse(await readFile(join(DATA_DIR, 'unified-index.json'), 'utf-8'));
  const skills = unified.skills;
  console.log(`OK: Loaded ${skills.length} skills`);

  // Scan permissions
  let scanned = 0;
  const summaryNetwork = { none: 0, outbound_only: 0, full: 0 };
  const summaryFs = { none: 0, read: 0, write: 0 };
  const summarySensitivity = { public: 0, internal: 0, confidential: 0 };
  let shellCount = 0;

  for (const skill of skills) {
    const manifest = inferPermission(skill);
    skill.permissionManifest = manifest;
    scanned++;

    summaryNetwork[manifest.network_access] = (summaryNetwork[manifest.network_access] || 0) + 1;
    summaryFs[manifest.filesystem_access] = (summaryFs[manifest.filesystem_access] || 0) + 1;
    summarySensitivity[manifest.data_sensitivity] = (summarySensitivity[manifest.data_sensitivity] || 0) + 1;
    if (manifest.shell_execution) shellCount++;
  }

  // Save
  await writeFile(join(DATA_DIR, 'unified-index.json'), JSON.stringify(unified, null, 2));

  console.log(`OK: Scanned ${scanned} skills`);
  console.log(`  Network: ${JSON.stringify(summaryNetwork)}`);
  console.log(`  Filesystem: ${JSON.stringify(summaryFs)}`);
  console.log(`  Sensitivity: ${JSON.stringify(summarySensitivity)}`);
  console.log(`  Shell execution: ${shellCount}`);
}

main().catch(err => { console.error('ERROR:', err.message); process.exit(1); });
