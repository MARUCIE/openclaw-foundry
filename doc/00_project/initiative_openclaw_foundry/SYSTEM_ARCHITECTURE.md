# SYSTEM_ARCHITECTURE - OpenClaw Foundry

## AI-Managed Project Block
- PROJECT_DIR: `/Users/mauricewen/Projects/22-openclaw-foundry`
- Canonical Initiative Path: `doc/00_project/initiative_openclaw_foundry/`
- Updated: `2026-03-21`

## System Boundary
OpenClaw Foundry v2.0 is a universal Agent deployment platform supporting **13 platforms** across 5 categories (Desktop/SaaS/Cloud/Mobile/Remote). The system uses a **Provider abstraction layer** to dispatch a single Blueprint to any supported platform.

Runtime styles:
1. local execution through the `ocf` CLI
2. remote execution through an Express server plus static browser/bootstrap clients
3. multi-platform deployment via Provider dispatch

The shared contract is `Blueprint v2.0`, a typed JSON document now including a `target` field for platform routing.

## High-Level Modules
| Module | Files | Responsibility |
| --- | --- | --- |
| CLI shell | `src/cli.ts`, `src/wizard.ts` | Collect local input, platform selection, call AI/catalog flows, execute lifecycle commands |
| Analysis engine | `src/analyzer.ts`, `src/capability-registry.ts` | Convert wizard answers and catalog data into `Blueprint`, then normalize and repartition |
| Catalog layer | `src/catalog.ts` | Scan local AI-Fleet skills and remote ClawHub skills |
| **Provider system** | `src/providers/*.ts` (12 files) | **v2.0: Multi-platform deployment abstraction (deploy/test/repair/uninstall/diagnose)** |
| Execution layer | `src/executor.ts` | Legacy install/export/repair/upgrade/rollback (wrapped by OpenClawProvider) |
| Server/API | `src/server.ts` | Expose health, analyze, catalog, providers, profile, customer, and LLM proxy |
| Persistence | `src/profiles.ts`, `src/customers.ts` | Store reusable profiles and managed customer tokens/usage |
| LLM gateway | `src/llm-proxy.ts` | Customer-authenticated OpenAI-compatible chat proxy |
| Static client | `client/` | Browser wizard with platform selection, bootstrap scripts |
| **Web Console** | `web/` (Next.js 15) | **v3.0: Visual management — Platform Catalog, One-Click Deploy, Arena** |
| **Deploy Manager** | `src/deploy-manager.ts` | **v3.0: Async deploy job lifecycle (create/poll/cancel)** |
| **Arena Engine** | `src/arena-engine.ts` | **v3.0: Multi-provider parallel execution + scoring** |

## Provider Architecture (v2.0)
```
Blueprint.target.provider → ProviderRegistry.getProvider() → Provider.deploy()

BaseProvider (abstract)
├── CloudProvider (checkApiAccess, checkApiHealth, getEndpoint)
│   ├── JDCloudProvider (genericCloudDeploy)
│   │   ├── HuaweiCloudProvider
│   │   ├── AliyunProvider
│   │   └── DuClawProvider
│   ├── ArkClawProvider
│   └── WorkBuddyProvider
├── DesktopProvider (checkLocalInstall)
│   ├── OpenClawProvider (wraps legacy executor)
│   ├── LobsterAIProvider
│   └── AutoClawProvider
├── SaaSProvider (checkApiHealth)
│   ├── KimiClawProvider
│   └── MaxClawProvider
├── MobileProvider (checkDeviceConnection)
│   └── MiClawProvider
└── BaseProvider (direct)
    └── LenovoProvider (remote service)
```

### Supported Platforms (13)
| ID | Name | Vendor | Type | Status |
|----|------|--------|------|--------|
| openclaw | OpenClaw | Anthropic | desktop | stable |
| workbuddy | WorkBuddy/QClaw | Tencent | desktop | stable |
| lobsterai | LobsterAI | NetEase Youdao | desktop | beta |
| autoclaw | AutoClaw | Zhipu AI | desktop | stable |
| arkclaw | ArkClaw | ByteDance | saas | stable |
| duclaw | DuClaw | Baidu Cloud | saas | stable |
| kimiclaw | Kimi Claw | Moonshot AI | saas | stable |
| maxclaw | MaxClaw | MiniMax | saas | stable |
| jdcloud | JD Cloud OpenClaw | JD Cloud | cloud | beta |
| huaweicloud | Huawei Cloud | Huawei Cloud | cloud | beta |
| aliyun | AgentBay | Alibaba Cloud | cloud | stable |
| miclaw | miclaw | Xiaomi | mobile | preview |
| lenovo | Lenovo BaiYing | Lenovo | remote | preview |

