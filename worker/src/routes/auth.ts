// Auth routes — passwordless magic-link flow.
//
// POST /api/auth/request   body: {email}             → 200 {sent: true, delivered_via}
// GET  /api/auth/consume   ?token=<plaintext>         → 200 {bearer_token, user} | 400/410
// GET  /api/auth/me        Authorization: Bearer <t>  → 200 {user} | 401
// POST /api/auth/logout    Authorization: Bearer <t>  → 200 {revoked: true} | 401
//
// Magic-link URL points at the Pages domain (not the Worker), e.g.
// https://agent-foundry.pages.dev/auth/callback?token=<plaintext>
// The Pages page reads the token and POSTs to /api/auth/consume itself, which avoids
// the cross-domain cookie problem (CF Pages + CF Worker are different subdomains).

import { Hono } from 'hono';
import { sendMagicLink } from '../lib/email';
import { sha256Hex, randomToken, resolveSessionUser, extractBearer, type AuthedUser } from '../lib/auth';

interface Env {
  DB: D1Database;
  RESEND_API_KEY?: string;
  MAGIC_LINK_BASE_URL?: string;   // defaults to https://agent-foundry.pages.dev
  RESEND_FROM?: string;            // defaults to onboarding@resend.dev
}

const MAGIC_LINK_TTL_MIN = 15;
const SESSION_TTL_DAYS = 30;
const RATE_LIMIT_WINDOW_MIN = 1;
const RATE_LIMIT_MAX = 3;          // max 3 magic-link requests per email per minute

const EMAIL_RX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const auth = new Hono<{ Bindings: Env; Variables: { user: AuthedUser } }>();

// POST /api/auth/request — accept email, mint single-use token, mail (or log) the magic link.
auth.post('/request', async (c) => {
  let body: { email?: string };
  try {
    body = await c.req.json();
  } catch {
    return c.json({ error: 'invalid JSON body' }, 400);
  }
  const email = (body.email || '').trim().toLowerCase();
  if (!email || !EMAIL_RX.test(email) || email.length > 254) {
    return c.json({ error: 'valid email required' }, 400);
  }

  // Rate-limit: max 3 in last 1 minute for this email
  const recent = await c.env.DB.prepare(
    `SELECT COUNT(*) as n FROM auth_tokens WHERE email = ? AND created_at > datetime('now', '-${RATE_LIMIT_WINDOW_MIN} minutes')`,
  ).bind(email).first<{ n: number }>();
  if (recent && recent.n >= RATE_LIMIT_MAX) {
    return c.json({ error: `太多请求，请稍后再试（${RATE_LIMIT_WINDOW_MIN} 分钟内最多 ${RATE_LIMIT_MAX} 次）` }, 429);
  }

  const plaintext = randomToken();
  const hash = await sha256Hex(plaintext);
  const expiresAt = new Date(Date.now() + MAGIC_LINK_TTL_MIN * 60_000).toISOString();
  const ip = c.req.header('CF-Connecting-IP') || c.req.header('X-Forwarded-For') || null;
  const ua = c.req.header('User-Agent') || null;

  await c.env.DB.prepare(
    `INSERT INTO auth_tokens (token_hash, email, expires_at, request_ip, request_ua)
     VALUES (?, ?, ?, ?, ?)`,
  ).bind(hash, email, expiresAt, ip, ua).run();

  const base = c.env.MAGIC_LINK_BASE_URL || 'https://agent-foundry.pages.dev';
  const link = `${base.replace(/\/$/, '')}/auth/callback?token=${encodeURIComponent(plaintext)}`;

  const result = await sendMagicLink({
    to: email,
    link,
    expires_minutes: MAGIC_LINK_TTL_MIN,
    apiKey: c.env.RESEND_API_KEY,
    fromOverride: c.env.RESEND_FROM,
  });

  if (!result.ok) {
    // Surface delivery failure but don't reveal whether the email exists in users table.
    return c.json({ error: '邮件发送暂时失败，请稍后重试' }, 502);
  }

  return c.json({
    sent: true,
    delivered_via: result.delivered_via,
    expires_minutes: MAGIC_LINK_TTL_MIN,
  });
});

