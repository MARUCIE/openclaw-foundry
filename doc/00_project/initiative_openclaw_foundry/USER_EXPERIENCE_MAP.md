# USER_EXPERIENCE_MAP - OpenClaw Foundry

## AI-Managed Project Block
- PROJECT_DIR: `/Users/mauricewen/Projects/22-openclaw-foundry`
- Canonical Initiative Path: `doc/00_project/initiative_openclaw_foundry/`
- Updated: `2026-05-25`

## Primary User Types
1. Local builder:
   - wants to generate and apply a personalized OpenClaw setup on the current machine
2. Remote managed customer:
   - wants to use a Foundry server for AI analysis and managed LLM access
3. Operator/admin:
   - wants to inspect catalog, profiles, customers, and model access
4. **Platform evaluator** (v3.0):
   - wants to compare multiple Claw platforms side-by-side before committing to one
5. Anonymous browser:
   - wants to browse public skill, MCP, pack, pricing, news, and API documentation pages before registration
6. Registered operator:
   - wants to install/download Job Pack payloads after email or WeChat registration/login
7. Pack maintainer / copier:
   - wants to copy a current local role-pack repo or one pack directory and install it without depending on the deployed website state

## Entry Channels
| Channel | Entry | User Intent | Current State |
| --- | --- | --- | --- |
| Local CLI | `ocf init` | Wizard -> blueprint -> local install | Implemented |
| Thin client | `foundry.sh` / `foundry.ps1` | Remote analysis with local execution | Implemented |
| Browser wizard | legacy static `/` -> `client/index.html` | Fill wizard in browser and copy install command | Implemented |
| Static manual | `/pipeline-manual.html` | Browse role/pipeline examples | Implemented |
| Operator API | `/api/*`, `/llm/v1/*` | Inspect server state and use managed proxy | Implemented |
| **Web Console** | canonical app root in `web/` (Next.js) | Visual management: catalog, deploy, arena | v3.0 |
| Registration/Login | `/login` (web) | Email magic-link registration/login and WeChat scan registration/login | Implemented 2026-05-18 |

## 2026-04-23 Boundary Decision
1. Users discover, compare, and deploy through Foundry surfaces only.
2. `sota-skill-library` is not a canonical user-facing route, page, or parallel marketplace.
3. Any future recommendation or JIT planning experience must appear behind Foundry-owned routes and schema, not as a second public product entry.

## 2026-05-18 Auth-Wall Boundary Decision
1. Public browsing is allowed across the web console and legacy browser wizard.
2. Ordinary Skill/MCP/API documentation copy actions are public and must not display login locks.
3. Job Pack install/download payload delivery is not public browsing; those actions require a registered session.
4. Supported registration/login routes are email magic-link and WeChat OAuth.
5. Pack payload files are not served as public static assets; `guide.html` remains public, while install scripts and payload files are served through Worker auth/token APIs.

## Route / Page Map
| Surface | Path or Command | Purpose |
| --- | --- | --- |
| Browser wizard | legacy static `/` | Multi-step configuration form and blueprint preview |
| Pipeline manual | `/pipeline-manual.html` | Reference matrix of roles and pipeline examples |
| Shell bootstrap | `/foundry.sh` | macOS/Linux install, uninstall, repair bootstrap |
| PowerShell bootstrap | `/foundry.ps1` | Windows install, uninstall, repair bootstrap |
| Registration/Login | `/login` (web) | Email magic-link and WeChat scan registration/login |
| Health API | `/api/health` | Server reachability check |
| Analyze API | `/api/analyze` | Generate blueprint from wizard answers |
| Catalog API | `/api/catalog` | Browse skill catalog |
| Profiles API | `/api/profiles` | Read reusable preset profiles |
| Customers API | `/api/customers` | Manage managed-LLM customers |
| LLM proxy | `/llm/v1/models`, `/llm/v1/chat/completions` | Tier-gated model access |
| **Console Dashboard** | canonical `/` (web) | Platform stats, recent deploys, arena matches |
| **Console Catalog** | `/catalog` (web) | Browse/filter 13 platforms, view details |
| **Console Deploy** | `/deploy` (web) | 4-step deploy wizard with log streaming |
| **Console Arena** | `/arena` (web) | Multi-claw comparison battlefield |
| **Job Packs** | `/packs` (web) | Main “Start Using” target; job-pack copy/download requires registration |
| **Skill Marketplace** | `/skill` (web) | Public Skill install-command browsing and copy |
| **Login** | `/login` (web) | Email magic link and Enterprise WeChat login, both driven by `/api/auth/config` |
| **Retired Platform Overview** | `/explore/platforms` (web) | Removed product page; Cloudflare Pages redirects to `/packs` |
| **Standalone Role Packs** | `/Users/mauricewen/Projects/openclaw-role-packs`, `https://github.com/MARUCIE/openclaw-role-packs` | Git repo snapshot of current local role/job packs with local-first installers and pinned release tag |
| Deploy API | `POST /api/deploy` | Start async deploy job |
| Deploy Status | `GET /api/deploy/:jobId` | Poll deploy progress |
| Arena API | `POST /api/arena` | Create multi-provider match |
| Arena Status | `GET /api/arena/:matchId` | Poll arena match + results |
| Pack Install Command Copy | `/packs` button via `web/lib/protected-downloads.ts` | Registered-session clipboard command that clones pinned GitHub role-pack tag |
| Pack File API | `GET /api/packs/:id/file?path=...` | Protected single-file delivery by bearer session |

## Core Journeys
### Journey 1: Local CLI Bootstrap
1. User runs `ocf init`
2. Wizard collects role, industry, level, use cases, deliverables, languages, integrations, and LLM mode
3. CLI loads catalog and generates a `Blueprint`
4. User optionally saves/export the blueprint
5. Executor writes configuration into `~/.openclaw`

