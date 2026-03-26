// ConfigPacks: role-based one-click configuration bundles
// Pure value → pure function. No side effects except download_count increment.

import { Hono } from 'hono';
import type { Env } from '../index';

export const packs = new Hono<{ Bindings: Env }>();

interface PackRow {
  id: string;
  role: string;
  role_zh: string;
  description: string;
  description_zh: string;
  icon: string;
  color: string;
  claude_md: string;
  agents_md: string;
  mcp_servers: string;
  skill_ids: string;
  prompts: string;
  version: string;
  download_count: number;
  created_at: string;
  updated_at: string;
}

function mapPack(row: PackRow) {
  return {
    id: row.id,
    role: row.role,
    roleZh: row.role_zh,
    description: row.description,
    descriptionZh: row.description_zh,
    icon: row.icon,
    color: row.color,
    mcpServers: JSON.parse(row.mcp_servers || '[]'),
    skillIds: JSON.parse(row.skill_ids || '[]'),
    prompts: JSON.parse(row.prompts || '[]'),
    version: row.version,
    downloadCount: row.download_count,
    createdAt: row.created_at,
  };
}

// List all packs (public)
packs.get('/', async (c) => {
  const db = c.env.DB;
  const { results } = await db.prepare(
    'SELECT * FROM config_packs ORDER BY download_count DESC'
  ).all<PackRow>();

  return c.json({
    total: results?.length || 0,
    packs: (results || []).map(mapPack),
  });
});

// Get single pack with resolved skills (public)
packs.get('/:id', async (c) => {
  const db = c.env.DB;
  const id = c.req.param('id');

  const row = await db.prepare(
    'SELECT * FROM config_packs WHERE id = ?'
  ).bind(id).first<PackRow>();

  if (!row) return c.json({ error: 'Pack not found' }, 404);

  const skillIds: string[] = JSON.parse(row.skill_ids || '[]');
  let skills: unknown[] = [];
  if (skillIds.length > 0) {
    const placeholders = skillIds.map(() => '?').join(',');
    const { results } = await db.prepare(
      `SELECT id, name, slug, author, description, category, rating, score
       FROM skills WHERE id IN (${placeholders})`
    ).bind(...skillIds).all();
    skills = results || [];
  }

  return c.json({
    pack: {
      ...mapPack(row),
      claudeMd: row.claude_md,
      agentsMd: row.agents_md,
    },
    skills,
  });
});

// Download pack as structured JSON (client generates files)
packs.get('/:id/download', async (c) => {
  const db = c.env.DB;
  const id = c.req.param('id');

  const row = await db.prepare(
    'SELECT * FROM config_packs WHERE id = ?'
  ).bind(id).first<PackRow>();

  if (!row) return c.json({ error: 'Pack not found' }, 404);

  // Increment download count (only side effect)
  await db.prepare(
    'UPDATE config_packs SET download_count = download_count + 1 WHERE id = ?'
  ).bind(id).run();

  // Return structured data — client decides how to save
  const pack = {
    meta: {
      id: row.id,
      role: row.role,
      version: row.version,
      generatedAt: new Date().toISOString(),
      source: 'openclaw-foundry',
    },
    files: {
      'CLAUDE.md': row.claude_md,
      'AGENTS.md': row.agents_md,
    },
    mcpServers: JSON.parse(row.mcp_servers || '[]'),
    skillIds: JSON.parse(row.skill_ids || '[]'),
    prompts: JSON.parse(row.prompts || '[]'),
  };

  return c.json(pack);
});
