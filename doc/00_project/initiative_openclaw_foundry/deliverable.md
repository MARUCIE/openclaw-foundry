# Deliverable

## Delivery Scope
项目规范文档补齐与治理基线建立。

## Delivered
1. Root governance files created:
   - `AGENTS.md`
   - `CLAUDE.md`
   - `CODEX.md`
   - `GEMINI.md`
2. Canonical documentation tree created under `doc/`
3. Project initiative files created under `doc/00_project/initiative_openclaw_foundry/`
4. Current architecture, UX map, roadmap, optimization backlog, and rolling ledger baselined from repository facts
5. Analyzer contract hardening delivered in code:
   - `src/analyzer.ts`
   - `tests/analyzer.test.ts`

## Canonical Outputs
1. `doc/index.md`
2. `doc/00_project/index.md`
3. `doc/00_project/initiative_openclaw_foundry/PRD.md`
4. `doc/00_project/initiative_openclaw_foundry/SYSTEM_ARCHITECTURE.md`
5. `doc/00_project/initiative_openclaw_foundry/USER_EXPERIENCE_MAP.md`
6. `doc/00_project/initiative_openclaw_foundry/PLATFORM_OPTIMIZATION_PLAN.md`
7. `doc/00_project/initiative_openclaw_foundry/EXECUTION_ROADMAP.md`
8. `doc/00_project/initiative_openclaw_foundry/PDCA_EXECUTION_PLAN.md`
9. `doc/00_project/initiative_openclaw_foundry/ROLLING_REQUIREMENTS_AND_PROMPTS.md`
10. `doc/00_project/initiative_openclaw_foundry/task_plan.md`
11. `doc/00_project/initiative_openclaw_foundry/notes.md`
12. `doc/00_project/initiative_openclaw_foundry/deliverable.md`
13. `doc/00_project/initiative_openclaw_foundry/PDCA_ITERATION_CHECKLIST.md`

## Human-Facing Companion Outputs
1. `outputs/reports/workflow-meta-swarm/2026-04-23-foundry-sota-merge-architecture.html`
   - Purpose: Chinese human-facing companion for the 2026-04-23 Foundry x SOTA merge architecture decision
   - Style route: McKinsey Blue
2. `doc/00_project/initiative_openclaw_foundry/SYSTEM_ARCHITECTURE.html`
   - Purpose: colocated human-facing companion for `SYSTEM_ARCHITECTURE.md`
   - Style route: McKinsey Blue
   - Pairing note: canonical source remains `doc/00_project/initiative_openclaw_foundry/SYSTEM_ARCHITECTURE.md`

## Verification For This Task
1. History lookup attempted via `aline search` and recorded
2. Documentation coverage checked by enumerating the created `doc/` files
3. Build verification executed:
   - `outputs/doc-bootstrap/doc-bootstrap-20260311-verification/logs/npm-build.log`
4. CLI doctor verification executed:
   - `outputs/doc-bootstrap/doc-bootstrap-20260311-verification/logs/ocf-doctor.log`
5. Product-level `ai check` attempted but timed out:
   - `outputs/doc-bootstrap/doc-bootstrap-20260311-verification/logs/ai-check.log`
6. UX simulation was not run in this iteration
7. Analyzer fix verification executed:
   - `outputs/doc-bootstrap/doc-bootstrap-20260311-analyzer-fix/logs/npm-build.log`
   - `outputs/doc-bootstrap/doc-bootstrap-20260311-analyzer-fix/logs/analyzer-test.log`
   - `outputs/doc-bootstrap/doc-bootstrap-20260311-analyzer-fix/logs/api-health.json`
   - `outputs/doc-bootstrap/doc-bootstrap-20260311-analyzer-fix/logs/api-analyze.json`
   - `outputs/doc-bootstrap/doc-bootstrap-20260311-analyzer-fix/logs/ai-check.log`

## Known Gaps Left Intentionally
1. No business code change in this iteration
2. No feature-level or component-level specs yet because no feature/component split was requested
3. Legacy `docs/` content was not migrated; it remains a reference source
4. `ai check` did not produce a pass/fail result in either verification bundle because it timed out

## 2026-04-23 Architecture Companion Closeout
1. 2-file delivery for the merge-architecture decision is now complete:
   - Canonical machine-readable side: updated PDCA `.md` files
   - Human-facing side: routed swarm report + colocated `SYSTEM_ARCHITECTURE.html`
2. Style routing rationale and report path are recorded in `notes.md`
3. Swarm memory log was appended under `state/memory/2026-04-23.md`

## Analyzer Fix Summary
1. Fixed system-controlled blueprint fields being overwritten by AI output
2. Added catalog-based skill filtering and source re-partitioning
3. Verified through build + regression test + live `/api/analyze` smoke

## Closeout
1. Skills update: N/A
2. PDCA four-doc sync: completed for documentation baseline
3. AGENTS/CLAUDE cross-task rule update: completed at project root
4. Rolling ledger: initialized
5. Three-end consistency:
   - Local project: documentation baseline created
   - GitHub: N/A, project-specific remote not verified in this iteration
   - VPS: N/A, no deployment action in this iteration

## Status
Completed for the documentation-bootstrap scope.

---

## 2026-05-09 SOP 5.1 Frontend Validation -- Iter 1 Delivery

### Scope
Frontend validation of `web/` Next.js console (12 routes) on local `next dev :3200` against the dirty working tree. Per dev-pipeline `test-frontend` (sopRef=5.1): loop x3, swarm 3-expert, any-pass consensus.

### Verdict
**PASS** (any-pass consensus: 2 of 3 experts pass).

### Delivered Artefacts
| Path | Type | Notes |
|---|---|---|
| `outputs/sop-5.1/2026-05-09-frontend-validation-001/verdict/verdict.md` | Verdict (canonical) | Full findings, severity-ordered, with concrete target file paths and an Evidence Manifest |
| `outputs/sop-5.1/2026-05-09-frontend-validation-001/verdict/playwright-report.json` | Machine-readable report | Per-route metrics, console errors, network 4xx/5xx, overflow elements, screenshot paths |
| `outputs/sop-5.1/2026-05-09-frontend-validation-001/screenshots/` | 36 PNG (~21 MB) | 3 viewports x 12 routes, fullpage |
| `outputs/sop-5.1/2026-05-09-frontend-validation-001/run-playwright.cjs` | Replay script | Reproducible: `cd PROJECT_DIR && NODE_PATH=$(npm root -g) node outputs/sop-5.1/.../run-playwright.cjs` |

