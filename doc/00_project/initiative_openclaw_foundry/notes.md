# Notes

## 2026-03-11 Documentation Bootstrap

### Trigger
- User provided explicit `PROJECT_DIR`: `/Users/mauricewen/Projects/22-openclaw-foundry`
- Follow-up task: continue unfinished work and fill all missing specification documents

### Repository Facts Collected
1. Top-level directories:
   - `client/`
   - `dist/`
   - `docs/`
   - `profiles/`
   - `src/`
2. Runtime declared in `package.json`:
   - `ocf`: `tsx src/cli.ts`
   - `server`: `tsx src/server.ts`
   - `build`: `tsc`
   - `dev`: `tsx watch src/server.ts`
3. Existing canonical-looking historical document before bootstrap:
   - `docs/plans/2026-03-10-openclaw-foundry-design.md`

### Code Evidence Read
1. `src/cli.ts`
   - CLI command surface includes `init`, `cast`, `catalog`, `switch`, `export`, `save`, `uninstall`, `repair`, `upgrade`, `rollback`, `snapshots`, `doctor`, and customer-related commands.
2. `src/server.ts`
   - Express JSON server with optional API key guard
   - Exposes `/api/analyze`, `/api/catalog`, `/api/profiles`, `/api/customers`, `/llm/v1`
   - Serves static files from `client/`
   - Dynamically injects server URL into `foundry.sh` and `foundry.ps1`
3. `src/types.ts`
   - `Blueprint` is the core contract
   - Contains `llm`, `skills`, `agents`, `config`, `mcpServers`, `extensions`
4. `src/catalog.ts`
   - Aggregates local AI-Fleet skills and remote ClawHub skills
5. `src/customers.ts`
   - Managed LLM customers are persisted in `data/customers.json`
6. `src/doctor.ts`
   - Project-local doctor validates Node, OpenClaw, config, manifest, audit log, optional server reachability
7. `src/llm-proxy.ts`
   - OpenAI-compatible chat endpoint
   - Customer token auth + tier-based rate limit + provider routing
   - Actual upstream implementation exists for Gemini and Anthropic only
8. `src/capability-registry.ts`
   - Central mapping from role/use-case to skills and MCP servers

### UX / Entrypoint Evidence Read
1. `client/index.html`
   - 6-step browser wizard
   - Posts wizard answers to `/api/analyze`
   - Shows generated blueprint and install command
2. `client/foundry.sh`
   - Thin-client bootstrap for macOS/Linux
   - Can install, uninstall, and repair
3. `client/foundry.ps1`
   - Windows PowerShell bootstrap with same lifecycle
4. `client/pipeline-manual.html`
   - Large static reference page for 36 roles x 10 pipelines

### History / Tooling Checks
1. OneContext fallback via `aline search`:
   - Query: `openclaw[ -]foundry|22-openclaw-foundry|Foundry`
   - Result: `Found 0 matches in 0 events, 0 turns, 0 sessions`
2. `ai doctor --json`
   - Timed out after 12s with no stdout in current non-interactive call path

### Documentation Decisions
1. Canonical docs path chosen as `doc/00_project/initiative_openclaw_foundry/`
2. `docs/` retained as historical reference only
3. Root governance files added as thin project-local entrypoints instead of copying the entire parent corpus
4. PDCA docs written against current repository reality, not aspirational future-only scope

### Additional Risks Confirmed By Explorer Review
1. Rule-based fallback may inject non-existent skills into `Blueprint.skills.fromAifleet`
2. `customers.json` uses in-memory cache plus JSON-file persistence, which is weak under concurrent writes
3. `/api/*` auth and `/llm/v1/*` auth are split into different mechanisms
4. Exported installer behavior is not equivalent to local `executeBlueprint()` when AI-Fleet symlink skills are selected
5. `pipeline-manual.html` is a real shipped surface but not clearly linked from the main wizard flow

### Immediate Follow-up Recommendations
1. Run the project-local health path `npm run build` and `npm run ocf -- doctor` during the next implementation task.
2. Decide whether `pipeline-manual.html` is a supported product surface or marketing/reference content.
3. Resolve git-root ambiguity if the project will need isolated version-control workflows.

## 2026-03-11 Verification Extension

### Evidence Root
- `outputs/doc-bootstrap/doc-bootstrap-20260311-verification/`

### Commands
1. `npm run build`
2. `npm run ocf -- doctor`
3. `ai check` with 20s timeout guard

