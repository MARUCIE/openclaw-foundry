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

## 2026-05-27 Role-Pack Source Contract Review Fix

### Trigger
Code review swarm found that guide completeness was being proven after HTML fallback generation instead of at the source skill-doc layer. It also found split release refs and standalone validation gaps.

### Decisions
1. Guide HTML is no longer the source of truth for manual completeness. Markdown guide skill docs (`SKILL.md`, `README.md`, `SPEC.md`) must carry `## 是什么`, `## 怎么用`, and `## 架构图` with Mermaid before `guide.html` is generated.
2. Non-Markdown skill payloads (`.py`, `.json`, `.yaml`) remain executable/config artifacts and are not counted as guide cards.
3. `web/public/data/role-pack-release.json` is the single release ref source for guide commands, UI clipboard commands, Git drift audit, and standalone catalog sync.
4. Standalone `validate` now proves release config alignment, no unpinned Git install command, and no concrete person-name leakage.

### Evidence
1. Source section audit: `OK source skill sections: skills=182`.
2. Guide audit: `OK pack guide skill sections: guides=26 guideSkills=182 payloads=185 sourceSkills=182 cards=182`.
3. Standalone release tag: `v2026.05.27.3`, commit `3f0ecd1`.
4. Git release drift audit: 550/550 Foundry payload files matched the cloned Git tag.
5. Local archive output: `dist/role-pack-zips-20260527-094317-all/openclaw-role-packs-all-v2026.05.27.3.zip`.

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

### Production Verification Result
1. Foundry commit pushed: `a90769c8f156d5eee5115b31aa86757c89d084f4`.
2. GitHub Actions deploy run `26392426318` completed successfully.
3. Production pack catalog:
   - URL: `https://agent-foundry.pages.dev/data/packs.json?verify=a90769c8f156d5eee5115b31aa86757c89d084f4`
   - HTTP 200
   - total packs: 26
   - `strategy-roundtable-advisor`: present, `tier=enriched`, `line=strategy`
4. Production skill catalog:
   - URL: `https://agent-foundry.pages.dev/data/skills.json?verify=a90769c8f156d5eee5115b31aa86757c89d084f4`
   - HTTP 200
   - total skills: 5000
   - bad install sources: 0
   - source split: `clawhub=3500`, `mcp-registry=1500`
5. Old public backup catalog URL returned HTTP 404.
6. Playwright production smoke:
   - Opened `https://agent-foundry.pages.dev/packs?verify=a90769c8f156d5eee5115b31aa86757c89d084f4`.
   - Clicked `Define Strategy`.
   - Result card rendered `战略圆桌顾问` / `Strategy Roundtable Advisor`.
   - Console errors/warnings: 0.
7. Guide command audit:
   - contains GitHub repo and tag `v2026.05.25.2`
   - contains pack id `strategy-roundtable-advisor`
   - does not contain legacy direct Pages install URL
   - does not contain `download-token`
8. Fresh remote GitHub tag clone:
   - `npm run validate` -> PASS, 26 packs.
   - `npm run smoke:install` -> PASS, 26/26 packs.

## 2026-05-25 Product Manager / Designer Pack Boundary Cutover

### Trigger
Production `/packs` still exposed `原型设计师`, but prototype hypothesis and clickable validation belong to Product Manager. The design role must be a real Designer pack with visual system, experience architecture, design QA, and engineering handoff assets.

### Current Facts
1. Standalone role-pack repo: `/Users/mauricewen/Projects/openclaw-role-packs`.
2. Remote install source: `https://github.com/MARUCIE/openclaw-role-packs.git`.
3. New release tag: `v2026.05.25.3`.
4. Standalone role-pack release commit: `8c042c359d57f51dd344063b3755394b0e5863d1`.
5. Foundry pack id `prototype-designer` has been removed from public data and replaced by `designer`.
6. Product Manager metadata now owns prototype hypothesis, validation demo prompt, PRD, RICE, and user story responsibilities.

### Guardrails Added
1. `scripts/sync-design-pack.py` no longer defaults to Maurice's absolute AI-Fleet path; it uses `AI_FLEET_ROOT` or `~/00-AI-Fleet`.
2. `openclaw-role-packs/scripts/sync-from-foundry.mjs` now requires explicit `--source <foundry-root>` or `FOUNDRY_SOURCE`; it no longer bakes in Maurice's Foundry path.
3. Public guide/install scripts now reference GitHub tag `v2026.05.25.3` instead of local-only or Pages-direct installers.
4. `/packs` card copy says GitHub tag install scripts pull resources through `manifest.json`, making the public install source explicit.
5. Legacy Foundry sync/resync scripts no longer hardcode `/Users/mauricewen/00-AI-Fleet` or `file:///Users/mauricewen...`; they use environment variables, `Path.home()`, or blank URLs that the public-source audit can block.