### Findings Summary
| Severity | Issue | Concrete target file |
|---|---|---|
| P0 | `/explore/skills` overflows mobile-375 + tablet-768 (`docW=2572` vs viewport) | `web/app/explore/skills/page.tsx` |
| P1 | 9/12 routes hit `/api/*` returning 500 then load `/data/*.json` succeeding 200 | `web/lib/api.ts` (`fetchJSON`, lines 17-32) |
| P2 | `favicon.ico` 404 every route | `web/app/favicon.ico` (new file) |
| P3 | Initial 1440 overflow (claude-in-chrome) was a `resize_window` artefact, invalidated by Playwright ground truth | -- |

### Iter 2 Scope (deferred, awaits user direction)
1. Fix P0 overflow (single Tailwind class addition in `web/app/explore/skills/page.tsx`)
2. Fix P1 wasted-fetch path (single function edit in `web/lib/api.ts`)
3. Add favicon (1 binary asset)
4. Re-run Playwright walk; diff `playwright-report.json` against Iter 1

Loop did not advance to Iter 2 because (a) Iter 1 gate already PASSed under any-pass consensus, and (b) all P0/P1 fixes are user-visible code changes outside the autonomous-extension reversible scope.

### Tooling Notes
1. `mcp__chrome-devtools__list_pages` failed twice with `Network.enable` timeout; pivoted to Playwright + claude-in-chrome MCP (Tw93 stuck-rule applied).
2. Lighthouse audit deferred -- chrome-devtools MCP was the configured carrier; Playwright equivalent not run in this iter.
3. Dev server (next dev :3200) was started, exercised across 3 viewports x 12 routes, then stopped (`pkill -f 'next dev -p 3200'`).
4. Project-level HTML guard `npm run design:check` -> `MD8 design hook: pass`.

---

## 2026-05-18 Auth-Wall Correction Delivery

### Scope
Fix the login-wall boundary so the site remains browseable, Skill/MCP/API copy remains open, and only Job Pack copy/download/install payload actions require registration/login through email magic-link or WeChat OAuth.

### Delivered
1. Public copy reopened:
   - `web/components/marketplace-shell.tsx`
   - `web/app/skill/page.tsx`
   - `web/app/explore/mcp/page.tsx`
   - `web/app/api-docs/page.tsx`
   - `client/index.html`
2. Job Pack session enforcement:
   - `web/lib/session.ts`
   - `web/lib/protected-downloads.ts`
3. Gated Job Pack UI/action surfaces:
   - `web/app/packs/page.tsx`
4. Registration/login copy:
   - `web/app/login/page.tsx`
   - `web/components/top-nav.tsx`
5. Protected backend payload delivery:
   - `worker/src/routes/packs.ts`
   - `worker/src/middleware/auth.ts`
   - `worker/src/migration-v10.sql`
6. Deployment hardening:
   - `.github/workflows/deploy.yml`
   - `web/public/_headers`
   - `scripts/upload-protected-packs-to-r2.mjs`
   - `scripts/prune-public-pack-downloads.mjs`
   - `scripts/generate-pack-guides.mjs`
   - `scripts/audit-auth-surfaces.sh`
7. Documentation closeout:
   - `AUTH_SURFACE_INVARIANT.md`
   - PRD / UX map / system architecture / optimization plan / rolling ledger / task plan / notes / deliverable

### Verification
1. `bash scripts/audit-auth-surfaces.sh` -> PASS, 18 Job Pack boundary checks
2. `cd web && npm run build` -> PASS
3. `cd worker && npx tsc -p tsconfig.json` -> PASS
4. root `npm run build` -> PASS
5. `node scripts/prune-public-pack-downloads.mjs` -> PASS; only public guide files remain under `web/out/packs`
6. `find web/out/packs -type f ! -name guide.html -print` -> no output
7. `web/out/_headers` now caches only `/packs/*/guide.html`, not all `/packs/*`
8. `.github/workflows/deploy.yml` YAML parse check -> PASS
9. Local smoke on `next dev -p 3201`:
   - `/login` HTTP 200
   - `/packs` HTTP 200
   - login page contains `注册 / 登陆`, email registration, and WeChat registration copy

### Closeout
1. Skills update: N/A - this was project-specific auth and deployment hardening, not a reusable cross-project workflow.
2. PDCA four-doc sync: completed in PRD, UX map, system architecture, and platform optimization plan.
3. AGENTS/CLAUDE cross-task rule update: N/A - no new global rule beyond existing auth invariant.
4. Rolling ledger: updated with REQ-013 and anti-regression Q&A for public Skill copy + protected Job Packs.
5. Three-end consistency:
   - Local project: verified by builds, typecheck, auth audit, prune check, and local smoke.
   - GitHub: workflow updated; not pushed/deployed in this run.
   - VPS/Production: N/A for this Pages/Worker/R2 deploy path; production R2 object verification remains deploy-environment work.

### Remaining Risks
1. R2 upload requires Cloudflare credentials and was not executed locally.
2. `ai check` was not run; project-level verification gates were used instead.
3. Existing unrelated dirty worktree state was preserved.
4. npm audit reports one high-severity dependency issue after `npm ci`; dependency remediation is outside this auth-wall scope.

---

## 2026-05-25 Role Pack Standalone Repo Delivery

### Scope
同步当前本地最新岗位配置包，创建独立 Git 仓库，保证别人复制整个仓库或单个岗位包后默认走本地安装路径，不再隐式依赖 `agent-foundry.pages.dev` 的线上状态。

### Delivered
1. Standalone repo:
   - `/Users/mauricewen/Projects/openclaw-role-packs`
2. Public GitHub repo:
   - `https://github.com/MARUCIE/openclaw-role-packs`
3. Initial Git commit:
   - `d17801ac092e2295031c863adad9450dc7476fb5`
4. Current published release:
   - commit `77075297628573619491f472338ffa8148da130f`
   - tag `v2026.05.25.2`
5. Synced artifacts:
   - 25 role-pack directories under `packs/`
   - catalog snapshots under `catalog/`
   - root `install.sh`
   - per-pack local-first `install.sh`
   - validation, smoke-install, sync, and installer-regeneration scripts under `scripts/`