### Results
1. Build log:
   - `outputs/doc-bootstrap/doc-bootstrap-20260311-verification/logs/npm-build.log`
   - Result: pass (`tsc` exited without error output)
2. Doctor log:
   - `outputs/doc-bootstrap/doc-bootstrap-20260311-verification/logs/ocf-doctor.log`
   - Result: pass
   - Key observations:
     - Node.js `v25.6.0`
     - OpenClaw `2026.3.7`
     - `~/.openclaw` present
     - 6 skills installed
     - Foundry-managed config present
     - manifest and audit log present
3. `ai check` log:
   - `outputs/doc-bootstrap/doc-bootstrap-20260311-verification/logs/ai-check.log`
   - Result: timeout after 20s; no success claim

## 2026-03-11 Analyzer Normalization Fix

### Reproduction
1. Local server smoke before fix returned a generated blueprint with:
   - `meta.created = "2024-07-30"`
   - request was made on `2026-03-11`
2. This proved the analyzer was trusting model-authored deterministic fields

### Root Cause
1. `analyzeAndGenerateBlueprint()` parsed AI JSON and returned it directly
2. The AI path had no system-side normalization layer
3. The same path also allowed skill lists to pass through without catalog re-validation

### Changes Applied
1. Added `normalizeBlueprint()` in `src/analyzer.ts`
2. Normalization now enforces:
   - `meta.os` from `WizardAnswers`
   - `meta.created` from `today()`
   - `identity.role` from `WizardAnswers`
   - `config.autonomy` from `WizardAnswers`
   - `llm` from `buildLlmConfig(answers)`
3. Skill IDs are now combined, deduplicated, and repartitioned from the actual catalog source map
4. Added regression test:
   - `tests/analyzer.test.ts`

### Verification Evidence
1. Build:
   - `outputs/doc-bootstrap/doc-bootstrap-20260311-analyzer-fix/logs/npm-build.log`
   - Result: pass
2. Regression test:
   - `outputs/doc-bootstrap/doc-bootstrap-20260311-analyzer-fix/logs/analyzer-test.log`
   - Result: pass
3. API smoke:
   - `outputs/doc-bootstrap/doc-bootstrap-20260311-analyzer-fix/logs/api-health.json`
   - `outputs/doc-bootstrap/doc-bootstrap-20260311-analyzer-fix/logs/api-analyze.json`
   - Result: pass; `meta.created` returned `2026-03-11`
4. `ai check`:
   - `outputs/doc-bootstrap/doc-bootstrap-20260311-analyzer-fix/logs/ai-check.log`
   - Result: timeout after 20s

##### Web Console v3.0 (2026-03-22, 完成)
- Web Console: Next.js 15 + Tailwind v4 + Foundry Slate 设计系统
- 4 页面: Dashboard / Catalog (13 platforms) / Deploy (4-step wizard) / Arena (multi-claw battle)
- Stitch 设计管线: project 14805725606263234014, 4 screens generated
- 后端: deploy-manager (async job) + arena-engine (4-dimension scoring) + auto-provision
- 12 新 API 端点: deploy CRUD + arena CRUD + stats + model-providers
- Executor v3: executeBlueprintForProvider — 真实本地部署到 ~/.{provider}/
- 11 步部署: prereqs → CLI → home dir → identity → skills → agents → config → IM → model API → manifest → verify
- IM auto-provision: 从 telegram/discord plugin + claude-to-im 自动同步 token (3 层 fallback)
- Model API auto-provision: 从 env vars + config files 自动读取 (8 providers)
- Arena 评分: deploySpeed(20%) + testPassRate(40%) + featureSupport(25%) + platformReach(15%)
- tsc PASS, next build PASS, 4K screenshots captured
- GitHub: MARUCIE/openclaw-foundry, commit 4fbea02 (+4,530 lines, 31 files)

## 2026-04-23 HTML Companion Routing -- Foundry x SOTA Merge Architecture

### Trigger
1. The architecture decision was already written to canonical `.md` PDCA documents.
2. A follow-up review identified a delivery gap: the task had not completed the required 2-file contract (`.md` + `.html`) for architecture/planning/swarm output.

### Routing Decision
1. Router source:
   - `/Users/mauricewen/00-AI-Fleet/knowledge/facts/engineering-baseline/09-output-format.md`
   - `/Users/mauricewen/00-AI-Fleet/skills/shared/html-style-router/SPEC.md`