### Fresh Verification
1. `openclaw-role-packs npm run validate` -> PASS, 26 packs and 26 catalog entries.
2. `openclaw-role-packs npm run smoke:install` -> PASS, 26/26 packs; `designer` installs 15 files.
3. Fresh remote clone of `https://github.com/MARUCIE/openclaw-role-packs.git` at tag `v2026.05.25.3` -> `npm run validate` PASS and `bash install.sh designer --agent=codex --target <tmp>` PASS.
4. `rg -n "prototype-designer|Prototype Designer|原型设计师|stitch-prototype" web data scripts -g '!node_modules' -g '!out'` -> no matches.
5. `npm --prefix web run build` -> PASS.
6. `python3 scripts/pack-spec-audit.py --packs-dir web/public/packs --summary` -> PASS; `designer` is `enriched`.
7. `python3 -m py_compile ...` for pack sync/catalog scripts -> PASS.
8. `rg -n "/Users/mauricewen/00-AI-Fleet|file:///Users/mauricewen|/Users/mauricewen/Projects|~/Projects" scripts` -> no matches.
9. Local Playwright static export smoke:
   - released cards include `设计师 / DESIGNER`;
   - product direction includes `Product Manager` and `Designer`;
   - `原型设计师` and `prototype-designer` are absent.
10. `ai check` -> exit 0, run dir `/Users/mauricewen/00-AI-Fleet/outputs/check/20260525-094234-dad4d3a0`; global AI-Fleet integrity caveat remains unrelated to this release.

### Production Verification Result
1. Foundry release commit: `6efd6b8b500a6264fd67a2c1ef078ef5ee8d8235`.
2. GitHub Actions deploy run `26394169342` -> PASS; `deploy-worker`, `apply-migrations`, and `deploy-frontend` completed successfully.
3. Production `packs.json` check:
   - HTTP 200
   - 26 packs
   - `designer` present with `tier=enriched`, `line=product`, `nameZh=设计师`, and 3 bundled skills
   - `prototype-designer` absent
   - `product-manager` description includes prototype validation ownership
4. Production `designer` guide check:
   - contains GitHub repo `https://github.com/MARUCIE/openclaw-role-packs.git`
   - contains release tag `v2026.05.25.3`
   - contains `install.sh designer`
   - contains no old `prototype-designer`
   - contains no Pages direct install URL, `download-token`, or Maurice-local filesystem path
5. Production old guide `/packs/prototype-designer/guide.html` -> HTTP 404.
6. Playwright production smoke:
   - opened `https://agent-foundry.pages.dev/packs?verify=6efd6b8b500a6264fd67a2c1ef078ef5ee8d8235`
   - clicking `Build Products` shows `Product Manager` and `Designer`
   - clicking `Designer` renders the `设计师 / DESIGNER` recommendation card with `产品职能线`, `已富化`, `+3 SKILL`, `+2 ADVISOR`, and GitHub-tag install copy
   - released list has 9 cards including Product Manager and Designer
   - no `原型设计师`, `Prototype Designer`, or `prototype-designer`
   - screenshot: `.playwright-cli/page-2026-05-25T09-52-31-207Z.png`

## 2026-05-25 Person-Neutral Role Pack Audit

### Trigger
User required a full audit so every role/job configuration pack contains no concrete person names.

### Changes
1. Added `scripts/sanitize-pack-person-names.mjs` as the release gate for Foundry packs, standalone packs, pack catalogs, guides, and installed smoke output.
2. Replaced person-named advisor IDs and labels with capability-neutral identities, including decision framework, business value, systems thinking, strategic focus, tail-risk, software simplicity, project complexity, product experience, design simplicity, team culture, execution speed, and language clarity.
3. Updated canonical pack installers to be local-first; remote pack fetching is now only enabled by explicit `--remote-base`, `ROLE_PACKS_BASE_URL`, or `FOUNDRY_BASE_URL`.
4. Advanced the role-pack release reference to `v2026.05.25.5` and synchronized the standalone repo from Foundry.

