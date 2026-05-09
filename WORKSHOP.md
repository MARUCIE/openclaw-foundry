# Agent Foundry · Workshop Quick Start

> **The 60-second box-open**: clone → install → open browser → curated 37k-skill marketplace ready for the demo.

This guide takes a fresh laptop to a running, browsable Agent Foundry instance in under 5 minutes. Designed for internal AI workshops where the toolkit is the artefact.

---

## Prerequisites

| Requirement | Why |
|---|---|
| **Node.js 20+** | Next.js 15 + Tailwind 4 minimum runtime. Check: `node --version` |
| **Git** | To clone the workshop bundle |
| **A modern browser** | Chrome, Safari, Edge, Firefox — anything from 2024+ |

Optional (only for self-hosting the API backend):
- A free Cloudflare account (Pages + Workers + D1) — see `README.md` §"Option 2: Self-host"

---

## 60-second path (frontend-only, mock data)

```bash
# 1. Clone
git clone https://github.com/MARUCIE/openclaw-foundry.git agent-foundry
cd agent-foundry

# 2. One command starts the workshop
npm run workshop:start
```

That's it. The script runs `cd web && npm install --silent && npm run dev` for you.

When you see `▲ Next.js 15.x.x — Local: http://localhost:3200`, open that URL.

You should see the **Agent Capability Marketplace** as the home page (37k+ skills, search, S/A/B/C ratings, install modal).

---

## What you can demo right now

1. **Browse 37,000+ skills** at `/` (the marketplace home)
2. **Filter by category, source, rating** — left sidebar + top tabs
3. **Click "Install"** on any skill → modal shows install commands for 5 target CLIs (Claude Code, Codex, Gemini, Cursor, generic)
4. **Switch language** EN ↔ ZH from the top-right corner
5. **Explore platforms** at `/explore/platforms` — 13 deployment targets organized by automation tier
6. **Configuration packs** at `/packs` — guided wizard that recommends pre-built skill bundles by role (frontend / backend / data / PM / etc.)
7. **Pricing comparison** at `/pricing` — side-by-side for individual / team / enterprise tiers
8. **Marketing landing** preserved at `/about` — for the "before vs after" workshop story

---

## Production-ready path (live data + Cloudflare deploy)

When you want real data instead of mock JSON, follow `README.md` §"Option 2: Self-host" — that path adds:

- Cloudflare D1 database (skills + ratings)
- Cloudflare Workers API (Hono-based REST)
- Daily GitHub Actions cron that scrapes ClawHub + MCP Registry

Estimated time: **15 minutes** the first time, including Cloudflare account setup and D1 binding.

---

## Workshop facilitation tips

