# PRD - OpenClaw Foundry

## Product Summary
OpenClaw Foundry v3.0 is a **universal AI Agent deployment platform** that turns a user profile into a deployable Agent environment across **13 platforms** (Desktop/SaaS/Cloud/Mobile/Remote). One Blueprint, any platform. It supports local CLI, remote client-server flow, thin bootstrap scripts, a browser wizard, and a **full Web Console** with platform catalog, one-click deploy, and multi-claw arena comparison.

As of the 2026-04-23 architecture decision, Foundry is also the single product surface for skill discovery. External skill-intelligence logic from `sota-skill-library` is treated as an upstream factory for artifacts and heuristics, not as a second runtime or second public UI.

As of the 2026-05-18 auth-wall correction, Foundry keeps public browsing and ordinary Skill/MCP/API copy actions open. Only Job Pack payload delivery (pack install command copy, pack file download, protected pack artifacts) is a registered-user action. Registration/login is supported through email magic-link and WeChat OAuth surfaces.

## Problem Statement
The Chinese AI Agent ecosystem has fragmented into 13+ platforms (ArkClaw, WorkBuddy, DuClaw, Kimi Claw, etc.), each with its own setup flow, IM integration, and model routing. Users must learn each platform's configuration separately. Foundry v2 standardizes deployment across all platforms through a single Blueprint contract + Provider abstraction layer.

## Target Users
1. Individual operators who want a personalized Agent setup on any of 13 supported platforms
2. Team leads who need to deploy the same Blueprint to different platforms (e.g., local dev + cloud production)
3. Platform owners who want a managed server-side provisioning path with multi-platform support
4. Operators who need a managed LLM proxy with customer tokens and tier limits

## Goals
1. Collect structured user context + platform selection through CLI, shell bootstrap, or browser wizard
2. Generate a valid `Blueprint v2.0` JSON with target platform routing using AI or deterministic fallback
3. Deploy to any of 13 platforms via Provider abstraction (deploy/test/repair/uninstall/diagnose)
4. Offer a server mode with platform discovery, catalog scanning, blueprint generation, and LLM proxying
5. Support IM channel integration (Feishu/WeCom/QQ/DingTalk/Telegram/Discord/Slack)
6. Converge skill discovery on one Foundry-owned catalog artifact contract, even when scoring, deduplication, and bundle heuristics originate from external pipeline logic

## Non-Goals
1. Full billing workflow with payment integration
2. Production-grade secret vault and enterprise policy engine
3. Multi-tenant isolation (Web Console is single-operator)
4. Directly merging SOTA local runtime concerns (`~/.clawhub-skills`, local telemetry DB, local MCP installer) into Foundry public/runtime paths
5. Running two public marketplaces or two competing catalog truths in parallel

## Primary Product Surfaces
1. Local CLI:
   - `ocf init`
   - `ocf cast`
   - `ocf catalog`
   - `ocf switch`
   - `ocf export`
   - lifecycle commands (`repair`, `upgrade`, `rollback`, `snapshots`, `doctor`)
2. Server API:
   - `/api/analyze`
   - `/api/catalog`
   - `/api/profiles`
   - `/api/customers`
   - `/llm/v1`
3. Static UX:
   - browser wizard (`client/index.html`)
   - role/pipeline manual (`client/pipeline-manual.html`)
   - bootstrap scripts (`foundry.sh`, `foundry.ps1`)
4. **Web Console** (v3.0):
   - Dashboard: platform stats, recent deploys, recent arena matches
   - Platform Catalog: browse/filter 13 platforms, view details and requirements
   - One-Click Deploy: stepper wizard (select → configure → confirm → execute)
   - Arena: multi-claw comparison (2-5 providers, same task, scoring + winner)