### Verification
1. `npm run build` in `web/` -> PASS.
2. `node scripts/sanitize-pack-person-names.mjs --check --packs-dir web/public/packs --packs-dir web/out/packs --packs-dir /Users/mauricewen/Projects/openclaw-role-packs/packs --extra-dir data/job-packs --catalog web/public/data/packs.json --catalog web/public/data/collections.json --catalog /Users/mauricewen/Projects/openclaw-role-packs/catalog/packs.json --catalog /Users/mauricewen/Projects/openclaw-role-packs/catalog/collections.json` -> PASS.
3. Exact-match scan for old advisor IDs and concrete person names across Foundry packs, exported packs, standalone packs, and public pack catalogs -> no matches.
4. `node scripts/audit-public-install-sources.mjs` -> PASS.
5. `python3 scripts/pack-spec-audit.py --out /tmp/foundry-pack-audit-final-v5.json` -> PASS.
6. `npm run validate` in `/Users/mauricewen/Projects/openclaw-role-packs` -> PASS.
7. `npm run smoke:install` in `/Users/mauricewen/Projects/openclaw-role-packs` -> PASS, 26/26 packs installed.
8. Person-name audit on the latest smoke-installed output -> PASS.
9. `ai check` -> exit 0, run dir `/Users/mauricewen/00-AI-Fleet/outputs/check/20260525-112012-3420d639`; known unrelated caveat remains `skill_integrity=false` for 3 AI-Fleet `dna/capsules/*` entries.

## 2026-05-26 · Pages Pack Payload Tombstone Guard

### Trigger
Production Pages still served an old cached `product-manager/manifest.json` direct URL after the protected payload files had been removed from the latest static export.

### Change
1. `scripts/prune-public-pack-downloads.mjs` now overwrites protected pack payload files in `web/out/packs` with a neutral tombstone instead of deleting them.
2. The deploy workflow runs the tombstone step after uploading real payloads to R2 and before deploying Pages.
3. Global site metadata/API copy no longer uses a personal curator name, reducing false positives when 404 pages are scanned during pack-path audits.

### Verification
1. `npm --prefix web run build` -> PASS.
2. `node scripts/prune-public-pack-downloads.mjs` -> PASS, 463 protected pack payload files tombstoned in `web/out/packs`.
3. Sample exported `web/out/packs/product-manager/manifest.json` contains only the tombstone text and no old advisor IDs.

## 2026-05-26 · Pack UI Coverage Repair

### Root Cause
The `/packs` guide and browse UI had two hidden filters: the question tree only hardcoded 16 pack IDs, while the browse view filtered out all `tier: stub` packs. The catalog had 26 packs, so 10 packs had no question-tree entry and 17 pending packs looked missing instead of visibly under validation.

### Change
1. `/packs` now expands question-tree options from `packs.json` by line, so newly cataloged packs appear without another hardcoded UI edit.
2. Browse mode renders all 26 packs; released packs remain installable, while pending packs show `Coming soon` and disable install/download/guide actions.
3. `scripts/audit-packs-page-coverage.mjs` is wired into web prebuild and fails when a pack line or pack ID cannot be reached from `/packs`.

### Evidence
1. `node scripts/audit-packs-page-coverage.mjs` -> PASS, 26 packs and 6 lines covered.
2. `npm --prefix web run build` -> PASS, including pack generation, person-name sanitizer, public install source audit, and page coverage audit.
3. Local Playwright static export smoke on `/packs.html` -> PASS: browse mode renders 26 cards, the code direction shows 11 options, and previously missing packs such as security auditor, code reviewer, platform engineer, AI app engineer, internal control specialist, and investment analyst are visible.
4. Commit `faccc22857641061faa5c941f97ef936048d9c65` was pushed to `origin/main`; GitHub Actions deploy run `26428949743` completed successfully, including Worker deploy, D1 migrations, and Pages frontend deploy.
5. Production `https://agent-foundry.pages.dev/data/packs.json?verify=faccc22` -> HTTP 200, 26 packs, 9 released, 17 pending, 6 lines.
6. Production Playwright smoke on `https://agent-foundry.pages.dev/packs?verify=faccc22` -> PASS: browse mode renders 26 cards, no audited pack names are missing, the count notice is visible, `Coming soon` is visible for pending packs, and the code direction has no missing engineering options.

## 2026-05-26 · Pack Taxonomy Grouping Repair

### Trigger
The coverage repair fixed missing packs but made the second-level selector too noisy: the engineering direction exposed 11 individual pack cards. The user requirement changed to a compact, scientific taxonomy that still covers every catalog pack.

### Decision
Use task-domain groups at the recommendation layer, then expand concrete packs only in the result layer. This matches high-star agent-framework patterns: MetaGPT organizes work as software-company roles and SOPs; CrewAI separates agent role definitions from task definitions; OpenHands frames the product around software-engineering tasks and executable workflows.

