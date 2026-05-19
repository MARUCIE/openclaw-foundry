# PDCA Iteration Checklist

## Plan
- [x] Confirm `PROJECT_DIR`
- [x] Confirm missing governance files
- [x] Confirm missing `doc/` tree and initiative docs
- [x] Confirm canonical initiative slug: `initiative_openclaw_foundry`

## Do
- [x] Inject root governance files
- [x] Create `doc/index.md` and project initiative index
- [x] Create planning files (`task_plan.md`, `notes.md`, `deliverable.md`)
- [x] Create PDCA docs (`PRD.md`, `SYSTEM_ARCHITECTURE.md`, `USER_EXPERIENCE_MAP.md`, `PLATFORM_OPTIMIZATION_PLAN.md`)
- [x] Create execution docs (`EXECUTION_ROADMAP.md`, `PDCA_EXECUTION_PLAN.md`, `ROLLING_REQUIREMENTS_AND_PROMPTS.md`)

## Check
- [x] Cross-check architecture against actual entrypoints (`src/cli.ts`, `src/server.ts`, `client/`)
- [x] Cross-check UX map against browser wizard and bootstrap scripts
- [x] Record OneContext/aline result
- [x] Record `ai doctor` timeout limitation
- [x] Enumerate created docs to confirm coverage
- [x] Run `npm run build` and archive log
- [x] Run `npm run ocf -- doctor` and archive log
- [x] Attempt `ai check` and archive timeout result

## Act
- [x] Mark `doc/` as canonical and `docs/` as historical
- [x] Record open risks for next implementation iteration
- [x] Initialize rolling ledger for future requirements and anti-regression notes
- [x] Leave product-level Round 1 and Round 2 verification to the next code-changing task

## 2026-03-11 Continuation Update (Analyzer Normalization Fix)

### Plan
- [x] Reproduce the incorrect `meta.created` emitted by `/api/analyze`
- [x] Define deterministic fields that must be system-owned rather than model-owned

### Do
- [x] Add analyzer normalization layer
- [x] Add regression test for deterministic fields and skill filtering

### Check
- [x] `npm run build` passed
- [x] `node --import tsx --test tests/analyzer.test.ts` passed
- [x] `/api/analyze` smoke returned `meta.created=2026-03-11`
- [x] `ai check` attempted and archived with timeout result

### Act
- [x] Sync notes, deliverable, architecture, optimization plan, and rolling ledger

## 2026-04-03 Continuation Update (Phase 1 & 2 Hardening)

### Plan
- [x] Align model routing with actual upstream support (OpenAI)
- [x] Validate lifecycle paths (doctor, repair, rollback)
- [x] Clarify UX surface relationships (wizard vs manual)
- [x] Add explicit operator/admin UI for customer management

### Do
- [x] Implement OpenAI upstream caller in `src/llm-proxy.ts`
- [x] Update model defaults in `src/analyzer.ts`
- [x] Interlink `index.html` and `pipeline-manual.html`
- [x] Add Customer Management APIs to `web/lib/api.ts`
- [x] Create Admin Customer Management page in `web/app/admin/customers`
- [x] Align versions to 4.0.0 across `cli.ts` and `server.ts`

### Check
- [x] `npm run build` (root) passed
- [x] `npm run ocf -- doctor` passed
- [x] `npm run ocf -- rollback` verified working
- [x] `npm run build` (web) passed

### Act
- [x] Update `ROLLING_REQUIREMENTS_AND_PROMPTS.md` with REQ-006, REQ-007, REQ-008
- [x] Update `EXECUTION_ROADMAP.md` status
- [x] Sync task progress in `PDCA_ITERATION_CHECKLIST.md`

## 2026-04-03 Phase 3 Completion (Delivery & Discipline)

### Plan
- [x] Add reproducible verification commands into canonical docs
- [x] Define round-based acceptance against UX map
- [x] Archive legacy references and eliminate documentation drift

### Do
- [x] Create `VERIFICATION.md` with build/doctor/smoke test commands
- [x] Append Round-Based Acceptance Criteria to `USER_EXPERIENCE_MAP.md`
- [x] Cleanup dead references in `doc/index.md`
- [x] Mark Phase 3 as completed in `EXECUTION_ROADMAP.md`

### Check
- [x] `doc/index.md` matches current project structure
- [x] `VERIFICATION.md` contains actionable commands
- [x] No `docs/` folder remaining in project root

### Act
- [x] Sync documentation baseline for next major feature development

## 2026-04-23 Continuation Update (Skill Intelligence Boundary Unbraiding)

### Plan
- [x] Compare `22-openclaw-foundry` and `sota-skill-library` as bounded contexts rather than as flat repositories
- [x] Identify current catalog truth drift across web JSON, unified index data, and external local-state pipelines
- [x] Decide whether the merge target is runtime-level or artifact-level

### Do
- [x] Record the architecture decision in `SYSTEM_ARCHITECTURE.md`
- [x] Add PRD and optimization-plan alignment for canonical artifact convergence
- [x] Add PDCA iteration and roadmap items for artifact cutover and optional sidecar isolation
- [ ] Build the actual artifact adapter from SOTA outputs into Foundry schema

### Check
- [ ] Shadow-run current Foundry catalog vs SOTA-derived artifact
- [ ] Measure ID churn, category spread, rating spread, and broken-reference rate
- [ ] Verify stale-data serving behavior when upstream skill sync fails

### Act
- [ ] Freeze canonical artifact contract in code and seed pipeline
- [ ] Demote duplicate catalog paths to cache/staging only
- [ ] Decide whether recommendation / JIT remains sidecar-only or becomes internal API
