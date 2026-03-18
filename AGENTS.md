# AGENTS.md - OpenClaw Foundry

## Scope
- Project root: `/Users/mauricewen/Projects/22-openclaw-foundry`
- Canonical project docs root: `doc/00_project/initiative_openclaw_foundry/`
- Existing legacy notes live in `docs/` and are treated as historical reference only.

## Collaboration Rules
- Plan first, then code.
- Update PDCA documents before changing product behavior.
- Keep documentation single-sourced under `doc/`.
- Prefer repo-local facts over assumptions.
- Do not claim verification that has not been executed.

## Mandatory Inputs Before Code Changes
- `doc/index.md`
- `doc/00_project/initiative_openclaw_foundry/task_plan.md`
- `doc/00_project/initiative_openclaw_foundry/notes.md`
- `doc/00_project/initiative_openclaw_foundry/deliverable.md`
- `doc/00_project/initiative_openclaw_foundry/SYSTEM_ARCHITECTURE.md`
- `doc/00_project/initiative_openclaw_foundry/USER_EXPERIENCE_MAP.md`

## Canonical PDCA Docs
- `doc/00_project/initiative_openclaw_foundry/PRD.md`
- `doc/00_project/initiative_openclaw_foundry/SYSTEM_ARCHITECTURE.md`
- `doc/00_project/initiative_openclaw_foundry/USER_EXPERIENCE_MAP.md`
- `doc/00_project/initiative_openclaw_foundry/PLATFORM_OPTIMIZATION_PLAN.md`

## Working Agreement
- CLI and server changes must preserve the `Blueprint` contract.
- Any route, page, script, or API change must be reflected in architecture and UX documents.
- Historical search is best-effort via `aline search`; if no matches exist, continue from repository evidence.
- `docs/plans/2026-03-10-openclaw-foundry-design.md` is the seed design document, not the current single source of truth.