2. Chosen swarm group:
   - `workflow-meta-swarm`
3. Chosen style:
   - `html-mckinsey-style` / McKinsey Blue
4. Reason:
   - The document is strategy / architecture / executive decision oriented
   - The dominant verb is RECOMMEND / STRATEGIZE / DECIDE, not ANALYZE / ARGUE
   - The audience is internal decision-makers, not a public editorial readership

### Human-Facing Output
1. HTML report path:
   - `outputs/reports/workflow-meta-swarm/2026-04-23-foundry-sota-merge-architecture.html`
2. Colocated project-doc companion:
   - `doc/00_project/initiative_openclaw_foundry/SYSTEM_ARCHITECTURE.html`
3. Browser open action:
   - required by global router rule; executed after file write
4. Memory trace:
   - `state/memory/2026-04-23.md`

### Constraint Note
1. The shared `html-style-router` exists as a spec under `00-AI-Fleet/skills/shared/`, but it is not exposed as a directly invokable loaded skill in the current CLI environment.
2. Routing was therefore executed manually against the canonical shared router spec rather than skipped.

## 2026-05-09 SOP 5.1 Run -- Frontend Validation Iter 1

### Trigger
1. User prompt "打开前端验证" with explicit PROJECT_DIR=`/Users/mauricewen/Projects/22-openclaw-foundry`
2. Hook `[SOP-RECOMMEND]` matched SOP 3.1 (sop-registry phase=TEST), but dev-pipeline-registry maps "前端验证与性能检查" to pipeline `test-frontend` (sopRef=5.1) -- the runtime-canonical config with claude-in-chrome + chrome-devtools MCP wired and viewports 375/768/1440 declared.

### Pre-flight State
1. Working tree: 11 files modified (uncommitted), no staged changes, branch `main`
2. client/*.html diff: trivial (4 lines total) -- cross-link inserts between deployment wizard and pipeline manual
3. `web/out/` last touched 2026-04-23 (stale relative to working tree)
4. `:3200` not in use; spawned `npm run dev` in background, ready in 2.8s
5. prod URL `openclaw-foundry.pages.dev` reachable HTTP 200 but represents commit 83aca6a (~2 weeks old)
6. `ai check` does NOT run cleanly outside AI-Fleet root (exit 1) -- substituted with project-level gate `npm run design:check`

### Iter 1 Decisions
1. Validation target = local dev (working tree dirty + prod stale)
2. Evidence dir = `outputs/sop-5.1/2026-05-09-frontend-validation-001/{screenshots,console,network,lighthouse,verdict}/`
3. Tool stack: chrome-devtools MCP for Lighthouse + screenshot; claude-in-chrome MCP for DOM walk + console + network (paired, not substituted)
4. Run-id naming: `YYYY-MM-DD-frontend-validation-NNN`

## 2026-05-25 Role Pack Standalone Repo Sync

### Trigger
1. User reported that other people cannot install by directly copying current configuration packs.
2. User requested all configuration packs be synced with the local latest state and placed in a separate Git repo for different roles.

### Source-State Evidence
1. Source project root:
   - `/Users/mauricewen/Projects/22-openclaw-foundry`
2. Current branch:
   - `main`
3. Current source repo state includes uncommitted pack/data edits:
   - `web/public/data/packs.json`
   - `web/public/data/skills.json`
   - 21 `web/public/packs/*/guide.html` files
4. Pack catalog parity command result:
   - `packEntries=25`
   - `uniqueIds=25`
   - `dirs=25`
   - `idsMissingDir=[]`
   - `dirsMissingJson=[]`
5. Manifest artifact audit result:
   - `problemCount=0`
   - all manifest `src` files exist under the local source pack directory
6. Shell syntax audit:
   - 25 `install.sh` files pass `sh -n`

### Root-Cause Hypothesis
The copied-local-install failure is caused by installer source selection. Existing pack installers are manifest-driven, but their default `BASE_URL` points at `https://agent-foundry.pages.dev/packs/$PACK_ID`. When someone copies a local pack folder and runs `install.sh`, the script still fetches manifest/artifacts from the deployed site instead of the copied local folder. Any mismatch between deployed content and current local artifacts can produce missing or stale configuration errors.

