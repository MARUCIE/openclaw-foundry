# PDCA_EXECUTION_PLAN - OpenClaw Foundry

## Iteration 0 - Documentation Bootstrap
### Plan
- Build missing governance and initiative docs
- Record actual current architecture and UX facts

### Do
- Create root governance files
- Create `doc/` tree and initiative docs

### Check
- Verify document coverage
- Verify architecture/UX docs align with current entrypoints

### Act
- Freeze `doc/` as canonical path
- Carry forward open runtime and contract risks

## Iteration 1 - Runtime Contract Alignment
### Plan
- Review provider routing, doctor path, and lifecycle commands

### Do
- Fix contract mismatches and unstable verification surfaces

### Check
- Run build + doctor + lifecycle smoke tests

### Act
- Update PDCA docs and rolling ledger with discovered regressions

## Iteration 2 - Product Surface Clarification
### Plan
- Resolve ownership of static wizard, manual, and operator API surfaces

### Do
- Add missing docs or UI surfaces needed to make the product coherent

### Check
- Walk the UX map end-to-end across supported channels

### Act
- Archive deprecated paths and simplify the product story

## Iteration 3 - Skill Intelligence Boundary Unbraiding
### Plan
- Define the canonical Foundry-owned artifact contract for skills, taxonomy, ratings, dedup, and bundle candidates
- Identify every effective source of truth currently used by web export, D1 seeding, and local/offline pipelines
- Decide the bounded-context split between public discovery, deploy runtime, and optional intelligence runtime

### Do
- Record the architecture decision: Foundry as the single product surface; SOTA logic absorbed as heuristics/artifact production only
- Add a source-of-truth matrix and migration phases to `SYSTEM_ARCHITECTURE.md`
- Add roadmap and optimization items for artifact cutover and sidecar quarantine

### Check
- Compare current Foundry catalog artifacts vs SOTA-derived artifacts on total count, ID churn, category spread, and rating spread
- Verify that a failed upstream sync degrades to stale-but-servable catalog data rather than breaking the portal
- Verify rollback can happen by artifact version switch without touching deploy state

### Act
- Freeze one canonical artifact contract
- Mark all duplicate catalog paths as legacy, cache, or staging-only
- Rebuild recommendation / JIT capabilities only after artifact stability is proven
