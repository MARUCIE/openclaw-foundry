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
| OPT-02 | P0 | Contract integrity | OpenAI route is declared but not implemented in `llm-proxy.ts` | Model router and upstream support are consistent | Completed |
| OPT-03 | P0 | Catalog integrity | Rule-based fallback can emit non-existent skills into blueprints | Fallback output is strictly catalog-valid | Completed |
| OPT-04 | P0 | Export parity | Exported installers are not fully equivalent to local execution for AI-Fleet-linked skills | Export path matches runtime contract or documents limits clearly | Completed |
| OPT-05 | P0 | Repo hygiene | Parent git root weakens project-scoped verification | Isolated project repo or explicit git strategy | Completed |
| OPT-06 | P1 | Tooling | `ai doctor` evidence path is unstable in non-interactive mode | Reliable health-check runbook and timeout-safe command path | Completed |
| OPT-07 | P1 | UX ownership | `pipeline-manual.html` role in main product flow is unclear | Classified as product feature or archived reference | Completed |
| OPT-08 | P1 | Server hardening | Customer persistence is JSON-file based | Upgrade path to durable concurrent-safe storage | Completed |
| OPT-09 | P1 | API ergonomics | No browser operator console for customers/profiles/catalog | ~~Minimal operator UI~~ **Web Console v3.0** | Completed |
| OPT-10 | P2 | Release quality | No documented end-to-end acceptance run in canonical docs | Standard verification playbook aligned to UX map | Completed |
| OPT-11 | P0 | Web Console | No visual platform catalog or deploy management | Next.js Web Console with catalog/deploy/arena | v3.0 |
| OPT-12 | P0 | Arena Engine | No cross-platform comparison capability | Parallel deploy+test with auto-scoring | v3.0 |
| OPT-13 | P1 | Frontend perf | Web Console must handle 13 platform cards + real-time polling | SWR caching, 60s stale-while-revalidate, skeleton loading | v3.0 |
| OPT-14 | P1 | Deploy UX | Deploy is sync-only (blocks until done) | Async job model with polling + cancel | v3.0 |
| OPT-15 | P0 | Auth correctness | Login UI could show “sent” when Worker only logged a console fallback | Production email auth fails closed unless Resend delivery is configured | Completed |
| OPT-16 | P0 | IA cleanup | Retired `/explore/platforms` page remained reachable through CTA/direct URL | CTA targets `/packs`; legacy URL redirects to `/packs` | Completed |
| OPT-17 | P0 | Skill intelligence boundary | Catalog truth is split across Foundry JSONs, D1 seeds, and external SOTA-local state | Single canonical artifact contract consumed by Foundry only | Planned |
| OPT-18 | P1 | Runtime decoupling | SOTA local MCP/JIT runtime could be merged into the wrong layer | Keep intelligence runtime as optional sidecar and import heuristics/artifacts first | Planned |
| OPT-19 | P0 | Auth wall | Whole-site route guard blocked normal browsing, while static Job Pack payloads still bypassed registration | Public browsing and Skill/MCP/API copy remain open; Job Pack install/download payloads require email or WeChat registered session and protected Worker/R2 delivery | Completed 2026-05-18 |
| OPT-20 | P0 | Role-pack distribution | Copied local pack installers fetched deployed remote files by default | Public GitHub `openclaw-role-packs` repo with pinned tag install command, local-first installers, and full pack smoke install | Completed 2026-05-25 |
| OPT-21 | P0 | Static Pages data fetch | Static export requested `/api/packs` before falling back to `/data/packs.json`, producing avoidable production console 404s | Direct static `/data/*.json` reads when `NEXT_PUBLIC_API_URL` is unset | Completed 2026-05-25 |
| OPT-22 | P0 | Pack recommendation UX | Decision-tree paths could point to hidden `stub` packs and render an empty result panel | Recommendation paths render concrete cards; lower-maturity packs remain visible and installable when required artifacts exist | Completed 2026-05-25; updated 2026-05-26 |
| OPT-23 | P0 | Strategy pack coverage | `定策略` had no released, installable strategy frontdoor pack despite the strategy line existing in IA | `strategy-roundtable-advisor` enriched pack is generated, audited, synced to standalone role-pack repo, and wired into `/packs` | Completed 2026-05-25 |
| OPT-24 | P1 | Data IA clarity | `做数据` and `看数据` split one data intent into two first-level cards | One `做/看数据` card routes algorithm, big data, metrics, A/B, and dashboard options | Completed 2026-05-25 |
| OPT-25 | P0 | Product/design role boundary | `prototype-designer` implied that prototype ownership belonged to Designer and exposed stale install paths | Replace it with `designer`, move prototype validation language to `product-manager`, publish `openclaw-role-packs` tag `v2026.05.25.3`, and verify remote install | Completed 2026-05-25 |
| OPT-26 | P0 | Pack identity neutrality | Released packs contained person-named advisors and framework copy that made configuration packages feel tied to specific individuals | Enforce capability-neutral advisor IDs/names, sanitize Foundry + standalone pack payloads, and publish local-first release tag `v2026.05.25.5` | Completed 2026-05-25 |
| OPT-27 | P0 | Pages stale payload cache | Deleted protected pack payload files can remain available from old Cloudflare Pages edge assets | Tombstone protected payload files in `web/out/packs` before deploy so old direct URLs cannot expose historical configuration content | Completed 2026-05-26 |
| OPT-28 | P0 | Pack UI coverage | Public catalog packs could exist in `packs.json` but be absent from the `/packs` question tree or browse cards | Render all non-deprecated public catalog packs, keep maturity badges separate from availability, and add prebuild coverage audits | Completed 2026-05-26; updated 2026-05-26 |
| OPT-29 | P0 | Pack taxonomy clarity | Showing one second-level card per catalog pack made the job-pack selector noisy and unscientific | Replace flat second-level pack lists with compact task-domain groups while preserving canonical public-pack coverage through result expansion and audit gates | Completed 2026-05-26; updated 2026-05-26 |
| OPT-30 | P0 | Role-pack Git release drift | Standalone Git tag `v2026.05.25.5` installed successfully but missed newly enriched resources for 13 public packs | Sync Foundry public packs into `openclaw-role-packs`, publish tag `v2026.05.26.1`, update guide copy, and verify fresh remote clone smoke install | Completed 2026-05-26 |
| OPT-30 | P0 | Pack online-state semantics | `PACK_SPEC` tier was conflated with online availability, causing 17 Basic packs to look missing or disabled | Treat `tier: "stub"` as `Basic`, generate guides for public pack directories, and fail prebuild if required online artifacts are absent | Completed 2026-05-26; updated 2026-05-26 |
| OPT-31 | P0 | R2 upload resilience | Cloudflare R2 transient `502` / `504` responses could fail an otherwise valid pack deploy | Bound protected pack upload concurrency and retry transient R2 upload failures with exponential backoff | Completed 2026-05-26 |
| OPT-32 | P0 | Duplicate role-pack aliases | Deprecated `spellbook-*` aliases still appeared as duplicate public role cards beside richer canonical packs | Suppress `deprecated_alias_of` packs from public `packs.json`, remove alias IDs from `/packs` groups, and add a public dedup prebuild audit | Completed 2026-05-26 |
| OPT-33 | P0 | Public pack maturity floor | Some canonical public packs still displayed `基础档` after dedup, making live packs look incomplete | Enrich canonical public packs to audit-derived `enriched` or `certified`, inherit canonical maturity on deprecated alias guides, and fail prebuild on any public `stub` | Completed 2026-05-26 |
| OPT-34 | P1 | CI runtime lifecycle | GitHub Actions emitted Node 20 deprecation warnings before the 2026-06-02 Node 24 runner switch | Upgrade all workflow actions to Node 24-compatible majors and pin Cloudflare Wrangler to `4.76.0` | Completed 2026-05-26 |

## Next Execution Order
1. Move `NEXT_PUBLIC_ROLE_PACKS_GIT_REF` only after `openclaw-role-packs` validate + smoke-install passes and the new tag containing the current released packs is pushed.
2. **Skill intelligence boundary unbraiding** (OPT-17, OPT-18): define artifact contract and demote duplicate truth sources.
3. **v3.0 Web Console** (OPT-11, OPT-12): Next.js frontend + deploy-manager + arena-engine.
4. Resolve remaining P0 contract and repository-boundary issues (OPT-02, OPT-04).
5. Frontend performance optimization (OPT-13): SWR, skeleton, polling strategy.
6. Async deploy model (OPT-14): job lifecycle + cancel support.
7. Make health-check and verification paths deterministic.
8. Clarify static UX surface ownership.
9. Improve persistence and operator usability.
10. Provision production auth secrets (`RESEND_API_KEY`, optional `RESEND_FROM`, `WECHAT_CORP_ID`, `WECHAT_AGENT_ID`, `WECHAT_SECRET`) and verify `/api/auth/config`.

## Success Signal
1. Documentation and code entrypoints stay synchronized
2. Every public route or command has an owner and a canonical doc reference
3. Verification paths are reproducible without relying on tribal knowledge
