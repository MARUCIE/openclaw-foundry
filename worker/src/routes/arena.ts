// Arena results: persisted to D1 (replaces memory Map)

import { Hono } from 'hono';
import type { Env } from '../index';
import type { ArenaResultRow } from '../types';
import { safeJsonArray, safeJsonObject } from '../types';

export const arena = new Hono<{ Bindings: Env }>();

// Get arena history (public)
arena.get('/history', async (c) => {
  const db = c.env.DB;
  const limit = Math.min(parseInt(c.req.query('limit') || '20'), 50);

  const { results } = await db.prepare(
    `SELECT * FROM arena_results ORDER BY created_at DESC LIMIT ?`
  ).bind(limit).all<ArenaResultRow>();

  const mapped = (results || []).map(r => ({
    id: r.id,
    providerIds: safeJsonArray(r.provider_ids),
    blueprintHash: r.blueprint_hash,
    testPrompt: r.test_prompt,
    scoring: safeJsonObject(r.scoring),
    winner: r.winner,
    status: r.status,
    createdAt: r.created_at,
    completedAt: r.completed_at,
  }));

  return c.json({ matches: mapped });
});

// Get single arena result
arena.get('/:id', async (c) => {
  const db = c.env.DB;
  const id = c.req.param('id');

  const row = await db.prepare(
    'SELECT * FROM arena_results WHERE id = ?'
  ).bind(id).first<ArenaResultRow>();

  if (!row) return c.json({ error: 'Arena result not found' }, 404);

  return c.json({
    id: row.id,
    providerIds: safeJsonArray(row.provider_ids),
    blueprintHash: row.blueprint_hash,
    testPrompt: row.test_prompt,
    scoring: safeJsonObject(row.scoring),
    winner: row.winner,
    status: row.status,
    createdAt: row.created_at,
    completedAt: row.completed_at,
  });
});

// Create arena match (requires auth for Pro tier)
arena.post('/', async (c) => {
  const db = c.env.DB;
  const body = await c.req.json<{
    provider_ids: string[];
    blueprint_hash?: string;
    test_prompt: string;
  }>();

  if (!body.provider_ids?.length || !body.test_prompt) {
    return c.json({ error: 'provider_ids and test_prompt are required' }, 400);
  }
  if (body.provider_ids.length < 2 || body.provider_ids.length > 5) {
    return c.json({ error: 'provider_ids must have 2-5 entries' }, 400);
  }

  const id = `arena-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

  await db.prepare(
    `INSERT INTO arena_results (id, provider_ids, blueprint_hash, test_prompt, status)
     VALUES (?, ?, ?, ?, 'pending')`
  ).bind(
    id,
    JSON.stringify(body.provider_ids),
    body.blueprint_hash || '',
    body.test_prompt,
  ).run();

  return c.json({ matchId: id, status: 'pending' }, 202);
});
