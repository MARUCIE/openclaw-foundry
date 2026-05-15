# Job Pack × WORKSHOP_PLAN Integration Plan

> Map AI-workshop v7 sessions (W1-W15) to openclaw-foundry Job Packs.
> Source: `/Users/mauricewen/Projects/AI-workshop/WORKSHOP_PLAN.md` v7 + this repo's `web/public/packs/*`.
> Generated: 2026-05-15.

## What this document is

WORKSHOP_PLAN.md v7 schedules 15 active workshop sessions × 5-item tool kits = 75 cohort-facing artifacts. The delivery mechanism is openclaw-foundry's per-pack `install.sh` (manifest-driven, validated 2026-05-15 by E2E smoke test on `scenario-planner`).

This plan locks the role → pack mapping so the next-cycle factory line can enrich the right packs with the right wave content, instead of inventing new pack infrastructure or building wave folders that never reach cohort.

## Mapping table (WORKSHOP_PLAN role → openclaw-foundry pack)

| WP Session | WP Role | Calendar | openclaw-foundry pack(s) | Pack baseline (CLAUDE/prompts L) | Status |
|-----------|---------|----------|--------------------------|----------------------------------|--------|
| S1 | 产品经理 / 需求分析岗 | W1 | `product-manager` | 36L / 16L | 🟡 stub — needs W1 enrichment |
| S2 | 产品研发岗（后端/前端/需求） | W2 | `backend-engineer` + `frontend-engineer` | 18L / ?L each | 🟡 stub — needs W2 enrichment |
| S3 | 业务分析 / 场景规划岗 | W3 | `scenario-planner` | 18L → enriched 2026-05-15 | 🟢 PILOT (in progress) |
| S4 | 测试 / QA 岗 | W4 | `test-engineer` | 18L / 7L | 🟡 stub — needs W4 enrichment |
| S5 | 数据 / 算法岗 | W6 | `data-analyst` + `algorithm-engineer` + `bigdata-engineer` | 18L / ?L each | 🟡 stub — needs W5 enrichment |
| S6 | Agent 工具应用岗 | W7 | `spellbook-ai-app-engineer` (+ siblings) | ?L | 🟡 stub — likely already AI-native, lighter enrichment |
| S7 | 业务运营 / 政策岗 | W8 | `compliance-expert` | 17L / 7L | 🟡 stub — needs W7 enrichment |
| S8 | 运维 / SRE 岗 | W9 | `infra-engineer` + `ops-engineer` | ?L each | 🟡 stub — needs W8 enrichment |
| S9 | 产品经理 R2 | W11 | `product-manager` (R2 layer added) | (same as S1) | 🟡 needs S1 retro absorption |
| S10 | 产品研发 R2 | W12 | `backend-engineer` + `frontend-engineer` R2 | (same as S2) | 🟡 needs S2 retro absorption |
| S11 | 业务分析 R2 (3-pod COMPLEX) | W13 | `scenario-planner` R2 | (same as S3) | 🟡 needs S3 retro absorption + complex-pod skill add |
| S12 | 测试 / QA R2 | W14 | `test-engineer` R2 | (same as S4) | 🟡 needs S4 retro absorption |
| S13 | 数据 / 算法 R2 | W16 | `data-analyst` R2 | (same as S5) | 🟡 needs S5 retro absorption |
| S14 | Agent R2 | W17 | `spellbook-ai-app-engineer` R2 | (same as S6) | 🟡 needs S6 retro absorption |
| S15 | 业务分析 R3 | W18 | `scenario-planner` R3 | (same as S3+S11) | 🟡 needs S3+S11 double-retro absorption |

**No WORKSHOP_PLAN role lacks a pack.** All 8 roles already have at least one pack scaffold in `web/public/packs/`. The work is **enrichment, not creation**.

## Enrichment recipe (per pack, derived from S3 pilot 2026-05-15)

For each pack, append/replace these 6-8 manifest items, sourced from the corresponding `AI-workshop/workshops/W<N>-*/` wave folder (English source canonical, translated to Chinese for the pack):

| Pack item | Source W<N> file | Action |
|-----------|------------------|--------|
| `CLAUDE.md` (existing stub) | `tool-kit-01-claude-md.md` | REPLACE with full Chinese version |
| `prompts.md` (existing stub) | `tool-kit-02-prompt-templates.md` | REPLACE with 12 PDCA Chinese prompts |
| `baseline-before-after.md` | `baseline-before-after.md` | NEW (Chinese) |
| `checklist-delivery.md` | `checklist-delivery.md` | NEW (Chinese) |
| `tool-kit-03-sop-flowchart.md` | `tool-kit-03-sop-flowchart.md` | NEW (Mermaid + Chinese narration) |
| `tool-kit-05-document-templates.md` | `tool-kit-05-document-templates.md` | NEW (Chinese) |
| `data-collection/baseline-actual.csv` | `data-collection/baseline-actual.csv` | COPY VERBATIM |
| `data-collection/cohort-feedback-form.md` | `data-collection/cohort-feedback-form.md` | COPY VERBATIM (already Chinese) |

