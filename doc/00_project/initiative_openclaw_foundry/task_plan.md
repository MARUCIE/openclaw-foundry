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
