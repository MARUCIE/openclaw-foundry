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
| OPT-09 | P1 | API ergonomics | No browser operator console for customers/profiles/catalog | ~~Minimal operator UI~~ **Web Console v3.0** | In Progress |
| OPT-10 | P2 | Release quality | No documented end-to-end acceptance run in canonical docs | Standard verification playbook aligned to UX map | Planned |
| OPT-11 | P0 | Web Console | No visual platform catalog or deploy management | Next.js Web Console with catalog/deploy/arena | v3.0 |
| OPT-12 | P0 | Arena Engine | No cross-platform comparison capability | Parallel deploy+test with auto-scoring | v3.0 |
| OPT-13 | P1 | Frontend perf | Web Console must handle 13 platform cards + real-time polling | SWR caching, 60s stale-while-revalidate, skeleton loading | v3.0 |
| OPT-14 | P1 | Deploy UX | Deploy is sync-only (blocks until done) | Async job model with polling + cancel | v3.0 |

## Next Execution Order
1. **v3.0 Web Console** (OPT-11, OPT-12): Next.js frontend + deploy-manager + arena-engine
2. Resolve P0 contract and repository-boundary issues (OPT-02, OPT-04)
3. Frontend performance optimization (OPT-13): SWR, skeleton, polling strategy
4. Async deploy model (OPT-14): job lifecycle + cancel support
5. Make health-check and verification paths deterministic
6. Clarify static UX surface ownership
7. Improve persistence and operator usability

## Success Signal
1. Documentation and code entrypoints stay synchronized
2. Every public route or command has an owner and a canonical doc reference
3. Verification paths are reproducible without relying on tribal knowledge
