# CLAUDE.md - OpenClaw Foundry Engineering Canon

## Canonical Paths
- Project root: `/Users/mauricewen/Projects/22-openclaw-foundry`
- Canonical initiative path: `doc/00_project/initiative_openclaw_foundry/`
- Historical design reference: `docs/plans/2026-03-10-openclaw-foundry-design.md`

## Operating Principles
1. Use the documentation tree under `doc/` as the single source of truth.
2. Read `task_plan.md` and PDCA docs before substantial implementation.
3. Keep architecture, UX map, PRD, and optimization plan in sync.
4. Prefer real command evidence over narrative claims.
5. Avoid compatibility layers unless explicitly required by the product contract.

## Baseline Workflow
1. Confirm project scope and entrypoints from `doc/index.md`.
2. Re-read `task_plan.md` and `notes.md`.
3. Update PDCA docs if system boundary or UX flow changes.
4. Implement the smallest coherent slice.
5. Verify with commands appropriate to the changed surface.
6. Record evidence and closeout in `deliverable.md`.

## Product Boundary
- OpenClaw Foundry is a TypeScript client-server toolchain for generating and executing personalized OpenClaw blueprints.
- Supported interaction channels:
  - local CLI
  - thin-client shell/PowerShell bootstrap
  - static browser wizard
  - server-side customer and LLM proxy APIs

## File Map
- CLI entry: `src/cli.ts`
- Server entry: `src/server.ts`
- Blueprint contract: `src/types.ts`
- Static UX entry: `client/index.html`
- Bootstrap scripts: `client/foundry.sh`, `client/foundry.ps1`

## Documentation Discipline
- New feature docs belong in `doc/10_features/<feature_slug>/`.
- Component docs belong in `doc/20_components/<component_slug>/`.
- Completed or superseded snapshots belong in `doc/99_archive/`.
- Do not use `docs/` for new canonical planning or architecture outputs.
