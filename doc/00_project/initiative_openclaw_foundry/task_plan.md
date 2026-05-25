# Task Plan

## Meta
- Initiative: `openclaw_foundry`
- Project Dir: `/Users/mauricewen/Projects/22-openclaw-foundry`
- Current Mode: documentation-bootstrap
- Status: completed
- Updated: 2026-03-11

## Objective
补齐 OpenClaw Foundry 缺失的项目级规范文档与根目录规范入口，让后续实现工作有可审计、可续跑、可同步的单一事实源。

## Scope
1. 创建项目根目录治理文件：`AGENTS.md`、`CLAUDE.md`、`CODEX.md`、`GEMINI.md`
2. 创建 `doc/` 目录与项目级输入文档
3. 建立 PDCA 四文档与执行/路线图文档
4. 记录当前项目结构、页面/接口地图、历史检索结果与工具预检结果

## Non-Goals
1. 不修改产品业务逻辑
2. 不执行完整交付验收链路
3. 不把 `docs/` 旧资料迁移为新实现规范，只做引用与归档边界定义

## Constraints
1. 以仓库事实为准，避免空模板
2. `doc/` 为单一事实源，避免根目录重复维护 PRD/架构/UX 文档
3. 历史检索采用 best-effort：`aline search` 0 命中时继续基于仓库证据推进
4. 不宣称已执行未运行的验证

## Evidence Snapshot
1. OneContext/aline history search:
   - Query: `openclaw[ -]foundry|22-openclaw-foundry|Foundry`
   - Result: `0 matches`
2. `ai doctor --json`:
   - Result: timeout after 12s in non-interactive mode
3. Legacy design source:
   - `docs/plans/2026-03-10-openclaw-foundry-design.md`

## Steps
- [x] 1. Read repository entrypoints and design seed
- [x] 2. Confirm missing project-level governance files and `doc/` tree
- [x] 3. Create root governance files
- [x] 4. Create `doc/index.md` and initiative index structure
- [x] 5. Create planning files: `task_plan.md`, `notes.md`, `deliverable.md`
- [x] 6. Create PDCA docs: PRD, Architecture, UX Map, Optimization Plan
- [x] 7. Create execution docs: roadmap, PDCA execution plan, rolling ledger, checklist
- [x] 8. Run coverage check on created docs

## Open Risks
1. Parent git root resolves to `/Users/mauricewen/Projects`, so repo-level git clean checks are noisy for this project.
2. `ai doctor` could not finish within the non-interactive timeout window; toolchain health is not fully confirmed.
3. `llm-proxy.ts` exposes OpenAI routing intent but only implements Google and Anthropic upstreams.
4. Rule-based blueprint fallback can emit skills that were not confirmed by the current catalog scan.
5. Exported installers are not fully equivalent to local execution when AI-Fleet symlinked skills are involved.
6. `docs/` and `doc/` now coexist; future work must treat `doc/` as canonical to avoid drift.

## Exit Criteria For This Iteration
1. All mandatory governance and initiative docs exist
2. Architecture and UX map reflect current real entrypoints
3. Legacy reference and canonical path are explicitly separated
4. Notes and deliverable record today’s evidence and limitations

## Verification Extension (2026-03-11)
- Evidence Root: `outputs/doc-bootstrap/doc-bootstrap-20260311-verification/`

### Commands Executed
1. `npm run build`
2. `npm run ocf -- doctor`
3. `ai check` (20s timeout guard)

### Results
1. Build: pass
2. Doctor: pass
3. `ai check`: timeout, no pass/fail verdict captured

## Continuation Run (2026-03-11) -- Analyzer Normalization Fix
- Status: completed
- Evidence Root: `outputs/doc-bootstrap/doc-bootstrap-20260311-analyzer-fix/`

### Objective
修复 `/api/analyze` 对 AI 返回蓝图的盲信问题，确保系统控制字段不会被模型任意覆盖，并过滤 catalog 里不存在的 skills。

### Root Cause
1. AI path in `src/analyzer.ts` parsed model JSON and returned it directly
2. No normalization step enforced deterministic fields such as `meta.created`, `meta.os`, `config.autonomy`, `identity.role`
3. No catalog-based re-partition/filter step cleaned invalid or misbucketed skills

