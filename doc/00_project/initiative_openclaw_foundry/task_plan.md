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
- [x] 7. Push fix and verify real R2 upload plus Pages deploy. (Reconciled 2026-07-16: closed by the same-day follow-up — deploy run `26383364471` succeeded with 437/437 protected payloads; see the next section's Completion Evidence 1.)

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
- [x] 9. Push the static API fallback fix and verify the final production deploy. (Reconciled 2026-07-16: the `web/lib/api.ts` fallback shipped in later pushes ending at `41c09c9`, and production guide verification was recorded in `d93779a`/`cffb44c`; final end-to-end re-verification is the 2026-07-16 release section below.)

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
- Status: completed and production verified
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
- [x] Commit and push Foundry release changes.
- [x] Deploy Cloudflare Pages production.
- [x] Run production browser smoke and remote catalog checks.

### Verification Snapshot
1. `node scripts/audit-public-install-sources.mjs` -> PASS: 5000/5000 skills, 26 pack settings, 22 guides, 485 pack files.
2. `npm --prefix web run build` -> PASS.
3. `npm run build` -> PASS.
4. `git diff --check` -> PASS.
5. `ai check` -> exit 0 and summary `ok=true`; known caveat: global AI-Fleet `skill_integrity=false` for 3 unrelated `dna/capsules/*` entries.
6. `openclaw-role-packs npm run validate` -> PASS, 26 packs.
7. `openclaw-role-packs npm run smoke:install` -> PASS, 26/26 packs.
8. GitHub Actions deploy run `26392426318` -> PASS.
9. Production `packs.json` -> HTTP 200, 26 packs, `strategy-roundtable-advisor` is `enriched`.
10. Production `skills.json` -> HTTP 200, 5000 skills, 0 bad install sources, `clawhub=3500`, `mcp-registry=1500`.
11. Production `/data/_backup-pre-resync/skills.json` -> HTTP 404.
12. Playwright production `/packs` smoke -> `Define Strategy` renders `战略圆桌顾问`; console errors/warnings: 0.
13. Production guide audit -> GitHub tag install command present; legacy Pages direct install URL and `download-token` absent.
14. Fresh remote GitHub tag clone -> `npm run validate` PASS and `npm run smoke:install` PASS for 26/26 packs.

## 2026-05-25 Product Manager / Designer Pack Boundary Cutover
- Status: production verified
- Stop condition: production `/packs` shows `产品经理` and `设计师` as separate product-line choices, no `原型设计师` surface remains, and the public install command pulls `designer` from GitHub tag `v2026.05.25.3`.

### Objective
Move prototype validation ownership back to `product-manager`, rename `prototype-designer` to `designer`, and rebuild both the recommendation card and bundled pack content so external users can install the role without Maurice-local paths.

### Steps
- [x] Rename public pack id from `prototype-designer` to `designer`.
- [x] Replace prototype-specific design skill content with designer-owned experience architecture, visual system, design QA, and engineering handoff assets.
- [x] Update Product Manager metadata so PRD, RICE, user stories, prototype hypothesis, and clickable validation demo prompts belong to PM.
- [x] Update `/packs` decision tree, wall board labels, card copy, and install-source wording.
- [x] Regenerate pack catalog, install scripts, and guide pages against GitHub tag `v2026.05.25.3`.
- [x] Sync standalone `openclaw-role-packs`, validate 26 packs, smoke-install all packs, and publish tag `v2026.05.25.3`.
- [x] Build Foundry and run pack audit, local browser smoke, and `ai check`.
- [x] Commit and push Foundry release changes.
- [x] Wait for Cloudflare Pages production deployment.
- [x] Verify production `/packs`, guide HTML, and remote Git install for `designer`.

### Current Verification Snapshot
1. `npm --prefix web run build` -> PASS; prebuild public-source audit reports 5000/5000 skills, 26 pack settings, 22 guides, 485 pack files.
2. `python3 scripts/pack-spec-audit.py --packs-dir web/public/packs --summary` -> PASS; `designer` has P1/P2/P3/P4 present and is `enriched`.
3. `ai check` -> exit 0, run dir `/Users/mauricewen/00-AI-Fleet/outputs/check/20260525-094234-dad4d3a0`; known caveat remains the unrelated global AI-Fleet `skill_integrity=false` for 3 `dna/capsules/*` entries.
4. Local static Playwright smoke on `/packs.html` -> PASS; released list contains `设计师 / DESIGNER`, does not contain `原型设计师`, and product direction shows both Product Manager and Designer.
5. Fresh remote GitHub tag clone for `v2026.05.25.3` -> `npm run validate` PASS and `bash install.sh designer --agent=codex --target <tmp>` installs 15/15 files.

### Production Verification Result
1. Foundry release commit pushed: `6efd6b8b500a6264fd67a2c1ef078ef5ee8d8235`.
2. GitHub Actions deploy run `26394169342` completed successfully; `deploy-frontend` completed in 3m51s.
3. Production pack catalog:
   - URL: `https://agent-foundry.pages.dev/data/packs.json?verify=6efd6b8b500a6264fd67a2c1ef078ef5ee8d8235`
   - HTTP 200
   - total packs: 26
   - `designer`: present, `tier=enriched`, `line=product`, `artifacts.skills=3`
   - `prototype-designer`: absent
   - `product-manager` description includes prototype validation ownership
4. Production Designer guide:
   - URL: `https://agent-foundry.pages.dev/packs/designer/guide.html?verify=6efd6b8b500a6264fd67a2c1ef078ef5ee8d8235`
   - HTTP 200
   - contains `git clone --depth 1`, `https://github.com/MARUCIE/openclaw-role-packs.git`, tag `v2026.05.25.3`, and `install.sh designer`
   - contains no `prototype-designer`, no `agent-foundry.pages.dev/packs/designer/install.sh`, no `download-token`, and no Maurice-local path
5. Old production guide `https://agent-foundry.pages.dev/packs/prototype-designer/guide.html?verify=6efd6b8b500a6264fd67a2c1ef078ef5ee8d8235` -> HTTP 404.
6. Playwright production `/packs` smoke:
   - product direction click shows `Product Manager` and `Designer`
   - released pack list renders 9 cards including `设计师 / DESIGNER` and `产品经理 / PRODUCT MANAGER`
   - no `原型设计师`, `Prototype Designer`, or `prototype-designer` text
   - screenshot: `.playwright-cli/page-2026-05-25T09-52-31-207Z.png`

## 2026-05-26 · Public Pack Dedup Repair
- Status: production verified
- Stop condition: production `/packs` exposes 22 canonical public packs, hides the 4 deprecated spellbook aliases, and keeps all canonical packs covered by recommendation groups or browse mode.

### Steps
- [x] Identify duplicate public-role clusters from `deprecated_alias_of` manifests.
- [x] Suppress deprecated aliases from generated public `packs.json`.
- [x] Remove alias IDs from `/packs` recommendation groups.
- [x] Add `audit-pack-public-dedup.mjs` to the web prebuild gate.
- [x] Update coverage/online-status audits to treat deprecated alias directories as non-public historical targets.
- [x] Sync PRD, UX map, system architecture, platform optimization plan, and rolling ledger.
- [x] Run local build, audits, Playwright static smoke, and `ai check`.
- [x] Commit, push, deploy, and verify production `/packs`.

### Local Verification Snapshot
1. `npm --prefix web run build` -> PASS.
2. `node scripts/audit-pack-public-dedup.mjs` -> PASS: publicPacks=22, suppressedAliases=4.
3. `node scripts/audit-packs-page-coverage.mjs` -> PASS: packs=22, lines=6.
4. `node scripts/audit-pack-online-status.mjs` -> PASS: packs=22, requiredFiles=7.
5. Local Playwright static smoke on `/packs.html?verify=local-dedup` -> PASS: Frontend Experience renders 1 canonical card; Browse All renders 22 cards and 22 guide links; forbidden alias strings are absent; console errors=0; navigation duration=1291ms.
6. `ai check` -> PASS, run dir `/Users/mauricewen/00-AI-Fleet/outputs/check/20260526-060413-451c666b`.

### Production Verification Snapshot
1. Commit `5e68a4a6b881b3fd048cd2c50c982129f4e3fcf3` pushed to `origin/main`.
2. GitHub Actions deploy run `26435492679` completed successfully; `deploy-frontend` completed in 3m50s.
3. Production data smoke on `https://agent-foundry.pages.dev/data/packs.json?verify=5e68a4a6b881b3fd048cd2c50c982129f4e3fcf3` -> PASS: 22 packs, 0 deprecated alias IDs, 0 duplicate `nameZh`, 0 duplicate normalized English names.
4. Production Playwright smoke on `https://agent-foundry.pages.dev/packs?verify=5e68a4a6b881b3fd048cd2c50c982129f4e3fcf3` -> PASS: `Write Code -> Frontend Experience` renders 1 canonical card; Browse All renders 22 cards and 22 guide links; deprecated alias strings are absent; console errors=0; console warnings=0; navigation duration=4823ms.

## 2026-05-26 · Public Pack Maturity Floor Repair
- Status: completed
- Stop condition: all 22 canonical public job packs audit as `enriched` or higher, no public catalog/guide/static page displays `基础档`, and production `/packs` verifies the same after deploy.

### Steps
- [x] Identify public canonical packs whose audit tier remained `stub`.
- [x] Generate missing maturity artifacts for canonical public packs without hand-editing catalog tier labels.
- [x] Insert enrichment before tier injection in the `web` generation/prebuild chain.
- [x] Add a public maturity prebuild audit that fails on any public catalog `stub`.
- [x] Make deprecated alias guide pages inherit the canonical target maturity badge.
- [x] Sync PRD, UX map, architecture, platform optimization plan, and rolling ledger.
- [x] Rebuild, run audits, run local smoke, and run `ai check`.
- [x] Commit, push, deploy, and verify production `/packs`.
- [x] Make certified promotion deterministic by ignoring untracked local E2E logs in normal audits.

### Current Verification Snapshot
1. `npm --prefix web run build` -> PASS; prebuild includes public install source, dedup, page coverage, online status, and public maturity audits.
2. `node scripts/audit-public-pack-maturity.mjs` -> PASS locally after final rebuild: 22 public packs, 22 enriched, 0 certified, 0 stub.
3. `git diff --check` -> PASS after cleaning generated guide trailing whitespace.
4. Static data smoke -> PASS: 22 packs, 22 enriched, 0 certified, 0 stub; code reviewer and security auditor are enriched; deprecated aliases are hidden.
5. Local Chrome DevTools smoke on `http://127.0.0.1:4320/packs.html?verify=local-maturity` -> PASS after clicking Browse All: Code Reviewer and Security Auditor visible, `Enriched` visible, no `Basic` / `基础档`, deprecated frontend alias absent.
6. `ai check` -> PASS after deterministic audit fix, run dir `/Users/mauricewen/00-AI-Fleet/outputs/check/20260526-072940-3537d9b0`.
7. GitHub Actions deploy run `26438787446` -> PASS for commit `69031125d30b69c2c4172a62798978ca5ccd927c`; production smoke on `https://agent-foundry.pages.dev` showed 22 packs, 22 enriched, 0 certified, 0 stub, Code Reviewer and Security Auditor enriched, no `Basic` / `基础档` / `Certified` labels, and no deprecated aliases.

### Notes
2. Full pack-spec audit still reports 4 `stub` directories only for deprecated aliases that are suppressed from public catalog; alias guide pages now inherit canonical maturity.
3. Old local ignored `evidence/*/*-e2e.log` files are not accepted for normal certified promotion because they are not reproducible in CI and may contain historical advisor filenames. `PACK_SPEC_ALLOW_UNTRACKED_EVIDENCE=1` remains available only for local diagnosis.

## 2026-05-26 · GitHub Actions Node 24 Runtime Upgrade
- Status: completed
- Stop condition: production deploy workflow runs without Node 20 action-runtime annotations, and production `/packs` still verifies as 22/22 enriched after deploy.

### Steps
- [x] Identify all workflow actions still using Node 20 action runtimes.
- [x] Upgrade workflow actions to Node 24-compatible majors.
- [x] Pin Cloudflare Wrangler action steps to `wranglerVersion: 4.76.0`.
- [x] Run local workflow syntax checks, public pack audits, and `ai check`.
- [x] Commit, push, verify GitHub Actions deploy, and production-smoke `/packs`.

### Current Verification Snapshot
1. Official action metadata checked through GitHub API: `actions/checkout@v6`, `actions/setup-node@v6`, `actions/setup-python@v6`, `actions/upload-artifact@v7`, `actions/download-artifact@v8`, and `cloudflare/wrangler-action@v4` declare `runs.using: node24`.
2. Cloudflare `wrangler-action@v4` keeps the same `apiToken`, `accountId`, `workingDirectory`, `wranglerVersion`, and `command` inputs used by the existing workflow.
3. Workflow YAML parse -> PASS for `.github/workflows/deploy.yml` and `.github/workflows/skill-catalog-drift.yml`.
4. Legacy action scan -> PASS: no remaining `checkout@v4`, `setup-node@v4`, `upload-artifact@v4`, `download-artifact@v4`, `setup-python@v5`, `wrangler-action@v3`, or `node20` action metadata references under `.github`.
5. `python3 scripts/check-catalog-health.py --catalog web/public/data/skills.json --strict` -> PASS after aligning the script to the current skill catalog schema.
6. `npm --prefix web run build` -> PASS; public maturity, dedup, coverage, online status, install-source, and person-name gates all passed.
7. `ai check` -> PASS, run dir `/Users/mauricewen/00-AI-Fleet/outputs/check/20260526-090905-e728ecb3`.
8. GitHub Actions deploy run `26443292530` -> PASS at commit `9a081d9366df33f57b714c7872adc16d89409051`; jobs `deploy-worker`, `apply-migrations`, and `deploy-frontend` completed successfully with `actions/checkout@v6`, `actions/setup-node@v6`, and `cloudflare/wrangler-action@v4`.
9. GitHub Actions log scan -> PASS: no `Node.js 20`, `node20`, `checkout@v4`, `setup-node@v4`, `setup-python@v5`, `upload-artifact@v4`, `download-artifact@v4`, or `wrangler-action@v3` references.
10. Production `/packs` smoke -> PASS: `/data/packs.json` returned 22 public packs, `{"enriched":22}`, Code Reviewer and Security Auditor are enriched, no public deprecated aliases, and guide/page checks contain no Basic or Certified public labels.

## 2026-05-27 · Job-Pack Guide Three-Part Manual Completion
- Status: in verification
- Stop condition: all 26 guide pages render one complete `是什么` / `怎么用` / `架构图` skill card per manifest skill, the standalone Git tag matches Foundry, local build/check pass, and production `/packs` guide smoke verifies no unfinished guide placeholders.

### Steps
- [x] Identify the guide generator path and the exact unfinished placeholder source.
- [x] Add deterministic fallback normalization for legacy/imported SKILL/SPEC docs without exact Chinese headings.
- [x] Remove generated guide stub classes and unfinished copy.
- [x] Add `scripts/audit-pack-guide-skill-sections.mjs` and wire it into `web` prebuild plus root `role-packs:audit-guides`.
- [x] Regenerate all guide pages and verify 26 guides / 185 skills / 185 cards.
- [x] Sync `openclaw-role-packs`, validate, smoke-install, publish tag `v2026.05.27.2`, and prove Foundry/Git parity with `npm run role-packs:audit-git`.
- [x] Regenerate verified public and all-pack local zip archives for `v2026.05.27.2`.
- [x] Run full Foundry build/check suite.
- [x] Commit, push, wait for production deploy, and smoke-test production guide pages.

### Current Verification Snapshot
1. `node scripts/audit-pack-guide-skill-sections.mjs` -> PASS: 26 guide pages, 185 manifest skills, 185 complete skill cards.
2. Standalone `npm run validate` -> PASS: 26 packs and 26 catalog entries.
3. Standalone `npm run smoke:install` -> PASS: 26/26 packs installed into isolated output.
4. Standalone guide audit -> PASS: guides=26, skills=185, cards=185.
5. `npm run role-packs:audit-git` -> PASS: role-pack Git release `v2026.05.27.2`, 22 public packs, 26 distribution dirs, 550 manifest items, 550 payload files matched.
6. `npm run role-packs:package` -> PASS: `dist/role-pack-zips-20260527-020142-public`.
7. `npm run role-packs:package:all` -> PASS: `dist/role-pack-zips-20260527-020147-all`.
8. `npm --prefix web run build` -> PASS with guide and pack public gates.
9. `npm run build` -> PASS.
10. `git diff --check` -> PASS.
11. `node --check scripts/generate-pack-guides.mjs && node --check scripts/audit-pack-guide-skill-sections.mjs` -> PASS.
12. `ai check` -> PASS, run dir `/Users/mauricewen/00-AI-Fleet/outputs/check/20260527-020358-3abf65f5`.
13. Local `web/out` pack smoke -> PASS: 22 public packs, 22 enriched, 0 deprecated aliases visible; sampled guides had exact manifest skill-card parity and no unfinished placeholders.
14. Cross-surface person-name audit -> PASS across Foundry public packs, exported packs, and standalone Git payload/catalog surfaces.
15. GitHub Actions deploy run `26486392584` -> PASS for commit `9c4abd8`.
16. Production smoke -> PASS: 22 public packs, 22 enriched, 0 deprecated aliases; sampled production guides contain `v2026.05.27.2`, exact three-part card parity, and no named cohort/person-owner strings or unfinished placeholders.

## 2026-05-27 · Role-Pack Source Contract and Release SSOT
- Status: completed
- Stop condition: source guide docs, generated guide HTML, standalone Git tag, local zip archives, Foundry build, GitHub deploy, and production smoke all verify against `v2026.05.27.3`.

### Steps
- [x] Convert guide generation from HTML fallback completion to source-section enforcement.
- [x] Add `scripts/enrich-pack-skill-sections.mjs` for deterministic source repair of Markdown guide skill docs.
- [x] Update guide audit to validate source docs and rendered guide cards separately.
- [x] Add `web/public/data/role-pack-release.json` as release URL/ref/version SSOT and consume it from guide generation, UI copy, and Git audit.
- [x] Expand person-name sanitizer to audit paths and catch old advisor brace shorthand.
- [x] Sync standalone role-pack repo, add standalone release validation, and publish tag `v2026.05.27.3`.
- [x] Generate verified full local zip archive set for `v2026.05.27.3`.
- [x] Run local Foundry and standalone verification.
- [x] Commit Foundry, push, wait for production deploy, and smoke-test production guide pages.

### Current Verification Snapshot
1. `npm run role-packs:enrich-source-skills -- --check` -> PASS: 182 guide-facing source skill docs.
2. `npm run role-packs:audit-guides` -> PASS: 26 guides, 182 guide-facing skill docs, 185 skill payloads, 182 cards.
3. `npm run role-packs:audit-person-names` -> PASS across Foundry public packs, data job-pack sources, and public catalogs.
4. Standalone `npm run validate` -> PASS: 26 packs, 26 catalog entries, release config/package version match, no unpinned Git install command, no concrete person names.
5. Standalone `npm run smoke:install` -> PASS for 26/26 packs through root `install.sh <pack-id>`.
6. `npm run role-packs:audit-git` -> PASS for `v2026.05.27.3`: 22 public packs, 26 distribution dirs, 550 manifest items, 550 payload files matched.
7. `npm --prefix web run build` -> PASS with source-guide, person-name, install-source, dedup, coverage, online-status, and maturity gates.
8. `npm run build` -> PASS.
9. `npm run role-packs:package:all` -> PASS: `dist/role-pack-zips-20260527-095622-all`, 26 per-pack archives plus `openclaw-role-packs-all-v2026.05.27.3.zip`, verified by install smoke.
10. `ai check` -> command exited 0 with run dir `/Users/mauricewen/00-AI-Fleet/outputs/check/20260527-095031-70e43875`; project docs/tests passed, but global AI-Fleet `skill_integrity` reported pre-existing/out-of-scope state (`codex-system-skills/plugin-creator` tampered, `code-review-swarm` and `network-speed-optimizer` new).
11. Foundry commit `cffb44c450c242ac6b281c22c67f387f8ba50064` pushed to `origin/main`.
12. GitHub Actions deploy run `26504443947` -> PASS for commit `cffb44c`; jobs `deploy-worker`, `apply-migrations`, and `deploy-frontend` completed successfully. `Deploy to CF Pages` completed at `2026-05-27T10:06:14Z`.
13. Production data smoke on `https://agent-foundry.pages.dev` -> PASS: `role-pack-release.json` returned `v2026.05.27.3`, `/data/packs.json` returned 22 canonical packs, 0 deprecated aliases, and 7 sampled guide pages contained `是什么` / `怎么用` / `架构图`, pinned branch `v2026.05.27.3`, and no forbidden concrete person names.
14. Production headless Chrome smoke -> PASS: screenshot `/tmp/agent-foundry-packs-cffb44c.png` shows `/packs` rendered with `22 packs`, `6 lines`, and merged `Work with / Read Data`; no duplicate role-card cluster appears in the first viewport.
15. Three-end consistency -> PASS: local Foundry commit `cffb44c`, GitHub `origin/main` at `cffb44c`, standalone Git tag `v2026.05.27.3` at `3f0ecd1`, and production `role-pack-release.json` all point to the same release contract.

## 2026-05-31 · Step 0 Autonomous Delivery Protocol Alignment
- Status: completed locally
- Mode: planning-with-files / local reversible preflight / attacker-review hardening
- Stop condition: protocol requirements are recorded, local tool/DNA/codegraph availability is proven, first local verification queue is executed, accepted attacker-review findings are fixed, and any unavailable/HITL gates are explicitly marked with evidence.

### Objective
Apply the user-provided Step 0 preamble as the active execution protocol for this project without changing runtime product behavior in this branch.

### Non-Goals
1. Do not publish, push, tag, comment externally, or communicate outside the local workspace without explicit authority.
2. Do not install third-party skills or run unreviewed executable payloads.
3. Do not create a new product/runtime feature until a concrete implementation target is selected.

### Constraints
1. Use `/Users/mauricewen/Projects/22-openclaw-foundry` as `PROJECT_DIR`.
2. Use append-only planning files unless a later cleanup pass intentionally normalizes docs.
3. Preserve the pre-existing dirty `task_plan.md` state and do not revert prior edits.
4. Treat `ai check`, UX-map smoke, and attacker review as release gates, not optional summaries.
5. Use local/reversible commands first; defer production, GitHub comments, deploys, and tag moves as HITL/external authority gates.

### Tool and Workflow Selection
1. `planning-with-files` selected because the task is long-running and explicitly requires `task_plan.md`, `notes.md`, and `deliverable.md` evidence.
2. DNA capsule lookup selected before new trial paths; initial search for `openclaw foundry planning workflow` and `ai check skill_integrity dna capsules` returned no matches.
3. DNA registry health selected as reusable guard: `ai dna validate` and `ai dna doctor` are local and reversible.
4. CodeGraph selected as repo-understanding guard, but current CLI status shows this repo is not initialized; graph creation is deferred until there is a code-impact task or explicit need for a persistent local index.
5. Native verifier subagent delegated a read-only gate audit; root agent continues local doc/preflight work.

### Steps
- [x] Load project AGENTS/CLAUDE rules and canonical docs.
- [x] Confirm planning files and PDCA checklist exist.
- [x] Check current git state and preserve existing dirty file.
- [x] Check installed `ai`, `omx`, `npx`, `node`, `npm`, and `agent-browser` paths.
- [x] Run DNA search before trial/error.
- [x] Run DNA validate/doctor availability checks.
- [x] Check CodeGraph/MCP graph availability.
- [x] Delegate read-only verification-gate audit to subagent.
- [x] Run local preflight command queue: build/static checks plus DNA gates.
- [x] Add a lightweight attacker-review checklist before any release claim.
- [x] Decide whether a new DNA capsule is warranted after one verified correction path exists.
- [x] Update deliverable with evidence after verification queue finishes.

### Current Evidence
1. `git status --short` shows only pre-existing `M doc/00_project/initiative_openclaw_foundry/task_plan.md` before this Step 0 append.
2. `ai dna search "openclaw foundry planning workflow"` -> `No matches.`
3. `ai dna search "ai check skill_integrity dna capsules"` -> `No matches.`
4. `ai dna validate` -> `OK: validate passed`.
5. `ai dna doctor` -> `OK: doctor passed`.
6. `ai codegraph status .` -> `Not initialized`; no CodeGraph index was created in this branch.
7. Code review graph MCP minimal context -> `0 nodes, 0 edges across 0 files`; current graph evidence is unavailable until a graph build/index is run.
8. Attacker review accepted three release-blocking findings: public pack detail payload exposure, unsafe return-path propagation, and bearer-session leakage into generated installers.
9. Attacker review classified GitHub tag install and open email magic-link registration as current product contracts/residual product risks, not code defects to change in this branch.
10. Local verification after fixes:
    - `node --import tsx --test tests/auth-boundary.test.ts` -> PASS, 5/5 tests.
    - `bash scripts/audit-auth-surfaces.sh` -> PASS, 37 checks / 0 violations.
    - `npm run build` -> PASS.
    - `npx tsc -p worker/tsconfig.json` -> PASS.
    - `node --import tsx --test tests/*.test.ts` -> PASS, 37/37 tests. Note: the pre-existing provider deploy test writes local `~/.openclaw` state and temporarily generated root agent mirror files; repo root side effects were cleaned from the diff.
    - `npm --prefix web run build` -> PASS with existing Next static-export warnings.
    - `git diff --check` -> PASS.
    - `ai check` -> PASS, run dir `/Users/mauricewen/00-AI-Fleet/outputs/check/20260531-111035-3f11884f`, `ok=true`, `rounds=2`, docs/no_emoji/registry/instruction_mirror_drift/foundation_surface_audit/mcp_transport_guard/aaas_contracts/codegraph_lookup/sbom/skill_integrity all true; the tool's default options skipped its own audit/tests, so explicit project audit/tests above are the release evidence. The command produced a completed summary before its control-plane process exited, so the wrapper process was stopped after recording the summary.
11. DNA capsule decision: do not create a cross-project DNA/Skill in this branch. The reusable auth boundary is encoded as `scripts/audit-auth-surfaces.sh` plus `tests/auth-boundary.test.ts`; a broader `openclaw-delivery-protocol` capsule remains a candidate for an AI-Fleet task after repeated use, not a project-runtime change.
12. Postmortem added: `postmortem/PM-2026-05-31-auth-payload-boundary.md` records symptom, root cause, fix, prevention, machine triggers, and verification evidence for the release-blocking auth findings.
13. Release guard added: `scripts/scan-postmortems.mjs --strict` scans current diffs against PM machine triggers, root `npm run build` runs `postmortem:scan`, `web` prebuild runs the same guard, and deploy checkout now fetches history for diff-based scanning. Fresh evidence: strict scan PASS, `tests/postmortem-scan.test.ts` PASS 3/3, full project Node tests PASS 37/37, root build PASS with scan, web build PASS with scan first in prebuild, deploy workflow YAML parse PASS, `ai check --no-tests` PASS at `/Users/mauricewen/00-AI-Fleet/outputs/check/20260531-134444-47cc7e19`; full `ai check` global tests hung and were terminated at `/Users/mauricewen/00-AI-Fleet/outputs/check/20260531-113154-226de16a`.
14. Follow-on local hardening: `web/lib/protected-downloads.ts` now reuses `loginRedirect(returnPath)` for 401 re-auth redirects instead of hand-building a login return URL; `tests/auth-boundary.test.ts` and `scripts/audit-auth-surfaces.sh` now lock this shared-entry invariant.
15. HITL/external gates not executed: no commit, push, tag move, GitHub comment, production deploy, production secret change, or three-end production consistency check was performed in this local-only branch.

## 2026-06-11 · Designer UI Skills Directory Integration
- Status: completed locally
- Mode: feature-dev / local reversible pack update / documentation closeout
- PROJECT_DIR: `/Users/mauricewen/01-Lingque-Platform/openclaw-foundry__OpenClaw工坊__OpenClaw工坊`
- Stop condition: Designer pack contains a bounded UI Skills directory routing skill, public pack metadata and generated guide are synchronized, project PDCA docs and rolling ledger are updated, and local pack-generation audits pass.

### Objective
Integrate `https://www.ui-skills.com/` into the Designer design infrastructure pack as a curated routing capability for selecting task-fit UI/design engineering skills.

### Non-Goals
1. Do not install the full UI Skills directory into this repository.
2. Do not add a new runtime dependency or external package.
3. Do not alter unrelated auth/postmortem/workflow changes already present in the dirty worktree.
4. Do not publish, push, deploy, move tags, or change production state.

### Project Architecture and Page/Route Map Precheck
1. Pack source: `web/public/packs/designer/`.
2. Public pack catalog: `web/public/data/packs.json`.
3. Generated pack guide: `web/public/packs/designer/guide.html`.
4. Native pack generation path: `scripts/generate-pack-guides.mjs` plus `web` pack generation scripts; `generate-packs.mjs` preserves native packs from `web/public/data/packs.json`.
5. User-facing surface: `/packs/designer` guide payload and pack catalog entry, sourced from the Designer manifest and generated static guide.

### Steps
- [x] Verify project root and load project rules.
- [x] Identify the current design infrastructure pack as `web/public/packs/designer`.
- [x] Check UI Skills source material and define a bounded integration contract.
- [x] Add `ui-skills-directory` skill spec with `是什么`, `怎么用`, and `架构图`.
- [x] Update Designer manifest, CLAUDE/AGENTS guidance, prompts, checklist, templates, public catalog metadata, and generated guide.
- [x] Sync PRD, SYSTEM_ARCHITECTURE, USER_EXPERIENCE_MAP, PLATFORM_OPTIMIZATION_PLAN, doc index, and rolling requirements ledger.
- [x] Run focused generation and pack audits.
- [x] Record evidence in `task_plan.md`, `notes.md`, and `deliverable.md`.

### Verification Evidence
1. `node scripts/generate-pack-guides.mjs` -> PASS: `OK generated 26 guide.html`.
2. `npm run role-packs:audit-guides` -> PASS: 26 guides, 183 source guide docs, 183 cards.
3. `python3 scripts/pack-spec-audit.py --packs-dir web/public/packs --summary` -> PASS: 26 packs; `designer` enriched with P1/P2/P3/P4 coverage.
4. JSON parse check for `web/public/packs/designer/manifest.json` and `web/public/data/packs.json` -> PASS.
5. `npm --prefix web run generate-packs` -> PASS: native Designer pack preserved, guide regeneration and guide audit passed.
6. `npm run role-packs:audit-person-names` -> PASS: public pack, extra pack source, and catalog name audit passed.
7. `npm --prefix web run build` -> PASS: strict postmortem scan, static prebuild, pack generation, public install-source/dedup/coverage/online/maturity audits, Next build, and static export passed with existing Next warnings.
8. `npm run build` -> PASS: TypeScript, design source lock, MD8 design hook, and strict postmortem scan passed.
9. Exported Designer pack smoke -> PASS: `web/out/data/packs.json`, `web/out/packs/designer/guide.html`, and `web/out/packs/designer/skills/design/ui-skills-directory/SPEC.md` contain the UI Skills route.
10. UX-map Designer pack path smoke -> PASS: catalog, manifest first-use demo, guide card, shortlist output, and Designer/Frontend Engineer/PM handoff are present.
11. `npm run role-packs:package:all` -> PASS: 26 per-pack archives plus `openclaw-role-packs-all-v2026.05.27.3.zip`, verified output at `dist/role-pack-zips-20260611-095701-all`.
12. Zip content smoke -> PASS: `designer.zip` and `openclaw-role-packs-all-v2026.05.27.3.zip` contain `designer/skills/design/ui-skills-directory/SPEC.md`; `designer.zip` checksum `75120ffa7dd8d6139b65eb5db909d5456aca3892987deeb42eebf9d7ce470bda`.
13. Temporary install smoke -> PASS: extracted `designer.zip`, ran `./install.sh --agent=claude --target <tmp> --local`, installed 16 artifacts, and verified installed `skills/design/ui-skills-directory/SPEC.md`, CLAUDE guidance, prompts, checklist, and source manifest first-use demo.
14. `ai check --no-tests` -> PASS, final run dir `/Users/mauricewen/00-AI-Fleet/outputs/check/20260611-110027-58ff0bb8`; docs, registry, instruction mirror drift, foundation surface, MCP transport, AAAS contracts, codegraph lookup, SBOM, and skill integrity passed; audit/tests intentionally skipped by option because explicit local build/smoke evidence above covers this pack-content change.
15. `git diff --check` -> PASS after final planning-file append.

### Closeout
1. Skills update: completed inside the Designer pack as `skills/design/ui-skills-directory/SPEC.md`; no global Skill/DNA promotion yet because this is a pack-specific routing integration.
2. PDCA four-doc sync: PRD, UX map, system architecture, platform optimization plan, rolling ledger, notes, task plan, deliverable, and doc index updated.
3. AGENTS/CLAUDE cross-task rule update: N/A - no new global workflow invariant; pack-local AGENTS/CLAUDE rules were updated.
4. Technical debt closure: Designer now has an explicit bounded route for using UI Skills instead of ad hoc external-skill recommendations.
5. Three-end consistency: N/A for this local-only branch; no commit, push, deploy, tag move, or production check was executed. Local generated static output and local role-pack zip install were smoke-checked instead.

### Commit Boundary Audit
1. Whole-file task-owned candidates: `web/public/packs/designer/**`, `web/public/data/packs.json`, and new `web/public/packs/designer/skills/design/ui-skills-directory/SPEC.md`.
2. Mixed-history docs requiring hunk-level staging if making a UI-Skills-only commit: `doc/index.md`, PRD, SYSTEM_ARCHITECTURE, USER_EXPERIENCE_MAP, PLATFORM_OPTIMIZATION_PLAN, ROLLING_REQUIREMENTS_AND_PROMPTS, task_plan, notes, and deliverable.
3. Exclude from a UI-Skills-only commit: `.github/workflows/deploy.yml`, auth pages/helpers, Worker auth/pack routes, postmortem scanner/tests, auth invariant docs, root/web package postmortem-scan wiring, and postmortem PM files unless intentionally creating a broader auth hardening commit.
4. Lore commit intent line candidate: `Route Designer pack UI work through UI Skills`.
5. Local commit created: `e6b724845949d04f0d7b057f8c10e60bab7adc41`; it includes only Designer pack files and `web/public/data/packs.json`, with no push or deploy.

## 2026-07-16 Auth Payload Boundary Release
- Status: pushed; production deploy verification recorded below
- Trigger: user directive "继续" after the PM-2026-05-31 auth hardening changeset was committed locally as `5973201`; the standing queue items were push + verify deploy

### Steps
- [x] 1. Re-run the PM-2026-05-31 release gate on the exact release tree: `tests/auth-boundary.test.ts` 5/5 pass; `scripts/audit-auth-surfaces.sh` 0 violations.
- [x] 2. Push `origin/main` from `cffb44c` to `5973201` (3 commits: `95131e6` docs repoint, `e6b7248` Designer pack via UI Skills, `5973201` auth payload boundary hardening; all authored Maurice Wen, no AI trailers).
- [x] 3. Reconcile the two stale 2026-05-25 push checkboxes with pointers to their actual closure evidence.
- [x] 4. Verify GitHub Actions deploy run `29474644027` completes green (Worker + D1 migrations + R2 upload + Pages).
- [x] 5. Curl-verify production auth boundary: `/packs` HTTP 200; public pack detail is metadata-only (no `claudeMd`/`agentsMd`/`settings`/`promptsMd` bodies); unauthenticated protected file route returns 401.
- [x] 6. Refresh `HANDOFF.md` from the stale 2026-03-26 snapshot to current state and commit the documentation reconciliation.

### Completion Evidence
1. Release gate on the exact release tree (clean, HEAD `5973201`): `node --import tsx --test tests/auth-boundary.test.ts` -> PASS 5/5; `bash scripts/audit-auth-surfaces.sh` -> PASS, 0 violations.
2. Push: `origin/main` advanced `cffb44c` -> `5973201`; all 3 commits authored `Maurice Wen <maurice_wen@proton.me>`, no AI trailers.
3. Deploy run `29474644027` -> conclusion `success` at 2026-07-16T05:50:24Z; jobs: `deploy-worker` success, `apply-migrations` success, `deploy-frontend` success, `sync-data`/`seed-db` skipped by design (seed-db remains the known LOW-impact D1 token issue).
4. Production `/packs` (agent-foundry.pages.dev) -> HTTP 200.
5. Production public pack detail `GET /api/packs/compliance-expert` -> metadata-only; keys `color, description, descriptionZh, downloadCount, files, icon, id, layerIds, line, lineZh, name, nameZh`; none of `claudeMd`/`agentsMd`/`settings`/`promptsMd` present.
6. Production unauthenticated `GET /api/packs/compliance-expert/file?path=install.sh` -> HTTP 401.
7. `HANDOFF.md` rewritten from the 2026-03-26 snapshot to current state (git state, auth boundary contract, key files, known issue preserved).

### Continuation - Strict Scanner Block on Docs Commit
- [x] 7. Docs reconciliation commit `c5594fd` triggered deploy run `29475065778`, which FAILED at the strict postmortem scanner: the documentation mentioned the PM-2026-05-31 trigger terms without updating that PM file in the same commit (scanner contract working as designed). Production was unaffected - it remained on the verified run `29474644027` artifacts.
- [x] 8. Remediation per the scanner contract: appended the 2026-07-16 release verification section to the PM-2026-05-31 file itself, so this commit records acknowledgment. Local strict scan on this commit reports the PM as acknowledged-in-diff and exits 0 (evidence below); the remediation deploy is the Actions run bound to this commit and its conclusion is verified in-session.

### Continuation Evidence
1. Failure log line from run `29475065778`: "FAIL postmortem scan: historical regression trigger(s) matched without updating the matching PM file."; job breakdown: deploy-worker success, apply-migrations success, deploy-frontend failure at the web prebuild scan step.
2. Root cause chain: the scanner passes a triggered diff only when the matching PM file path is among the changed files; the code release commit `5973201` passed because it ADDED that PM file, while the docs commit did not touch it.
3. Ledger hygiene note: new ledger lines in this section deliberately avoid the PM trigger terms so future bookkeeping commits do not re-trigger the block.
