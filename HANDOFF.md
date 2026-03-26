# HANDOFF -- OpenClaw Foundry

> Session 2026-03-26. Job Packs v2 DONE + Skill Curation v4 DONE + Pipeline Automation DONE.

## Commits This Session (10)

| # | Hash | Summary |
|---|------|---------|
| 1 | c344510 | Job Packs v2: 10 packs, 4 lines, 50 static files |
| 2 | 4d6d849 | Full closure: API v5, D1 migrated, combos removed, CI prebuild |
| 3 | 7fa4846 | Skill Curation P0: dedup + bell-curve ratings + 2000 icons |
| 4 | d5fb846 | Skill Curation P1-5: 2000 tags + 400 taglines + 0% Other |
| 5 | 9e7c11b | Pipeline automation: CI curation + incremental LLM + git commit |
| 6 | 098e32e | Timestamp cleanup |
| 7 | ad29744 | CI timeout: 25 → 45 min for LLM enrichment |
| 8 | 45e29da | Carry-forward fix: restore tags from git HEAD, avoid LLM full retag |
| 9 | be0ddf8 | seed-db: add npm ci for pinned wrangler |
| 10 | (CI) | sync-data auto-commit: curated skills data |

## What Was Built

### 1. Job Packs v2 (COMPLETE)
- 10 packs across 4 function lines (Engineering 5 / Data&AI 2 / Product 2 / Business 1)
- 4-layer inheritance: L0 finance-tax (all inherit) → L1 line → L2 role → L3 project (optional)
- 2-table D1 model: pack_layers (15) + config_packs (10)
- Question tree UX: 2-step → 1 recommendation + Tab browse
- E2E verified: VPS curl install.sh → 4 files installed

### 2. Skill Curation v4 (COMPLETE)
- Phase 1 (Dedup): 89 generic names renamed, 0 same-author duplicates
- Phase 2 (Ratings): Percentile bell-curve S:100 A:300 B:800 C:600 D:200
- Phase 3 (Tags): 2000/2000 tagged (tech_stack + scenario + platform), Gemini Flash
- Phase 4 (Editorial): 400 S/A taglines + 2000 Material Symbol icons
- Phase 5 (Reclassify): 61 "Other" → 0 (0.0%)

### 3. Pipeline Automation (COMPLETE)
- CI sync-data: scrape → merge → prebuild → curate → LLM enrich → seed SQL → git commit
- Carry-forward: Phase 0 restores tags/taglines from git HEAD, LLM only processes new skills
- Incremental LLM: tag-skills-llm.mjs skips already-tagged skills
- Graceful degradation: no API key = skip LLM (doesn't block pipeline)
- GOOGLE_API_KEY secret added to GitHub Actions

## Known Issue: seed-db D1 Permission

**Status**: CF API Token (CLOUDFLARE_API_TOKEN) lacks D1 query permission.
**Impact**: LOW — frontend uses static JSON, Worker API uses manual seed data (37310 skills).
**Fix**: Create new API token in CF Dashboard with D1 Edit permission, then:
```bash
gh secret set CLOUDFLARE_API_TOKEN
# paste new token value
```

## Key Files

| File | Purpose |
|------|---------|
| scripts/curate-skills.mjs | Dedup + rating + icons + carry-forward (Phase 0-2, 4) |
| scripts/tag-skills-llm.mjs | LLM tags + taglines + reclassify (Phase 3-5, incremental) |
| scripts/generate-packs.mjs | Job Pack static file generator (50 files) |
| scripts/generate-seed-sql.mjs | Curated data → D1 seed SQL (with tags/tagline columns) |
| .github/workflows/deploy.yml | Full pipeline DAG documented at top |
| doc/.../SKILL_CURATION_V4_PLAN.md | Curation upgrade plan (6 phases) |
| doc/.../SKILL_CURATION_V4_PLAN-zh.html | McKinsey Blue HTML version |
| doc/.../JOB_PACKS_ARCHITECTURE-zh.html | Job Packs architecture doc |

## Pipeline DAG

```
Daily sync (cron 06:00 UTC):
  scrape-clawhub-api.mjs → data/clawhub-skills-raw.json
  scrape-mcp-registry.mjs → data/mcp-registry-servers.json
  merge-all-sources.mjs → data/unified-index.json
  prebuild-static.mjs → web/public/data/skills.json (raw)
  curate-skills.mjs → skills.json (carry-forward + dedup + rating + icons)
  tag-skills-llm.mjs → skills.json (+ tags + taglines + reclassify) [incremental]
  generate-seed-sql.mjs → worker/src/seed.sql (from curated data)
  git commit → persist curated data

Push to main:
  generate-packs.mjs (npm prebuild) → web/public/packs/ (50 files)
  next build → web/out/ (static export)
  wrangler pages deploy → CF Pages
  wrangler deploy → CF Worker
```

## Git State
- Branch: main
- Latest: be0ddf8
- CI: sync-data/deploy-frontend/deploy-worker GREEN, seed-db KNOWN ISSUE
- Production: openclaw-foundry.pages.dev LIVE
