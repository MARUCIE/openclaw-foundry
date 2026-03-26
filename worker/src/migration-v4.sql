-- Migration v4: ConfigPacks — role-based one-click configuration bundles
-- Pure value table: immutable snapshots of curated configurations

CREATE TABLE IF NOT EXISTS config_packs (
  id TEXT PRIMARY KEY,
  role TEXT NOT NULL,
  role_zh TEXT NOT NULL,
  description TEXT DEFAULT '',
  description_zh TEXT DEFAULT '',
  icon TEXT DEFAULT 'person',
  color TEXT DEFAULT '#003ea8',
  claude_md TEXT DEFAULT '',
  agents_md TEXT DEFAULT '',
  mcp_servers TEXT DEFAULT '[]',
  skill_ids TEXT DEFAULT '[]',
  prompts TEXT DEFAULT '[]',
  version TEXT DEFAULT '1.0',
  download_count INTEGER DEFAULT 0,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_packs_role ON config_packs(role);
CREATE INDEX IF NOT EXISTS idx_packs_downloads ON config_packs(download_count DESC);