// GET /api/auth/consume?token=<plaintext> — verify magic-link, upsert user, mint Bearer session.
auth.get('/consume', async (c) => {
  const plaintext = c.req.query('token');
  if (!plaintext) {
    return c.json({ error: 'token required' }, 400);
  }
  const hash = await sha256Hex(plaintext);

  // Atomically: select fresh+unused, mark consumed.
  const tokenRow = await c.env.DB.prepare(
    `SELECT email, expires_at, consumed_at FROM auth_tokens WHERE token_hash = ? LIMIT 1`,
  ).bind(hash).first<{ email: string; expires_at: string; consumed_at: string | null }>();

  if (!tokenRow) {
    return c.json({ error: '链接无效或已被使用' }, 400);
  }
  if (tokenRow.consumed_at) {
    return c.json({ error: '链接已被使用，请重新申请' }, 410);
  }
  if (new Date(tokenRow.expires_at) < new Date()) {
    return c.json({ error: '链接已过期，请重新申请' }, 410);
  }

  // Mark consumed BEFORE issuing session so double-consume can't race.
  const consumeRes = await c.env.DB.prepare(
    `UPDATE auth_tokens SET consumed_at = datetime('now') WHERE token_hash = ? AND consumed_at IS NULL`,
  ).bind(hash).run();
  if (!consumeRes.meta || consumeRes.meta.changes === 0) {
    // Lost the race
    return c.json({ error: '链接已被使用，请重新申请' }, 410);
  }

  // Upsert user — email is the unique key, verified-at is set on first verify.
  const email = tokenRow.email;
  let user = await c.env.DB.prepare(
    `SELECT id, email, email_verified_at, display_name FROM users WHERE email = ? LIMIT 1`,
  ).bind(email).first<AuthedUser>();

  if (!user) {
    const newUserId = crypto.randomUUID();
    await c.env.DB.prepare(
      `INSERT INTO users (id, email, last_login_at) VALUES (?, ?, datetime('now'))`,
    ).bind(newUserId, email).run();
    user = { id: newUserId, email, email_verified_at: new Date().toISOString(), display_name: null };
  } else {
    await c.env.DB.prepare(
      `UPDATE users SET last_login_at = datetime('now') WHERE id = ?`,
    ).bind(user.id).run();
  }

  // Mint Bearer session
  const sessionPlaintext = randomToken();
  const sessionHash = await sha256Hex(sessionPlaintext);
  const sessionExpiresAt = new Date(Date.now() + SESSION_TTL_DAYS * 86_400_000).toISOString();
  const ip = c.req.header('CF-Connecting-IP') || c.req.header('X-Forwarded-For') || null;
  const ua = c.req.header('User-Agent') || null;
  await c.env.DB.prepare(
    `INSERT INTO sessions (session_token_hash, user_id, expires_at, ua, ip) VALUES (?, ?, ?, ?, ?)`,
  ).bind(sessionHash, user.id, sessionExpiresAt, ua, ip).run();

  return c.json({
    bearer_token: sessionPlaintext,
    expires_at: sessionExpiresAt,
    user: {
      id: user.id,
      email: user.email,
      display_name: user.display_name,
      email_verified_at: user.email_verified_at,
    },
  });
});

// GET /api/auth/me — return current user from Bearer
auth.get('/me', async (c) => {
  const bearer = extractBearer(c.req.header('Authorization'));
  const user = await resolveSessionUser(c.env.DB, bearer);
  if (!user) {
    return c.json({ error: 'not signed in' }, 401);
  }
  return c.json({ user });
});

// POST /api/auth/logout — revoke current session
auth.post('/logout', async (c) => {
  const bearer = extractBearer(c.req.header('Authorization'));
  if (!bearer) {
    return c.json({ error: 'Authorization Bearer token required' }, 401);
  }
  const hash = await sha256Hex(bearer);
  await c.env.DB.prepare(
    `UPDATE sessions SET revoked_at = datetime('now') WHERE session_token_hash = ? AND revoked_at IS NULL`,
  ).bind(hash).run();
  return c.json({ revoked: true });
});
