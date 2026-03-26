# HANDOFF -- OpenClaw Foundry

> Session handoff 2026-03-26. Job Packs v2 DONE + Skill Curation v4 IN PROGRESS.

## What Was Done This Session

### Job Packs v2 (COMPLETE — fully deployed)
- 10 packs across 4 function lines, adapted to real company org
- 4-layer inheritance: L0 finance-tax (all inherit) → L1 line → L2 role
- 2-table data model: pack_layers (15) + config_packs (10)
- generate-packs.mjs: 50 static files from SQL seeds
- Question tree UX: 2-step → 1 recommendation + Tab browse
- Worker API v5, D1 migrated + seeded, CI prebuild hook
- E2E verified: VPS curl install.sh → all 4 files downloaded
- 3 commits: c344510, 4d6d849, 7fa4846

### Skill Curation v4 (Phase 1-2 DONE, Phase 3-5 IN PROGRESS)
- Phase 1 (P0 Dedup): 89 generic names renamed (mcp/mcp-server → description slugs)
- Phase 2 (P0 Ratings): Percentile calibration S:100 A:300 B:800 C:600 D:200
- Phase 4 partial (Icons): 2000 Material Symbol icons assigned
- Phase 3 (Tags): LLM batch running (Gemini Flash, 200 batches)
- Phase 4 partial (Taglines): LLM batch running (S/A ~400 skills)
- Phase 5 (Reclassify): LLM batch running ("Other" → proper categories)
- Planning doc: SKILL_CURATION_V4_PLAN.md + McKinsey Blue HTML

## Key Files

| File | Purpose |
|------|---------|
| `scripts/curate-skills.mjs` | Dedup + rating calibration + icon assignment |
| `scripts/tag-skills-llm.mjs` | LLM batch tagging + taglines + reclassify |
| `scripts/generate-packs.mjs` | Job Pack static file generator |
| `doc/.../SKILL_CURATION_V4_PLAN.md` | Curation upgrade plan (6 phases) |
| `doc/.../SKILL_CURATION_V4_PLAN-zh.html` | McKinsey Blue HTML version |
| `doc/.../JOB_PACKS_ARCHITECTURE-zh.html` | Job Packs architecture doc |
| `worker/src/migration-v5.sql` | 2-table D1 schema |
| `worker/src/seed-layers.sql` | 15 layer content blocks |
| `worker/src/seed-packs-v2.sql` | 10 pack definitions |
| `web/app/packs/page.tsx` | Question tree + tab browse page |

## Git State
- Branch: main
- Latest pushed: 7fa4846
- CI: all green
- LLM batch: running in background (tag-skills-llm.mjs)
