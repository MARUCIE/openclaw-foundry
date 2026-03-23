-- OpenClaw Foundry D1 Schema

CREATE TABLE IF NOT EXISTS providers (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  vendor TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('desktop', 'cloud', 'saas', 'mobile', 'remote')),
  tier INTEGER NOT NULL DEFAULT 1 CHECK (tier IN (1, 2, 3)),
  platforms TEXT NOT NULL DEFAULT '[]', -- JSON array
  status TEXT NOT NULL DEFAULT 'stable',
  console_url TEXT DEFAULT '',
  doc_url TEXT DEFAULT '',
  im_channels TEXT DEFAULT '[]', -- JSON array
  description TEXT DEFAULT '',
  install_cmd TEXT DEFAULT '',
  github TEXT DEFAULT '',
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS skills (
  id TEXT PRIMARY KEY, -- author/slug
  name TEXT NOT NULL,
  slug TEXT NOT NULL,
  author TEXT NOT NULL,
  description TEXT DEFAULT '',
  category TEXT DEFAULT '',
  icon TEXT DEFAULT 'widgets',
  downloads INTEGER DEFAULT 0,
  downloads_display TEXT DEFAULT '',
  stars INTEGER DEFAULT 0,
  stars_display TEXT DEFAULT '',
  versions INTEGER DEFAULT 0,
  platforms TEXT DEFAULT '[]', -- JSON array
  official INTEGER DEFAULT 0,
  score INTEGER DEFAULT 0,
  rating TEXT DEFAULT 'C' CHECK (rating IN ('S', 'A', 'B', 'C', 'D')),
  url TEXT DEFAULT '',
  synced_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS deploy_jobs (
  id TEXT PRIMARY KEY,
  provider_id TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  blueprint TEXT DEFAULT '{}', -- JSON
  logs TEXT DEFAULT '[]', -- JSON array
  created_at TEXT DEFAULT (datetime('now')),
  completed_at TEXT,
  FOREIGN KEY (provider_id) REFERENCES providers(id)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_skills_category ON skills(category);
CREATE INDEX IF NOT EXISTS idx_skills_rating ON skills(rating);
CREATE INDEX IF NOT EXISTS idx_skills_score ON skills(score DESC);
CREATE INDEX IF NOT EXISTS idx_deploy_status ON deploy_jobs(status);
