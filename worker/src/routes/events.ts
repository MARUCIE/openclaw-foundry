// Unified skill event stream: deploy, review, view, install
// Append-only fact log. Cron materializes derived fields on skills table.
// Anti-spam: B1 weight decay for anomalous fingerprint patterns.

import { Hono } from 'hono';
import type { Env } from '../index';

export const events = new Hono<{ Bindings: Env }>();

const VALID_TYPES = ['deploy_ok', 'deploy_fail', 'review_up', 'review_down', 'install', 'view'] as const;
type EventType = typeof VALID_TYPES[number];

// Review events require tenant identity (Hickey: opinions need identity)
const IDENTITY_REQUIRED: EventType[] = ['review_up', 'review_down'];

events.post('/', async (c) => {
  const db = c.env.DB;

  const body = await c.req.json<{
    skill_id: string;
    event_type: string;
    tenant_id?: string;
    payload?: Record<string, unknown>;
  }>();

  if (!body.skill_id || !body.event_type) {
    return c.json({ error: 'skill_id and event_type are required' }, 400);
  }
  if (!VALID_TYPES.includes(body.event_type as EventType)) {
    return c.json({ error: `event_type must be one of: ${VALID_TYPES.join(', ')}` }, 400);
  }

  const eventType = body.event_type as EventType;

  // Identity gate: review events require tenant_id
  if (IDENTITY_REQUIRED.includes(eventType) && !body.tenant_id) {
    return c.json({ error: 'tenant_id is required for review events' }, 400);
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

  // B1 anti-spam: check recent event volume from same fingerprint prefix (ASN approximation)
  const fpPrefix = fingerprint.slice(0, 8);
  let weight = 1.0;
  try {
    const recentRow = await db.prepare(
      `SELECT COUNT(*) as cnt FROM skill_events
       WHERE fingerprint LIKE ? || '%'
         AND event_type = ?
         AND created_at > datetime('now', '-24 hours')`
    ).bind(fpPrefix, eventType).first<{ cnt: number }>();

    if (recentRow && recentRow.cnt >= 5) {
      weight = 0.1; // Anomalous volume: decay weight
    }
  } catch {
    // Non-critical: proceed with default weight
  }

  const payloadStr = JSON.stringify(body.payload || {});

  try {
    await db.prepare(
      `INSERT INTO skill_events (skill_id, event_type, fingerprint, tenant_id, payload, weight)
       VALUES (?, ?, ?, ?, ?, ?)
       ON CONFLICT(skill_id, event_type, fingerprint) DO UPDATE SET
         payload = excluded.payload,
         weight = excluded.weight,
         tenant_id = excluded.tenant_id,
         created_at = datetime('now')`
    ).bind(
      body.skill_id,
      eventType,
      fingerprint,
      body.tenant_id || '',
      payloadStr,
      weight,
    ).run();

    return c.json({ ok: true, weight });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error('Event write failed:', msg);
    return c.json({ error: 'Failed to record event' }, 500);
  }
});

// Get event stats for a skill
events.get('/stats', async (c) => {
  const db = c.env.DB;
  const skillId = c.req.query('skill_id');
  if (!skillId) return c.json({ error: 'skill_id query param required' }, 400);

  const { results } = await db.prepare(
    `SELECT event_type, COUNT(*) as cnt, SUM(weight) as weighted_cnt
     FROM skill_events
     WHERE skill_id = ?
     GROUP BY event_type`
  ).bind(skillId).all<{ event_type: string; cnt: number; weighted_cnt: number }>();

  const stats: Record<string, { count: number; weighted: number }> = {};
  for (const r of results || []) {
    stats[r.event_type] = { count: r.cnt, weighted: r.weighted_cnt };
  }

  return c.json({ skillId, stats });
});

// Co-occurrence recommendations: "users who installed X also installed Y"
events.get('/recommendations', async (c) => {
  const db = c.env.DB;
  const skillId = c.req.query('skill_id');
  const limit = Math.min(parseInt(c.req.query('limit') || '5'), 10);
  if (!skillId) return c.json({ error: 'skill_id query param required' }, 400);

  const { results } = await db.prepare(
    `SELECT e2.skill_id as partner_id, COUNT(DISTINCT e2.fingerprint) as co_count
     FROM skill_events e1
     JOIN skill_events e2
       ON e1.fingerprint = e2.fingerprint
       AND e1.skill_id != e2.skill_id
       AND e2.event_type IN ('deploy_ok', 'install')
     WHERE e1.skill_id = ?
       AND e1.event_type IN ('deploy_ok', 'install')
     GROUP BY e2.skill_id
     ORDER BY co_count DESC
     LIMIT ?`
  ).bind(skillId, limit).all<{ partner_id: string; co_count: number }>();

  return c.json({ skillId, recommendations: results || [] });
});

// Recent events feed (public transparency)
events.get('/recent', async (c) => {
  const db = c.env.DB;
  const limit = Math.min(parseInt(c.req.query('limit') || '20'), 50);
  const eventType = c.req.query('type'); // optional filter

  let query = `SELECT e.skill_id, e.event_type, e.payload, e.created_at,
                      s.name as skill_name, s.rating as skill_rating
               FROM skill_events e
               LEFT JOIN skills s ON e.skill_id = s.id`;
  const params: (string | number)[] = [];

  if (eventType && VALID_TYPES.includes(eventType as EventType)) {
    query += ' WHERE e.event_type = ?';
    params.push(eventType);
  }

  query += ' ORDER BY e.created_at DESC LIMIT ?';
  params.push(limit);

  const { results } = await db.prepare(query).bind(...params).all();

  return c.json({ events: results || [] });
});
