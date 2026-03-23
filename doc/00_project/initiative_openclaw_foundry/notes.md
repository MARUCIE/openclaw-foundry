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