### Change
1. Replaced single `packId` second-level options with `packIds` groups in `/packs`.
2. Engineering now has four groups: frontend experience, backend platform, quality/security, infrastructure/ops.
3. Data now has two groups: data/AI engineering and metrics/experiments.
4. Product, business, strategy, research, and scenario lines use the same compact task-domain grouping pattern.
5. `scripts/audit-packs-page-coverage.mjs` now parses `packIds` arrays and fails if the page references missing catalog IDs or leaves catalog packs uncovered.

### Evidence
1. Catalog baseline: 26 packs total, 9 released and 17 pending, across 6 lines.
2. Local coverage audit: `node scripts/audit-packs-page-coverage.mjs` -> PASS.
3. Local static Playwright smoke: code direction shows 4 group buttons; old flat engineering labels are absent from the second-level view; selecting frontend experience renders 2 concrete pack cards.
4. `ai check` -> PASS, run dir `/Users/mauricewen/00-AI-Fleet/outputs/check/20260526-032923-a8c9e390`.
5. GitHub Actions deploy run `26430651434` -> PASS for commit `ea78a2302ec6bc3024e558e69978cc90040e7544`; `deploy-frontend` completed in 3m55s.
6. Production data smoke on `https://agent-foundry.pages.dev/data/packs.json?verify=ea78a2302ec6bc3024e558e69978cc90040e7544` -> PASS: 26 packs, 9 released, 17 pending, 6 lines, `strategy-roundtable-advisor` present.
7. Production Playwright smoke on `/packs?verify=ea78a2302ec6bc3024e558e69978cc90040e7544` -> PASS: code direction has 4 group buttons, old flat engineering labels are absent from second-level view, and frontend experience expands to 2 pack cards.

## 2026-05-26 · All Role Packs Online Status Repair

### Trigger
After the compact taxonomy shipped, the public `/packs` page still implied that many configuration packs were missing or not online because `tier: "stub"` was being treated as availability instead of maturity.

### Audit Inputs
1. Foundry catalog baseline: `web/public/data/packs.json` contains 26 packs across 6 lines.
2. Foundry public artifacts: every pack directory now contains `CLAUDE.md`, `AGENTS.md`, `settings.json`, `prompts.md`, `install.sh`, `manifest.json`, and `guide.html`.
3. Local AI-Fleet audit: `/Users/mauricewen/00-AI-Fleet/layers/L3-intelligence/skills/skills` contains 123 `SKILL.md` entries; the relevant global strategy surfaces remain `cognitive-skeleton`, `multi-expert-roundtable-report`, `planning-with-files`, `cognitive-reflection`, `business-diagnosis-pipeline`, and `product-management-swarm`.
4. GitHub reference scan as of 2026-05-26: AutoGPT, Dify, browser-use, OpenHands, MetaGPT, Cline, AutoGen, CrewAI, and LangGraph were used as taxonomy reference points; the shared pattern is task-domain entrypoints with underlying role/tool packs expanded after selection.

### Change
1. Split pack availability from `PACK_SPEC` tier. `tier: "stub"` now renders as `Basic`, not `Coming soon`.
2. Generated `guide.html` for all 26 visible pack directories, including the four `spellbook-*` alias packs that were previously skipped.
3. Added `scripts/audit-pack-online-status.mjs` and wired it into `web` prebuild so the build fails if any catalog pack lacks required public artifacts or if `/packs` release logic uses `tier === "stub"` / `tier !== "stub"`.
4. Tightened person-name sanitization for residual abbreviated person references in pack prompts and references.