6. Installer contract:
   - local copied folder is the default source
   - remote install requires explicit `ROLE_PACKS_BASE_URL` or `FOUNDRY_BASE_URL`
   - production `/packs` install-command copy uses a pinned GitHub tag clone after registration

### Verification
1. Source catalog/dir parity: 25 catalog entries, 25 pack directories, no missing or extra IDs.
2. Manifest artifact audit: 0 missing local manifest artifacts.
3. `npm run validate` in `openclaw-role-packs` -> PASS, 25 packs and 25 catalog entries.
4. `npm run smoke:install` -> PASS, all 25 packs installed to isolated output.
5. `./install.sh --list` -> 25 pack IDs.
6. `./install.sh product-manager --agent=codex --target out/verify/root-install-product-manager` -> PASS.
7. Post-commit validation `npm run validate` -> PASS.
8. GitHub tag install smoke from `https://github.com/MARUCIE/openclaw-role-packs.git` at `v2026.05.25.2` -> PASS, product-manager installed with 24 files and pack list count 25.
9. Production Pages remote install smoke from `https://agent-foundry.pages.dev/packs` -> PASS, 25/25 packs installed.
10. `npm run design:check` -> PASS, `MD8 design hook: pass`.
11. `cd web && npm run build` -> PASS, `/packs` static route exported.
12. Root `npm run build` -> PASS, TypeScript and design checks passed.
13. `ai check` -> PASS, run dir `/Users/mauricewen/00-AI-Fleet/outputs/check/20260525-034718-21b7061c`.

### Closeout
1. Skills update: N/A - this was a project distribution artifact, not a reusable cross-project skill.
2. PDCA four-doc sync: updated PRD, UX map, system architecture, and optimization plan for standalone role-pack distribution.
3. AGENTS/CLAUDE cross-task rule update: N/A - no new cross-task governance rule.
4. Rolling ledger: updated with standalone role-pack distribution requirement and anti-regression Q&A.
5. Three-end consistency:
   - Local project: source pack parity and standalone repo install validation passed.
   - GitHub: public repo `MARUCIE/openclaw-role-packs` is reachable and tag `v2026.05.25.2` clone/install smoke passed.
   - VPS/Production: Pages production pack data and static payload smoke passed; follow-up deploy verifies `/packs` clipboard command after this source commit reaches Cloudflare.

### Remaining Risks
1. The production `/packs` clipboard command requires the Foundry Pages deploy for the new source commit.
2. Source Foundry still contains unrelated preexisting dirty files; this task preserved them.

## 2026-05-25 Production Deploy CI Fix

### Scope
Remove a production deployment blocker where `web` prebuild required developer-local `~/.claude/skills` on a clean GitHub runner.

### Delivered
1. `scripts/reconcile-catalog-integrity.py` now supports `--allow-missing-local-root`.
2. `web/package.json` `prebuild` passes that flag.
3. `postmortem/PM-2026-05-25-ci-local-skill-root.md` records the regression trigger and prevention rule.

### Verification
1. Empty-`HOME` reconciler dry run -> PASS, no-op with catalog unchanged.
2. Empty-`HOME` `cd web && npm run build` -> PASS, Next.js static export completed.
3. Root `npm run build` -> PASS.
4. `ai check` -> PASS, run dir `/Users/mauricewen/00-AI-Fleet/outputs/check/20260525-035315-aae2b488`.

## 2026-05-25 Production Deploy R2 Upload Fix

### Scope
Remove the remaining production Pages deploy blocker where protected role-pack payload upload exceeded the GitHub Actions job timeout.

### Delivered
1. `scripts/upload-protected-packs-to-r2.mjs` now uses a bounded async upload pool instead of serial one-process-per-file upload.
2. The upload script requires `worker/node_modules/.bin/wrangler`, tying deployment to the worker lockfile rather than `npx` resolution.
3. `.github/workflows/deploy.yml` sets `R2_UPLOAD_CONCURRENCY=8` and increases `deploy-frontend` to a 20-minute budget.
4. `postmortem/PM-2026-05-25-ci-r2-upload-timeout.md` records the regression trigger and prevention rule.

### Verification
1. Failed run `26382381162` log inspected: upload progressed through hundreds of files and was cancelled at the job timeout.
2. Local payload plan: 437 protected pack files.
3. `node --check scripts/upload-protected-packs-to-r2.mjs` -> PASS.
4. `R2_UPLOAD_CONCURRENCY=8 node scripts/upload-protected-packs-to-r2.mjs --dry-run` -> PASS, 437 payloads planned with the local Wrangler binary.
5. `bash scripts/audit-auth-surfaces.sh` -> PASS, 18 checks and 0 violations.
6. `npm run design:check` -> PASS.
7. `cd web && npm run build` -> PASS, `/packs` static export completed.
8. Root `npm run build` -> PASS.
9. `ai check` -> PASS, run dir `/Users/mauricewen/00-AI-Fleet/outputs/check/20260525-041513-3ebbd355`.
10. Real R2 upload and Pages deploy: pending next GitHub Actions run after push.

## 2026-05-25 Production Git Install Verification

### Scope
Finish the production-safe install path for role packs: install commands must use the pinned GitHub role-pack release, protected payload uploads must complete in CI, and static Pages should not expose stale direct-download copy paths.

### Delivered
1. Production `/packs` copy command now clones `https://github.com/MARUCIE/openclaw-role-packs.git` at tag `v2026.05.25.2`.
2. Generated pack guide pages now show the same GitHub tag install command and no longer show `curl -fsSL .../packs/<id>/install.sh`.
3. Static Pages builds without `NEXT_PUBLIC_API_URL` read GET catalog data directly from `/data/*.json`, removing the `/api/packs` 404 fallback noise.
4. Protected pack payload CI upload now completes with bounded R2 upload concurrency.

