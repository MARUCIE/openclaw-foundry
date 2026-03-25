-- Migration: v2 -> v3 (Curation System)
-- Run: cd worker && npx wrangler d1 execute openclaw-foundry --file=src/migration-v3.sql
--
-- Based on: CURATION_V3_PRD.md (5-agent swarm synthesis)
-- Principles: unified event stream (Hickey), cron materialization (Meadows), flat collections

-- ═══ New Table 1: Unified Event Stream ═══
-- Replaces scattered feedback tables with a single append-only fact log.
-- All user behaviors (deploy, review, view, install) share the same structure.
CREATE TABLE IF NOT EXISTS skill_events (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  skill_id TEXT NOT NULL,
  event_type TEXT NOT NULL CHECK (event_type IN (
    'deploy_ok', 'deploy_fail',
    'review_up', 'review_down',
    'install', 'view'
  )),
  fingerprint TEXT NOT NULL,
  tenant_id TEXT DEFAULT '',
  payload TEXT DEFAULT '{}',
  weight REAL DEFAULT 1.0,
  created_at TEXT DEFAULT (datetime('now')),
  UNIQUE(skill_id, event_type, fingerprint)
);

CREATE INDEX IF NOT EXISTS idx_events_skill ON skill_events(skill_id);
CREATE INDEX IF NOT EXISTS idx_events_type ON skill_events(event_type);
CREATE INDEX IF NOT EXISTS idx_events_created ON skill_events(created_at);

-- ═══ New Table 2: Curated Collections (flat, JSON skill_ids) ═══
-- One table, no join tables. skill_ids is a JSON array.
-- Collections are editorially curated (curator field = human name).
CREATE TABLE IF NOT EXISTS collections (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  tagline TEXT DEFAULT '',
  description TEXT DEFAULT '',
  skill_ids TEXT NOT NULL DEFAULT '[]',
  curator TEXT NOT NULL DEFAULT 'Maurice',
  cover_type TEXT DEFAULT 'auto',
  featured INTEGER DEFAULT 0,
  install_count INTEGER DEFAULT 0,
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_collections_featured
  ON collections(featured DESC, install_count DESC);

-- ═══ Skills Table Extensions (derived fields, cron-recalculated) ═══
ALTER TABLE skills ADD COLUMN editorial_tagline TEXT DEFAULT '';
ALTER TABLE skills ADD COLUMN trending_score REAL DEFAULT 0.0;
ALTER TABLE skills ADD COLUMN composite_score REAL DEFAULT 0.0;
ALTER TABLE skills ADD COLUMN review_up INTEGER DEFAULT 0;
ALTER TABLE skills ADD COLUMN review_down INTEGER DEFAULT 0;
ALTER TABLE skills ADD COLUMN stale_penalty REAL DEFAULT 0.0;

-- Index for the new sort field
CREATE INDEX IF NOT EXISTS idx_skills_composite ON skills(composite_score DESC);