## Runtime Topology
```mermaid
flowchart TD
  A[User] --> B[CLI Wizard]
  A --> C[Browser Wizard]
  A --> D[Bootstrap Script]
  B --> E[Analyzer]
  C --> F[Express Server]
  D --> F
  F --> E
  E --> G[Capability Registry]
  E --> H[Catalog Aggregator]
  H --> I[AI-Fleet Skills]
  H --> J[ClawHub Skills]
  E --> K[Gemini API or Rule-Based Fallback]
  B --> L[Executor]
  F --> M[Profiles Store]
  F --> N[Customer Store]
  F --> O[LLM Proxy]
  O --> P[Gemini Upstream]
  O --> Q[Anthropic Upstream]
  L --> R[~/.openclaw]
  L --> S[Manifest + Snapshots]
```

## Core Data Objects
1. `WizardAnswers` / `WizardAnswersV2`
   - Structured user intent collected from CLI or browser
   - v2 adds: `targetProvider`, `targetDeployMode`, `targetRegion`, `targetImChannel`, cloud credentials
2. `Blueprint` (v2.0)
   - Canonical deployment contract
   - Includes meta, **target** (provider + deployMode + credentials), identity, skills, agents, config, cron, MCP servers, extensions, LLM
   - `target` defaults to `{provider:'openclaw', deployMode:'local'}` for backward compatibility
3. `Provider` (interface)
   - Multi-platform deployment abstraction
   - Methods: deploy, test, repair, uninstall, diagnose, getRequirements, isAvailable
4. `Manifest`
   - Records files and directories written by Foundry
5. `Snapshot`
   - Captures pre-change installation state for rollback
6. `Customer`
   - Managed LLM subscriber record with token, tier, and usage stats

## Contract Guardrails
1. AI-generated blueprints are normalized before return
2. System-owned fields are enforced from trusted inputs:
   - `meta.os`
   - `meta.created`
   - `identity.role`
   - `config.autonomy`
   - `llm`
3. Skill IDs are deduplicated and re-partitioned against the current catalog source map

## Entrypoints
### CLI
- `npm run ocf -- init`
- `npm run ocf -- cast <file>`
- `npm run ocf -- doctor`

### Server
- `npm run server`
- `npm run dev`

### HTTP
- `GET /api/health` — includes provider stats
- `POST /api/analyze`
- `GET /api/catalog`
- **`GET /api/providers`** — list all 13 platforms (filter: ?type=, ?os=)
- **`GET /api/providers/:id`** — platform detail + requirements + availability
- **`GET /api/providers/:id/diagnose`** — platform health check
- `GET /api/profiles`
- `GET /api/profiles/:id`
- `POST /api/customers`
- `GET /api/customers`
- `GET /api/customers/:id`
- `PATCH /api/customers/:id/tier`
- `DELETE /api/customers/:id`
- `GET /llm/v1/models`
- `POST /llm/v1/chat/completions`
- `GET /foundry.sh`
- `GET /foundry.ps1`
- static files from `client/`

## Deployment / Storage Model
1. Repo-local:
   - `profiles/*.json`
   - `data/customers.json`
2. User machine:
   - `~/.openclaw/openclaw.json`
   - `~/.openclaw/IDENTITY.md`
   - `~/.openclaw/SOUL.md`
   - `~/.openclaw/skills/`
   - `~/.openclaw/agents/`
   - `~/.openclaw/.foundry-manifest.json`
   - `~/.openclaw/.snapshots/`

---

## Web Console Architecture (v3.0)

### Overview
Web Console 是 OpenClaw Foundry 的可视化管理界面，提供三大核心能力：