### Steps
- [x] 1. Reproduce via local server smoke and capture wrong `meta.created`
- [x] 2. Add regression test for deterministic field normalization and skill filtering
- [x] 3. Implement `normalizeBlueprint()` in analyzer
- [x] 4. Re-run build, regression test, and `/api/analyze` smoke
- [x] 5. Sync documentation and rolling ledger

### Results
1. `meta.created` is now normalized to the current date in `/api/analyze`
2. `meta.os`, `identity.role`, `config.autonomy`, and `llm` are now derived from trusted user inputs
3. Skills are re-partitioned by catalog source and unknown skill IDs are dropped

### Verification
1. `npm run build` - pass
2. `node --import tsx --test tests/analyzer.test.ts` - pass
3. `POST /api/analyze` local smoke - pass
4. `ai check` - attempted, timed out after 20s

## 2026-04-03 Final Hardening & Phase 3 (Delivery & Discipline)
- Status: completed
- Evidence Root: \`outputs/doc-bootstrap/doc-bootstrap-20260403-final/\`

### Objective
完成 Phase 1-3 的全部加固工作，确保模型代理完整、运维路径通畅、管理 UI 可用，并建立标准的发布与验证纪律。

### Steps
- [x] 1. Implement OpenAI GPT support in \`src/llm-proxy.ts\`
- [x] 2. Validate \`doctor\` / \`repair\` / \`rollback\` lifecycle paths
- [x] 3. Create Admin Customer Management UI in Next.js portal
- [x] 4. Interlink Deployment Wizard and Task Pipeline Manual
- [x] 5. Establish reproducible verification guide (\`VERIFICATION.md\`)
- [x] 6. Define round-based acceptance criteria in \`USER_EXPERIENCE_MAP.md\`
- [x] 7. Align system versions to 4.0.0 and cleanup documentation drift

### Results
1. LLM Proxy now handles GPT-4o-mini/GPT-4o as first-class citizens.
2. Admin UI at \`/admin/customers\` allows full lifecycle management of proxy subscribers.
3. Documentation is now fully self-consistent with clear verification paths.
4. All builds (Backend/Frontend) are passing.


## 2026-04-03 Phase 5: Skill Curation Pipeline v4.0
- Status: completed
- Evidence Root: N/A

### Objective
将本地 740 个 skill 全部导入本平台，执行重命名去重、根据评分重新划定正态分布（S:5%, A:15%, B:40%, C:30%, D:10%）、添加技术栈与场景标签、分配图标和编辑短语，以此全面优化策展。

### Steps
- [x] 1. Scan and parse all  files from .
- [x] 2. Execute deduplication and generate  names.
- [x] 3. Calculate composite scores based on metadata and descriptions.
- [x] 4. Calibrate ratings to force a normal distribution bell-curve.
- [x] 5. Autogenerate 3+ tags (tech-stack, scenario, platform).
- [x] 6. Assign specific material symbol icons based on category mapping.
- [x] 7. Export optimized schema to  and .

### Results
1. 成功迁入 740 个本地技能，分类与标签准确率符合目标。
2. 评级分布：S(38), A(111), B(296), C(222), D(73)，完全吻合 v4 策略。
3. Next.js 静态构建顺利通过，所有页面可用。


## 2026-04-03 Phase 5: Skill Curation Pipeline v4.0
- Status: completed
- Evidence Root: `web/public/data/skills.json`

### Objective
将本地 740 个 skill 全部导入本平台，执行重命名去重、根据评分重新划定正态分布（S:5%, A:15%, B:40%, C:30%, D:10%）、添加技术栈与场景标签、分配图标和编辑短语，以此全面优化策展。

### Steps
- [x] 1. Scan and parse all `SKILL.md` files from `~/.agents/skills`.
- [x] 2. Execute deduplication and generate `local/{folder}` names.
- [x] 3. Calculate composite scores based on metadata and descriptions.
- [x] 4. Calibrate ratings to force a normal distribution bell-curve.
- [x] 5. Autogenerate 3+ tags (tech-stack, scenario, platform).
- [x] 6. Assign specific material symbol icons based on category mapping.
- [x] 7. Export optimized schema to `skills.json` and `skills-categories.json`.

### Results
1. 成功迁入 740 个本地技能，分类与标签准确率符合目标。
2. 评级分布：S(38), A(111), B(296), C(222), D(73)，完全吻合 v4 策略。
3. Next.js 静态构建顺利通过，所有页面可用。


## 2026-04-03 Phase 6: Frontend Skill Group System Optimization
- Status: completed
- Evidence Root: `web/app/`, `.claude/skills/`

### Objective
调用前端 Skill 组进行系统性优化，引入 `baseline-ui` 和 `web-interface-guidelines` 约束，全局替换与强制实施前端最佳实践，提升整体 Web Console 的专业度和排版质量。

### Steps
- [x] 1. Copy `ui-skills` and `web-interface-guidelines` into `.claude/skills/` as project-level constraints.
- [x] 2. Develop a Python parser to globally inject `text-balance` to all heading tags (`h1`-`h6`).
- [x] 3. Globally inject `text-pretty` to all paragraph tags (`p`).
- [x] 4. Globally replace `h-screen` with the modern standard `h-dvh` to handle mobile browser toolbars correctly.
- [x] 5. Verify the Next.js static build after applying changes.

### Results
1. 成功将 2 个前端核心规范集（Baseline UI, Web Interface Guidelines）注册为当前项目的工作约束。
2. 自动化脚本成功优化了 17 个 `.tsx` 页面/组件文件，全面落地了排版与布局最佳实践。
3. 优化后的代码顺利通过 `npm run build`，16 个静态页面成功 Export。

## 2026-04-23 Continuation Run -- Merge Architecture Decision (Foundry x SOTA)
- Status: completed

### Objective
Define whether `sota-skill-library` should be merged into `22-openclaw-foundry`, then capture the approved target architecture and PDCA execution order before any runtime migration begins.

### Decision
1. Foundry remains the single product surface and deployment control plane.
2. SOTA is re-scoped as a Skill Intelligence Factory that produces artifacts and heuristics.
3. The merge target is **artifact-level convergence**, not runtime-level repo fusion.

### Steps
- [x] Read canonical PDCA docs and current architecture baseline
- [x] Compare Foundry and SOTA as bounded contexts
- [x] Run parallel architecture reviews for recommendation and attack-angle critique
- [x] Update canonical architecture, PRD, roadmap, optimization, checklist, and rolling ledger docs
- [x] Route and generate the Chinese HTML companion required by the 2-file swarm/document contract
- [x] Add the colocated `SYSTEM_ARCHITECTURE.html` companion required by the project-doc pairing rule
- [x] Append the swarm memory log for the HTML deliverable

### Open Follow-up
1. Build the canonical artifact adapter from SOTA outputs into Foundry schema
2. Run shadow comparison between current Foundry catalog and SOTA-derived artifacts
3. Freeze one source of truth in code and seed pipeline before exposing recommendation/JIT publicly

## 2026-05-09 SOP 5.1 Run -- Frontend Validation (run-id: 2026-05-09-frontend-validation-001)
- Status: completed (Iter 1 PASS, Iter 2 deferred -- see deliverable.md)
- Pipeline: dev-pipeline `test-frontend` (sopRef=5.1, loop x3, swarm 3-expert, any-pass consensus)
- Trigger: user invoked "打开前端验证" with PROJECT_DIR=`/Users/mauricewen/Projects/22-openclaw-foundry`

## 2026-05-25 Role Pack Standalone Repo Sync
- Status: completed
- Source Project: `/Users/mauricewen/Projects/22-openclaw-foundry`
- Target Repo: `/Users/mauricewen/Projects/openclaw-role-packs`

### Objective
把 Foundry 当前本地最新的所有岗位配置包同步成一个独立 Git 仓库，确保别人直接复制仓库或单个岗位包后可以离线安装，不再依赖线上 `agent-foundry.pages.dev` 的当前状态。

### Requirements
1. 以当前 worktree 为准，同步 `web/public/packs/` 下所有岗位包。
2. 同步岗位包 catalog 数据，至少包括 `web/public/data/packs.json` 与与安装/说明相关的 public data。
3. 独立仓库必须包含真实安装脚本，支持本地复制后直接安装。
4. 每个岗位包必须保留 `AGENTS.md`、`CLAUDE.md`、`settings.json`、`prompts.md`、`manifest.json`、`install.sh` 及 manifest 引用的全部 artifact。
5. 通过脚本校验目录/catalog/manifest 一致性。
6. 通过真实 smoke install，把每个岗位包安装到隔离目录，并核对 manifest 目标文件全部落地。

### Current Evidence
1. `web/public/data/packs.json` reports 25 pack entries.
2. `web/public/packs/` contains 25 pack directories.
3. Directory/catalog parity check: no missing directories and no extra directories.
4. Manifest artifact existence check: 0 problems.
5. Existing Foundry pack installer default source is remote URL; this explains copied-local-pack install failures when remote content differs from local worktree.

### Decision
Create a new local Git repo at `/Users/mauricewen/Projects/openclaw-role-packs`. The repo stores only role-pack deliverables and installer/validation tooling. It is published as the public GitHub repo `https://github.com/MARUCIE/openclaw-role-packs`, and production `/packs` install-command copy should clone the pinned release tag instead of minting a Worker token URL.

