# Job Pack Specification — Four-Pillar Contract

> Authority: standard contract for every openclaw-foundry job pack at `web/public/packs/<role>/`.
> Source signal: Maurice 2026-05-15 "每个岗位准备：工具包，方法论，工作流，确保开卷必有益".
> Status: v1.0 (2026-05-15). Supersedes the ad-hoc per-pack structures in `JOB_PACKS_PRD.md`.

## 0. Why this spec exists

Audit on 2026-05-15 of 21 packs at `web/public/packs/`:

- 1 pack (`scenario-planner` v4.2.0, 1081 lines / 10 .md files) is fully enriched.
- 3 spellbook packs (`spellbook-code-reviewer`, `spellbook-security-auditor`, `spellbook-onboarding`) carry external content (368-867 lines).
- 17 packs are stub-tier (83-280 lines). Installing any of them currently delivers config skeleton only — no immediate value.

The contract below defines the minimum every pack must satisfy so that `curl ... | bash` produces an "open and benefit" (开卷必有益) experience: the cohort installer gets concrete value within 10 minutes of install, not "a skeleton I have to fill in myself."

## 1. Four-Pillar Contract

Every pack at `web/public/packs/<role>/` MUST contain four pillars. Each pillar has explicit artifact requirements and a `first-use` proof.

### Pillar 1 — 工具包 (Toolkit)

Concrete, immediately-usable artifacts that the cohort runs against real work.

**Required artifacts:**

- `prompts.md` ≥ 100 lines · ≥ 8 ready-to-copy prompts grouped by scenario (3-5 scenarios). Each prompt names input shape, expected output, and 1 worked example.
- `skills/<scenario>/<skill-name>/SPEC.md` × ≥ 3 skills. Each SPEC declares `description` (trigger phrase), `inputs`, `outputs`, `gotchas`.
- `tool-kit-<NN>-*.md` × ≥ 2 reusable templates (SOP flowchart, document templates, checklists, etc.).

**Manifest entry:** every artifact above MUST appear in `manifest.json` with `type: "config" | "skill" | "data"`.

**First-use proof:** running `claude --skill <one of the declared skills>` on a real cohort input produces non-trivial output within 60 seconds.

### Pillar 2 — 方法论 (Methodology)

The "why this way" cognitive framework. Without it, the toolkit looks like a random collection.

**Required artifacts:**

- `CLAUDE.md` ≥ 80 lines containing:
  - **Role identity** — who this pack is for (job title + seniority).
  - **Core decision frameworks** — 2-4 named mental models the role uses (e.g. ICP / 5-Why / Cynefin / Inversion). Each names the framework, when it triggers, the 3-5-step structure.
  - **Anti-patterns** — what NOT to do. ≥ 5 explicit failure modes the cohort should recognize.
  - **Cross-pack dependencies** (optional) — which other packs this role coordinates with.
- `AGENTS.md` ≥ 30 lines naming 2+ advisor agents (e.g. `advisor-drucker`, `advisor-meadows`) with explicit invocation criteria.

**First-use proof:** a cohort member reading CLAUDE.md without prior context can name (a) who the pack is for, (b) the top decision framework, (c) two anti-patterns — all within 5 minutes of skim.

### Pillar 3 — 工作流 (Workflow)

The execution sequence that chains toolkit and methodology into daily-use SOP.

**Required artifacts:**

- `checklist-delivery.md` ≥ 50 lines containing the end-of-day deliverable checklist for the role (≥ 8 checkbox items, organized by lifecycle phase: input → process → output → close).
- `tool-kit-03-sop-flowchart.md` (or named equivalent) ≥ 80 lines containing 1-3 SOP flowcharts in mermaid or ASCII art showing how Pillar 1 artifacts compose into Pillar 3 sequences.
- `baseline-before-after.md` ≥ 40 lines: explicit "without this pack vs. with this pack" comparison across 5+ work dimensions, including time-cost and quality-cost.

**First-use proof:** a cohort member can follow the SOP flowchart from start to finish for ONE scenario without asking the trainer.

### Pillar 4 — 开卷必有益 (Open-and-Benefit)

The pack must produce visible, specific value the first time it is opened. Stub packs that "look ready but aren't" are explicitly forbidden.

**Required artifacts:**

- `data-collection/baseline-actual.csv` (or equivalent): pre-filled with the role's baseline metrics so the cohort can ENTER their own numbers and immediately compare. The CSV header must declare ≥ 5 columns covering at minimum: scenario_id, current_time_min, expected_time_min, current_quality, expected_quality.
- `data-collection/cohort-feedback-form.md` (or equivalent): 1-page form with ≥ 6 questions covering what worked, what broke, what surprised, what to add next wave.
- `install.sh` MUST end with a single-line "next step" hint that names a specific command the cohort runs to produce visible output (e.g. `cd ~/.claude && claude --skill <skill-name> < sample-input.md`).

**First-use proof — the hard gate:**

1. Fresh machine, no `~/.claude/` directory.
2. Run the install command from the public URL.
3. Within 10 minutes of install completing, the cohort produces ≥ 1 concrete artifact that didn't exist before. The artifact is named in `install.sh`'s closing hint.

If steps 1-3 cannot be demonstrated in a recorded E2E smoke test, the pack fails the 开卷必有益 contract and is marked `stub` in the registry.

## 2. Manifest Schema

Every pack's `manifest.json`:

