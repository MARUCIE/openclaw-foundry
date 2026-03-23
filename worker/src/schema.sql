-- OpenClaw Foundry D1 Schema v2 (Developer Arsenal)

-- ═══ Existing tables (preserved) ═══

CREATE TABLE IF NOT EXISTS providers (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  vendor TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('desktop', 'cloud', 'saas', 'mobile', 'remote')),
  tier INTEGER NOT NULL DEFAULT 1 CHECK (tier IN (1, 2, 3)),
  platforms TEXT NOT NULL DEFAULT '[]',
  status TEXT NOT NULL DEFAULT 'stable',
  console_url TEXT DEFAULT '',
  doc_url TEXT DEFAULT '',
  im_channels TEXT DEFAULT '[]',
  description TEXT DEFAULT '',
  install_cmd TEXT DEFAULT '',
  github TEXT DEFAULT '',
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS skills (
  id TEXT PRIMARY KEY,
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
  platforms TEXT DEFAULT '[]',
  official INTEGER DEFAULT 0,
  score INTEGER DEFAULT 0,
  rating TEXT DEFAULT 'C' CHECK (rating IN ('S', 'A', 'B', 'C', 'D')),
  url TEXT DEFAULT '',
  source TEXT DEFAULT 'clawhub',
  source_url TEXT DEFAULT '',
  repository_url TEXT DEFAULT '',
  remote_url TEXT DEFAULT '',
  -- v2 fields: curation layer
  permission_manifest TEXT DEFAULT '{}',
  deploy_success_rate REAL DEFAULT -1,
  deploy_count INTEGER DEFAULT 0,
  last_updated TEXT DEFAULT '',
  stale INTEGER DEFAULT 0,
  synced_at TEXT DEFAULT (datetime('now'))
);

-- ═══ New tables (v2) ═══

-- Deploy feedback: anonymous, no account needed, R1 flywheel core
CREATE TABLE IF NOT EXISTS deploy_feedback (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  skill_id TEXT NOT NULL,
  provider_id TEXT DEFAULT '',
  outcome TEXT NOT NULL CHECK (outcome IN ('success', 'fail', 'not_tried')),
  fingerprint TEXT NOT NULL,
  comment TEXT DEFAULT '',
  created_at TEXT DEFAULT (datetime('now')),
  UNIQUE(skill_id, fingerprint)
);

-- Tenants: lightweight API users
CREATE TABLE IF NOT EXISTS tenants (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT DEFAULT '',
  api_key TEXT NOT NULL UNIQUE,
  tier TEXT NOT NULL DEFAULT 'free' CHECK (tier IN ('free', 'pro', 'partner')),
  active INTEGER DEFAULT 1,
  daily_requests INTEGER DEFAULT 0,
  daily_reset TEXT DEFAULT '',
  created_at TEXT DEFAULT (datetime('now')),
  last_active_at TEXT DEFAULT ''
);

-- Arena results: persisted (replaces memory Map)
CREATE TABLE IF NOT EXISTS arena_results (
  id TEXT PRIMARY KEY,
  provider_ids TEXT NOT NULL DEFAULT '[]',
  blueprint_hash TEXT DEFAULT '',
  test_prompt TEXT DEFAULT '',
  scoring TEXT DEFAULT '{}',
  winner TEXT DEFAULT '',
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'running', 'completed', 'failed')),
  created_at TEXT DEFAULT (datetime('now')),
  completed_at TEXT DEFAULT ''
);

-- Deploy jobs: restructured with tenant association
CREATE TABLE IF NOT EXISTS deploy_jobs (
  id TEXT PRIMARY KEY,
  tenant_id TEXT DEFAULT '',
  provider_id TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  blueprint TEXT DEFAULT '{}',
  logs TEXT DEFAULT '[]',
  created_at TEXT DEFAULT (datetime('now')),
  completed_at TEXT,
  FOREIGN KEY (provider_id) REFERENCES providers(id)
);

-- ═══ Indexes ═══
CREATE INDEX IF NOT EXISTS idx_skills_category ON skills(category);
CREATE INDEX IF NOT EXISTS idx_skills_rating ON skills(rating);
CREATE INDEX IF NOT EXISTS idx_skills_score ON skills(score DESC);
CREATE INDEX IF NOT EXISTS idx_skills_stale ON skills(stale);
CREATE INDEX IF NOT EXISTS idx_feedback_skill ON deploy_feedback(skill_id);
CREATE INDEX IF NOT EXISTS idx_feedback_created ON deploy_feedback(created_at);
CREATE INDEX IF NOT EXISTS idx_tenants_api_key ON tenants(api_key);
CREATE INDEX IF NOT EXISTS idx_arena_created ON arena_results(created_at);
CREATE INDEX IF NOT EXISTS idx_deploy_status ON deploy_jobs(status);
