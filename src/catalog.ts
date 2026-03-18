import { readdir, readFile } from 'fs/promises';
import { join } from 'path';
import { execa } from 'execa';
import type { CatalogEntry } from './types.js';

const AIFLEET_SKILLS = process.env.AIFLEET_SKILLS_DIR
  || join(process.env.HOME || '~', '00-AI-Fleet', '.claude', 'skills');

// Scan local AI-Fleet skills directory
export async function scanAiFleetSkills(): Promise<CatalogEntry[]> {
  try {
    const dirs = await readdir(AIFLEET_SKILLS, { withFileTypes: true });
    const entries: CatalogEntry[] = [];

    for (const dir of dirs) {
      if (!dir.isDirectory() && !dir.isSymbolicLink()) continue;

      const skillMdPath = join(AIFLEET_SKILLS, dir.name, 'SKILL.md');
      let description = '';
      let tags: string[] = [];

      try {
        const content = await readFile(skillMdPath, 'utf-8');
        const fm = parseFrontmatter(content);
        description = fm.description || extractFirstParagraph(content);
        tags = fm.tags ? fm.tags.split(',').map((t: string) => t.trim()) : [];
      } catch { /* SKILL.md missing — still list the skill */ }

      entries.push({
        id: dir.name,
        name: dir.name,
        description,
        source: 'aifleet',
        tags,
      });
    }
    return entries;
  } catch {
    return [];
  }
}

// Query ClawHub for available skills
export async function scanClawHubSkills(): Promise<CatalogEntry[]> {
  try {
    const { stdout } = await execa('openclaw', ['skills', 'list', '--json'], {
      timeout: 15_000,
    });
    const skills = JSON.parse(stdout);
    return skills.map((s: Record<string, unknown>) => ({
      id: (s.id || s.name) as string,
      name: s.name as string,
      description: (s.description || '') as string,
      source: 'clawhub' as const,
      category: s.category as string | undefined,
      tags: s.tags as string[] | undefined,
    }));
  } catch {
    return [];
  }
}

// Unified catalog from both sources
export async function getFullCatalog(): Promise<CatalogEntry[]> {
  const [aifleet, clawhub] = await Promise.all([
    scanAiFleetSkills(),
    scanClawHubSkills(),
  ]);
  return [...aifleet, ...clawhub];
}

// Format catalog as a compact string for LLM prompt
export function catalogToPromptText(catalog: CatalogEntry[]): string {
  const bySource: Record<string, CatalogEntry[]> = { aifleet: [], clawhub: [] };
  for (const entry of catalog) {
    (bySource[entry.source] ??= []).push(entry);
  }

  const lines: string[] = [];
  for (const [source, entries] of Object.entries(bySource)) {
    lines.push(`\n## ${source === 'aifleet' ? 'AI-Fleet (local)' : 'ClawHub (remote)'}`);
    for (const e of entries) {
      lines.push(`- ${e.id}${e.description ? ': ' + e.description.slice(0, 80) : ''}`);
    }
  }
  return lines.join('\n');
}

// --- helpers ---

interface Frontmatter {
  description?: string;
  name?: string;
  tags?: string;
  category?: string;
  [key: string]: string | undefined;
}

function parseFrontmatter(md: string): Frontmatter {
  const match = md.match(/^---\n([\s\S]*?)\n---/);
  if (!match) return {};

  const fm: Frontmatter = {};
  const lines = match[1].split('\n');
  let currentKey = '';

  for (const line of lines) {
    // Continuation line (indented) — append to current key
    if (currentKey && /^\s+\S/.test(line)) {
      const prev = fm[currentKey] || '';
      fm[currentKey] = (prev + ' ' + line.trim()).trim();
      continue;
    }

    const idx = line.indexOf(':');
    if (idx === -1) continue;

    const key = line.slice(0, idx).trim();
    let val = line.slice(idx + 1).trim();

    // YAML multiline indicators: strip `>`, `|`, `>-`, `|-`
    if (val === '>' || val === '|' || val === '>-' || val === '|-') {
      currentKey = key;
      fm[key] = '';
      continue;
    }

    currentKey = key;
    // Strip surrounding quotes
    if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
      val = val.slice(1, -1);
    }
    fm[key] = val;
  }
  return fm;
}

function extractFirstParagraph(md: string): string {
  // Skip frontmatter block, then find first content line
  const stripped = md.replace(/^---\n[\s\S]*?\n---\n*/, '');
  for (const line of stripped.split('\n')) {
    const t = line.trim();
    if (t && !t.startsWith('#') && !t.startsWith('```') && !t.startsWith('---')) {
      return t.slice(0, 200);
    }
  }
  return '';
}
