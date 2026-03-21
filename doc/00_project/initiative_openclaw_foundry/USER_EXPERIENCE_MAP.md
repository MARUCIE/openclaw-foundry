# USER_EXPERIENCE_MAP - OpenClaw Foundry

## AI-Managed Project Block
- PROJECT_DIR: `/Users/mauricewen/Projects/22-openclaw-foundry`
- Canonical Initiative Path: `doc/00_project/initiative_openclaw_foundry/`
- Updated: `2026-03-21`

## Primary User Types
1. Local builder:
   - wants to generate and apply a personalized OpenClaw setup on the current machine
2. Remote managed customer:
   - wants to use a Foundry server for AI analysis and managed LLM access
3. Operator/admin:
   - wants to inspect catalog, profiles, customers, and model access
4. **Platform evaluator** (v3.0):
   - wants to compare multiple Claw platforms side-by-side before committing to one

## Entry Channels
| Channel | Entry | User Intent | Current State |
| --- | --- | --- | --- |
| Local CLI | `ocf init` | Wizard -> blueprint -> local install | Implemented |
| Thin client | `foundry.sh` / `foundry.ps1` | Remote analysis with local execution | Implemented |
| Browser wizard | `/` -> `client/index.html` | Fill wizard in browser and copy install command | Implemented |
| Static manual | `/pipeline-manual.html` | Browse role/pipeline examples | Implemented |
| Operator API | `/api/*`, `/llm/v1/*` | Inspect server state and use managed proxy | Implemented |
| **Web Console** | `web/` (Next.js) | Visual management: catalog, deploy, arena | v3.0 |

## Route / Page Map
| Surface | Path or Command | Purpose |
| --- | --- | --- |
| Browser wizard | `/` | Multi-step configuration form and blueprint preview |
| Pipeline manual | `/pipeline-manual.html` | Reference matrix of roles and pipeline examples |
| Shell bootstrap | `/foundry.sh` | macOS/Linux install, uninstall, repair bootstrap |
| PowerShell bootstrap | `/foundry.ps1` | Windows install, uninstall, repair bootstrap |
| Health API | `/api/health` | Server reachability check |
| Analyze API | `/api/analyze` | Generate blueprint from wizard answers |
| Catalog API | `/api/catalog` | Browse skill catalog |
| Profiles API | `/api/profiles` | Read reusable preset profiles |
| Customers API | `/api/customers` | Manage managed-LLM customers |
| LLM proxy | `/llm/v1/models`, `/llm/v1/chat/completions` | Tier-gated model access |
| **Console Dashboard** | `/` (web) | Platform stats, recent deploys, arena matches |
| **Console Catalog** | `/catalog` (web) | Browse/filter 13 platforms, view details |
| **Console Deploy** | `/deploy` (web) | 4-step deploy wizard with log streaming |
| **Console Arena** | `/arena` (web) | Multi-claw comparison battlefield |
| Deploy API | `POST /api/deploy` | Start async deploy job |
| Deploy Status | `GET /api/deploy/:jobId` | Poll deploy progress |
| Arena API | `POST /api/arena` | Create multi-provider match |
| Arena Status | `GET /api/arena/:matchId` | Poll arena match + results |

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

## UX Gaps
1. ~~No authenticated web operator console~~ **Resolved by v3.0 Web Console** — customer management still API-only
2. Browser wizard produces install command text but does not execute a local install itself
3. Error/empty states for unsupported model routes are API-level rather than explanatory product UX
4. `pipeline-manual.html` is discoverable as static content but not clearly tied to the main browser-wizard journey
5. The current design seed did not document `repair` and `uninstall` lifecycle journeys even though they are real product entrypoints