### Evidence
1. `npm --prefix web run build` -> PASS, including pack generation, guide generation for 26 packs, person-name sanitizer, public install-source audit, page coverage audit, and online-status audit.
2. `node scripts/audit-pack-online-status.mjs` -> PASS: 26 packs, 7 required files each.
3. `node scripts/audit-packs-page-coverage.mjs` -> PASS: 26 packs across 6 lines.
4. `node scripts/sanitize-pack-person-names.mjs --check --packs-dir web/public/packs --extra-dir data/job-packs --catalog web/public/data/packs.json --catalog web/public/data/collections.json` -> PASS.
5. Local Playwright static export smoke on `/packs.html` -> PASS: code direction has 4 task-domain groups, quality/security group shows a Basic pack, browse mode exposes 26 guide links, and no `Coming soon` copy appears.
6. `ai check` -> PASS, run dir `/Users/mauricewen/00-AI-Fleet/outputs/check/20260526-040741-af59dd2d`.
7. Local zip snapshot generated at `dist/openclaw-role-packs-20260526-120909.zip`; SHA256 `12ef1572df59f86118203233ecd87f3560b97ce3866a9e1d1392b2924537c336`; zip contains 26 guides and 26 manifests.
8. Commit `1d5fdf48fb3ca97b76f2c4c33ed405732649f313` was pushed to `origin/main`; GitHub Actions deploy run `26431853849` completed successfully for Worker, D1 migration, and Pages frontend deploy.
9. Production data smoke on `https://agent-foundry.pages.dev/data/packs.json?verify=1d5fdf48fb3ca97b76f2c4c33ed405732649f313` -> PASS: HTTP 200, 26 packs, 6 lines, no missing `id` / `line` / `tier` fields.
10. Production Playwright smoke on `/packs?verify=1d5fdf48fb3ca97b76f2c4c33ed405732649f313` -> PASS: `Write Code` uses 4 compact task-domain groups, `Quality & Security` shows `BASIC` maturity packs, Browse All exposes 26 guide links, and no `Coming soon` / `即将上线` copy appears.

## 2026-05-26 · R2 Protected Pack Upload Retry Guard

### Trigger
The documentation closeout deployment for commit `870bafeeb04888b253e403714aadf4f13ce8cafa` failed twice in the protected pack upload step because Cloudflare R2 returned transient `502 Bad Gateway` and `504 Gateway Timeout` responses for individual objects.

### Change
1. `scripts/upload-protected-packs-to-r2.mjs` now retries transient 429/5xx/gateway/timeout upload failures with exponential backoff.
2. Default `R2_UPLOAD_CONCURRENCY` was reduced from 8 to 4 to lower pressure on R2 during the 463-file protected payload upload.
3. `R2_UPLOAD_RETRIES` and `R2_UPLOAD_RETRY_BASE_MS` are configurable through the deploy environment.

### Evidence
1. `node --check scripts/upload-protected-packs-to-r2.mjs` -> PASS.
2. `node scripts/upload-protected-packs-to-r2.mjs --dry-run` -> PASS, 463 protected pack files planned.
3. `bash scripts/audit-auth-surfaces.sh` -> PASS, 18 checks and 0 violations.

## 2026-05-26 · Public Pack Dedup Repair

### Trigger
The public `/packs` UI still showed duplicate role cards such as `frontend-engineer` and `spellbook-frontend-engineer`. The richer canonical pack should be the only public choice when a spellbook pack declares `deprecated_alias_of`.

### Root Cause
Four spellbook directories had correct `deprecated_alias_of` metadata, but `scripts/generate-packs.mjs` preserved their old `packs.json` entries and `/packs` hardcoded them in `QUESTION_TREE` groups. The previous coverage audit interpreted "all packs" as all raw directories/catalog entries and did not distinguish public canonical packs from deprecated historical aliases.

### Change
1. `scripts/generate-packs.mjs` now suppresses `deprecated_alias_of` packs from public `packs.json` when the canonical target exists.
2. `/packs` recommendation groups now reference only canonical IDs for frontend, backend, infra/platform, and test duplicates.
3. Added `scripts/audit-pack-public-dedup.mjs`; prebuild now fails if a deprecated alias enters `packs.json`, appears in `QUESTION_TREE`, or leaves duplicate visible role names.
4. `scripts/audit-packs-page-coverage.mjs` and `scripts/audit-pack-online-status.mjs` now define coverage against the public canonical catalog while allowing deprecated alias directories to remain as historical install targets.
5. `scripts/generate-pack-guides.mjs` renders deprecated alias guides as explicit historical-alias pages pointing users to the canonical target instead of degrading to slug-only metadata.

### Evidence
1. Public catalog after generation: 22 packs; suppressed aliases: `spellbook-frontend-engineer -> frontend-engineer`, `spellbook-backend-engineer -> backend-engineer`, `spellbook-test-engineer -> test-engineer`, `spellbook-platform-engineer -> infra-engineer`.
2. Local audits passed: public dedup, page coverage, and online status.
3. `npm --prefix web run build` -> PASS.
4. Local Playwright static smoke -> PASS: one canonical frontend result card, 22 Browse All cards, 22 guide links, forbidden alias strings absent, console errors=0.
5. `ai check` -> PASS, run dir `/Users/mauricewen/00-AI-Fleet/outputs/check/20260526-060413-451c666b`.