| Module | Purpose | Core Interaction |
|--------|---------|-----------------|
| **Platform Catalog** | 浏览全部 13 个 **Claw 平台，按类型/状态/OS 筛选 | 卡片网格 + 详情面板 |
| **One-Click Deploy** | 选择平台 → 配置 Blueprint → 一键部署 | 步骤向导 (Stepper) |
| **Arena 比武场** | 同一任务 dispatch 到多个 Claw，并行执行并横向对比 | 多列对比面板 + 实时状态 |

### Frontend Architecture

```
web/                          # Next.js 15 App Router
├── app/
│   ├── layout.tsx            # Root layout (sidebar + header)
│   ├── page.tsx              # Dashboard (overview stats)
│   ├── catalog/
│   │   ├── page.tsx          # Platform catalog grid
│   │   └── [id]/page.tsx     # Platform detail + requirements
│   ├── deploy/
│   │   ├── page.tsx          # Deploy wizard (stepper)
│   │   └── [jobId]/page.tsx  # Deploy job status
│   └── arena/
│       ├── page.tsx          # Arena setup (select task + claws)
│       └── [matchId]/page.tsx # Arena live match view
├── components/
│   ├── ui/                   # shadcn/ui primitives
│   ├── platform-card.tsx     # Provider card with status badge
│   ├── deploy-stepper.tsx    # Multi-step deploy flow
│   ├── arena-lane.tsx        # Single claw lane in arena
│   ├── blueprint-editor.tsx  # Blueprint JSON editor
│   └── status-badge.tsx      # Provider status indicator
├── lib/
│   ├── api.ts                # OCF server API client
│   ├── types.ts              # Shared types (re-export from src/)
│   └── hooks/
│       ├── use-providers.ts  # SWR hook for provider list
│       ├── use-deploy.ts     # Deploy job polling
│       └── use-arena.ts      # Arena match state
└── tailwind.config.ts
```

Tech stack: **Next.js 15** + **Tailwind v4** + **shadcn/ui** + **SWR** for data fetching.
Connects to existing Express server at `localhost:18800`.

### New Server API Endpoints (v3.0)

| Method | Path | Purpose | Module |
|--------|------|---------|--------|
| POST | `/api/deploy` | Start a deploy job (async) | Deploy |
| GET | `/api/deploy/:jobId` | Poll deploy job status | Deploy |
| POST | `/api/deploy/:jobId/cancel` | Cancel running deploy | Deploy |
| POST | `/api/arena` | Create arena match (N providers, 1 blueprint) | Arena |
| GET | `/api/arena/:matchId` | Poll arena match status | Arena |
| GET | `/api/arena/:matchId/results` | Final comparison results | Arena |
| GET | `/api/stats` | Aggregate dashboard stats | Dashboard |

### Deploy Job Model

```typescript
interface DeployJob {
  id: string;                    // "deploy-{timestamp}"
  status: 'pending' | 'running' | 'success' | 'failed' | 'cancelled';
  provider: ProviderId;
  blueprint: Blueprint;
  createdAt: string;
  startedAt?: string;
  completedAt?: string;
  result?: DeployResult;
  logs: StepResult[];            // Streaming step log
}
```

Deploy flow: POST /api/deploy → 202 Accepted (jobId) → GET poll → final result.
Server stores jobs in-memory Map with TTL (1 hour).

### Arena Match Model

```typescript
interface ArenaMatch {
  id: string;                    // "arena-{timestamp}"
  status: 'setup' | 'running' | 'completed' | 'failed';
  task: {
    blueprint: Blueprint;        // Shared blueprint template
    testPrompt: string;          // The task all claws will execute
  };
  lanes: ArenaLane[];            // One per selected provider
  createdAt: string;
  completedAt?: string;
  winner?: ProviderId;           // Auto-determined or user-voted
  scoring?: ArenaScoring;
}

interface ArenaLane {
  provider: ProviderId;
  status: 'pending' | 'deploying' | 'testing' | 'done' | 'error';
  deployResult?: DeployResult;
  testResult?: TestResult;
  timing: {
    deployMs?: number;
    testMs?: number;
    totalMs?: number;
  };
  score?: number;                // 0-100 composite score
}

interface ArenaScoring {
  dimensions: {
    deploySpeed: Record<ProviderId, number>;    // Lower ms = higher score
    testPassRate: Record<ProviderId, number>;   // % checks passed
    featureSupport: Record<ProviderId, number>; // Requirements met
    platformReach: Record<ProviderId, number>;  // OS + IM coverage
  };
  overall: Record<ProviderId, number>;
  method: 'weighted-average';
  weights: { deploySpeed: 0.2; testPassRate: 0.4; featureSupport: 0.25; platformReach: 0.15 };
}
```

