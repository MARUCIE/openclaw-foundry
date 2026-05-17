// /api/wall — Before/After 工作流卡点登记墙
// Read endpoints: public (browsing the wall has zero friction).
// Write endpoints: requireAuth() — only verified-email users can post entries + comments.
// This is the "完整功能" line per the email-auth-wall goal (v8 migration).
//
// Anonymity is preserved on the privacy layer: anon_uid_hash is still derived
// from the user's stable identifier (user.id + WALL_PEPPER) so the public list
// never exposes the email; only the row owner sees "(you sent it)" via user_id
// match on the client. Legacy pre-v8 entries keep their hash unchanged.
//
// Endpoints:
//   GET  /api/wall?role=<slug>&limit=50           list recent entries (public)
//   GET  /api/wall/:id                             one entry + its comments (public)
//   POST /api/wall                                 create entry (requireAuth)
//   POST /api/wall/:id/comment                    add comment (requireAuth)
//   POST /api/wall/:id/flag                        community moderation marker (public)

import { Hono } from 'hono';
import type { Env } from '../index';
import { requireAuth, type AuthedUser } from '../lib/auth';

export const wall = new Hono<{ Bindings: Env; Variables: { user: AuthedUser } }>();

function requirePepper(env: Env & { WALL_PEPPER?: string }): string {
  const p = env.WALL_PEPPER;
  if (!p || p.length < 16) {
    // Fail loud — a known/default pepper defeats anonymity if data ever leaks.
    // Set via: wrangler secret put WALL_PEPPER (≥16 char random string)
    throw new Error('WALL_PEPPER secret missing or too short — refusing to hash');
  }
  return p;
}

async function hashAnonUid(uid: string, pepper: string): Promise<string> {
  const data = new TextEncoder().encode(`${uid}:${pepper}`);
  const buf = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(buf))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')
    .slice(0, 32);
}

function newId(): string {
  // Cloudflare Workers expose crypto.randomUUID
  return (crypto as { randomUUID?: () => string }).randomUUID?.() || `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

function clampLen(s: unknown, max: number): string {
  if (typeof s !== 'string') return '';
  return s.length > max ? s.slice(0, max) : s;
}

// GET /api/wall — list recent entries
wall.get('/', async (c) => {
  const role = c.req.query('role');
  const limit = Math.min(parseInt(c.req.query('limit') || '50'), 200);
  const conditions: string[] = ['flagged = 0'];
  const params: (string | number)[] = [];
  if (role) {
    conditions.push('role_slug = ?');
    params.push(role);
  }
  const where = `WHERE ${conditions.join(' AND ')}`;
  const sql = `
    SELECT e.id, e.anon_uid_hash, e.role_slug, e.before_state, e.after_method, e.suggestion, e.created_at,
           (SELECT COUNT(*) FROM wall_comments c WHERE c.entry_id = e.id AND c.flagged = 0) AS comment_count
    FROM wall_entries e
    ${where}
    ORDER BY e.created_at DESC
    LIMIT ?
  `;
  const { results } = await c.env.DB.prepare(sql).bind(...params, limit).all();
  return c.json({ entries: results || [] });
});

// GET /api/wall/:id — one entry + comments (public read)
wall.get('/:id', async (c) => {
  const id = c.req.param('id');
  const entry = await c.env.DB.prepare(
    `SELECT id, anon_uid_hash, role_slug, before_state, after_method, suggestion, created_at, user_id
     FROM wall_entries WHERE id = ? AND flagged = 0`
  ).bind(id).first();
  if (!entry) return c.json({ error: 'not found' }, 404);
  const { results: comments } = await c.env.DB.prepare(
    `SELECT id, anon_uid_hash, body, created_at, user_id
     FROM wall_comments WHERE entry_id = ? AND flagged = 0
     ORDER BY created_at ASC`
  ).bind(id).all();
  return c.json({ entry, comments: comments || [] });
});

// POST /api/wall — create entry (requireAuth: only verified-email users can post)
wall.post('/', requireAuth(), async (c) => {
  const user = c.var.user;
  const body = await c.req.json<{
    role_slug?: string | null;
    before_state: string;
    after_method: string;
    suggestion?: string | null;
  }>();
  const before = clampLen(body.before_state, 2000);
  const after = clampLen(body.after_method, 2000);
  const suggestion = body.suggestion ? clampLen(body.suggestion, 800) : null;
  const roleSlug = body.role_slug ? clampLen(body.role_slug, 64) : null;
  if (!before.trim() || !after.trim()) {
    return c.json({ error: 'before_state and after_method required' }, 400);
  }
  // Derive anon_uid_hash from user.id + pepper — deterministic per user, so the
  // public list can still de-correlate identities without ever exposing the email.
  const pepper = requirePepper(c.env as Env & { WALL_PEPPER?: string });
  const hash = await hashAnonUid(user.id, pepper);
  const id = newId();
  await c.env.DB.prepare(
    `INSERT INTO wall_entries (id, anon_uid_hash, role_slug, before_state, after_method, suggestion, user_id)
     VALUES (?, ?, ?, ?, ?, ?, ?)`
  ).bind(id, hash, roleSlug, before, after, suggestion, user.id).run();
  return c.json({ id, anon_uid_hash: hash, user_id: user.id }, 201);
});

// POST /api/wall/:id/comment — add comment (requireAuth)
wall.post('/:id/comment', requireAuth(), async (c) => {
  const user = c.var.user;
  const entryId = c.req.param('id');
  const body = await c.req.json<{ body: string }>();
  const text = clampLen(body.body, 1500);
  if (!text.trim()) return c.json({ error: 'body required' }, 400);
  const exists = await c.env.DB.prepare(`SELECT 1 AS ok FROM wall_entries WHERE id = ?`).bind(entryId).first();
  if (!exists) return c.json({ error: 'entry not found' }, 404);
  const pepper = requirePepper(c.env as Env & { WALL_PEPPER?: string });
  const hash = await hashAnonUid(user.id, pepper);
  const id = newId();
  await c.env.DB.prepare(
    `INSERT INTO wall_comments (id, entry_id, anon_uid_hash, body, user_id)
     VALUES (?, ?, ?, ?, ?)`
  ).bind(id, entryId, hash, text, user.id).run();
  return c.json({ id, anon_uid_hash: hash, user_id: user.id }, 201);
});

// POST /api/wall/:id/flag — community moderation marker
wall.post('/:id/flag', async (c) => {
  const id = c.req.param('id');
  await c.env.DB.prepare(`UPDATE wall_entries SET flagged = 1 WHERE id = ?`).bind(id).run();
  return c.json({ ok: true });
});