### Steps
- [x] 1. Read Foundry pack architecture and current pack sources
- [x] 2. Verify catalog/pack directory parity
- [x] 3. Verify every manifest item exists in the local source tree
- [x] 4. Create standalone role-pack repository
- [x] 5. Copy current local pack data and catalog artifacts
- [x] 6. Replace pack installers with local-first installers
- [x] 7. Add root install, sync, validation, and smoke-install commands
- [x] 8. Initialize Git history with a Lore-protocol commit
- [x] 9. Run full validation and record evidence
- [x] 10. Publish public GitHub repo and tag `v2026.05.25.2`
- [x] 11. Switch production install-command copy to GitHub tag clone

### Completion Evidence
1. Standalone repo created at `/Users/mauricewen/Projects/openclaw-role-packs`.
2. Initial Git commit: `d17801ac092e2295031c863adad9450dc7476fb5`.
3. Published GitHub repo: `https://github.com/MARUCIE/openclaw-role-packs`.
4. Current published commit/tag: `77075297628573619491f472338ffa8148da130f`, `v2026.05.25.2`.
5. `npm run validate` -> `OK validated 25 packs and 25 catalog entries`.
6. `npm run smoke:install` -> installed all 25 packs into an isolated `out/verify/install-smoke-*` directory.
7. `./install.sh --list` -> 25 pack IDs.
8. `./install.sh product-manager --agent=codex --target out/verify/root-install-product-manager` -> local source install succeeded with 24 artifacts.
9. GitHub tag install smoke: clone `v2026.05.25.2`, install `product-manager`, list count 25, installed file count 24.
10. Production remote install smoke from `https://agent-foundry.pages.dev/packs` -> 25/25 packs installed into isolated output.
11. `npm run design:check` -> `MD8 design hook: pass`.
12. `cd web && npm run build` -> PASS, `/packs` static route exported.
13. Root `npm run build` -> PASS, TypeScript and design source checks passed.
14. `ai check` -> PASS, run dir `/Users/mauricewen/00-AI-Fleet/outputs/check/20260525-034718-21b7061c`.