### Verification
1. GitHub Actions deploy run `26383364471` succeeded; `deploy-frontend` completed in 3m43s.
2. CI uploaded `437/437` protected pack files to R2 and pruned `437` static pack payload files before Pages publish.
3. Production `/packs` returned HTTP 200 and `data/packs.json` reported 25 packs.
4. Production `/packs/product-manager/guide.html` contains the GitHub tag install commands and no `curl -fsSL` install command.
5. Playwright production copy smoke for `product-manager` produced a command containing `git clone --depth 1`, `openclaw-role-packs.git`, `v2026.05.25.2`, and `product-manager`; it contained neither `download-token` nor `/packs/product-manager/install.sh`.
6. GitHub tag install smoke installed `product-manager` to an isolated target with 24 files and `install.sh --list` returned 25 packs.
7. Worker protected file route without auth returned 401 with `registration required before copy/download`.
8. Preview direct static payload URL returned 404; cache-busted production direct payload URL returned 404.
9. `cd web && npm run build` -> PASS after static API fallback repair.

### Residual Risk
1. The bare production URL `https://agent-foundry.pages.dev/packs/product-manager/install.sh` can still return an old Cloudflare edge HIT from the previous `s-maxage=604800` header. Current origin, preview, cache-busted URL, `/packs` UI, and generated guides no longer use or expose that path; avoid sharing old bare direct URLs until the edge cache expires.

## 2026-05-25 Pack Decision Tree Availability Guard

### Scope
Prevent `/packs` recommendation paths from routing users into hidden `stub` packs and empty result panels.

### Delivered
1. Decision-tree availability now uses the same released-pack rule as public browsing: `tier !== "stub"`.
2. `做数据`, `定策略`, and `看数据` are disabled with `即将上线` because every target pack in those directions is still under validation.
3. `写代码` keeps released second-level options enabled and disables `架构/基础设施` plus `运维/SRE`.
4. Empty recommendation and empty browse-tab fallbacks now explain that the direction is still under validation.
5. Header counts and the browse CTA now report released pack semantics (`8 PACKS`, `4 LINES`, `查看已开放配置包 (8)`), not raw hidden-catalog totals.

### Verification
1. `npm --prefix web run lint` -> N/A, no lint script exists.
2. `npm --prefix web run build` -> PASS.
3. Local static Playwright smoke on `http://127.0.0.1:3210/packs.html` -> PASS:
   - unavailable first-level directions disabled
   - unavailable second-level options disabled
   - product-manager recommendation still renders
   - console errors/warnings: 0
4. `npm run build` -> PASS.
5. `bash scripts/audit-auth-surfaces.sh` -> PASS, 18 checks, 0 violations.
6. `ai check` -> PASS, run dir `/Users/mauricewen/00-AI-Fleet/outputs/check/20260525-054621-90d63d99`.
7. GitHub Actions deploy run `26385528697` -> PASS; `deploy-frontend` completed in 3m44s.
8. Production Playwright smoke on `https://agent-foundry.pages.dev/packs?verify=d54abd8` -> PASS:
   - unavailable first-level directions disabled
   - unavailable second-level options disabled
   - product-manager recommendation still renders with install-command action
   - console errors/warnings: 0

### Closeout
1. Skills update: N/A - this was a project-specific public-pack availability guard, not a reusable cross-project workflow.
2. PDCA four-doc sync: updated PRD, UX map, and platform optimization plan; system architecture boundary unchanged.
3. AGENTS/CLAUDE cross-task rule update: N/A - existing release verification rules already cover this.
4. Rolling ledger: updated with REQ-022 and anti-regression Q&A.
5. Three-end consistency:
   - Local project: build, auth audit, `ai check`, and local Playwright smoke passed.
   - GitHub: commit `d54abd8b52e5ed3ad95962487065e4a8c5a890d7` pushed to `main`; deploy run `26385528697` passed.
   - Production: `https://agent-foundry.pages.dev/packs?verify=d54abd8` verified with Playwright.

---

## 2026-05-25 Strategy Roundtable Pack + Data IA Merge Delivery

### Scope
Package the reusable strategic-thinking frontdoor as a Job Pack, wire it into `/packs` `定策略`, merge the old `做数据` and `看数据` first-level cards, and keep local standalone role-pack distribution in sync.

### Delivered
1. New Job Pack:
   - `web/public/packs/strategy-roundtable-advisor/`
   - `line= strategy`
   - `tier= enriched`
2. New generator:
   - `scripts/sync-strategy-roundtable-pack.py`
3. Pack composition:
   - 6 skills
   - 3 advisor prompts
   - 1 reference
   - 2 toolkits
   - 2 data-collection templates
4. `/packs` decision-tree update:
   - `定策略` recommends `战略圆桌顾问`
   - `做/看数据` replaces separate `做数据` and `看数据`
5. Local standalone role-pack repo:
   - `/Users/mauricewen/Projects/openclaw-role-packs`
   - 26 packs validated and smoke-installed locally

### Verification
1. `python3 -m py_compile scripts/sync-strategy-roundtable-pack.py scripts/sync-data-pack.py` -> PASS
2. `python3 -m json.tool web/messages/zh.json`, `web/messages/en.json`, `web/public/data/packs.json` -> PASS
3. `git diff --check` on changed pack/page files -> PASS
4. `python3 scripts/pack-spec-audit.py --out /tmp/pack-audit.json` -> PASS; `strategy-roundtable-advisor` is `enriched`
5. `npm run build` -> PASS
6. `cd web && npm run build` -> PASS
7. Chrome smoke on local `/packs` -> PASS; merged data card present, standalone `看数据` absent, `定策略` opens `战略圆桌顾问`, console error count 0
8. `openclaw-role-packs`:
   - `npm run validate` -> PASS
   - `npm run smoke:install` -> PASS; 26 packs installed in smoke target

### Closeout
1. Skills update: completed as a Job Pack bundle rather than a new standalone Codex global skill; it bundles existing canonical skills and exposes them through `strategy-roundtable-advisor`.
2. PDCA four-doc sync: completed in PRD, UX map, system architecture, and platform optimization plan.
3. AGENTS/CLAUDE cross-task rule update: N/A - no new global operating rule was introduced.
4. Rolling ledger: updated with REQ-023 and anti-regression Q&A.
5. Three-end consistency:
   - Local project: verified by audit, builds, and browser smoke.
   - Local standalone role-pack repo: synced and smoke-installed.
   - GitHub / production: not pushed or retagged in this run; release-tag advancement remains a separate external publish step.

---

## 2026-05-25 Public Installability Release v2026.05.25.2

### Scope
Close the remaining production gap: every public Skill and Job Pack install surface must resolve from public GitHub/HTTPS sources, and `/packs` `定策略` must recommend a released pack that remote users can install from the pinned Git repository.