### Production Evidence
1. Foundry commit `5e68a4a6b881b3fd048cd2c50c982129f4e3fcf3` was pushed to `origin/main`.
2. GitHub Actions deploy run `26435492679` completed successfully; `deploy-worker`, D1 migrations, and `deploy-frontend` all passed.
3. Production `packs.json` at `https://agent-foundry.pages.dev/data/packs.json?verify=5e68a4a6b881b3fd048cd2c50c982129f4e3fcf3` returned 22 packs, no deprecated alias IDs, no duplicate Chinese names, and no duplicate normalized English names.
4. Production Playwright smoke on `/packs?verify=5e68a4a6b881b3fd048cd2c50c982129f4e3fcf3` passed: Frontend Experience renders 1 canonical card, Browse All renders 22 cards and 22 guide links, deprecated alias strings are absent, console errors=0, console warnings=0.

## 2026-05-26 · Public Pack Maturity Floor Repair

### Trigger
After duplicate alias suppression, the public `/packs` recommendation page still displayed `基础档` for several canonical packs, including security/code-review style roles. The user requirement is stronger than "online": every canonical public pack should be enriched enough to be useful and should not look like a placeholder.

### Root Cause
The prior repair correctly separated availability from `PACK_SPEC` tier, but it left the maturity floor at `stub`. Public catalog generation therefore produced live cards whose maturity label was still `Basic`, even though the product goal is "all public packs are ready enough to use".

### Change
1. Added `scripts/enrich-public-pack-maturity.mjs` to enrich only public canonical packs whose audit tier is still `stub`.
2. The enrichment script adds real managed assets: advisor prompts, three skills, two toolkits, delivery checklist, baseline template, first-use demo, and data-collection forms.
3. The `web` generation/prebuild chain now runs enrichment before installer regeneration and tier injection, so `scripts/pack-spec-audit.py` remains the source of truth for tier labels.
4. Added `scripts/audit-public-pack-maturity.mjs` and wired it into `web` prebuild after tier injection.
5. Deprecated alias guide pages inherit canonical target maturity so historical guide URLs do not show downgraded `Basic` badges.

### Local Evidence
1. `npm --prefix web run build` -> PASS; public maturity gate reports 22 packs, 22 enriched, 0 certified, 0 stub.
2. `node scripts/audit-public-pack-maturity.mjs` -> PASS.
3. `node scripts/audit-pack-public-dedup.mjs` -> PASS.
4. `node scripts/audit-packs-page-coverage.mjs` -> PASS.
5. `node scripts/audit-pack-online-status.mjs` -> PASS.
6. `node scripts/sanitize-pack-person-names.mjs --check` -> PASS.
7. `python3 scripts/pack-spec-audit.py --summary` -> 0 certified, 22 enriched, 4 deprecated-alias stubs outside public catalog. Certified promotion now requires tracked evidence; ignored local logs no longer affect normal audits.
8. `git diff --check` -> PASS.
9. Static data smoke -> PASS: public `packs.json` has 22 packs, 22 enriched, 0 certified, 0 stub; `spellbook-code-reviewer` and `spellbook-security-auditor` are enriched; deprecated aliases are absent.
10. Local Chrome DevTools smoke on `/packs.html?verify=local-maturity` -> PASS after clicking Browse All: Code Reviewer and Security Auditor visible, Enriched visible, no Basic / `基础档`, deprecated frontend alias absent.
11. `ai check` -> PASS after deterministic audit fix, run dir `/Users/mauricewen/00-AI-Fleet/outputs/check/20260526-072940-3537d9b0`.
12. GitHub Actions deploy `26438787446` for commit `69031125d30b69c2c4172a62798978ca5ccd927c` -> PASS; production smoke showed 22 packs, 22 enriched, 0 certified, 0 stub, no Basic / Certified labels, no deprecated aliases, and Code Reviewer / Security Auditor enriched.
13. Root-cause note: local ignored `evidence/*/*-e2e.log` files caused local-only Certified labels. They were not committed because they are ignored, non-reproducible in CI, and contain historical advisor filenames; normal audits now require tracked evidence.

## 2026-05-26 · GitHub Actions Node 24 Runtime Upgrade

### Trigger
The final production deploy for the public pack maturity work succeeded, but GitHub emitted Node 20 deprecation annotations for workflow actions. GitHub's runner default switches to Node 24 on 2026-06-02, so this is release debt rather than a cosmetic warning.

### Change
1. `.github/workflows/deploy.yml` now uses `actions/checkout@v6`, `actions/setup-node@v6`, `actions/upload-artifact@v7`, `actions/download-artifact@v8`, and `cloudflare/wrangler-action@v4`.
2. `.github/workflows/skill-catalog-drift.yml` now uses `actions/checkout@v6` and `actions/setup-python@v6`.
3. Cloudflare deploy steps pin `wranglerVersion: 4.76.0` to avoid following latest by accident after the action major upgrade.