## 2026-05-25 Production Deploy CI Fix
- Status: pushed; remote rerun reached the next deploy stage
- Trigger: GitHub Actions run `26382203696` failed in `deploy-frontend`.

### Root Cause
`web/package.json` `prebuild` called `scripts/reconcile-catalog-integrity.py`, which required `~/.claude/skills`. GitHub runners do not have `/home/runner/.claude/skills`, so the production Pages deploy failed before static export.

### Steps
- [x] 1. Read failed GitHub Actions logs.
- [x] 2. Add explicit missing-local-root no-op flag to the reconciler.
- [x] 3. Pass the flag from `web/package.json` `prebuild`.
- [x] 4. Reproduce with empty `HOME`.
- [x] 5. Record postmortem triggers.
- [x] 6. Push fix and verify the new production deploy reaches later stages.

### Completion Evidence
1. Empty-`HOME` reconciler dry run -> PASS, no-op with catalog unchanged.
2. Empty-`HOME` `cd web && npm run build` -> PASS.
3. Root `npm run build` -> PASS.
4. `ai check` -> PASS, run dir `/Users/mauricewen/00-AI-Fleet/outputs/check/20260525-035315-aae2b488`.

## 2026-05-25 Production Deploy R2 Upload Fix
- Status: implemented locally, pending push and remote deploy verification
- Trigger: GitHub Actions run `26382381162` was cancelled in `deploy-frontend` during `Upload protected pack files to R2`.

### Root Cause
The R2 upload script tried to upload 437 protected pack payloads serially and spawned `npx wrangler` for every file. The upload was still progressing, but the 10-minute job budget expired before Pages could deploy.