### Delivered
1. Advanced the standalone role-pack Git release to `v2026.05.25.2`.
2. Synced the Foundry static pack catalog to 26 packs, including `strategy-roundtable-advisor`.
3. Rebuilt the public skill catalog from public ClawHub/MCP registry sources only.
4. Removed tracked `web/public/data/_backup-*` local-only catalogs from public output.
5. Added `scripts/audit-public-install-sources.mjs` as a build-time guard against local-only URLs, legacy Pages direct-install URLs, and stale public backup directories.
6. Changed deprecated alias installers to local-first sibling delegation; remote fallback is explicit-only through `ROLE_PACKS_BASE_URL` or `FOUNDRY_BASE_URL`.

### Verification
1. Role-pack repo HEAD: `aa55e2ff92e254ab1b7b59ecd7d454bcc976e422`.
2. Role-pack tag at HEAD: `v2026.05.25.2`.
3. `npm run validate` in `/Users/mauricewen/Projects/openclaw-role-packs` -> PASS, 26 packs and 26 catalog entries.
4. `npm run smoke:install` in `/Users/mauricewen/Projects/openclaw-role-packs` -> PASS, 26/26 packs installed, including `strategy-roundtable-advisor`.
5. `node scripts/audit-public-install-sources.mjs` -> PASS: 5000/5000 public skills, 26 pack settings, 22 guides, and 485 pack files.
6. `npm --prefix web run build` -> PASS, `/packs` static export generated.
7. `npm run build` -> PASS, TypeScript and MD8 design hook passed.
8. `git diff --check` -> PASS.
9. `ai check` exit code 0 and `summary.json.ok=true`; project checks passed except the pre-existing global AI-Fleet `skill_integrity` guard, which reports 3 tampered `dna/capsules/*` entries outside this Foundry public-install surface.

### Closeout
1. Skills update: N/A - no reusable Codex global skill was introduced; the reusable guard is project script `scripts/audit-public-install-sources.mjs`.
2. PDCA four-doc sync: completed in PRD, UX map, system architecture, and platform optimization plan.
3. AGENTS/CLAUDE cross-task rule update: N/A - no new global operating rule was introduced.
4. Rolling ledger: updated with the public installability release requirement and anti-regression guard.
5. Three-end consistency:
   - Local Foundry: build and public-install audit passed.
   - GitHub role-pack repo: tag `v2026.05.25.2` points at `aa55e2ff92e254ab1b7b59ecd7d454bcc976e422`.
   - Production Pages: GitHub Actions deploy run `26392426318` passed for Foundry commit `a90769c8f156d5eee5115b31aa86757c89d084f4`.

### Production Verification
1. GitHub Actions deploy run `26392426318` -> PASS; `deploy-worker`, `apply-migrations`, and `deploy-frontend` completed successfully.
2. Production `https://agent-foundry.pages.dev/data/packs.json?verify=a90769c8f156d5eee5115b31aa86757c89d084f4` -> HTTP 200, 26 packs, `strategy-roundtable-advisor` present with `tier=enriched` and `line=strategy`.
3. Production `https://agent-foundry.pages.dev/data/skills.json?verify=a90769c8f156d5eee5115b31aa86757c89d084f4` -> HTTP 200, 5000 skills, 0 bad install sources, source split `clawhub=3500` and `mcp-registry=1500`.
4. Production old public backup URL `/data/_backup-pre-resync/skills.json` -> HTTP 404.
5. Playwright production smoke on `/packs?verify=a90769c8f156d5eee5115b31aa86757c89d084f4`:
   - `Define Strategy / 定策略` is enabled.
   - Clicking it renders `战略圆桌顾问`.
   - The rendered card shows `Strategy Roundtable Advisor`, `战略决策线`, `已富化`, bundled counts `+6 skill`, `+3 advisor`, `+1 reference`, and the guide link `/packs/strategy-roundtable-advisor/guide.html`.
   - Browser console: 0 errors, 0 warnings.
6. Production guide HTML for `strategy-roundtable-advisor` contains:
   - `git clone --depth 1`
   - `https://github.com/MARUCIE/openclaw-role-packs.git`
   - `v2026.05.25.2`
   - `strategy-roundtable-advisor`
   - No `agent-foundry.pages.dev/packs/strategy-roundtable-advisor/install.sh`
   - No `download-token`
7. Fresh remote GitHub tag clone smoke:
   - `git clone --depth 1 --branch v2026.05.25.2 https://github.com/MARUCIE/openclaw-role-packs.git`
   - `npm run validate` -> PASS, 26 packs and 26 catalog entries.
   - `npm run smoke:install` -> PASS, 26/26 packs installed.

---

## 2026-05-25 Product Manager / Designer Pack Boundary Cutover

### Scope
Correct the product-line role boundary: Product Manager owns prototype hypothesis and validation demos, while Designer owns experience architecture, visual system, design QA, component states, responsive constraints, and engineering handoff. Public installation must use the standalone GitHub role-pack tag, not local paths.

### Delivered
1. Replaced public pack id `prototype-designer` with `designer`.
2. Rebuilt the Designer pack content, metadata, guide, installer, and bundled skills around design-system and handoff work.
3. Updated Product Manager pack metadata to include prototype hypothesis, clickable validation demo prompts, PRD, RICE, and user story ownership.
4. Refactored `/packs` product-direction recommendation options and pack cards so `产品经理` and `设计师` appear as distinct choices.
5. Advanced standalone role-pack repo to Git tag `v2026.05.25.3`.
6. Removed Maurice-local source assumptions from role-pack sync defaults.
7. Removed remaining Maurice-local absolute defaults from Foundry pack sync/catalog scripts and local skill resync URL generation.