### Implementation Decision
Create `/Users/mauricewen/Projects/openclaw-role-packs` as a standalone local Git repository. Copy current local pack artifacts and catalog data from Foundry, then regenerate installers so local checkout/copy install is the default path. Publish the standalone repo to GitHub and make production `/packs` copy a pinned Git clone command after registration, because a tag clone is safer and easier to audit than a short-lived Worker token URL.

### Implementation Evidence
1. New standalone Git repository:
   - `/Users/mauricewen/Projects/openclaw-role-packs`
2. Public GitHub repository:
   - `https://github.com/MARUCIE/openclaw-role-packs`
3. Initial commit:
   - `d17801ac092e2295031c863adad9450dc7476fb5`
4. Current published release:
   - commit `77075297628573619491f472338ffa8148da130f`
   - tag `v2026.05.25.2`
5. Synced payload:
   - 25 `packs/<id>/` directories copied from current local `web/public/packs/`
   - catalog snapshots copied into `catalog/`
6. Installer behavior:
   - root `install.sh` lists and delegates pack installs
   - every `packs/<id>/install.sh` defaults to local sibling `manifest.json` and files
   - remote fetch requires explicit `ROLE_PACKS_BASE_URL` or `FOUNDRY_BASE_URL`
7. Production install-command behavior:
   - `web/lib/protected-downloads.ts` keeps the registered-session gate
   - clipboard install command clones `https://github.com/MARUCIE/openclaw-role-packs.git` at `v2026.05.25.2`
   - Worker-protected file download remains available for single-file downloads
8. Validation evidence:
   - `npm run validate` -> `OK validated 25 packs and 25 catalog entries`
   - `npm run smoke:install` -> all 25 packs installed into isolated verification output
   - `./install.sh --list` -> 25 pack IDs
   - `./install.sh product-manager --agent=codex --target out/verify/root-install-product-manager` -> local root installer path works
   - GitHub tag clone install smoke -> product-manager installed with 24 files and pack list count 25
   - production Pages remote install smoke -> 25/25 packs installed from `https://agent-foundry.pages.dev/packs`
   - `npm run design:check` -> `MD8 design hook: pass`
   - `cd web && npm run build` -> PASS, `/packs` static route exported
   - root `npm run build` -> PASS, TypeScript and design checks passed
   - `ai check` -> PASS, run dir `/Users/mauricewen/00-AI-Fleet/outputs/check/20260525-034718-21b7061c`
9. Documentation repair:
   - resolved stale merge-conflict markers in PDCA docs while updating the same closeout surface
   - fixed preexisting `AUTH_WIRING_GUIDE.html` MD8 spacing/overflow issues so `npm run design:check` can pass

### Tool Failures
1. `mcp__chrome-devtools__list_pages` -- timeout on Network.enable (2 attempts). Pivoted to Playwright 1.59.1 global install + claude-in-chrome MCP for DOM probing.
2. GitHub Actions deploy run `26382203696` failed in `deploy-frontend` because `web` prebuild invoked `reconcile-catalog-integrity.py` and the GitHub runner lacked `/home/runner/.claude/skills`.
   - Fix: added `--allow-missing-local-root` and passed it from `web/package.json` `prebuild`.
   - Verification: empty-`HOME` `web` build passes, root `npm run build` passes, `ai check` passes at `/Users/mauricewen/00-AI-Fleet/outputs/check/20260525-035315-aae2b488`.
   - Postmortem: `postmortem/PM-2026-05-25-ci-local-skill-root.md`.
3. GitHub Actions deploy run `26382381162` reached R2 upload but was cancelled by the 10-minute `deploy-frontend` job timeout.
   - Root cause: `scripts/upload-protected-packs-to-r2.mjs` uploaded 437 protected payload files serially and launched `npx wrangler` once per file.
   - Fix: use the lockfile-installed local Wrangler binary, bounded async upload concurrency (`R2_UPLOAD_CONCURRENCY=8`), progress logging, and a 20-minute frontend deploy budget.
   - Verification: auth boundary audit passes; `node --check scripts/upload-protected-packs-to-r2.mjs` passes; dry run plans 437 protected payloads with the local Wrangler binary; `web` build, root build, and `ai check` pass.
   - Postmortem: `postmortem/PM-2026-05-25-ci-r2-upload-timeout.md`.

## 2026-05-25 Production Git Install Verification

### Trigger
Maurice confirmed that installing from the Git address is the safest default and asked to continue verifying whether production had updated and could download/install.