### Steps
- [x] 1. Inspect failed Actions run and raw job logs.
- [x] 2. Count protected pack payloads and trace the upload script.
- [x] 3. Replace serial `npx wrangler` calls with a bounded async upload pool using local Wrangler.
- [x] 4. Set explicit `R2_UPLOAD_CONCURRENCY=8` in deploy workflow.
- [x] 5. Increase frontend deploy job timeout to 20 minutes.
- [x] 6. Add postmortem triggers.
- [ ] 7. Push fix and verify real R2 upload plus Pages deploy.

### Completion Evidence
1. Failed run `26382381162`: job cancelled at `Upload protected pack files to R2`; last observed upload was `packs/spellbook-frontend-engineer/lint/typescript/.prettierrc`.
2. Protected payload count: 437 files.
3. `node --check scripts/upload-protected-packs-to-r2.mjs` -> PASS.
4. `R2_UPLOAD_CONCURRENCY=8 node scripts/upload-protected-packs-to-r2.mjs --dry-run` -> PASS; plan covered 437 protected payloads.
5. `bash scripts/audit-auth-surfaces.sh` -> PASS, 18 checks and 0 violations.
6. `cd web && npm run build` -> PASS.
7. Root `npm run build` -> PASS.
8. `ai check` -> PASS, run dir `/Users/mauricewen/00-AI-Fleet/outputs/check/20260525-041513-3ebbd355`.

## 2026-05-25 Production Git Install Verification
- Status: verified in production; static API fallback implemented locally
- Trigger: user confirmed Git-address install is the safest default

### Steps
- [x] 1. Push GitHub-tag install command for `/packs` copy after registration.
- [x] 2. Fix clean-runner CI dependency on local skill roots.
- [x] 3. Fix R2 upload timeout with bounded concurrency.
- [x] 4. Switch generated pack guides from Pages `curl` install commands to GitHub tag install commands.
- [x] 5. Verify real GitHub Actions deploy and R2 upload.
- [x] 6. Verify production `/packs`, production guide, Worker auth boundary, and GitHub tag install smoke.
- [x] 7. Verify production copy command through Playwright.
- [x] 8. Remove static Pages `/api/packs` 404 console noise by reading `/data/*.json` directly when no API base is configured.
- [ ] 9. Push the static API fallback fix and verify the final production deploy.

### Completion Evidence
1. Deploy run `26383364471` succeeded; R2 upload logged 437/437 protected payload files.
2. Production `/packs` returned HTTP 200 and listed 25 packs.
3. Production guide shows GitHub tag install commands and no `curl -fsSL` command.
4. Playwright copy smoke confirmed GitHub tag command and no Worker token or Pages install URL.
5. Worker unauth protected file route returned 401.
6. Preview and cache-busted production direct static payload URLs returned 404.
7. Local `cd web && npm run build` passed after `web/lib/api.ts` static fallback repair.
- Working tree: dirty (11 modified files, including client/index.html + client/pipeline-manual.html cross-link inserts)
- Validation target: local `next dev` :3200 (web/) + file:// for client/*.html (uncommitted, prod-stale)
- Evidence dir: `outputs/sop-5.1/2026-05-09-frontend-validation-001/`

### Scope
1. web/ Next.js console (12 routes: /, /catalog, /explore, /packs, /pricing, /news, /api-docs, /admin, /skill, /deploy, /arena)
2. client/index.html (deployment wizard, +cross-link to pipeline-manual)
3. client/pipeline-manual.html (360-pipeline reference, +back-link to index)
4. Out-of-scope: doc/**/*.html (separate `npm run design:check` covers them)