KEEP unchanged: `AGENTS.md`, `settings.json`, `install.sh`, `agents/*`, `skills/*`. The skill bundle is per-pack curation; do not overwrite.

UPDATE: `manifest.json` to append the 6 new items.

## Per-pack effort estimate (after S3 pilot calibration)

S3 pilot (scenario-planner enrichment) data:
- Source content: already produced in W3 wave folder (16 .md files, 2026-05-15)
- Translation + adaptation work: ~700 lines Chinese, delegated to background agent in 5-10 min
- Manifest update: ~5 min manual
- Smoke test re-run: ~3 min
- Total per-pack work: ~25 min when source W<N> wave content already exists

**Critical path**: source W<N> wave content must exist BEFORE pack enrichment. Sequence is:

```
W<N> wave folder (content authoring, English)
   ↓
pack enrichment (translation + manifest, Chinese)
   ↓
deploy to CF Pages
   ↓
cohort runs install.sh from prod URL
```

## Recommended next-cycle scope

### Cycle 1 (after S3 pilot ships and is verified by 2026-06-04 cohort)
1. Build W1 wave content (英文) → enrich `product-manager` pack
2. Build W2 wave content (英文) → enrich `backend-engineer` + `frontend-engineer` packs
3. Build W4 wave content → enrich `test-engineer` pack

Rationale: W1, W2, W4 are first-round bucket-A priority workshops (per WORKSHOP_PLAN.md §"Round 1"). Their packs are also the most-requested per the 8-role workshop schedule.

### Cycle 2
4. Build W5-W8 wave content → enrich `data-analyst`, `algorithm-engineer`, `bigdata-engineer`, `spellbook-ai-app-engineer`, `compliance-expert`, `infra-engineer`, `ops-engineer`

### Cycle 3 (R2 absorption — wait for cohort retro from R1)
5. Re-enrich S1+S2+S3+S4 packs with R1 retro lessons (S9-S12 packs)

### Cycle 4 (R3)
6. Final enrichment of `scenario-planner` for S15 (only R3 session)

## Verification gates per pack

Replicate the 6-axis verification from `_template/CANONICAL.md` (AI-workshop), adapted for openclaw-foundry packs:

| Axis | Pack-level requirement | Verify command |
|------|------------------------|----------------|
| 1 | manifest.json has ≥ 14 items | `python3 -c "import json; print(len(json.load(open('web/public/packs/<id>/manifest.json'))['items']))"` |
| 2 | install.sh E2E succeeds | `FOUNDRY_BASE_URL=http://localhost:8765 bash install.sh` (with local HTTP server) |
| 3 | CLAUDE.md ≥ 100 lines | `wc -l web/public/packs/<id>/CLAUDE.md` |
| 4 | prompts.md ≥ 80 lines | `wc -l web/public/packs/<id>/prompts.md` |
| 5 | data-collection/ folder exists with CSV + form | `test -d web/public/packs/<id>/data-collection` |
| 6 | manifest.json items resolve to existing files | Iterate manifest; verify each `src` exists |

## What NOT to do (anti-patterns explicitly rejected)

1. **Do not create new packs for WORKSHOP_PLAN roles** — all 8 roles already mapped to existing packs. Creating duplicates fragments the install ecosystem.
2. **Do not skip the wave-folder source authoring step** — pack enrichment without first-having English wave content leads to incomplete translation and missing baseline anchoring.
3. **Do not overwrite the curated skills bundle in each pack** — each pack's `skills/` folder is its own curation decision; merge by adding new items, never wholesale replace.
4. **Do not invent new pack manifest schema fields** — the existing `{src, dst, type}` triple covers everything; extending it requires updating install.sh which compounds risk.
5. **Do not bypass the smoke test** — every pack manifest update MUST re-run install.sh against a local HTTP server before commit. The smoke test caught a path-construction issue on 2026-05-15.

## Reference paths

- Pack root: `/Users/mauricewen/Projects/22-openclaw-foundry/web/public/packs/`
- WORKSHOP_PLAN: `/Users/mauricewen/Projects/AI-workshop/WORKSHOP_PLAN.md`
- W3 source content: `/Users/mauricewen/Projects/AI-workshop/workshops/W3-第3周-业务分析场景规划岗/`
- Generation: `/Users/mauricewen/Projects/22-openclaw-foundry/scripts/generate-packs.mjs`
- Install (production URL): `https://openclaw-foundry.pages.dev/packs/<pack-id>/install.sh`

---

Maurice | maurice_wen@proton.me