### Local Evidence
1. GitHub API action metadata check confirmed every upgraded action uses `runs.using: node24`.
2. Workflow YAML parse -> PASS for `.github/workflows/deploy.yml` and `.github/workflows/skill-catalog-drift.yml`.
3. Legacy action scan -> PASS: no remaining Node 20 action major references under `.github`.
4. `python3 scripts/check-catalog-health.py --catalog web/public/data/skills.json --strict` -> PASS after updating the script from the old `descriptionZh/tags` contract to the current catalog schema.
5. Pack audits -> PASS: public maturity, public dedup, page coverage, online status, and person-name checks.
6. `npm --prefix web run build` -> PASS.
7. `ai check` -> PASS, run dir `/Users/mauricewen/00-AI-Fleet/outputs/check/20260526-090905-e728ecb3`.

### Production Evidence
1. GitHub Actions deploy run `26443292530` -> PASS for commit `9a081d9366df33f57b714c7872adc16d89409051`.
2. Runtime action scan -> PASS: logs show the upgraded Node 24-native action majors (`actions/checkout@v6`, `actions/setup-node@v6`, `cloudflare/wrangler-action@v4`) and no `Node.js 20`, `node20`, or old action major references.
3. Production `/packs` smoke -> PASS: `/data/packs.json` returned 22 public packs, all `enriched`; Code Reviewer and Security Auditor are enriched; no deprecated aliases are publicly visible; guide/page checks contain no Basic or Certified public labels.

## 2026-05-26 · Role-Pack Git Installability and Local Zip Snapshot

### Trigger
The standalone Git tag `v2026.05.25.5` was reachable and installable, but comparison against the current Foundry public pack manifests showed 13 public packs with fewer files in the Git release than in the enriched Foundry source.

### Change
1. Updated Foundry install copy to target `openclaw-role-packs` tag `v2026.05.26.1`.
2. Regenerated all 26 pack guide pages with the new pinned Git command.
3. Synced `/Users/mauricewen/Projects/openclaw-role-packs` from Foundry and published tag `v2026.05.26.1`.
4. Updated the standalone sync script so deprecated alias pack directories keep catalog entries during future Foundry syncs.
5. Generated one local complete zip per public canonical pack under `dist/role-pack-zips-20260526-095537/`.

### Evidence
1. Foundry public pack check -> PASS: 22 public packs, 470 manifest items, 157 bundled skills, 69 bundled agents, zero missing sources, all guides use `v2026.05.26.1`.
2. Standalone repo `npm run validate` -> PASS: 26 packs and 26 catalog entries.
3. Standalone repo `npm run smoke:install` -> PASS: 26/26 packs installed, including deprecated aliases delegating to canonical targets.
4. Fresh GitHub clone of `v2026.05.26.1` -> PASS: validate and smoke install installed 26/26 packs from the remote tag.
5. Local zip smoke -> PASS: 22 zip files, every zip contains manifest/install/guide/CLAUDE/AGENTS, and every extracted zip installed exactly its manifest item count.

## 2026-05-26 · Role-Pack Release Automation

### Trigger
The Git installability and zip snapshot work proved the release by hand, but the proof still lived as a sequence of one-off shell commands. That leaves room for future drift between Foundry, the pinned `openclaw-role-packs` tag, and locally shared zip archives.

### Change
1. Added `scripts/audit-role-pack-git-release.mjs`.
   - Reads the Git URL/ref from Foundry guide generation and protected-download code.
   - Fails if the configured Git URL/ref diverges between those sources.
   - Clones the pinned standalone tag, runs standalone `npm run validate` and `npm run smoke:install`, and compares required files plus manifest payload hashes between Foundry and the cloned release.
2. Added `scripts/package-role-packs.mjs`.
   - `--scope public` packages the 22 public canonical packs plus one all-in-one public archive.
   - `--scope all` packages all 26 distribution directories plus one all-in-one full archive.
   - Emits `SHA256SUMS.txt`, `manifest-summary.json`, and `README.md`.
   - Verifies each generated zip by extracting it and running its local `install.sh`.
3. Added npm scripts: `role-packs:audit-git`, `role-packs:package`, and `role-packs:package:all`.
4. Fixed release-governance documentation IDs so the platform optimization backlog and requirements ledger no longer contain duplicate `OPT-30` / `REQ-032` entries.

