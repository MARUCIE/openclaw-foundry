-- D1 migration v7 (2026-05-16)
-- Adds wall_entries + wall_comments tables for /wall feature (Before/After workflow stickwall).
-- Anonymous model: anon_uid_hash = SHA256(localStorage_uuid + WALL_PEPPER env var), stored as hex.
-- Deletes: not supported in v7 (out of scope per design-brief.md "v2 features deferred").

CREATE TABLE IF NOT EXISTS wall_entries (
  id TEXT PRIMARY KEY,
  anon_uid_hash TEXT NOT NULL,
  role_slug TEXT,
  before_state TEXT NOT NULL,
  after_method TEXT NOT NULL,
  suggestion TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  flagged INTEGER NOT NULL DEFAULT 0
);
CREATE INDEX IF NOT EXISTS idx_wall_entries_created ON wall_entries(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_wall_entries_role ON wall_entries(role_slug);

CREATE TABLE IF NOT EXISTS wall_comments (
  id TEXT PRIMARY KEY,
  entry_id TEXT NOT NULL,
  anon_uid_hash TEXT NOT NULL,
  body TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  flagged INTEGER NOT NULL DEFAULT 0,
  FOREIGN KEY (entry_id) REFERENCES wall_entries(id)
);
CREATE INDEX IF NOT EXISTS idx_wall_comments_entry ON wall_comments(entry_id, created_at);
