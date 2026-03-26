// Job Packs v2: 2-table model (pack_layers + config_packs)
// Query config_packs for listing, JOIN pack_layers for content resolution.

import { Hono } from 'hono';
import type { Env } from '../index';

export const packs = new Hono<{ Bindings: Env }>();

// ── Types ──

interface PackRow {
  id: string;
  name: string;
  name_zh: string;
  description: string;
  description_zh: string;
  icon: string;
  color: string;
  line: string;
  line_zh: string;
  layer_ids: string;
  version: string;
  download_count: number;
  created_at: string;
  updated_at: string;
}

interface LayerRow {
  id: string;
  type: string;
  name: string;
  name_zh: string;
  content_claude_md: string;
  content_agents_md: string;
  content_settings: string;
  content_prompts_md: string;
  sort_order: number;
}

// ── Mappers ──

function mapPack(row: PackRow) {
  const layerIds: string[] = JSON.parse(row.layer_ids || '[]');
  return {
    id: row.id,
    name: row.name,
    nameZh: row.name_zh,
    description: row.description,
    descriptionZh: row.description_zh,
    icon: row.icon,
    color: row.color,
    line: row.line,
    lineZh: row.line_zh,
    layerIds: layerIds,
    files: ['CLAUDE.md', 'AGENTS.md', 'settings.json', 'prompts.md', 'install.sh'],
    version: row.version,
    downloadCount: row.download_count,
  };
}

function mergeLayers(layers: LayerRow[]) {
  const claudeMd = layers
    .map(l => l.content_claude_md)
    .filter(Boolean)
    .join('\n\n---\n\n');

  const agentsMd = layers
    .map(l => l.content_agents_md)
    .filter(Boolean)
    .join('\n\n---\n\n');

  const settings = layers.reduce((acc, l) => {
    try {
      const parsed = JSON.parse(l.content_settings || '{}');
      return deepMerge(acc, parsed);
    } catch {
      return acc;
    }
  }, {} as Record<string, unknown>);

  const promptsMd = layers.at(-1)?.content_prompts_md || '';

  return { claudeMd, agentsMd, settings, promptsMd };
}

function deepMerge(target: Record<string, unknown>, source: Record<string, unknown>): Record<string, unknown> {
  const result = { ...target };
  for (const key of Object.keys(source)) {
    const val = source[key];
    if (val && typeof val === 'object' && !Array.isArray(val)) {
      result[key] = deepMerge((result[key] || {}) as Record<string, unknown>, val as Record<string, unknown>);
    } else {
      result[key] = val;
    }
  }
  return result;
}

// ── Routes ──

// List all packs (public) — grouped by line
packs.get('/', async (c) => {
  const db = c.env.DB;
  const { results } = await db.prepare(
    'SELECT * FROM config_packs ORDER BY line, download_count DESC'
  ).all<PackRow>();

  const packList = (results || []).map(mapPack);

  // Group by line
  const lineMap = new Map<string, { id: string; name: string; packs: ReturnType<typeof mapPack>[] }>();
  for (const p of packList) {
    if (!lineMap.has(p.line)) {
      lineMap.set(p.line, { id: p.line, name: p.lineZh, packs: [] });
    }
    lineMap.get(p.line)!.packs.push(p);
  }

  return c.json({
    total: packList.length,
    generated: new Date().toISOString(),
    lines: Array.from(lineMap.values()),
    packs: packList,
  });
});

// Get single pack with resolved layers (public)
packs.get('/:id', async (c) => {
  const db = c.env.DB;
  const id = c.req.param('id');

  const row = await db.prepare(
    'SELECT * FROM config_packs WHERE id = ?'
  ).bind(id).first<PackRow>();

  if (!row) return c.json({ error: 'Pack not found' }, 404);

  // Resolve layers
  const layerIds: string[] = JSON.parse(row.layer_ids || '[]');
  let layers: LayerRow[] = [];
  if (layerIds.length > 0) {
    const placeholders = layerIds.map(() => '?').join(',');
    const { results } = await db.prepare(
      `SELECT * FROM pack_layers WHERE id IN (${placeholders}) ORDER BY sort_order`
    ).bind(...layerIds).all<LayerRow>();
    // Re-order to match layer_ids order (SQL IN doesn't preserve order)
    const layerMap = new Map((results || []).map(l => [l.id, l]));
    layers = layerIds.map(lid => layerMap.get(lid)!).filter(Boolean);
  }

  const merged = mergeLayers(layers);

  return c.json({
    pack: {
      ...mapPack(row),
      claudeMd: merged.claudeMd,
      agentsMd: merged.agentsMd,
      settings: merged.settings,
      promptsMd: merged.promptsMd,
    },
  });
});

// Track download (increment counter)
packs.get('/:id/download', async (c) => {
  const db = c.env.DB;
  const id = c.req.param('id');

  const row = await db.prepare(
    'SELECT id FROM config_packs WHERE id = ?'
  ).bind(id).first<PackRow>();

  if (!row) return c.json({ error: 'Pack not found' }, 404);

  await db.prepare(
    'UPDATE config_packs SET download_count = download_count + 1, updated_at = datetime(\'now\') WHERE id = ?'
  ).bind(id).run();

  return c.json({ ok: true, id });
});
