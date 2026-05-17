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
import { requireAuth, extractBearer, resolveSessionUser, type AuthedUser } from '../lib/auth';

export const wall = new Hono<{ Bindings: Env; Variables: { user: AuthedUser } }>();

// Optional auth — used by GET endpoints to surface per-user `liked` state when a valid
// Bearer is present, without rejecting anonymous browsers. Returns the user or null.
async function resolveOptionalUser(c: { req: { header: (k: string) => string | undefined }; env: Env }): Promise<AuthedUser | null> {
  const bearer = extractBearer(c.req.header('Authorization'));
  if (!bearer) return null;
  return await resolveSessionUser(c.env.DB, bearer);
}

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
// Public read; Bearer optional. When a valid Bearer is present, each row carries a
// `liked: 0|1` flag indicating whether the calling user has liked it.
wall.get('/', async (c) => {
  const role = c.req.query('role');
  const limit = Math.min(parseInt(c.req.query('limit') || '50'), 200);
  const user = await resolveOptionalUser(c);
  const conditions: string[] = ['flagged = 0'];
  const params: (string | number)[] = [];
  if (role) {
    conditions.push('role_slug = ?');
    params.push(role);
  }
  const where = `WHERE ${conditions.join(' AND ')}`;
  // liked subquery returns 0 when user is anonymous (no row in wall_likes matches NULL user_id).
  const sql = `
    SELECT e.id, e.anon_uid_hash, e.role_slug, e.before_state, e.after_method, e.suggestion, e.created_at, e.user_id,
           (SELECT COUNT(*) FROM wall_comments c WHERE c.entry_id = e.id AND c.flagged = 0) AS comment_count,
           (SELECT COUNT(*) FROM wall_likes l WHERE l.entry_id = e.id) AS like_count,
           CASE WHEN ? IS NULL THEN 0
                ELSE (SELECT COUNT(*) FROM wall_likes l WHERE l.entry_id = e.id AND l.user_id = ?)
           END AS liked
    FROM wall_entries e
    ${where}
    ORDER BY e.created_at DESC
    LIMIT ?
  `;
  const userId = user?.id ?? null;
  const { results } = await c.env.DB.prepare(sql).bind(userId, userId, ...params, limit).all();
  return c.json({ entries: results || [] });
});

// GET /api/wall/:id — one entry + comments (public read; Bearer optional surfaces `liked`)
wall.get('/:id', async (c) => {
  const id = c.req.param('id');
  const user = await resolveOptionalUser(c);
  const userId = user?.id ?? null;
  const entry = await c.env.DB.prepare(
    `SELECT e.id, e.anon_uid_hash, e.role_slug, e.before_state, e.after_method, e.suggestion, e.created_at, e.user_id,
            (SELECT COUNT(*) FROM wall_likes l WHERE l.entry_id = e.id) AS like_count,
            CASE WHEN ? IS NULL THEN 0
                 ELSE (SELECT COUNT(*) FROM wall_likes l WHERE l.entry_id = e.id AND l.user_id = ?)
            END AS liked
     FROM wall_entries e WHERE e.id = ? AND e.flagged = 0`
  ).bind(userId, userId, id).first();
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

// POST /api/wall/:id/like — toggle like (requireAuth). Idempotent under double-click:
// INSERT OR IGNORE for first click (creates row), DELETE for second (removes it).
// Returns the post-toggle state so the client can render the correct icon + count
// without an extra GET round-trip.
wall.post('/:id/like', requireAuth(), async (c) => {
  const user = c.var.user;
  const entryId = c.req.param('id');
  const exists = await c.env.DB.prepare(`SELECT 1 AS ok FROM wall_entries WHERE id = ?`).bind(entryId).first();
  if (!exists) return c.json({ error: 'entry not found' }, 404);
  // Check current state to decide INSERT vs DELETE (atomic-enough: D1 is single-writer per row).
  const current = await c.env.DB.prepare(
    `SELECT 1 AS liked FROM wall_likes WHERE entry_id = ? AND user_id = ? LIMIT 1`
  ).bind(entryId, user.id).first();
  if (current) {
    await c.env.DB.prepare(`DELETE FROM wall_likes WHERE entry_id = ? AND user_id = ?`).bind(entryId, user.id).run();
  } else {
    const id = newId();
    await c.env.DB.prepare(
      `INSERT OR IGNORE INTO wall_likes (id, entry_id, user_id) VALUES (?, ?, ?)`
    ).bind(id, entryId, user.id).run();
  }
  // Recount + return fresh state.
  const countRow = await c.env.DB.prepare(
    `SELECT COUNT(*) AS like_count FROM wall_likes WHERE entry_id = ?`
  ).bind(entryId).first() as { like_count: number } | null;
  return c.json({ liked: current ? 0 : 1, like_count: countRow?.like_count ?? 0 });
});

// POST /api/wall/:id/flag — community moderation marker
wall.post('/:id/flag', async (c) => {
  const id = c.req.param('id');
  await c.env.DB.prepare(`UPDATE wall_entries SET flagged = 1 WHERE id = ?`).bind(id).run();
  return c.json({ ok: true });
});