### Evidence
1. Foundry source commits pushed:
   - `e6ed52099c7b4ca71bbe28c32dcdb10270d2d661` — production copy command changed from Worker token URL to pinned GitHub clone command.
   - `5adff09ee473202f547f033879103300d5903bba` — CI runner no longer requires local `~/.claude/skills`.
   - `21a56eb8e7ff6e9542815b79fbbbea28490a4c88` — R2 upload script uses bounded concurrency and local Wrangler.
   - `59061cca5c01fe227895439b437ae193aeda6367` — generated pack guides switched to GitHub tag install commands.
2. GitHub Actions deploy run `26383364471` completed successfully:
   - uploaded 437 protected payload files to R2
   - pruned 437 static payload files from Pages output
   - uploaded Pages output successfully
3. Production `/packs` returned HTTP 200 and production `data/packs.json` reported 25 packs.
4. Production `product-manager` guide uses `git clone --depth 1 --branch v2026.05.25.2 https://github.com/MARUCIE/openclaw-role-packs.git`; grep found no `curl -fsSL` install command.
5. Playwright copy smoke on production `/packs` with a registered-session fixture copied:
   - `tmp="$(mktemp -d)"`
   - `git clone --depth 1 --branch 'v2026.05.25.2' 'https://github.com/MARUCIE/openclaw-role-packs.git' "$tmp/openclaw-role-packs"`
   - `"$tmp/openclaw-role-packs/install.sh" 'product-manager' --agent=claude`
6. Copy-smoke assertions:
   - `hasGitClone=true`
   - `hasGitRepo=true`
   - `hasPinnedTag=true`
   - `hasPack=true`
   - `hasDownloadToken=false`
   - `hasPagesInstall=false`
7. GitHub tag smoke installed `product-manager` into `out/verify/git-guide-command/product-manager` with 24 files and pack list count 25.
8. Unauthenticated Worker protected file route returned 401 with `registration required before copy/download`.
9. Preview and cache-busted production direct static payload URLs returned 404; the old bare production payload URL still has a stale Cloudflare edge HIT from the previous week-long cache header.

### Follow-up Fix
Playwright exposed one production console error: `/api/packs` 404 before static fallback. `web/lib/api.ts` now skips `/api/*` for GET catalog data when `NEXT_PUBLIC_API_URL` is absent and directly reads `/data/*.json`.

### Iter 1 Closeout Summary
1. Coverage: 12 routes x 3 viewports = 36 fullpage PNG (21 MB) at `outputs/sop-5.1/2026-05-09-frontend-validation-001/screenshots/`
2. Walk errors: 0 / 36 (all routes loaded under 20s timeout)
3. h1 missing: 0 routes
4. Broken images: 0 routes
5. Real-overflow finding: `/explore/skills` only, mobile-375 + tablet-768; root cause traced to `web/lib` chip rail leaking width to ancestor `flex-1 space-y-8` -- target file `web/app/explore/skills/page.tsx`
6. Wasted-network finding: 9 / 12 routes hit `/api/*` returning 500, then load `/data/*.json` succeeding 200; target file `web/lib/api.ts` (function `fetchJSON` lines 17-32)
7. Cosmetic: `favicon.ico` 404 every route
8. Earlier 1440-overflow signal (claude-in-chrome) was invalidated by Playwright ground truth -- it was a `resize_window` artefact; recorded as P3 in verdict
9. Project-level HTML guard `npm run design:check` PASS (md8-design-hook.mjs)
10. Consensus (any-pass): PASS -- 2 of 3 experts pass; Performance auditor deferred (Lighthouse tooling failure, not site failure)
11. Iter 2/3 NOT executed: gate already passed; remaining P0/P1 fixes are user-visible code changes outside autonomous-extension reversible scope; logged to deliverable.md as scoped follow-ups

## 2026-05-18 Auth-Wall Correction -- Public Skill Copy + Registered Job Pack Payloads

### Trigger
Maurice first requested normal site access plus registration-gated copy/download, then clarified the final boundary: Skill copy must stay open; only Job Pack payloads require login. Registration supports WeChat and email.

### Pre-flight Findings
1. Existing auth design intent already existed in `AUTH_SURFACE_INVARIANT.md`, but enforcement was incomplete.
2. The real bypass was static Job Pack payload delivery, not ordinary Skill/MCP/API copy.
3. Whole-site route guards were the wrong fix because they break public browsing.

