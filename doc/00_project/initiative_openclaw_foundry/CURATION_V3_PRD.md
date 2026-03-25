# OpenClaw Foundry -- Curation System v3 PRD

> From tool directory to curated marketplace. 7 features that transform OpenClaw from "skill listing" into "developer arsenal curation platform."

**Version**: 3.0 | **Date**: 2026-03-25 | **Source**: 5-agent swarm brainstorm synthesis

---

## Executive Summary

**Core recommendation**: Add 2 new tables + 1 ALTER + 1 cron recalculation to transform ranking from "third-party scraper score" to "real deployment quality score", while launching Combo Recipes and Battle Record testimonials as differentiation weapons.

| Metric | Current | Target |
|--------|---------|--------|
| Skills indexed | 249 | 249+ (same data, better surfacing) |
| Deploy rate available | 0% (all -1) | 100% composite scoring |
| New tables | 0 | 2 (skill_events + collections) |
| Competitor gap | None | Combo recipes (unique in market) |

---

## Data Model (migration-v3.sql)

### Design Principles (Hickey simplicity)

1. **Unified event stream**: One `skill_events` table replaces N separate tables
2. **Cron materialization**: Write path decoupled from computation path
3. **Content in R2**: README/screenshots stored in R2, not D1

### New Tables

```sql
-- Unified event stream
CREATE TABLE skill_events (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  skill_id TEXT NOT NULL,
  event_type TEXT NOT NULL CHECK (event_type IN (
    'deploy_ok','deploy_fail','review_up','review_down','install','view'
  )),
  fingerprint TEXT NOT NULL,
  tenant_id TEXT DEFAULT '',
  payload TEXT DEFAULT '{}',
  weight REAL DEFAULT 1.0,
  created_at TEXT DEFAULT (datetime('now')),
  UNIQUE(skill_id, event_type, fingerprint)
);

-- Curated collections (flat table, JSON skill_ids)
CREATE TABLE collections (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  tagline TEXT DEFAULT '',
  description TEXT DEFAULT '',
  skill_ids TEXT NOT NULL DEFAULT '[]',
  curator TEXT NOT NULL,
  cover_type TEXT DEFAULT 'auto',
  featured INTEGER DEFAULT 0,
  install_count INTEGER DEFAULT 0,
  created_at TEXT DEFAULT (datetime('now'))
);

-- Skills table extensions (derived, cron-recalculated)
ALTER TABLE skills ADD COLUMN editorial_tagline TEXT DEFAULT '';
ALTER TABLE skills ADD COLUMN trending_score REAL DEFAULT 0.0;
ALTER TABLE skills ADD COLUMN composite_score REAL DEFAULT 0.0;
ALTER TABLE skills ADD COLUMN review_up INTEGER DEFAULT 0;
ALTER TABLE skills ADD COLUMN review_down INTEGER DEFAULT 0;
ALTER TABLE skills ADD COLUMN stale_penalty REAL DEFAULT 0.0;
```

---

## Composite Score Formula

```
composite_score =
    score * 0.35                           -- third-party signal
  + deploy_success_rate * 100 * 0.30       -- deployment quality
  + (review_up - review_down) * 5 * 0.20   -- community sentiment
  + trending_score * 0.10                  -- 7-day momentum
  + (1 - stale_penalty) * 10 * 0.05        -- freshness
```

---

## 7 Features by Priority

| P | Feature | Complexity | Impact |
|---|---------|-----------|--------|
| P0 | composite_score replaces score sorting | Minimal | Critical |
| P0 | skill_events unified event table | Small | Foundation |
| P0 | B1 anti-spam weight decay | Small | Safety |
| P1 | Combo recipes + collections table | Medium | Differentiation |
| P1 | Skill detail page (7-zone layout) | Medium | Experience |
| P1 | Battle Record testimonials | Medium | Trust |
| P2 | Trending hot list + time decay | Small | Growth |

---

## Feedback Loops

### Reinforcing (R)
- **R1**: Quality-exposure loop (P0 fix: connect deploy_success_rate to ranking)
- **R2**: Combo amplification loop (P1: collections drive co-install events)
- **R3**: Author incentive loop (P2: auto-notify repo owners via GitHub Issue)

### Balancing (B)
- **B1**: Anti-spam (P0: weight decay for anomalous fingerprints)
- **B2**: Stale penalty (P0: continuous decay replacing boolean flag)
- **B3**: Rating inflation control (P2: per-category percentile capping)

---

## Combo Recommendation Engine (3 layers)

1. **L1 SQL co-occurrence** (immediate, zero new tables): `JOIN skill_events ON fingerprint`
2. **L2 Manual curation** (cold start): `collections.featured = 1`, highest display weight
3. **L3 Semantic similarity** (fallback): Fleet Semantic Fabric embed-index.db

---

## Skill Detail Page (7 zones)

1. Hero: name + editorial_tagline + best screenshot
2. Scenarios: "What you can do" -- 3 scenario bullets
3. Combo: "Works great with" -- horizontal cards
4. Testimonials: Battle Records (max 3)
5. Install: Sticky multi-platform command
6. Permissions: Human-readable manifest
7. Activity: 30-day sparkline + last update

---

## Implementation Roadmap

- **Phase 0** (1 session): migration + cron + anti-spam + composite_score
- **Phase 1** (2-3 sessions): detail page + combos + testimonials + R2 content
- **Phase 2** (iterative): trending, radar chart, author notifications, search revamp

---

## Risk Mitigations

| Risk | Mitigation |
|------|-----------|
| Goodhart effect on composite_score | B1 anti-spam must ship with R1 |
| Cold start empty pages | Seed 5-8 hand-curated collections + manually deploy top 20 skills |
| editorial_tagline maintenance cost | Only top 50 manual, rest auto-truncate description |

---

## Competitive Positioning

Combo recipes + Battle Record testimonials + signed curator collections = unique combination in all AI skill marketplaces. Core moat is content accumulation, not technology.

---

Maurice | maurice_wen@proton.me