### Verification
1. Standalone role-pack repo HEAD: `8c042c359d57f51dd344063b3755394b0e5863d1`.
2. Role-pack tag at HEAD: `v2026.05.25.3`.
3. `npm run validate` in `/Users/mauricewen/Projects/openclaw-role-packs` -> PASS, 26 packs and 26 catalog entries.
4. `npm run smoke:install` in `/Users/mauricewen/Projects/openclaw-role-packs` -> PASS, 26/26 packs installed, including `designer`.
5. Fresh remote GitHub tag clone -> `npm run validate` PASS and `bash install.sh designer --agent=codex --target <tmp>` installs 15/15 files.
6. `npm --prefix web run build` -> PASS, `/packs` static export generated.
7. `python3 scripts/pack-spec-audit.py --packs-dir web/public/packs --summary` -> PASS; `designer` is `enriched`.
8. Pack sync/catalog script syntax check -> PASS.
9. Script local-path scan -> no `/Users/mauricewen/00-AI-Fleet`, `file:///Users/mauricewen`, `/Users/mauricewen/Projects`, or `~/Projects` matches in `scripts/`.
10. `ai check` exit code 0, run dir `/Users/mauricewen/00-AI-Fleet/outputs/check/20260525-094234-dad4d3a0`; known unrelated caveat: global AI-Fleet `skill_integrity=false` for 3 `dna/capsules/*` entries.
11. Local Playwright static smoke on `/packs.html` -> PASS; `设计师 / DESIGNER` renders, product direction includes Product Manager + Designer, and `原型设计师` is absent.

### Closeout
1. Skills update: N/A - no global Codex skill was introduced; this is a Job Pack boundary and metadata release.
2. PDCA four-doc sync: completed in PRD, UX map, system architecture, and platform optimization plan.
3. AGENTS/CLAUDE cross-task rule update: N/A - no new global operating rule was introduced.
4. Rolling ledger: updated with the PM/Designer boundary requirement and anti-regression guard.
5. Three-end consistency:
   - Local Foundry: build, pack audit, `ai check`, and local Playwright smoke passed.
   - GitHub role-pack repo: tag `v2026.05.25.3` points at `8c042c359d57f51dd344063b3755394b0e5863d1`.
   - Production Pages: deploy run `26394169342` passed for Foundry commit `6efd6b8b500a6264fd67a2c1ef078ef5ee8d8235`.

### Production Verification
1. GitHub Actions deploy run `26394169342` -> PASS; `deploy-worker`, `apply-migrations`, and `deploy-frontend` completed successfully.
2. Production `https://agent-foundry.pages.dev/data/packs.json?verify=6efd6b8b500a6264fd67a2c1ef078ef5ee8d8235` -> HTTP 200, 26 packs, `designer` present with `tier=enriched`, `line=product`, `nameZh=设计师`, and `artifacts.skills=3`.
3. Production pack catalog has no `prototype-designer`, and `product-manager` still explicitly owns prototype validation.
4. Production `https://agent-foundry.pages.dev/packs/designer/guide.html?verify=6efd6b8b500a6264fd67a2c1ef078ef5ee8d8235` contains:
   - `git clone --depth 1`
   - `https://github.com/MARUCIE/openclaw-role-packs.git`
   - `v2026.05.25.3`
   - `install.sh designer`
   - no `prototype-designer`
   - no direct Pages install URL
   - no `download-token`
   - no Maurice-local filesystem path
5. Production old guide `/packs/prototype-designer/guide.html` -> HTTP 404.
6. Playwright production smoke on `/packs?verify=6efd6b8b500a6264fd67a2c1ef078ef5ee8d8235`:
   - `Build Products` shows `Product Manager` and `Designer`.
   - Selecting `Designer` renders `设计师 / DESIGNER`, `产品职能线`, `已富化`, `+3 SKILL`, `+2 ADVISOR`, and the GitHub-tag install explanation.
   - `View Released Packs` renders 9 cards including Product Manager and Designer.
   - No `原型设计师`, `Prototype Designer`, or `prototype-designer` appears.
   - Screenshot: `.playwright-cli/page-2026-05-25T09-52-31-207Z.png`.

---

## 2026-05-25 Person-Neutral Role Pack Release

### Scope
Fully audit and neutralize released role/job configuration packs so no concrete person names or person-named advisor IDs appear in pack payloads, public pack catalogs, guide HTML, install scripts, standalone release artifacts, or installed output.

### Delivered
1. Added `scripts/sanitize-pack-person-names.mjs` and wired it into the web prebuild path.
2. Replaced person-named advisor files and references with capability-neutral advisor IDs.
3. Neutralized public pack curation metadata (`Agent Foundry Team`) and removed person-specific advisor/framework copy from pack payloads.
4. Rebuilt all pack `install.sh` scripts as local-first installers with explicit remote override only.
5. Advanced Foundry and standalone role-pack install references to `v2026.05.25.5`.
6. Updated standalone smoke verification so deprecated alias packages are validated against their canonical redirect output.

### Verification
1. Foundry `npm run build` -> PASS.
2. Foundry pack person-name audit across `web/public/packs`, `web/out/packs`, `data/job-packs`, standalone `packs`, and pack catalogs -> PASS.
3. Exact old-name scan across Foundry + standalone pack payloads/catalogs -> no matches.
4. `node scripts/audit-public-install-sources.mjs` -> PASS.
5. `python3 scripts/pack-spec-audit.py --out /tmp/foundry-pack-audit-final-v5.json` -> PASS.
6. Standalone `npm run validate` -> PASS.
7. Standalone `npm run smoke:install` -> PASS, 26/26 packs installed.
8. Person-name audit on smoke-installed output -> PASS.
9. `ai check` -> exit 0, run dir `/Users/mauricewen/00-AI-Fleet/outputs/check/20260525-112012-3420d639`; caveat: unrelated AI-Fleet `skill_integrity=false` for 3 `dna/capsules/*` entries.

### Closeout
1. Skills update: completed as a Job Pack release gate and sanitizer script, not as a new global skill.
2. PDCA four-doc sync: PRD, UX map, system architecture, and platform optimization plan updated for identity-neutral pack release `v2026.05.25.5`.
3. AGENTS/CLAUDE cross-task rule update: N/A - project release gate script now owns this invariant.
4. Rolling ledger: updated with REQ-028 and anti-regression Q&A.
5. Three-end consistency: local and GitHub release are verified before deployment; production verification is performed after the GitHub Actions deploy for the pushed Foundry commit.

## 2026-05-26 · Pages Pack Payload Tombstone Guard

### Delivered
1. Protected pack payload files in `web/out/packs` are tombstoned before Pages deploy, so stale direct URLs cannot return historical package content.
2. Production workflow wording and auth-boundary docs now reflect the R2 + Worker gate plus static tombstone strategy.
3. Site metadata/API copy no longer contains a personal curator name that can appear in 404 responses during pack-path scans.

