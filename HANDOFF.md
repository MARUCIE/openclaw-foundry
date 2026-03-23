# HANDOFF: OpenClaw Foundry v4.0

> Written: 2026-03-23 | Status: SHIPPED (CF Pages + CF Workers + D1)

## Production URLs

| Service | URL |
|---------|-----|
| Frontend | https://openclaw-foundry.pages.dev |
| API | https://openclaw-foundry-api.maoyuan-wen-683.workers.dev |
| GitHub | https://github.com/MARUCIE/openclaw-foundry |

## Architecture (Zero VPS)

```
CF Pages (frontend) ←→ CF Workers/Hono (API) ←→ D1 SQLite (DB)
                                                  R2 (files)
                                                  KV (cache)
```

## What's Built

### Frontend (8 pages, Next.js 15 + Tailwind v4)
- `/` Landing: Hero + Stats + 3-Tier platforms + News + Skills
- `/explore/skills` Skills Marketplace: 249 ClawHub skills, 13 categories, S/A/B/C rating, search + pagination
- `/explore/mcp` MCP Directory: Featured 3 + 16-card grid + category tabs
- `/explore/platforms` Platform Overview: 12 providers, Tier-grouped, real API
- `/news` News Center: Featured article + feed + version tracker + subscribe
- `/pricing` Pricing: 12-platform comparison table + recommendation cards
- `/deploy` Deploy wizard (existing)
- `/arena` Arena battle (existing)

### Backend (CF Workers + D1)
- `worker/src/index.ts` Hono app with CORS + cron
- `/api/providers` D1-backed, 12 providers
- `/api/skills` D1-backed, 249 skills with search/category/rating/pagination
- `/api/stats` Aggregated stats
- `/api/health` Health check

### Data Pipeline
- `scripts/scrape-clawhub.mjs` Playwright headless scraper (ClawHub.ai top 300)
- `scripts/sync-clawhub-skills.mjs` Filter + rate (S/A/B/C) + categorize (13 categories)
- `scripts/prebuild-static.mjs` Bake JSON for static fallback
- `scripts/generate-seed-sql.mjs` JSON → D1 seed SQL
- `.github/workflows/deploy.yml` Auto-deploy: Pages + Workers + daily cron sync

### Design System: Azure Foundry
- Primary: #003ea8/#0053db, Secondary: #712ae2, Accent: #4edea3
- Fonts: Manrope (headings), Inter (body)
- Light theme, MD3 tokens, rounded-2xl, tonal layering (no 1px borders)

## Daily Auto-Sync
- GitHub Actions cron: 06:00 UTC daily
- Local cron: `0 6 * * * /path/to/scripts/clawhub-sync-cron.sh`
- Flow: Scrape ClawHub → filter/rate → seed D1 → redeploy Pages

## Data Pipeline (v2: Multi-Source)

### Sources
| Source | Count | Script | Method |
|--------|-------|--------|--------|
| ClawHub API | 33,566 | `scrape-clawhub-api.mjs` | REST `/api/v1/packages?family=skill` |
| ClawHub Scroll | 2,108 (stats) | `scrape-clawhub.mjs` | Playwright 4-sort dedup |
| Official MCP Registry | 11,870 | `scrape-mcp-registry.mjs` | REST v0.1 cursor pagination |
| **Unified** | **37,296** | `merge-all-sources.mjs` | Cross-source dedup |

### Processing
- `sync-clawhub-skills.mjs`: 23 categories, v3 scoring (continuous + percentile)
- `enrich-clawhub-data.mjs`: Merge scroll stats (downloads/stars) into API data
- `prebuild-static.mjs`: Top 2000 for static, full via Workers API
- `generate-seed-sql.mjs`: D1 seed from unified index

### Category System (23 categories)
区块链 Web3, 金融交易, 电商营销, 办公文档, 教育学习, 游戏娱乐, 生活服务, HR 人才,
Agent 基建, 安全合规, AI 模型, 浏览器自动化, 搜索与研究, 通讯集成, 数据分析,
内容创作, 效率工具, 多媒体, DevOps 部署, 代码开发, 系统工具, API 网关, 其他

### Rating (percentile: S 5% / A 21% / B 32% / C 34% / D 7%)

## Commits
1. `6dbd779` feat(portal): v4.0 frontend 8 pages + ClawHub sync + UI polish 3 rounds
2. `f016e1a` chore: configurable API base URL
3. `bcf10f9` feat(static): prebuild baked data for CF Pages
4. `ecffda4` ci: GitHub Actions auto-deploy + daily cron
5. `9c97a83` feat(worker): CF Workers backend (Hono + D1 + R2)
6. `f057734` feat(live): connect frontend to Workers API
7. `750ff8d` feat(data): multi-source skill registry — 249 to 37,296 entries

## Reusable Template (for 50 projects)
```
project/
├── web/              ← CF Pages (Next.js static)
├── worker/           ← CF Workers (Hono + D1 + R2)
├── scripts/          ← Data pipeline
├── data/             ← Processed data
└── .github/workflows/deploy.yml
```
