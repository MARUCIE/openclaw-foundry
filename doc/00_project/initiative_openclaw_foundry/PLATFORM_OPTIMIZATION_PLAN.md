# PLATFORM_OPTIMIZATION_PLAN - OpenClaw Foundry

## Objective
将当前 OpenClaw Foundry 从“可运行 MVP”提升为“边界清晰、文档一致、可持续演进”的工程基线。

## Current Baseline
1. Core flows exist across CLI, server, browser wizard, and bootstrap scripts
2. Project-level governance and PDCA docs were missing before this iteration
3. Historical design lived only in `docs/plans/`

## Optimization Backlog
| ID | Priority | Theme | Gap | Target Outcome | Status |
| --- | --- | --- | --- | --- | --- |
| OPT-01 | P0 | Documentation | Missing project-level governance and `doc/` tree | Canonical `doc/` baseline exists | Completed |
| OPT-02 | P0 | Contract integrity | OpenAI route is declared but not implemented in `llm-proxy.ts` | Model router and upstream support are consistent | Planned |
| OPT-03 | P0 | Catalog integrity | Rule-based fallback can emit non-existent skills into blueprints | Fallback output is strictly catalog-valid | Completed |
| OPT-04 | P0 | Export parity | Exported installers are not fully equivalent to local execution for AI-Fleet-linked skills | Export path matches runtime contract or documents limits clearly | Planned |
| OPT-05 | P0 | Repo hygiene | Parent git root weakens project-scoped verification | Isolated project repo or explicit git strategy | Planned |
| OPT-06 | P1 | Tooling | `ai doctor` evidence path is unstable in non-interactive mode | Reliable health-check runbook and timeout-safe command path | Planned |
| OPT-07 | P1 | UX ownership | `pipeline-manual.html` role in main product flow is unclear | Classified as product feature or archived reference | Planned |
| OPT-08 | P1 | Server hardening | Customer persistence is JSON-file based | Upgrade path to durable concurrent-safe storage | Planned |
| OPT-09 | P1 | API ergonomics | No browser operator console for customers/profiles/catalog | Minimal operator UI or admin runbook | Planned |
| OPT-10 | P2 | Release quality | No documented end-to-end acceptance run in canonical docs | Standard verification playbook aligned to UX map | Planned |

## Next Execution Order
1. Resolve P0 contract and repository-boundary issues
2. Make health-check and verification paths deterministic
3. Clarify static UX surface ownership
4. Improve persistence and operator usability

## Success Signal
1. Documentation and code entrypoints stay synchronized
2. Every public route or command has an owner and a canonical doc reference
3. Verification paths are reproducible without relying on tribal knowledge