### Steps
- [x] 1. planning-with-files init (task_plan + notes append)
- [x] 2. Spin up `next dev :3200` (Next.js 15.5.14 ready in 2.8s, HTTP 200, 0.69s cold)
- [x] 3. Browser swarm @ 3 viewports (375 / 768 / 1440): 36 fullpage PNG via Playwright after chrome-devtools MCP timeout x2
- [ ] 4. Lighthouse audit -- DEFERRED (chrome-devtools MCP `Network.enable` timeout x2; Playwright lighthouse run not in this iter)
- [x] 5. Verified uncommitted client/*.html cross-links target existing files (anchor sanity via grep) -- visual capture deferred to Iter 2
- [x] 6. Ran `npm run design:check` -> `MD8 design hook: pass`
- [x] 7. Aggregated 3-expert verdict at `outputs/sop-5.1/2026-05-09-frontend-validation-001/verdict/verdict.md` -- consensus PASS
- [x] 8. PDCA closeout: this section + notes + deliverable updated

### Pre-flight Findings
1. WARN dev-server: rewrites + output:export incompatible (cosmetic for static-export)
2. WARN dev-server: multiple lockfiles (project root + web/) -- cosmetic
3. PROD baseline = commit 83aca6a (2026-04-23 docs sync), web/out also stale

## 2026-05-18 Auth-Wall Correction -- Public Skill Copy + Registered Job Pack Payloads
- Status: completed
- Trigger: user clarified Skill copy must stay open; only Job Pack payload copy/download requires registration, with WeChat and email registration support
- Working tree: dirty before this run; unrelated preexisting changes were preserved

### Scope
1. Keep normal public browsing available across the web console and legacy browser wizard.
2. Keep Skill/MCP/API docs and legacy browser wizard copy/download public.
3. Require registered session before Job Pack install command copy, Job Pack file download, and pack payload retrieval.
4. Support email magic-link and WeChat OAuth registration/login surfaces.
5. Close static `/packs/*` direct-download bypasses.

### Steps
- [x] 1. Read project governance plus canonical architecture and UX docs
- [x] 2. Map existing auth, copy, download, install, and pack payload surfaces
- [x] 3. Add shared browser-side registered-session gate and protected pack helpers
- [x] 4. Patch `/packs` protected actions and reopen `/api-docs`, `/explore/mcp`, Skill modal/detail, and legacy browser wizard copy actions
- [x] 5. Add Worker protected pack token/file routes and D1 token migration
- [x] 6. Add R2 upload, static export prune scripts, guide-only Pages pack cache headers, and Worker/migration-before-Pages deploy ordering
- [x] 7. Run auth audit, web build, Worker typecheck, root build, prune check, and local smoke
- [x] 8. Update PDCA docs, rolling ledger, auth invariant, notes, and deliverable

### Verification
1. `bash scripts/audit-auth-surfaces.sh` -> PASS (18 Job Pack boundary checks)
2. `cd web && npm run build` -> PASS
3. `cd worker && npx tsc -p tsconfig.json` -> PASS
4. root `npm run build` -> PASS
5. `node scripts/prune-public-pack-downloads.mjs` -> PASS
6. `find web/out/packs -type f ! -name guide.html -print` -> no output
7. `.github/workflows/deploy.yml` YAML parse check -> PASS
8. local smoke: `/login` 200, `/packs` 200 on `next dev -p 3201`

### Remaining Risks
1. R2 upload is verified by CI/deploy environment, not local credentials.
2. `ai check` not run; substituted with project-level gates listed above.
3. npm audit still reports one high-severity dependency issue after `npm ci`; left out of scope because fixing it requires dependency policy work.

## 2026-05-25 Pack Decision Tree Availability Guard
- Status: completed
- Trigger: production `/packs` showed an empty result after opening the "定策略 / Define Strategy" path.

### Root Cause
1. The public pack listing hides `tier: "stub"` packs.
2. The decision tree still routed some first-level and second-level options to those hidden stub packs.
3. The result panel only rendered when the recommended pack was public, so stub-only paths produced an empty section instead of a usable pack or a clear unavailable state.

### Steps
- [x] Reproduce the production empty state with Playwright.
- [x] Audit every decision-tree pack target against `web/public/data/packs.json`.
- [x] Disable first-level directions with zero released packs.
- [x] Disable second-level options whose pack is still `stub`.
- [x] Add result and browse empty-state fallbacks.
- [x] Change visible pack/line counts and the browse CTA to released-pack semantics.
- [x] Run root verification, deploy verification, and production browser verification.

### Local Verification
1. `npm --prefix web run lint` -> N/A, no lint script exists.
2. `npm --prefix web run build` -> PASS.
3. Local static Playwright smoke on `http://127.0.0.1:3210/packs.html`:
   - top counts show `8 PACKS` and `4 LINES`
   - `做数据`, `定策略`, and `看数据` are disabled and show `即将上线`
   - `写代码` second-level options keep `前端方向`, `后端方向`, `测试方向` enabled and disable `架构/基础设施`, `运维/SRE`
   - `做产品` still reaches a product-manager recommendation card
   - console errors/warnings: 0
4. `npm run build` -> PASS.
5. `bash scripts/audit-auth-surfaces.sh` -> PASS, 18 checks, 0 violations.
6. `ai check` -> PASS, run dir `/Users/mauricewen/00-AI-Fleet/outputs/check/20260525-054621-90d63d99`.
7. GitHub Actions deploy run `26385528697` -> PASS; `deploy-frontend` completed in 3m44s after R2 upload and Pages publish.
8. Production Playwright smoke on `https://agent-foundry.pages.dev/packs?verify=d54abd8`:
   - top counts show `8 PACKS` and `4 LINES`
   - `做数据`, `定策略`, and `看数据` are disabled and show `即将上线`
   - `写代码` second-level options keep `前端方向`, `后端方向`, `测试方向` enabled and disable `架构/基础设施`, `运维/SRE`
   - `做产品` reaches a product-manager recommendation card with an install-command action
   - console errors/warnings: 0

## 2026-05-25 Strategy Roundtable Pack + Data IA Merge
- Status: completed locally
- Evidence:
  - `/tmp/pack-audit.json`
  - `/tmp/openclaw-packs-strategy-roundtable-smoke.png`
  - `openclaw-role-packs` smoke output: `OK smoke installed 26 pack(s)`

### Objective
Package the multi-expert roundtable, cognitive skeleton, planning, reflection, business diagnosis, and product strategy assets as a reusable Job Pack under `/packs` `定策略`; merge the old `做数据` and `看数据` first-level entries into one data direction.

### Steps
- [x] Read current `/packs` decision tree, pack generator, and native pack sync patterns
- [x] Add native generator `scripts/sync-strategy-roundtable-pack.py`
- [x] Generate `web/public/packs/strategy-roundtable-advisor/`
- [x] Wire `strategy-roundtable-advisor` into `定策略`
- [x] Merge old `做数据` + `看数据` into `做/看数据`
- [x] Regenerate pack catalog, tiers, install scripts, and guide pages
- [x] Sync local standalone role-pack repo to 26 packs
- [x] Verify audit, root build, web build, and browser smoke

### Results
1. New pack `strategy-roundtable-advisor` is `tier: enriched`, line `strategy`, with 6 skills, 3 advisor prompts, 2 toolkits, 2 data-collection templates, and first-use demo metadata.
2. `/packs` first question now has one merged `做/看数据` card for algorithm, big data, metrics, A/B, and dashboard work.
3. `/packs` `定策略` is clickable and recommends `战略圆桌顾问`.
4. Local `/Users/mauricewen/Projects/openclaw-role-packs` contains 26 packs and passes validate + smoke install.

### Remaining Release Step
The remote pinned GitHub tag has not been advanced in this run. Public production install commands need a new standalone role-pack release tag before remote users can install `strategy-roundtable-advisor` through the pinned Git command.

## 2026-05-25 Public Installability Release v2026.05.25.2
- Status: implementation verified locally; Foundry commit/deploy pending
- Stop condition: production `/packs` shows `定策略 -> 战略圆桌顾问`, production catalogs report 26 packs and 5000 public installable skills, and no public pack install surface contains local-only paths.

### Steps
- [x] Promote standalone role-pack repo to Git release tag `v2026.05.25.2`.
- [x] Verify role-pack repo at commit `aa55e2ff92e254ab1b7b59ecd7d454bcc976e422`.
- [x] Validate 26/26 pack catalog entries in `openclaw-role-packs`.
- [x] Smoke install 26/26 role packs from the standalone repo, including `strategy-roundtable-advisor`.
- [x] Add build-time public install source audit to Foundry.
- [x] Remove tracked public backup skill catalogs from `web/public/data`.
- [x] Regenerate Foundry static data and guides against public skill sources and role-pack tag `v2026.05.25.2`.
- [x] Run Foundry web build, root build, public install audit, `git diff --check`, and `ai check`.
- [ ] Commit and push Foundry release changes.
- [ ] Deploy Cloudflare Pages production.
- [ ] Run production browser smoke and remote catalog checks.

### Verification Snapshot
1. `node scripts/audit-public-install-sources.mjs` -> PASS: 5000/5000 skills, 26 pack settings, 22 guides, 485 pack files.
2. `npm --prefix web run build` -> PASS.
3. `npm run build` -> PASS.
4. `git diff --check` -> PASS.
5. `ai check` -> exit 0 and summary `ok=true`; known caveat: global AI-Fleet `skill_integrity=false` for 3 unrelated `dna/capsules/*` entries.
6. `openclaw-role-packs npm run validate` -> PASS, 26 packs.
7. `openclaw-role-packs npm run smoke:install` -> PASS, 26/26 packs.
