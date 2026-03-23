// Deploy feedback: anonymous, R1 flywheel core
// No auth required — fingerprint-based dedup

import { Hono } from 'hono';
import type { Env } from '../index';
import type { CountRow } from '../types';

export const feedback = new Hono<{ Bindings: Env }>();

// Submit feedback (anonymous)
feedback.post('/', async (c) => {
  const db = c.env.DB;
  const body = await c.req.json<{
    skill_id: string;
    provider_id?: string;
    outcome: string;
    comment?: string;
  }>();

  if (!body.skill_id || !body.outcome) {
    return c.json({ error: 'skill_id and outcome are required' }, 400);
  }
  if (!['success', 'fail', 'not_tried'].includes(body.outcome)) {
    return c.json({ error: 'outcome must be success, fail, or not_tried' }, 400);
  }

  // Generate fingerprint from IP + User-Agent
  const ip = c.req.header('cf-connecting-ip') || c.req.header('x-forwarded-for') || 'unknown';
  const ua = c.req.header('user-agent') || 'unknown';
  const raw = `${ip}:${ua}`;
  const encoder = new TextEncoder();
  const data = encoder.encode(raw);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const fingerprint = Array.from(new Uint8Array(hashBuffer))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('')
    .slice(0, 32);

  try {
    await db.prepare(
      `INSERT INTO deploy_feedback (skill_id, provider_id, outcome, fingerprint, comment)
       VALUES (?, ?, ?, ?, ?)
       ON CONFLICT(skill_id, fingerprint) DO UPDATE SET
         outcome = excluded.outcome,
         comment = excluded.comment,
         created_at = datetime('now')`
    ).bind(
      body.skill_id,
      body.provider_id || '',
      body.outcome,
      fingerprint,
      body.comment || '',
    ).run();

    // Update skill deploy stats (async, best-effort)
    const statsRow = await db.prepare(
      `SELECT
         COUNT(*) as total,
         SUM(CASE WHEN outcome = 'success' THEN 1 ELSE 0 END) as successes
       FROM deploy_feedback WHERE skill_id = ?`
    ).bind(body.skill_id).first<{ total: number; successes: number }>();

    if (statsRow && statsRow.total > 0) {
      const rate = statsRow.successes / statsRow.total;
      await db.prepare(
        `UPDATE skills SET deploy_success_rate = ?, deploy_count = ? WHERE id = ?`
      ).bind(rate, statsRow.total, body.skill_id).run();
    }

    return c.json({ ok: true });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    // UNIQUE constraint = already submitted, update was applied
    if (msg.includes('UNIQUE')) {
      return c.json({ ok: true, updated: true });
    }
    return c.json({ error: 'Failed to submit feedback' }, 500);
  }
});

// Get feedback stats for a skill (use ?skill_id= because IDs contain slashes)
feedback.get('/stats', async (c) => {
  const db = c.env.DB;
  const skillId = c.req.query('skill_id');
  if (!skillId) return c.json({ error: 'skill_id query param required' }, 400);

  const { results } = await db.prepare(
    `SELECT outcome, COUNT(*) as cnt FROM deploy_feedback
     WHERE skill_id = ? GROUP BY outcome`
  ).bind(skillId).all<{ outcome: string; cnt: number }>();

  const stats: Record<string, number> = { success: 0, fail: 0, not_tried: 0 };
  for (const r of results || []) {
    stats[r.outcome] = r.cnt;
  }
  const total = stats.success + stats.fail + stats.not_tried;
  const successRate = total > 0 ? stats.success / (stats.success + stats.fail || 1) : -1;

  return c.json({ skillId, stats, total, successRate });
});

// Get recent feedback (public, for transparency)
feedback.get('/recent', async (c) => {
  const db = c.env.DB;
  const limit = Math.min(parseInt(c.req.query('limit') || '20'), 50);

  const { results } = await db.prepare(
    `SELECT f.skill_id, f.provider_id, f.outcome, f.comment, f.created_at,
            s.name as skill_name, s.rating as skill_rating
     FROM deploy_feedback f
     LEFT JOIN skills s ON f.skill_id = s.id
     ORDER BY f.created_at DESC LIMIT ?`
  ).bind(limit).all();

  return c.json({ feedback: results || [] });
});
