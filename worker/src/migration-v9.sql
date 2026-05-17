-- D1 migration v9 (2026-05-17) — wall_likes table for 卡点墙 like/点赞 toggle
-- Adds a dedicated likes table keyed by (entry_id, user_id). Toggle is implemented
-- at the route layer via INSERT OR IGNORE / DELETE so the endpoint stays idempotent
-- under double-click. Counts are derived via COUNT(*) subquery (same shape as the
-- existing comment_count in routes/wall.ts:65-66) — no denormalized like_count on
-- wall_entries to avoid write-time race conditions.
--
-- Likes require a verified user (requireAuth() on POST /:id/like) — anonymous
-- visitors can READ counts and rankings but cannot reaction-spam. This matches
-- the v8 write-gate policy on entries + comments.
--
-- WALL_PEPPER is NOT used here: likes are not anonymized — the user_id is the
-- subject, and "(you liked it)" status requires the exact user_id. There is no
-- public anon_uid_hash exposure surface for likes.
--
-- Idempotent re-apply: CREATE TABLE IF NOT EXISTS + UNIQUE INDEX IF NOT EXISTS.

CREATE TABLE IF NOT EXISTS wall_likes (
  id TEXT PRIMARY KEY,
  entry_id TEXT NOT NULL,
  user_id TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (entry_id) REFERENCES wall_entries(id),
  FOREIGN KEY (user_id) REFERENCES users(id),
  UNIQUE(entry_id, user_id)
);
CREATE INDEX IF NOT EXISTS idx_wall_likes_entry ON wall_likes(entry_id);
CREATE INDEX IF NOT EXISTS idx_wall_likes_user ON wall_likes(user_id, created_at DESC);
