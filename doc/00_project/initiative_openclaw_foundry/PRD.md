# PRD - OpenClaw Foundry

## Product Summary
OpenClaw Foundry v2.0 is a **universal AI Agent deployment platform** that turns a user profile into a deployable Agent environment across **13 platforms** (Desktop/SaaS/Cloud/Mobile/Remote). One Blueprint, any platform. It supports local CLI, remote client-server flow, thin bootstrap scripts, and a browser wizard with platform selection.

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

## Non-Goals
1. Multi-tenant SaaS admin console
2. Full billing workflow
3. Multi-page authenticated operator dashboard
4. Production-grade secret vault and enterprise policy engine

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

## Non-Functional Requirements
1. Contract-first: `Blueprint` must remain the shared schema across CLI, server, and exported installers
2. Cross-platform install path for macOS, Linux, and Windows
3. Graceful degradation when external APIs are unavailable
4. Traceability through manifest, snapshots, and audit-style logs
5. Documentation must stay synchronized with actual entrypoints

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