Arena flow:
1. User selects 2-5 providers + writes a task prompt
2. POST /api/arena → creates match, spawns parallel deploy+test per lane
3. Frontend polls GET /api/arena/:matchId → updates lane status in real-time
4. When all lanes complete → server computes scoring → determines winner
5. Frontend shows side-by-side comparison with scores + timing + logs

### Page Architecture

#### P1: Dashboard (`/`)
- Provider count by type (4 cards: Desktop / SaaS / Cloud / Mobile+Remote)
- Recent deploy jobs (last 5)
- Recent arena matches (last 3)
- System health (server uptime, API latency)

#### P2: Platform Catalog (`/catalog`)
- Filter bar: type | status | OS | IM channel
- Card grid: each card shows logo placeholder, name, vendor, type badge, status badge
- Click → detail page with:
  - Full provider meta
  - Requirements checklist (with live availability check)
  - Quick actions: Deploy / Add to Arena / Diagnose
  - Console URL + Doc URL external links

#### P3: Deploy Flow (`/deploy`)
- Step 1: Select provider (from catalog or dropdown)
- Step 2: Configure blueprint (profile preset or manual JSON editor)
- Step 3: Review blueprint summary
- Step 4: Deploy + real-time log streaming
- Step 5: Result summary + next actions (test / diagnose / open console)

#### P4: Arena (`/arena`)
- Setup panel: select 2-5 providers + enter task prompt
- Live view: N columns (one per provider), each showing:
  - Status indicator (spinner → checkmark/cross)
  - Deploy steps log
  - Test results
  - Timing
- Results panel: radar chart + score table + winner badge

### Data Flow

```mermaid
flowchart LR
  subgraph "Web Console (Next.js)"
    D[Dashboard] --> API
    C[Catalog] --> API
    DP[Deploy] --> API
    AR[Arena] --> API
  end
  subgraph "OCF Server (Express)"
    API[API Layer]
    API --> PR[Provider Registry]
    API --> AN[Analyzer]
    API --> DJ[Deploy Job Manager]
    API --> AM[Arena Match Manager]
    DJ --> PR
    AM --> PR
    PR --> P1[OpenClaw]
    PR --> P2[ArkClaw]
    PR --> P3[WorkBuddy]
    PR --> PN[... 10 more]
  end
```

### Security Constraints
- Web Console runs same-origin or CORS with existing `x-api-key` guard
- Cloud credentials (accessKeyId/Secret) are server-side only, never sent to frontend
- Arena matches are rate-limited (max 3 concurrent, 10/hour)
- Deploy jobs respect existing `checkApiReady()` guard per provider

## Architecture Risks
1. Provider routing gap:
   - `routeModel()` can return `openai`, but `createLlmProxy()` does not implement an OpenAI upstream caller
2. Persistence simplicity:
   - customers are stored in a JSON file, which is acceptable for MVP but weak for concurrent writes
   - Deploy jobs and arena matches use in-memory Map (acceptable for single-instance, lost on restart)
3. Git boundary mismatch:
   - repository directory lives inside a parent git root, which weakens project-isolated git health checks
4. Export parity gap:
   - exported installers do not preserve full equivalence with local execution for AI-Fleet symlinked skills
5. Auth boundary split:
   - `/api/*` uses optional shared API key, while `/llm/v1/*` uses bearer customer tokens
6. Documentation split:
   - `docs/` historical material can drift unless future changes only update `doc/`
7. Arena concurrency:
   - Parallel provider.deploy() calls share the same process; a slow/hanging provider blocks the event loop
   - Mitigation: per-lane timeout (60s) + AbortController
8. Web Console coupling:
   - Next.js dev server + Express server run on different ports; production needs reverse proxy or embedding
   - Mitigation: Next.js `rewrites` proxy `/api/*` to OCF server in dev; production co-locate or Caddy proxy