### Journey 2: Remote Thin-Client Bootstrap
1. User runs `bash <(curl -sSL <server>/foundry.sh)` or `irm <server>/foundry.ps1 | iex`
2. Bootstrap checks server reachability and local prerequisites
3. Script collects answers locally
4. Script posts answers to `/api/analyze`
5. Script receives blueprint and applies local install steps

### Journey 3: Browser Wizard
1. User opens `/`
2. User completes browser steps for profile fields
3. Browser posts payload to `/api/analyze`
4. Browser renders returned blueprint summary
5. Browser shows install command and blueprint download action

### Journey 4: Managed LLM Consumption
1. Operator creates or retrieves a customer token
2. Client calls `/llm/v1/models` or `/llm/v1/chat/completions` with bearer token
3. Server validates token, tier, daily limits, and model access
4. Proxy forwards to supported upstream provider
5. Usage is persisted to customer storage

### Journey 5: Web Console — Platform Catalog & Deploy (v3.0)
1. User opens Web Console `/`
2. Dashboard shows platform stats (4 type cards) + recent activity
3. User navigates to `/catalog`, filters by type/status/OS
4. User clicks "部署" on a platform card
5. Stepper wizard: select platform → configure blueprint → confirm → deploy
6. Real-time deploy log streams via polling
7. Result page: success/failure summary + next actions

### Journey 6: Web Console — Arena Battle (v3.0)
1. User navigates to `/arena`
2. Selects 2-5 providers from dropdown
3. Enters a test task description
4. Clicks "开始比武" → POST /api/arena
5. Frontend polls match status, shows N columns updating in real-time
6. Each lane shows: deploy steps → test results → timing
7. When all lanes complete: scoring table + winner badge
8. User can "导出报告" or "再来一局"

### Journey 7: Public Skill Copy, Registered Job Pack Access
1. Anonymous user opens public pages such as `/packs`, `/api-docs`, `/explore/mcp`, or the legacy browser wizard
2. User can read, search, filter, and inspect public information without being blocked by a route wall
3. User copies Skill, MCP, API-doc, or browser-wizard commands directly without registration
4. User clicks a Job Pack install/download action on `/packs`
5. If no active registered session exists, the UI redirects to `/login?return=/packs#install-<pack>`
6. Login page calls `/api/auth/config`; unavailable email or WeChat providers render as disabled instead of broken jumps
7. User registers or logs in through email magic-link or WeChat OAuth
8. Frontend writes a gated GitHub-tagged Job Pack install command to clipboard, or requests Worker-protected file routes for single-file downloads
9. Recommendation entrypoints whose target packs are still under validation are disabled and labeled `即将上线`, so users cannot navigate into an empty pack result.
10. The `定策略` recommendation path is released once `strategy-roundtable-advisor` is present with `tier != stub`; clicking it recommends the Strategy Roundtable Advisor pack.

### Journey 8: Standalone Role Pack Copy Install
1. Maintainer syncs Foundry's current local `web/public/packs/` and catalog data into `/Users/mauricewen/Projects/openclaw-role-packs`
2. Maintainer commits, tags, and pushes the snapshot to `https://github.com/MARUCIE/openclaw-role-packs`
3. Registered website user copies the install command from `/packs`, or recipient clones the release directly
4. Command runs `git clone --depth 1 --branch v2026.05.25.3 https://github.com/MARUCIE/openclaw-role-packs.git`
5. Recipient runs root `./install.sh <pack-id>` or pack-local `./install.sh`
6. Installer reads local sibling `manifest.json` and copies local artifacts by default
7. Remote fetching happens only when `ROLE_PACKS_BASE_URL` or `FOUNDRY_BASE_URL` is explicitly set
8. Production pack guide pages present the same GitHub-tagged install command; public static direct payload links are not part of the user journey
9. Product-line users choose between `product-manager` and `designer`: PM owns PRD, prototype hypothesis, and validation demo; Designer owns experience architecture, visual hierarchy, design tokens, design QA, and engineering handoff.

## UX Gaps
1. ~~No authenticated web operator console~~ **Resolved by v3.0 Web Console** — customer management still API-only
2. Browser wizard produces install command text but does not execute a local install itself
3. Error/empty states for unsupported model routes are API-level rather than explanatory product UX
4. `pipeline-manual.html` is discoverable as static content but not clearly tied to the main browser-wizard journey
5. The current design seed did not document `repair` and `uninstall` lifecycle journeys even though they are real product entrypoints
6. Moving the production Git ref requires a new validated and smoke-installed standalone repo tag
7. Old bare direct payload URLs can temporarily survive in edge cache, so support/ops copy must point users to `/packs` or the GitHub tag command, not historical direct Pages URLs
8. `定策略` now has a released Strategy Roundtable Advisor pack; the old `做数据` and `看数据` directions are merged into one `做/看数据` direction and remain labeled `即将上线` until a data pack graduates from `stub`.
9. `prototype-designer` is retired. Public UX, install commands, guides, and standalone Git repo should expose `designer` only.

## Round-Based Acceptance Criteria

| Stage | Focus | Criteria | Tooling |
|-------|-------|----------|---------|
| **Round 1** | Integrity | Build pass, Doctor green, API health OK | \`npm run build\`, \`ocf doctor\` |
| **Round 2** | Journeys | Essential user journeys (CLI, Web, Admin) verified | \`VERIFICATION.md#Round-2\` |
| **Round 3** | Performance | Web Console LCP < 2.5s, Server response < 5s | Chrome DevTools |
| **Round 4** | Compliance | Policy alignment, data protection, no mock in prod | \`PRD.md\` Checklist |