### Evidence
1. `npm --prefix web run build` -> PASS.
2. `node scripts/prune-public-pack-downloads.mjs` -> PASS, 463 files tombstoned.
3. Sample `web/out/packs/product-manager/manifest.json` contains only the protected-payload tombstone.

## 2026-05-26 · Pack UI Coverage Repair

### Delivered
1. `/packs` no longer hides pending catalog packs; all 26 job packs render in browse mode.
2. The recommendation tree dynamically includes same-line catalog packs beyond the hand-curated options, fixing missing entries in engineering, data, business, product, strategy, and research lines.
3. Pending packs are visible but non-installable, with download/install/guide controls disabled.
4. Added `scripts/audit-packs-page-coverage.mjs` to the web prebuild gate.

### Evidence
1. `node scripts/audit-packs-page-coverage.mjs` -> PASS.
2. `npm --prefix web run build` -> PASS.
3. Local Playwright static export smoke -> PASS: 26 cards render; `/packs` code direction shows 11 options and includes code reviewer, security auditor, and platform engineer.
4. GitHub: commit `faccc22857641061faa5c941f97ef936048d9c65` pushed to `origin/main`; deploy run `26428949743` succeeded.
5. Production data: `https://agent-foundry.pages.dev/data/packs.json?verify=faccc22` -> 26 packs, 9 released, 17 pending, 6 lines.
6. Production Playwright smoke: `/packs?verify=faccc22` browse mode renders 26 cards; audited missing-card list is empty; `/packs` code direction has no missing engineering options and shows pending packs as `Coming soon`.

## 2026-05-26 · Pack Taxonomy Grouping Repair

### Delivered
1. Changed `/packs` second-level recommendation choices from flat pack cards to compact task-domain groups.
2. Preserved full 26-pack coverage by expanding all packs in the selected group on the result page.
3. Updated bilingual copy for the new taxonomy and added visible group counts (`packs` / `released`).
4. Extended the `/packs` coverage audit to parse `packIds` groups and catch missing catalog references.
5. Synchronized PRD, UX map, architecture, platform optimization plan, and rolling ledger with the compact-taxonomy invariant.

### Evidence
1. `node scripts/audit-packs-page-coverage.mjs` -> PASS.
2. `npm --prefix web run build` -> PASS, including pack generation, person-name sanitizer, public install-source audit, and page coverage audit.
3. Local static Playwright smoke -> PASS: `/packs.html` code direction renders 4 group buttons, old flat engineering second-level labels are absent, and frontend experience expands to 2 pack cards.
4. GitHub high-star references reviewed for taxonomy rationale:
   - MetaGPT: role/SOP-based software-company model.
   - CrewAI: `agents.yaml` and `tasks.yaml` separate role definition from task execution.
   - OpenHands: software-engineering agent platform organized around end-to-end coding workflows.
5. `ai check` -> PASS, run dir `/Users/mauricewen/00-AI-Fleet/outputs/check/20260526-032923-a8c9e390`.
6. GitHub Actions deploy run `26430651434` -> PASS for commit `ea78a2302ec6bc3024e558e69978cc90040e7544`; `deploy-worker`, D1 migrations, and `deploy-frontend` completed successfully.
7. Production data smoke -> PASS: `https://agent-foundry.pages.dev/data/packs.json?verify=ea78a2302ec6bc3024e558e69978cc90040e7544` returned 26 packs, 9 released, 17 pending, 6 lines, and `strategy-roundtable-advisor`.
8. Production Playwright smoke -> PASS: `/packs?verify=ea78a2302ec6bc3024e558e69978cc90040e7544` renders 4 `Write Code` task-domain groups, no old flat engineering labels in the second-level view, and 2 frontend-result pack cards after selecting `Frontend Experience`.

## 2026-05-26 · All Role Packs Online Status Repair

### Delivered
1. All 26 cataloged role/job packs are now treated as live when generated artifacts are complete; `tier: "stub"` displays as the `Basic` maturity badge.
2. The four previously guide-less `spellbook-*` alias packs now ship `guide.html`, bringing public guide coverage to 26/26.
3. Added `scripts/audit-pack-online-status.mjs` to block future regressions where catalog packs lack public artifacts or `/packs` uses `PACK_SPEC` tier as availability state.
4. Extended person-name neutralization and cleaned the remaining concrete-name shorthand from public pack prompts/references.
5. Stored a local zip snapshot at `dist/openclaw-role-packs-20260526-120909.zip` with 26 guides and 26 manifests.

### Evidence
1. `npm --prefix web run build` -> PASS.
2. `node scripts/audit-pack-online-status.mjs` -> PASS: 26 packs, 7 required files.
3. `node scripts/audit-packs-page-coverage.mjs` -> PASS: 26 packs, 6 lines.
4. Pack person-name audit -> PASS for `web/public/packs`, `data/job-packs`, and public catalogs.
5. Local Playwright static export smoke -> PASS: 4 compact engineering groups, Basic badge visible, browse mode has 26 guide links, and no `Coming soon` copy appears.
6. `ai check` -> PASS, run dir `/Users/mauricewen/00-AI-Fleet/outputs/check/20260526-040741-af59dd2d`.
7. Zip SHA256: `12ef1572df59f86118203233ecd87f3560b97ce3866a9e1d1392b2924537c336`.
8. GitHub Actions deploy run `26431853849` -> PASS for commit `1d5fdf48fb3ca97b76f2c4c33ed405732649f313`.
9. Production data smoke -> PASS: `https://agent-foundry.pages.dev/data/packs.json?verify=1d5fdf48fb3ca97b76f2c4c33ed405732649f313` returned HTTP 200, 26 packs, 6 lines, and no missing required catalog fields.
10. Production Playwright smoke -> PASS: `https://agent-foundry.pages.dev/packs?verify=1d5fdf48fb3ca97b76f2c4c33ed405732649f313` renders 4 `Write Code` task-domain groups, `Quality & Security` exposes `BASIC` maturity packs, Browse All exposes 26 guide links, and no unavailable copy appears.

### Closeout
1. Skills update: N/A - this was a Foundry Job Pack online-state and release-gate repair, implemented as scripts and package artifacts.
2. PDCA four-doc sync: PRD, UX map, system architecture, platform optimization plan, and rolling ledger updated.
3. AGENTS/CLAUDE cross-task rule update: N/A - the invariant is now executable through prebuild audits.
4. Technical debt closure: online-state conflation and missing guide coverage are closed; production deployment and smoke verification are complete for commit `1d5fdf48fb3ca97b76f2c4c33ed405732649f313`.

