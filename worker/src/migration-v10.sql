-- D1 migration v10 (2026-05-18) — short-lived pack download tokens
-- Public browsing stays open, but pack file payloads are delivered only through
-- worker/src/routes/packs.ts after a verified user mints a 15-minute token.

CREATE TABLE IF NOT EXISTS pack_download_tokens (
  token_hash TEXT PRIMARY KEY,
  pack_id TEXT NOT NULL,
  user_id TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  expires_at TEXT NOT NULL,
  last_used_at TEXT,
  FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE INDEX IF NOT EXISTS idx_pack_download_tokens_pack ON pack_download_tokens(pack_id, expires_at);
CREATE INDEX IF NOT EXISTS idx_pack_download_tokens_user ON pack_download_tokens(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_pack_download_tokens_expires ON pack_download_tokens(expires_at);