```json
{
  "pack": "<role-slug>",
  "version": "<semver>",
  "spec_version": "1.0",
  "first_use_demo": {
    "command": "<one-line shell command the cohort runs first>",
    "expected_output": "<one-line description of what they see>",
    "time_to_value_minutes": <int ≤ 10>
  },
  "items": [
    { "src": "<source-path>", "dst": "<install-path>", "type": "config|skill|agent|data" }
  ]
}
```

The `first_use_demo` block is mandatory under spec v1.0. Packs without it FAIL the spec.

## 3. Compliance levels

A pack is graded on three discrete tiers:

| Tier | Criteria | Cohort-facing label |
|------|----------|---------------------|
| **stub** | < 3 pillars present OR no `first_use_demo` | `WIP — install at own risk` |
| **enriched** | 4 pillars present, `first_use_demo` present, but E2E smoke not recorded | `Ready — verify locally first` |
| **certified** | All 4 pillars + `first_use_demo` + recorded E2E smoke transcript at `evidence/<pack>/<date>-e2e.log` | `Certified — open and benefit` |

The cohort-facing pack list (`web/public/packs/index.json` or equivalent) MUST show the tier badge. Pretending a stub is certified is a contract violation.

## 4. Migration path (current state → v1.0 compliance)

Audit 2026-05-15 baseline:

| Pack | .md files | .md lines | Tier (audit) |
|------|----------:|----------:|--------------|
| scenario-planner | 10 | 1081 | enriched (E2E smoke 17/17 already done — promote to certified once transcript saved) |
| spellbook-code-reviewer | 10 | 867 | enriched (re-audit against pillars 2-4) |
| spellbook-security-auditor | 7 | 637 | enriched (re-audit) |
| executive-strategist | 9 | 571 | enriched (re-audit) |
| spellbook-onboarding | 5 | 435 | enriched (re-audit) |
| spellbook-test-engineer | 5 | 368 | stub-borderline |
| product-manager | 6 | 280 | **stub** (priority — W1 cohort target) |
| research-analyst | 6 | 227 | stub |
| compliance-expert | 6 | 194 | stub |
| data-analyst | 5 | 185 | stub |
| frontend-engineer | 5 | 181 | stub (priority — W2) |
| backend-engineer | 5 | 170 | stub (priority — W2) |
| bigdata-engineer | 5 | 170 | stub |
| algorithm-engineer | 5 | 169 | stub |
| infra-engineer | 5 | 165 | stub |
| spellbook-platform-engineer | 4 | 153 | stub |
| ops-engineer | 5 | 152 | stub |
| test-engineer | 5 | 150 | stub (priority — W4) |
| spellbook-backend-engineer | 4 | 132 | stub |
| spellbook-ai-app-engineer | 3 | 89 | stub |
| spellbook-frontend-engineer | 3 | 89 | stub |

**Rollout order** (1 pack per session, ~25 min when source W<N> wave exists, ~60 min when authoring from scratch):

1. product-manager (W1 wave exists at `AI-workshop/workshops/W1-*`) — next session
2. backend-engineer (W2 backend wave)
3. frontend-engineer (W2 frontend wave)
4. test-engineer (W4 wave)
5. research-analyst (W6 wave)
6. data-analyst (W8 wave)
7. compliance-expert (W12 wave)
8. spellbook-test-engineer, spellbook-platform-engineer, etc. (re-audit batch)

## 5. Verification gate

Before any pack moves from stub → enriched → certified:

```bash
# Run from openclaw-foundry repo root
python3 scripts/pack-spec-audit.py <pack-name>
```

The audit script (NOT YET BUILT, scheduled as part of next session's product-manager enrichment) must check:

- All 4 pillars' required artifacts present at required line counts.
- `manifest.json` has `first_use_demo` block and `spec_version: "1.0"`.
- `install.sh` exit code 0 on a fresh `~/.claude/` simulation via local `python3 -m http.server :8765`.
- Every artifact listed in manifest.json exists on disk.
- For `certified` tier: `evidence/<pack>/<date>-e2e.log` exists and shows a successful first-use demo.

## 6. Failure to comply

If a pack ships at the cohort URL (`https://openclaw-foundry.pages.dev/packs/<pack>/`) without meeting at least `enriched` tier, the install script must print a one-line WARN before doing anything else:

```
WARN: <pack> is currently at tier=stub. Expect skeleton-only install. Tracking: PACK_SPEC.md §4.
```

This prevents silent stub-disappointment. The cohort knows what they're getting.

---

## Anti-patterns explicitly forbidden under v1.0

1. **Padding to hit line counts.** A 124-line CLAUDE.md filled with verbose preamble does NOT satisfy Pillar 2. Use the methodology checklist (role identity / decision frameworks / anti-patterns / cross-pack).
2. **Methodology without toolkit.** A pack that lists "you should use 5-Why" but provides no `5-why.md` prompt template or skill SPEC is a half-pack.
3. **Toolkit without methodology.** A pack that ships 10 prompts but no CLAUDE.md explaining WHEN to use them is a prompt-dump.
4. **First-use demo that requires "you understand AI workflow already."** The demo must work for the cohort's least-experienced member, not the trainer.
5. **Stub pack masquerading as certified.** No tier inflation. If E2E smoke wasn't recorded, the badge stays at `enriched`.
6. **Renaming W<N> wave content into pack content as the only enrichment.** Translation is necessary but not sufficient — the pack must still have a `first_use_demo`, a checklist, a baseline CSV, and a feedback form that fit the role (not just the wave).

---

Maurice | maurice_wen@proton.me