### Implementation Notes
1. Added reusable registered-session enforcement in `web/lib/session.ts` and protected pack helpers in `web/lib/protected-downloads.ts`.
2. Kept Skill/MCP/API docs and legacy browser wizard copy/download actions public.
3. Gated only Job Pack copy/download/install actions in `/packs`.
4. Updated `/login` wording to present email registration/login and WeChat registration/login as supported paths.
5. Added Worker protected pack token/file delivery routes and D1 token migration.
6. Added CI scripts to upload protected pack payloads to R2 and prune static Pages payloads after build.
7. Changed deploy ordering so Pages waits for Worker deploy plus D1 migrations before publishing frontend routes that depend on protected pack APIs.
8. Narrowed Pages `_headers` so only public pack guides get static pack caching headers.
9. Updated `AUTH_SURFACE_INVARIANT.md` to v12: Skill copy public, Job Pack payloads protected.

### Verification Evidence
1. `bash scripts/audit-auth-surfaces.sh` -> PASS, 18 Job Pack boundary checks, 0 violations.
2. `cd web && npm run build` -> PASS, Next.js static export completed.
3. `cd worker && npx tsc -p tsconfig.json` -> PASS after tightening auth middleware D1 typing.
4. Root `npm run build` -> PASS after installing existing lockfile dependencies with `npm ci`.
5. `node scripts/prune-public-pack-downloads.mjs` -> PASS, protected files removed from `web/out/packs`, public `guide.html` files retained.
6. `find web/out/packs -type f ! -name guide.html -print` -> no output.
7. `.github/workflows/deploy.yml` YAML parse check -> PASS.
8. Local smoke on `http://localhost:3201`: `/login` 200, `/packs` 200, login copy confirms `注册 / 登陆`, email registration, and WeChat registration text present.

### Known Gaps / Follow-up
1. Cloudflare R2 upload was not run locally because it needs deploy credentials; CI now runs the upload before Pages deploy.
2. `ai check` was not used as the completion gate in this run; project-level build, Worker typecheck, auth-surface audit, prune check, and local smoke were used instead.
3. Existing worktree already contained unrelated dirty files; this run did not revert or normalize unrelated changes.

## 2026-05-25 Decision Tree Empty-State Investigation

### Observation
Production `/packs` allowed the user to open `Define Strategy / 定策略`, but no pack card appeared.

### Reproduction Evidence
Playwright clicked the production `Define Strategy` button and the recommendation region disappeared. The page still showed the browse CTA and "How It Works", confirming an empty result state rather than a network failure.

### Catalog Audit
Decision-tree targets with no released public pack:
1. `data`: `algorithm-engineer`, `bigdata-engineer` are both `tier: "stub"`.
2. `strategy`: `executive-strategist` is `tier: "stub"`.
3. `analyze`: `data-analyst` is `tier: "stub"`.
4. `code` second-level options: `infra-engineer` and `ops-engineer` are `tier: "stub"` while frontend/backend/test are released.

### Fix Notes
1. Public recommendation availability is now derived from `tier !== "stub"`.
2. First-level directions with zero released packs are disabled and labeled `即将上线`.
3. Second-level options whose target pack is still hidden are disabled and labeled `即将上线`.
4. Result and browse panels now show an explicit validation-state fallback instead of rendering an empty area.
5. Visible public pack/line counts now use released-pack counts, not raw catalog counts.

### Local Evidence
1. `npm --prefix web run build` passed.
2. Static Playwright smoke verified disabled unavailable entries, enabled released entries, product-manager recommendation, and 0 console errors/warnings.

### Production Evidence
1. GitHub Actions deploy run `26385528697` passed; `deploy-frontend` completed in 3m44s.
2. Production Playwright smoke on `https://agent-foundry.pages.dev/packs?verify=d54abd8` verified:
   - released counts: `8 PACKS`, `4 LINES`
   - `做数据`, `定策略`, `看数据`: disabled with `即将上线`
   - `写代码`: frontend/backend/test enabled; infra/ops disabled with `即将上线`
   - `做产品`: product-manager recommendation still renders with install-command action
   - console errors/warnings: 0

## 2026-05-25 Strategy Roundtable Pack + Data IA Merge

### Trigger
1. User requested the previously drafted multi-expert roundtable / cognitive-skeleton skill combination be packaged as a global job-pack skill bundle.
2. User requested it be placed under `/packs` `定策略`.
3. User requested the `做数据` and `看数据` cards be merged into one data card, with a new role card added.

