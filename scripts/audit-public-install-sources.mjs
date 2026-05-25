#!/usr/bin/env node

import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';

const root = new URL('..', import.meta.url).pathname;
const webPublic = join(root, 'web', 'public');
const skillsPath = join(webPublic, 'data', 'skills.json');
const packsDir = join(webPublic, 'packs');

const FORBIDDEN_PUBLIC_SOURCE_RE = /(file:\/\/\/Users\/|(^|[^A-Za-z0-9_-])\/Users\/|C:[\\/]+Users[\\/]+|~\/Projects)/;
const LEGACY_PAGES_INSTALL_RE = /agent-foundry\.pages\.dev\/packs\/[^"'<\s]+\/install\.sh/i;
const PUBLIC_URL_RE = /^https?:\/\//i;

const problems = [];
const stats = {
  skills: 0,
  publicSkills: 0,
  packSettings: 0,
  packGuides: 0,
  packFiles: 0,
};

function readJson(path) {
  return JSON.parse(readFileSync(path, 'utf8'));
}

function walkStrings(value, visit, path = '$') {
  if (typeof value === 'string') {
    visit(value, path);
    return;
  }
  if (Array.isArray(value)) {
    value.forEach((item, index) => walkStrings(item, visit, `${path}[${index}]`));
    return;
  }
  if (value && typeof value === 'object') {
    for (const [key, item] of Object.entries(value)) {
      walkStrings(item, visit, `${path}.${key}`);
    }
  }
}

function listPackDirs() {
  if (!existsSync(packsDir)) return [];
  return readdirSync(packsDir)
    .map((name) => join(packsDir, name))
    .filter((path) => statSync(path).isDirectory())
    .sort();
}

function listFiles(rootDir) {
  if (!existsSync(rootDir)) return [];
  const files = [];
  const pending = [rootDir];
  while (pending.length) {
    const current = pending.pop();
    for (const name of readdirSync(current)) {
      const path = join(current, name);
      const stat = statSync(path);
      if (stat.isDirectory()) {
        pending.push(path);
      } else if (stat.isFile()) {
        files.push(path);
      }
    }
  }
  return files.sort();
}

function auditPublicDataBackups() {
  const dataDir = join(webPublic, 'data');
  if (!existsSync(dataDir)) return;
  for (const name of readdirSync(dataDir)) {
    const path = join(dataDir, name);
    if (name.startsWith('_backup') && statSync(path).isDirectory()) {
      problems.push(`${path}: backup directory must not be published under web/public/data`);
    }
  }
}

function auditSkills() {
  const payload = readJson(skillsPath);
  const skills = payload.skills || [];
  stats.skills = skills.length;

  for (const skill of skills) {
    const label = skill.id || skill.name || '<unknown>';
    const source = String(skill.source || 'clawhub').toLowerCase();
    if (source === 'local') {
      problems.push(`skills.json:${label}: local source is not publicly installable`);
    }

    const publicUrls = [skill.url, skill.sourceUrl, skill.repositoryUrl]
      .filter((value) => typeof value === 'string' && value.length > 0);
    if (!publicUrls.some((value) => PUBLIC_URL_RE.test(value))) {
      problems.push(`skills.json:${label}: missing public http(s) source URL`);
    }
    for (const value of publicUrls) {
      if (!PUBLIC_URL_RE.test(value)) {
        problems.push(`skills.json:${label}: non-public source URL ${value}`);
      }
    }

    walkStrings(skill, (value, path) => {
      if (!/(url|source|install|path|command)/i.test(path)) return;
      if (FORBIDDEN_PUBLIC_SOURCE_RE.test(value)) {
        problems.push(`skills.json:${label}:${path}: forbidden local source ${value}`);
      }
    });
  }

  stats.publicSkills = skills.filter((skill) => (
    String(skill.source || 'clawhub').toLowerCase() !== 'local'
    && [skill.url, skill.sourceUrl, skill.repositoryUrl].some((value) => (
      typeof value === 'string' && PUBLIC_URL_RE.test(value)
    ))
  )).length;
}

function auditPackSettings() {
  for (const packDir of listPackDirs()) {
    const settingsPath = join(packDir, 'settings.json');
    if (!existsSync(settingsPath)) continue;
    stats.packSettings += 1;
    const settings = readJson(settingsPath);
    walkStrings(settings, (value, path) => {
      if (FORBIDDEN_PUBLIC_SOURCE_RE.test(value)) {
        problems.push(`${settingsPath}:${path}: forbidden local source ${value}`);
      }
    });
  }
}

function auditPackGuides() {
  for (const packDir of listPackDirs()) {
    const guidePath = join(packDir, 'guide.html');
    if (!existsSync(guidePath)) continue;
    stats.packGuides += 1;
    const html = readFileSync(guidePath, 'utf8');
    if (LEGACY_PAGES_INSTALL_RE.test(html)) {
      problems.push(`${guidePath}: guide exposes legacy Pages install.sh URL`);
    }
    if (FORBIDDEN_PUBLIC_SOURCE_RE.test(html)) {
      problems.push(`${guidePath}: guide exposes a local filesystem source`);
    }
  }
}

function auditPackPayloadFiles() {
  for (const path of listFiles(packsDir)) {
    stats.packFiles += 1;
    const text = readFileSync(path, 'utf8');
    if (FORBIDDEN_PUBLIC_SOURCE_RE.test(text)) {
      problems.push(`${path}: pack payload exposes a local filesystem source`);
    }
    if (LEGACY_PAGES_INSTALL_RE.test(text)) {
      problems.push(`${path}: pack payload exposes legacy Pages install.sh URL`);
    }
  }
}

auditPublicDataBackups();
auditSkills();
auditPackSettings();
auditPackGuides();
auditPackPayloadFiles();

if (problems.length) {
  console.error(`ERROR public install source audit failed with ${problems.length} problem(s):`);
  for (const problem of problems.slice(0, 80)) console.error(`- ${problem}`);
  if (problems.length > 80) console.error(`- ... ${problems.length - 80} more`);
  process.exit(1);
}

console.log(
  `OK public install sources: ${stats.publicSkills}/${stats.skills} skills, `
  + `${stats.packSettings} pack settings, ${stats.packGuides} guides, `
  + `${stats.packFiles} pack files`,
);