- **Demo flow (~10 min)**: home browse → install modal → switch lang → packs wizard → pricing comparison
- **Hands-on follow-up (~30 min)**: have each participant fork the repo and customize one of the 12 routes (e.g. add their team's name to `web/lib/constants.ts`, change the brand color in `web/app/globals.css`)
- **Design tokens lesson**: `web/lib/design-tokens.ts` is the single source for typography + color + spacing. Show how a single token change ripples across all 12 routes — a great vehicle for teaching "system thinking" vs "page thinking"
- **Architecture lesson**: walk through `web/components/marketplace-shell.tsx` — one component, two routes (`/` and `/explore/skills`) — to demonstrate DRY component extraction

---

## Troubleshooting

| Symptom | Fix |
|---|---|
| `npm run workshop:start` fails with "ENOTSUP" | You're on Node < 20. Install Node 20 LTS via `brew install node@20` or [nodejs.org](https://nodejs.org) |
| Port 3200 already in use | `lsof -i :3200` → kill the offender, or set `PORT=3201 npm run workshop:start` |
| Skills page is empty | The mock JSON might be out of date. Try `cd web && npm run dev` directly to see Next.js errors |
| Browser shows blank page | Check the Next.js terminal for build errors. Tailwind 4 occasionally needs a `rm -rf .next && npm run dev` reset |
| Catalog cards never render even with no errors | Sanity-check the mock data: `ls web/public/data/skills.json` must exist (718K). If missing, the seed step from README.md "Option 2: Self-host" is required |

---

## Project structure (workshop scope)

```
agent-foundry/
├── README.md                  ← Full project readme
├── WORKSHOP.md                ← You are here
├── package.json               ← npm run workshop:start
├── web/                       ← Next.js frontend (workshop subject)
│   ├── app/
│   │   ├── page.tsx           ← Home = Capability Marketplace (post-T4 IA)
│   │   ├── about/             ← Demoted marketing landing (preserved)
│   │   ├── explore/skills/    ← Same Marketplace component, alias route
│   │   ├── explore/platforms/ ← 13 platforms organized by automation tier
│   │   ├── packs/             ← Guided pack wizard
│   │   ├── pricing/           ← Comparison table + 3 recommendation tiers
│   │   ├── arena/, deploy/, news/, skill/, api-docs/
│   │   └── globals.css        ← MD3 tokens + Agent Foundry --af-* tokens
│   ├── components/
│   │   ├── marketplace-shell.tsx  ← The workhorse component (~640 lines)
│   │   ├── top-nav.tsx, footer.tsx
│   │   └── ui/                ← badge, states, primitives
│   ├── lib/
│   │   ├── design-tokens.ts   ← Single source for typography / palette / radii
│   │   ├── api.ts, i18n.ts, constants.ts
│   │   └── ...
│   └── public/data/           ← Mock skills.json + skills-categories.json
└── outputs/                   ← Per-task evidence (audits, scaffolds, screenshots)
    ├── design-token-audit/2026-05-09/   ← T1 inventory + verify-t* scripts
    ├── stitch-design-pipeline/2026-05-09-agent-foundry/  ← T5 scaffolds
    └── sop-5.1/...                       ← T8 frontend validation runs
```

---

## Verification status (2026-05-09 build)

| Gate | Result | Evidence |
|---|---|---|
| Brand rename ("OpenClaw Foundry" → "Agent Foundry") | PASS | `outputs/design-token-audit/2026-05-09/verify-t3.sh` exit 0 |
| Home = Agent Capability Marketplace | PASS | `web/app/page.tsx` renders `MarketplaceShell`; old landing preserved at `/about` |
| Token unification (raw hex < 5, arbitrary text-px < 50) | PASS | `outputs/design-token-audit/2026-05-09/verify-t6.sh`: 1 hex / 0 text-px |
| Frontend Playwright walk (12 routes × 3 viewports) | PASS | `outputs/sop-5.1/verify-iter2.sh`: 0 horizScroll, 0 broken images, 0 page errors, all titles correct |
| 3-round visual swarm (Jobs / Hara / Catmull) | PASS | `outputs/auto-visual-swarm-review/2026-05-09-agent-foundry/round3/verdict.md`: 3/3 APPROVE_SOTA |
| Workshop quick-start (this file + `npm run workshop:start`) | PASS | `WORKSHOP.md` + root `package.json` `workshop:start` script |

**Known unverified**: API routes (`/api/providers`, `/api/packs`, `/api/skills`) return 500 on the local dev server because the Cloudflare Workers backend isn't running locally. The frontend handles missing data gracefully (loading skeletons + empty states render). For a workshop demo, use the static `web/public/data/*.json` mock files (already populated, 718K of skills).

**Known HITL deferred**: production URL (`openclaw-foundry.pages.dev`) and GitHub repo slug (`MARUCIE/openclaw-foundry`) remain on the OpenClaw branding — both require Maurice to perform the rename via Cloudflare Pages settings + GitHub repo settings. Until then, the clone command in §"60-second path" still uses `openclaw-foundry`.

## What this toolkit is NOT

- **Not a vendor product**: Agent Foundry is an open MIT-licensed reference implementation
- **Not a CLI**: skills are referenced here, but installation runs through Claude Code / Codex / Cursor / Gemini CLIs the participant already has
- **Not opinionated about backend**: the frontend is decoupled — any REST API returning the documented skill schema works (mock JSON, Cloudflare Workers, your own FastAPI, anything)

---

Maurice | maurice_wen@proton.me