### Implementation Facts
1. New generator:
   - `scripts/sync-strategy-roundtable-pack.py`
2. New generated pack:
   - `web/public/packs/strategy-roundtable-advisor/`
3. Bundled skills:
   - `cognitive-skeleton`
   - `multi-expert-roundtable-report`
   - `business-diagnosis-pipeline`
   - `product-management-swarm`
   - `planning-with-files`
   - `cognitive-reflection`
4. Bundled advisors:
   - `advisor-munger`
   - `advisor-drucker`
   - `advisor-meadows`
5. Decision-tree changes:
   - `strategy` options now include `strategy-roundtable-advisor`
   - `data` options now include algorithm, big data, data analyst, and A/B analyst
   - the separate `analyze` first-level card and tab are removed
6. Data analyst pack line:
   - moved from `analyze` to `data-ai`

### Verification Evidence
1. `python3 -m py_compile scripts/sync-strategy-roundtable-pack.py scripts/sync-data-pack.py` -> pass
2. JSON syntax checks for `zh.json`, `en.json`, and `packs.json` -> pass
3. `git diff --check` on changed pack/page files -> pass
4. `python3 scripts/pack-spec-audit.py --out /tmp/pack-audit.json`:
   - `strategy-roundtable-advisor` tier: `enriched`
   - P1/P2/P3/P4 all pass
5. Root `npm run build` -> pass
6. `cd web && npm run build` -> pass
7. Browser smoke through system Chrome on `http://localhost:3200/packs`:
   - `q1HasMergedData=true`
   - `q1HasStandaloneAnalyze=false`
   - `q1StrategyEnabled=true`
   - `resultHasStrategyRoundtable=true`
   - `consoleErrorCount=0`
8. Standalone role-pack repo:
   - `npm run sync:foundry -- --source /Users/mauricewen/Projects/22-openclaw-foundry` -> 26 packs
   - `npm run validate` -> pass
   - `npm run smoke:install` -> pass, including `strategy-roundtable-advisor: installed 24 files`

### Release Boundary
No GitHub push/tag was performed. The local standalone repo is synced and validated; production clipboard commands still require a future release-tag advancement before remote users can install the new strategy pack from GitHub.

## 2026-05-25 Public Installability Release v2026.05.25.2

### Trigger
Production `/packs` still needed the new strategy pack plus public Git installability guarantees. The prior local-only role-pack sync was not enough because remote users need the pinned GitHub tag to contain every pack and no public install surface may point at Maurice's local filesystem.

### Current Facts
1. Standalone role-pack repo: `/Users/mauricewen/Projects/openclaw-role-packs`.
2. Remote install source: `https://github.com/MARUCIE/openclaw-role-packs.git`.
3. Release tag: `v2026.05.25.2`.
4. Release commit: `aa55e2ff92e254ab1b7b59ecd7d454bcc976e422`.
5. Foundry public catalog now contains 5000 installable skills from public ClawHub/MCP registry sources only.
6. Foundry public pack catalog now contains 26 packs, including `strategy-roundtable-advisor`.

### Guardrails Added
1. `scripts/audit-public-install-sources.mjs` blocks:
   - `source: local` public skill rows
   - skill entries without HTTP(S) source URLs
   - local filesystem references in public pack payloads
   - tracked `_backup*` directories under `web/public/data`
   - legacy direct Pages install URL strings
2. `web/package.json` runs the audit during `prebuild`.
3. Deprecated alias installers now delegate to local sibling pack installers when installed from the Git repo; remote script execution is not the default.

### Fresh Verification
1. `npm run validate` in `openclaw-role-packs` -> PASS, 26 packs.
2. `npm run smoke:install` in `openclaw-role-packs` -> PASS, 26/26 packs.
3. `node scripts/audit-public-install-sources.mjs` -> PASS, 5000 skills / 26 settings / 22 guides / 485 pack files.
4. `npm --prefix web run build` -> PASS.
5. `npm run build` -> PASS.
6. `git diff --check` -> PASS.
7. `ai check` -> exit 0 with `summary.json.ok=true`; `skill_integrity=false` is limited to 3 global AI-Fleet `dna/capsules/*` integrity mismatches, not this public catalog or pack install path.

### Remaining Step
Commit, push, deploy Foundry, then run production browser smoke on `https://agent-foundry.pages.dev/packs` to verify `定策略` renders `战略圆桌顾问` and production data files match the 26-pack / 5000-public-skill contract.
