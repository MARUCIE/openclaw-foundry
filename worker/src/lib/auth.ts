// Auth middleware + helpers for Bearer-token session validation.
// Pairs with worker/src/migration-v8.sql (sessions table) and worker/src/routes/auth.ts
// (which issues sessions via passwordless magic-link).

import type { MiddlewareHandler } from 'hono';

export interface AuthedUser {
  id: string;
  email: string;
  email_verified_at: string;
  display_name: string | null;
}

export interface AuthEnv {
  DB: D1Database;
}

// SHA-256 hex helper — used for both auth_tokens.token_hash and sessions.session_token_hash.
// The plaintext token is never stored; only its hash. The plaintext lives in the magic-link URL
// (one-shot) and in the client's localStorage after consume (Bearer).
export async function sha256Hex(input: string): Promise<string> {
  const data = new TextEncoder().encode(input);
  const hash = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(hash))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

// 32-byte random token, base64url-encoded → URL-safe + 43 chars.
export function randomToken(): string {
  const bytes = new Uint8Array(32);
  crypto.getRandomValues(bytes);
  // base64url: no padding, +/ → -_
  return btoa(String.fromCharCode(...bytes))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/g, '');
}

// Extract Bearer from Authorization header; returns null if missing/malformed.
export function extractBearer(authHeader: string | null | undefined): string | null {
  if (!authHeader) return null;
  const match = authHeader.match(/^Bearer\s+(.+)$/i);
  return match ? match[1].trim() : null;
}

// Resolve a Bearer plaintext to the authed user by hashing + querying sessions JOIN users.
// Returns null when: missing header, expired session, revoked session, or session not found.
export async function resolveSessionUser(
  db: D1Database,
  bearerPlaintext: string | null,
): Promise<AuthedUser | null> {
  if (!bearerPlaintext) return null;
  const hash = await sha256Hex(bearerPlaintext);
  const row = await db
    .prepare(
      `SELECT u.id, u.email, u.email_verified_at, u.display_name
       FROM sessions s
       JOIN users u ON u.id = s.user_id
       WHERE s.session_token_hash = ?
         AND s.revoked_at IS NULL
         AND s.expires_at > datetime('now')
       LIMIT 1`,
    )
    .bind(hash)
    .first<AuthedUser>();
  return row || null;
}

// Hono middleware factory — gates routes behind a valid session.
// Sets `c.var.user` for downstream handlers. Returns 401 on failure.
export function requireAuth(): MiddlewareHandler<{ Bindings: AuthEnv; Variables: { user: AuthedUser } }> {
  return async (c, next) => {
    const bearer = extractBearer(c.req.header('Authorization'));
    if (!bearer) {
      return c.json({ error: 'Authorization Bearer token required' }, 401);
    }
    const user = await resolveSessionUser(c.env.DB, bearer);
    if (!user) {
      return c.json({ error: 'invalid or expired session — sign in again' }, 401);
    }
    c.set('user', user);
    await next();
  };
}