## 2026-05-26 · R2 Protected Pack Upload Retry Guard

### Delivered
1. Hardened `scripts/upload-protected-packs-to-r2.mjs` against transient Cloudflare R2 `502` / `504` upload failures.
2. Reduced default protected-pack upload concurrency from 8 to 4.
3. Added configurable retry controls through `R2_UPLOAD_RETRIES` and `R2_UPLOAD_RETRY_BASE_MS`.

### Evidence
1. `node --check scripts/upload-protected-packs-to-r2.mjs` -> PASS.
2. `node scripts/upload-protected-packs-to-r2.mjs --dry-run` -> PASS, 463 protected pack files planned.
3. `bash scripts/audit-auth-surfaces.sh` -> PASS, 18 checks and 0 violations.

### Closeout
1. Technical debt closure: release upload no longer relies on manual reruns for transient Cloudflare R2 gateway responses.

## 2026-05-26 · Public Pack Dedup Repair

### Delivered
1. Public `/packs` catalog now exposes 22 canonical role/job packs instead of showing duplicate deprecated spellbook aliases beside richer canonical packs.
2. `spellbook-frontend-engineer`, `spellbook-backend-engineer`, `spellbook-test-engineer`, and `spellbook-platform-engineer` are suppressed from public `packs.json`, `/packs` question-tree IDs, visible counts, and Browse All cards.
3. Added `scripts/audit-pack-public-dedup.mjs` and wired it into `web` prebuild.
4. Updated pack coverage and online-status audits so they guard the public canonical catalog while allowing deprecated alias directories to remain as historical install targets.
5. Deprecated alias guide pages now explicitly identify themselves as historical aliases and point users to the canonical target.

### Local Evidence
1. `npm --prefix web run build` -> PASS.
2. `node scripts/audit-pack-public-dedup.mjs` -> PASS: publicPacks=22, suppressedAliases=4.
3. `node scripts/audit-packs-page-coverage.mjs` -> PASS: packs=22, lines=6.
4. `node scripts/audit-pack-online-status.mjs` -> PASS: packs=22, requiredFiles=7.
5. Local Playwright static smoke -> PASS: Frontend Experience renders 1 canonical card; Browse All renders 22 cards and 22 guide links; alias strings are absent; console errors=0; navigation duration=1291ms.
6. `ai check` -> PASS, run dir `/Users/mauricewen/00-AI-Fleet/outputs/check/20260526-060413-451c666b`.

### Production Evidence
1. Foundry commit `5e68a4a6b881b3fd048cd2c50c982129f4e3fcf3` was pushed to `origin/main`.
2. GitHub Actions deploy run `26435492679` completed successfully; `deploy-frontend` completed in 3m50s.
3. Production data smoke on `https://agent-foundry.pages.dev/data/packs.json?verify=5e68a4a6b881b3fd048cd2c50c982129f4e3fcf3` -> PASS: 22 packs, no `spellbook-frontend-engineer`, `spellbook-backend-engineer`, `spellbook-test-engineer`, or `spellbook-platform-engineer`, and no duplicate visible pack names.
4. Production Playwright smoke on `https://agent-foundry.pages.dev/packs?verify=5e68a4a6b881b3fd048cd2c50c982129f4e3fcf3` -> PASS: Frontend Experience renders 1 canonical card; Browse All renders 22 cards and 22 guide links; deprecated alias strings are absent; console errors=0; console warnings=0.

### Closeout
1. Skills update: N/A - this is a Foundry pack-catalog invariant implemented as generator/audit code.
2. PDCA four-doc sync: PRD, UX map, system architecture, platform optimization plan, and rolling ledger updated.
3. AGENTS/CLAUDE cross-task rule update: N/A - the invariant is executable through prebuild audits.
4. Technical debt closure: duplicate public role cards are closed by generation, audit gates, GitHub Actions deployment, and production smoke verification.

## 2026-05-26 · Public Pack Maturity Floor Repair

### Delivered
1. Canonical public job packs are automatically enriched before public tier injection when they fail the maturity floor.
2. The public catalog now has 22 canonical packs with zero `stub` entries: 22 `enriched` and 0 `certified`.
3. The `web` build now fails if any public catalog pack regresses to `stub`.
4. Deprecated historical alias guide pages inherit the maturity badge from their canonical target, while remaining suppressed from public cards/counts.

### Local Evidence
1. `node scripts/audit-public-pack-maturity.mjs` -> PASS: `packs=22, enriched=22, certified=0, stub=0`.
2. `npm --prefix web run build` -> PASS with public maturity, dedup, coverage, online-status, public-install-source, and person-name gates.
3. `git diff --check` -> PASS after fixing generated guide trailing whitespace.
4. Local static data smoke -> PASS: public catalog has zero `stub`; code reviewer and security auditor are enriched; deprecated aliases are hidden.
5. Local Chrome DevTools smoke -> PASS: Browse All shows Enriched, Code Reviewer, and Security Auditor; no Basic / `基础档` label.
6. `ai check` -> PASS after deterministic audit fix, run dir `/Users/mauricewen/00-AI-Fleet/outputs/check/20260526-072940-3537d9b0`.
7. Production deploy run `26438787446` for commit `69031125d30b69c2c4172a62798978ca5ccd927c` -> PASS; production smoke returned 22 packs, 22 enriched, 0 certified, 0 stub, no Basic / Certified labels, no deprecated aliases, and Code Reviewer / Security Auditor both enriched.
8. Deterministic maturity fix: normal `pack-spec-audit.py` now ignores untracked local E2E logs, preventing local-only Certified labels from diverging from CI/production.

### Closeout
1. Skills update: N/A - this is a Foundry pack generation/audit invariant rather than a user-facing skill.
2. PDCA four-doc sync: PRD, UX map, system architecture, platform optimization plan, and rolling ledger updated.
3. AGENTS/CLAUDE cross-task rule update: N/A - the invariant is executable through prebuild audits.
4. Technical debt closure: local build, audit, smoke, `ai check`, GitHub Actions deploy, and production smoke are closed for commit `69031125d30b69c2c4172a62798978ca5ccd927c`.
