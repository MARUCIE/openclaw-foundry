# EXECUTION_ROADMAP - OpenClaw Foundry

## Phase 0 - Documentation Baseline
1. Inject governance files
2. Establish `doc/` as canonical source
3. Map actual code entrypoints, routes, scripts, and risks
Status: completed on 2026-03-11

## Phase 1 - Contract and Runtime Hardening
1. Align model routing and actual upstream support
2. Validate doctor/repair/rollback lifecycle paths
3. Confirm profile/customer persistence behavior under real runs
Status: in progress (REQ-006 completed on 2026-04-03)

## Phase 2 - UX Surface Clarification
1. Decide product status of browser wizard vs pipeline manual
2. Add explicit operator/admin runbook or UI
3. Bring static/manual surfaces under a clearer information architecture
Status: in progress (REQ-006 completed on 2026-04-03)

## Phase 3 - Delivery and Release Discipline
Status: completed on 2026-04-03
1. Add reproducible verification commands into canonical docs
2. Define round-based acceptance against UX map
3. Archive legacy references and eliminate documentation drift
Status: completed

## Phase 4 - Skill Intelligence Boundary Unbraiding
1. Freeze one canonical artifact contract for skill catalog + bundle candidates
2. Shadow-run current Foundry data paths against SOTA-derived artifacts
3. Cut seed/build pipeline over to the canonical artifact
4. Keep SOTA out of Foundry runtime/UI; recommendation and JIT stay sidecar/internal-adapter only until artifact stability is proven
Status: planned
