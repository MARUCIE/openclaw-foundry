# HANDOFF -- OpenClaw Foundry

> Refreshed 2026-07-16 (previous snapshot 2026-03-26 was stale). Job Packs v2 + Skill Curation v4 + Pipeline Automation remain DONE; this refresh adds the role-pack waves, the UI-Skills Designer route, and the PM-2026-05-31 auth payload boundary release.

## Git State

- Branch: main
- Latest pushed: `5973201 Harden Job Pack auth payload boundary` (origin/main in sync)
- Deploy: run `29474644027` triggered by that push (Worker + D1 + R2 + Pages); verification evidence in `doc/00_project/initiative_openclaw_foundry/task_plan.md` §2026-07-16
- Production: agent-foundry.pages.dev LIVE

## Recent Work (2026-05 → 2026-07)

### Auth Payload Boundary (PM-2026-05-31, released 2026-07-16)
- One explicit boundary contract instead of adjacent behaviors: public pack detail is metadata-only; protected payload access is the only path to configuration bodies; generated `install.sh` never serializes browser sessions (short-lived D1 download tokens instead); auth return destinations pass `safeReturnPath`.
- Executable invariants: `tests/auth-boundary.test.ts` + `scripts/audit-auth-surfaces.sh` (37 checks). Strict postmortem scanner (`scripts/scan-postmortems.mjs --strict`) wired into root build, web prebuild, and CI (checkout uses `fetch-depth: 0`).
- Release gate rule: any change touching pack detail responses, protected file routes, install command generation, login callback returns, WeChat OAuth state, or download tokens must run the boundary test + audit before release. See `postmortem/PM-2026-05-31-auth-payload-boundary.md`.

### Role Packs + UI Skills
- Designer pack routes UI work through UI Skills (`web/public/packs/designer/skills/design/ui-skills-directory/SPEC.md`); 26 per-pack archives build via `npm run role-packs:package:all`.
- Production install path: pinned GitHub tag install after registration (product contract); open email magic-link self-registration remains the acquisition contract.

### Earlier (2026-03-26 snapshot, still valid)
- Job Packs v2: 10 packs, 4-layer inheritance (L0 finance-tax → L1 line → L2 role → L3 project), D1 `pack_layers`(15) + `config_packs`(10).
- Skill Curation v4: 2000 skills curated (dedup, bell-curve ratings S:100/A:300/B:800/C:600/D:200, tags, taglines, icons, 0% Other).
- Pipeline automation: daily CI sync with carry-forward + incremental LLM enrichment.

## Known Issue: seed-db D1 Permission

**Status**: CF API Token (`CLOUDFLARE_API_TOKEN`) lacks D1 query permission.
**Impact**: LOW — frontend uses static JSON, Worker API uses manual seed data (37310 skills).
**Fix**: Create new API token in CF Dashboard with D1 Edit permission, then:
```bash
gh secret set CLOUDFLARE_API_TOKEN
# paste new token value
```

## Key Files

| File | Purpose |
|------|---------|
| worker/src/routes/packs.ts | Metadata-only public detail; session vs download-token file access |
| web/lib/session.ts | `safeReturnPath` return-destination sanitizer |
| scripts/audit-auth-surfaces.sh | Auth boundary audit (37 checks) |
| tests/auth-boundary.test.ts | Executable boundary invariants |
| scripts/scan-postmortems.mjs | Strict postmortem trigger scanner (root/web/CI wired) |
| scripts/curate-skills.mjs | Dedup + rating + icons + carry-forward |
| scripts/tag-skills-llm.mjs | LLM tags + taglines + reclassify (incremental) |
| scripts/generate-packs.mjs | Job Pack static file generator |
| scripts/upload-protected-packs-to-r2.mjs | Bounded-concurrency R2 upload (437 payloads) |
| .github/workflows/deploy.yml | Full pipeline DAG documented at top |

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
  generate-packs.mjs (npm prebuild) → web/public/packs/
  wrangler deploy → CF Worker
  apply D1 migrations
  next build → web/out/ (static export)
  upload protected pack payloads to R2, then tombstone them in web/out/
  wrangler pages deploy → CF Pages
```
