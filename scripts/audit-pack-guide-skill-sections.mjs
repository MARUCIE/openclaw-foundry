#!/usr/bin/env node
// Fail the build when any public role-pack guide does not render every skill as
// a complete three-part manual card: 是什么 / 怎么用 / 架构图.

import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const PROJECT_ROOT = resolve(__dirname, '..');
const PACKS_DIR = join(PROJECT_ROOT, 'web', 'public', 'packs');

function readJson(path) {
  return JSON.parse(readFileSync(path, 'utf-8'));
}

function count(re, text) {
  return (text.match(re) || []).length;
}

const failures = [];
let guideCount = 0;
let skillCount = 0;

for (const entry of readdirSync(PACKS_DIR, { withFileTypes: true }).sort((a, b) => a.name.localeCompare(b.name))) {
  if (!entry.isDirectory()) continue;

  const slug = entry.name;
  const packDir = join(PACKS_DIR, slug);
  const manifestPath = join(packDir, 'manifest.json');
  const guidePath = join(packDir, 'guide.html');
  if (!existsSync(manifestPath)) continue;

  const manifest = readJson(manifestPath);
  const skills = (manifest.items || []).filter(item => item.type === 'skill');
  skillCount += skills.length;

  if (!existsSync(guidePath)) {
    failures.push(`${slug}: guide.html missing`);
    continue;
  }

  const missingSkillFiles = skills
    .map(item => item.src || item.dst)
    .filter(rel => !rel || !existsSync(join(packDir, rel)));
  if (missingSkillFiles.length > 0) {
    failures.push(`${slug}: missing skill files: ${missingSkillFiles.join(', ')}`);
  }

  const html = readFileSync(guidePath, 'utf-8');
  guideCount += 1;

  const cardCount = count(/<div class="skill-card" id="skill-/g, html);
  const whatCount = count(/<h4>是什么<\/h4>/g, html);
  const howCount = count(/<h4>怎么用<\/h4>/g, html);
  const archCount = count(/<h4>架构图<\/h4>/g, html);
  const mermaidCount = count(/<pre class="mermaid">/g, html);

  if (/尚未完成三段式美化|skill-card-stub|skill-card-stub-note/.test(html)) {
    failures.push(`${slug}: contains unfinished three-part placeholder text or stub classes`);
  }

  if (cardCount !== skills.length) {
    failures.push(`${slug}: skill-card count ${cardCount} != manifest skill count ${skills.length}`);
  }
  if (whatCount !== skills.length || howCount !== skills.length || archCount !== skills.length || mermaidCount !== skills.length) {
    failures.push(`${slug}: section counts mismatch (skills=${skills.length}, what=${whatCount}, how=${howCount}, arch=${archCount}, mermaid=${mermaidCount})`);
  }
}

if (failures.length > 0) {
  console.error('ERROR: pack guide skill sections audit failed:');
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log(`OK pack guide skill sections: guides=${guideCount} skills=${skillCount} cards=${skillCount}`);