## Functional Requirements
| ID | Requirement | Current Baseline |
| --- | --- | --- |
| FR-01 | Collect wizard answers across role, industry, level, team size, use cases, deliverables, languages, integrations, and LLM mode | Implemented |
| FR-02 | Generate a valid `Blueprint` from wizard answers and catalog inputs | Implemented |
| FR-03 | Support AI generation with rule-based fallback when API keys are absent or the model call fails | Implemented |
| FR-04 | Execute blueprint into local OpenClaw home with manifest and snapshot support | Implemented |
| FR-05 | Offer repair, uninstall, upgrade, rollback, snapshot listing, and doctor flows | Implemented |
| FR-06 | Support managed customer creation and tokenized LLM proxy access | Implemented |
| FR-07 | Expose static browser wizard and install command copy path | Implemented |
| FR-08 | Expose reusable preset profiles from JSON files | Implemented |
| FR-09 | Maintain project-level canonical documentation under `doc/` | Implemented in this iteration |
| FR-10 | Normalize AI-generated blueprints against trusted user inputs and current catalog before returning them | Implemented |
| FR-11 | Web Console: browse all 13 platforms with filter/search, view provider details and requirements | v3.0 |
| FR-12 | Web Console: one-click deploy wizard with async job tracking and real-time log streaming | v3.0 |
| FR-13 | Web Console: arena mode — same blueprint dispatched to 2-5 providers in parallel, auto-scoring and winner determination | v3.0 |
| FR-14 | Web Console: dashboard with aggregate stats, recent deploys, recent arena matches, system health | v3.0 |
| FR-15 | Catalog ingestion must converge on one canonical artifact contract for skills, ratings, taxonomy, and bundle candidates | Planned |
| FR-16 | Recommendation / JIT planning capabilities must be rebuilt against Foundry-owned schema and kept out of the critical public path until proven stable | Planned |
| FR-17 | Public pages and ordinary Skill/MCP/API copy actions remain open, while Job Pack install/download payloads require a registered session through email magic-link or WeChat OAuth | Implemented 2026-05-18 |
| FR-18 | Passwordless login: email success state is only shown after real Resend delivery; production config gaps fail closed and surface actionable UI | Implemented |
| FR-19 | WeChat login: Enterprise WeChat CTA is configuration-driven and disabled when OAuth secrets are absent | Implemented |
| FR-20 | Retired route handling: `/explore/platforms` is no longer a product page and redirects to `/packs` | Implemented |
| FR-21 | Role/job configuration packs must be exportable as a standalone Git repo whose installers default to local copied files | Implemented 2026-05-25 |
| FR-22 | `/packs` protected install-command copy should prefer a pinned GitHub role-pack release over a per-session Worker token URL | Implemented 2026-05-25 |
| FR-23 | Static Pages catalog reads must not emit missing `/api/*` console errors when the same data is available under `/data/*.json` | Implemented 2026-05-25 |
| FR-24 | `/packs` recommendation entrypoints must only be clickable when they resolve to at least one released public pack; unavailable directions must show an explicit validation state | Implemented 2026-05-25 |
| FR-25 | The `定策略` line must expose a released Strategy Roundtable Advisor pack that bundles cognitive-skeleton, multi-expert roundtable reporting, planning, reflection, and strategy/business execution skills | Implemented 2026-05-25 |
| FR-26 | The old `做数据` and `看数据` first-level entries must be merged into one `做/看数据` entry covering algorithm, big data, metrics, A/B, and dashboard paths | Implemented 2026-05-25 |
| FR-27 | Product-line packs must separate PM-owned prototype validation from Designer-owned experience architecture, visual system, design QA, and handoff; public install surfaces must expose `designer`, not `prototype-designer` | Implemented 2026-05-25 |
| FR-28 | Role/job configuration packs, guides, catalogs, installers, and installed output must not expose concrete person names or person-named advisor IDs; use capability-neutral advisor identities instead | Implemented 2026-05-25 |
| FR-29 | `/packs` must make every cataloged job pack visible from the guide UI and browse UI; packs under validation are visible as `Coming soon` with install/download disabled rather than hidden | Implemented 2026-05-26 |

## Non-Functional Requirements
1. Contract-first: `Blueprint` must remain the shared schema across CLI, server, and exported installers
2. Cross-platform install path for macOS, Linux, and Windows
3. Graceful degradation when external APIs are unavailable
4. Traceability through manifest, snapshots, and audit-style logs
5. Documentation must stay synchronized with actual entrypoints
6. Protected Job Pack payload delivery must avoid public static direct links; single-file payload downloads are served through Worker auth routes and static Pages output is tombstoned after build so stale direct URLs cannot expose payload content
7. Standalone role-pack distribution must stay local-first; production install-command copy uses the pinned GitHub release `https://github.com/MARUCIE/openclaw-role-packs.git` at `v2026.05.25.5`
8. Production role-pack guides and clipboard commands must not reintroduce `curl -fsSL .../packs/<id>/install.sh` direct static payload paths
9. Public pack counts must distinguish total catalog coverage from released/installable status; `stub` packs are visible but not installable
10. Strategy and data decision-tree labels must mirror the catalog: `定策略` includes the released strategic pack plus pending strategy options, and `做/看数据` shows algorithm, big data, data analyst, A/B, and AI app packs even while pending entries remain disabled
11. Pack generation and release verification must run a person-name audit across Foundry packs, standalone packs, public pack catalogs, guide HTML, and installed smoke-test output before publishing a tag.

## Success Criteria
1. A new user can reach blueprint generation from at least one supported entry channel without manual code editing
2. The system can generate and apply a blueprint or explain why it fell back
3. Lifecycle operations can inspect or repair a Foundry-managed installation
4. The repo has a canonical documentation baseline that can drive future changes

## Current Risks
1. OpenAI routing path is declared in model router but not implemented in upstream caller
2. Parent git root ambiguity complicates isolated repository health checks
3. `pipeline-manual.html` is large static content with unclear ownership relative to product requirements
4. Exported installer behavior is not fully equivalent to local execution for AI-Fleet-linked skills
5. Toolchain doctor evidence is incomplete due timeout in current non-interactive path
6. Email and Enterprise WeChat production login still require Cloudflare secrets/provider setup; code now fails visibly when those secrets are absent
7. Skill catalog truth is still split across curated web JSON, unified index data, and emerging external skill-factory inputs
8. Protected pack payload deployment depends on Cloudflare R2 upload during CI for single-file downloads; install-command copy no longer depends on a short-lived Worker token
9. Standalone role-pack repo drift remains possible; release by tag and run full smoke install before moving the production ref
10. Old bare direct payload URLs can remain in Cloudflare edge cache until their previous `s-maxage` expires; the product path must avoid exposing those URLs
11. Newly added pack-entry decision paths and catalog lines must be audited against `/packs` UI reachability before deployment
12. Public skill catalogs and role-pack payloads must not expose workstation-only links, `file:///Users/...` sources, or public `_backup*` data directories.
13. Role-pack renames must be real cutovers, not compatibility aliases; obsolete pack IDs must be absent from public catalog, guides, install scripts, and standalone Git repo.
14. Old person-named advisor IDs and person-framework copy can re-enter through upstream skill sync or historical templates; `scripts/sanitize-pack-person-names.mjs --check` is the release gate.
