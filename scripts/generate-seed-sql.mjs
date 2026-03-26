#!/usr/bin/env node

/**
 * Generate seed.sql for D1 from existing JSON data files.
 * Reads: data/clawhub-skills.json + runs backend to get providers
 * Output: worker/src/seed.sql
 */

import { readFile, writeFile } from 'fs/promises';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const PROJECT = join(__dirname, '..');

function esc(s) {
  if (s == null) return '';
  return String(s)
    .replace(/\\/g, '\\\\')
    .replace(/'/g, "''")
    .replace(/\n/g, '\\n')
    .replace(/\r/g, '\\r')
    .replace(/\0/g, '');
}

async function main() {
  const lines = ['-- Auto-generated seed data', `-- Generated: ${new Date().toISOString()}`, ''];

  // 1. Providers — from static prebuild data
  try {
    const raw = await readFile(join(PROJECT, 'web', 'public', 'data', 'providers.json'), 'utf-8');
    const { providers } = JSON.parse(raw);
    lines.push('-- Providers');
    lines.push('DELETE FROM providers;');
    for (const p of providers) {
      lines.push(`INSERT INTO providers (id, name, vendor, type, tier, platforms, status, console_url, doc_url, im_channels, description, install_cmd, github) VALUES ('${esc(p.id)}', '${esc(p.name)}', '${esc(p.vendor)}', '${esc(p.type)}', ${p.tier}, '${esc(JSON.stringify(p.platforms))}', '${esc(p.status)}', '${esc(p.consoleUrl)}', '${esc(p.docUrl)}', '${esc(JSON.stringify(p.imChannels))}', '${esc(p.description)}', '${esc(p.installCmd || '')}', '${esc(p.github || '')}');`);
    }
    console.log(`OK: ${providers.length} providers`);
  } catch (err) {
    console.log('WARN: No providers data found');
  }

  // 2. Skills — prefer curated static (web/public/data/skills.json) → unified-index → clawhub
  try {
    let skills;
    try {
      const curated = JSON.parse(await readFile(join(PROJECT, 'web', 'public', 'data', 'skills.json'), 'utf-8'));
      skills = curated.skills;
      const source = curated.meta?.source || 'unknown';
      console.log(`NOTE: Using curated static data (${skills.length} skills, source: ${source})`);
    } catch {
      try {
        const unified = JSON.parse(await readFile(join(PROJECT, 'data', 'unified-index.json'), 'utf-8'));
        skills = unified.skills;
        console.log(`NOTE: Using unified index (${skills.length} entries)`);
      } catch {
        const raw = JSON.parse(await readFile(join(PROJECT, 'data', 'clawhub-skills.json'), 'utf-8'));
        skills = raw.skills;
        console.log(`NOTE: Using ClawHub-only data (${skills.length} skills)`);
      }
    }
    lines.push('');
    lines.push('-- Skills');
    lines.push('DELETE FROM skills;');
    for (const s of skills) {
      const pm = s.permissionManifest ? esc(JSON.stringify(s.permissionManifest)) : '{}';
      const stale = s.stale ? 1 : 0;
      const tags = s.tags ? esc(JSON.stringify(s.tags)) : '{}';
      const tagline = s.editorialTagline || '';
      const trending = s.trendingScore || 0;
      lines.push(`INSERT INTO skills (id, name, slug, author, description, category, icon, downloads, downloads_display, stars, stars_display, versions, platforms, official, score, rating, url, source, source_url, repository_url, remote_url, permission_manifest, deploy_success_rate, deploy_count, stale, tags, editorial_tagline, trending_score) VALUES ('${esc(s.id)}', '${esc(s.name)}', '${esc(s.slug)}', '${esc(s.author)}', '${esc(s.description)}', '${esc(s.category)}', '${esc(s.icon || 'widgets')}', ${s.downloads || 0}, '${esc(s.downloadsDisplay || '')}', ${s.stars || 0}, '${esc(s.starsDisplay || '')}', ${s.versions || 0}, '${esc(JSON.stringify(s.platforms || []))}', ${s.official ? 1 : 0}, ${s.score || 0}, '${esc(s.rating || 'C')}', '${esc(s.url || '')}', '${esc(s.source || 'clawhub')}', '${esc(s.sourceUrl || '')}', '${esc(s.repositoryUrl || '')}', '${esc(s.remoteUrl || '')}', '${pm}', -1, 0, ${stale}, '${tags}', '${esc(tagline)}', ${trending});`);
    }
    console.log(`OK: ${skills.length} skills`);
  } catch (err) {
    console.log('WARN: No skills data found');
  }

  lines.push('');
  await writeFile(join(PROJECT, 'worker', 'src', 'seed.sql'), lines.join('\n'));
  console.log('OK: worker/src/seed.sql generated');
}

main().catch(err => { console.error('ERROR:', err.message); process.exit(1); });