### Evidence
1. `node --check scripts/audit-role-pack-git-release.mjs` -> PASS.
2. `node --check scripts/package-role-packs.mjs` -> PASS.
3. `npm run role-packs:audit-git` -> PASS: pinned tag `v2026.05.26.1`, 22 public packs, 26 distribution dirs, 550 manifest items, and 550 payload files matched.
4. `npm run role-packs:package` -> PASS: 22 per-pack archives plus `openclaw-role-packs-public-v2026.05.26.1.zip`, all zip installers smoke-verified.
5. `npm run role-packs:package:all` -> PASS: 26 per-pack archives plus `openclaw-role-packs-all-v2026.05.26.1.zip`, all zip installers smoke-verified, including deprecated alias archives with canonical siblings.

## 2026-05-27 · Job-Pack Guide Three-Part Manual Completion

### Trigger
The public pack guides still contained unfinished skill-card placeholders for imported or older SKILL/SPEC files that did not use the exact `## 是什么` / `## 怎么用` / `## 架构图` headings. The user-facing requirement is that every tool-package manual reads as complete, not as a TODO list.

### Root Cause
`scripts/generate-pack-guides.mjs` extracted only exact Chinese section headings and rendered a stub card when any of the three sections was missing. The source payload had 185 manifest skills, 57 of which lacked the exact heading set, so the visible guide layer regressed even though the install payload itself was present.

### Change
1. `scripts/generate-pack-guides.mjs` now keeps explicit three-part sections when they exist and deterministically derives missing `是什么` / `怎么用` / `架构图` content from the skill title, frontmatter description, source body excerpt, pack name, and line name.
2. Stub classes and unfinished placeholder copy were removed from generated guides.
3. Added `scripts/audit-pack-guide-skill-sections.mjs` and wired it into `web` `generate-packs` / `prebuild` plus root `npm run role-packs:audit-guides`.
4. Published standalone role-pack tag `v2026.05.27.2` after syncing the regenerated guide pages.

### Evidence
1. `node scripts/audit-pack-guide-skill-sections.mjs` -> PASS: 26 guide pages, 185 manifest skills, 185 complete skill cards.
2. Standalone `/Users/mauricewen/Projects/openclaw-role-packs` -> `npm run validate` PASS and `npm run smoke:install` PASS for 26/26 packs.
3. Standalone guide audit -> PASS: guides=26, skills=185, cards=185.
4. Published `openclaw-role-packs` commit `ccc071f` and tag `v2026.05.27.2`.
5. `npm run role-packs:audit-git` -> PASS: pinned tag `v2026.05.27.2`, 22 public packs, 26 distribution dirs, 550 manifest items, and 550 payload files matched.
6. `npm run role-packs:package` -> PASS: 22 per-pack archives plus `openclaw-role-packs-public-v2026.05.27.2.zip`, verified output at `dist/role-pack-zips-20260527-020142-public`.
7. `npm run role-packs:package:all` -> PASS: 26 per-pack archives plus `openclaw-role-packs-all-v2026.05.27.2.zip`, verified output at `dist/role-pack-zips-20260527-020147-all`.
8. `npm --prefix web run build` -> PASS; prebuild includes the guide three-part audit, person-name sanitizer, public install-source, dedup, page coverage, online-status, and maturity gates.
9. `npm run build` -> PASS at repo root.
10. `git diff --check` -> PASS.
11. `node --check scripts/generate-pack-guides.mjs && node --check scripts/audit-pack-guide-skill-sections.mjs` -> PASS.
12. `ai check` -> PASS, run dir `/Users/mauricewen/00-AI-Fleet/outputs/check/20260527-020358-3abf65f5`.
13. Local `web/out` pack smoke -> PASS: 22 public packs, 22 enriched, 0 deprecated aliases visible; sampled `data-analyst`, `strategy-roundtable-advisor`, and `frontend-engineer` guides had one complete three-part card per manifest skill and no unfinished guide placeholders.
14. Cross-surface person-name audit -> PASS: exact-name search and sanitizer check found no named cohort/person-owner strings in Foundry `web/public/packs`, exported `web/out/packs`, or standalone `openclaw-role-packs` payload/catalog surfaces.
15. GitHub Actions deploy run `26486392584` -> PASS for Foundry commit `9c4abd8`.
16. Production smoke on `https://agent-foundry.pages.dev` -> PASS: `/data/packs.json` returned 22 public packs, all enriched, 0 deprecated aliases visible; sampled `data-analyst`, `strategy-roundtable-advisor`, `frontend-engineer`, and `backend-engineer` guide pages all contained `v2026.05.27.2`, exact three-part section parity, and no named cohort/person-owner strings or unfinished guide placeholders.
