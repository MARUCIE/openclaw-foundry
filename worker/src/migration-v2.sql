-- Migration: v1 -> v2 (Developer Arsenal)
-- Run: cd worker && npx wrangler d1 execute openclaw-foundry --file=src/migration-v2.sql

-- New columns on skills table
ALTER TABLE skills ADD COLUMN permission_manifest TEXT DEFAULT '{}';
ALTER TABLE skills ADD COLUMN deploy_success_rate REAL DEFAULT -1;
ALTER TABLE skills ADD COLUMN deploy_count INTEGER DEFAULT 0;
ALTER TABLE skills ADD COLUMN last_updated TEXT DEFAULT '';
ALTER TABLE skills ADD COLUMN stale INTEGER DEFAULT 0;

-- Deploy feedback (R1 flywheel core)
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

-- Tenants (API users)
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

-- Arena results (persisted, replaces memory Map)
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

-- Add tenant_id to deploy_jobs if not exists
-- (SQLite doesn't support ADD COLUMN IF NOT EXISTS, so we catch errors)

-- New indexes
CREATE INDEX IF NOT EXISTS idx_skills_stale ON skills(stale);
CREATE INDEX IF NOT EXISTS idx_feedback_skill ON deploy_feedback(skill_id);
CREATE INDEX IF NOT EXISTS idx_feedback_created ON deploy_feedback(created_at);
CREATE INDEX IF NOT EXISTS idx_tenants_api_key ON tenants(api_key);
CREATE INDEX IF NOT EXISTS idx_arena_created ON arena_results(created_at);
