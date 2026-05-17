-- D1 migration v8 (2026-05-17) — email auth wall
-- Adds users + auth_tokens (passwordless magic-link) + sessions (Bearer-token) tables,
-- and one additive user_id column on wall_entries + wall_comments so authenticated writes
-- can be attributed without breaking legacy anonymous entries (FK soft — no destructive change).
--
-- Anonymity model unchanged for reads. For writes: requireAuth() middleware (worker/src/lib/auth.ts)
-- gates POST /api/wall + POST /api/wall/:id/comment; when a row has user_id, it was a verified write;
-- when user_id is NULL, it was anonymous (legacy v7 entries before this migration, or future opt-in
-- anon-write if/when the gate is relaxed for a specific surface).
--
-- Idempotent re-apply: CREATE TABLE IF NOT EXISTS + ALTER TABLE ADD COLUMN guarded via separate
-- statements. The apply-migrations CI job tolerates "duplicate column" / "already exists" errors
-- per ../../.github/workflows/deploy.yml IDEMPOTENT_RE pattern.

CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  email TEXT NOT NULL UNIQUE,
  email_verified_at TEXT NOT NULL DEFAULT (datetime('now')),
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  last_login_at TEXT,
  display_name TEXT
);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);

CREATE TABLE IF NOT EXISTS auth_tokens (
  -- magic-link token, single-use, 15-min TTL
  token_hash TEXT PRIMARY KEY,            -- SHA-256 hex of the random 32-byte token
  email TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  expires_at TEXT NOT NULL,
  consumed_at TEXT,                       -- non-NULL = already used; reject if non-NULL
  request_ip TEXT,                        -- for rate-limit + audit
  request_ua TEXT
);
CREATE INDEX IF NOT EXISTS idx_auth_tokens_email_created ON auth_tokens(email, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_auth_tokens_expires ON auth_tokens(expires_at);

CREATE TABLE IF NOT EXISTS sessions (
  -- Bearer session, 30-day TTL, revocable
  session_token_hash TEXT PRIMARY KEY,    -- SHA-256 hex of the random 32-byte session token
  user_id TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  expires_at TEXT NOT NULL,
  revoked_at TEXT,                        -- non-NULL = revoked (logout); requireAuth rejects
  ua TEXT,
  ip TEXT,
  FOREIGN KEY (user_id) REFERENCES users(id)
);
CREATE INDEX IF NOT EXISTS idx_sessions_user ON sessions(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_sessions_expires ON sessions(expires_at);

-- Additive: attribute future writes to a verified user when present. Legacy rows: NULL.
ALTER TABLE wall_entries ADD COLUMN user_id TEXT REFERENCES users(id);
ALTER TABLE wall_comments ADD COLUMN user_id TEXT REFERENCES users(id);
CREATE INDEX IF NOT EXISTS idx_wall_entries_user ON wall_entries(user_id) WHERE user_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_wall_comments_user ON wall_comments(user_id) WHERE user_id IS NOT NULL;
