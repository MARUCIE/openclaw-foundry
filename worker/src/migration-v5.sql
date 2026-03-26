-- Migration v5: Job Packs 2-table model (pack_layers + config_packs)
-- Replaces v4 single-table model. Enables layer inheritance and content reuse.

-- Drop v4 table (flat single-table model, no longer needed)
DROP TABLE IF EXISTS config_packs;

-- Table 1: pack_layers — immutable content blocks
-- 15 rows: 1 universal + 4 line + 10 role
CREATE TABLE IF NOT EXISTS pack_layers (
  id                  TEXT PRIMARY KEY,
  type                TEXT NOT NULL CHECK (type IN ('universal', 'line', 'role')),
  name                TEXT NOT NULL,
  name_zh             TEXT NOT NULL,
  content_claude_md   TEXT DEFAULT '',
  content_agents_md   TEXT DEFAULT '',
  content_settings    TEXT DEFAULT '{}',
  content_prompts_md  TEXT DEFAULT '',
  sort_order          INTEGER DEFAULT 0,
  created_at          TEXT DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_layers_type ON pack_layers(type);

-- Table 2: config_packs — composition references + display metadata
-- 10 rows, each referencing 3 layer IDs via JSON array
CREATE TABLE IF NOT EXISTS config_packs (
  id              TEXT PRIMARY KEY,
  name            TEXT NOT NULL,
  name_zh         TEXT NOT NULL,
  description     TEXT DEFAULT '',
  description_zh  TEXT DEFAULT '',
  icon            TEXT DEFAULT 'person',
  color           TEXT DEFAULT '#003ea8',
  line            TEXT NOT NULL,
  line_zh         TEXT NOT NULL,
  layer_ids       TEXT NOT NULL DEFAULT '[]',
  version         TEXT DEFAULT '1.0',
  download_count  INTEGER DEFAULT 0,
  created_at      TEXT DEFAULT (datetime('now')),
  updated_at      TEXT DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_packs_line ON config_packs(line);
CREATE INDEX IF NOT EXISTS idx_packs_downloads ON config_packs(download_count DESC);
