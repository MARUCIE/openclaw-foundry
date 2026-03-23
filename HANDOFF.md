# HANDOFF: OpenClaw Foundry v4.0 Frontend Implementation

> Written: 2026-03-22 | Status: Phase 1-4 DONE

## Current State

### Backend (DONE)
- **Provider v4.0**: 12 Provider 全真实实现, 28/28 测试 PASS, tsc 零错误
- **types.ts**: 12 PROVIDER_IDS, 3 Tier, ProviderMeta 含 tier/installCmd/github
- **Registry**: `src/providers/registry.ts` 按 Tier 排序
- **New providers**: hiclaw.ts, copaw.ts, qclaw.ts (替代 workbuddy.ts)
- **Deleted**: miclaw.ts, lenovo.ts, lobsterai.ts, workbuddy.ts
- **Architecture doc**: `doc/00_project/initiative_openclaw_foundry/SYSTEM_ARCHITECTURE.md` (v4.0 章节)
- **Research**: `findings.md` (真实自动化路径)

### Design (DONE)
- **Stitch Project**: `7159207622223544370` (OpenClaw Foundry v4.0 Portal)
- **Design System**: Azure Foundry (The Digital Curator)
  - Primary: #003ea8/#0053db, Secondary: #712ae2, Accent: #4edea3
  - Fonts: Manrope (headings), Inter (body)
  - Light theme, MD3 tokens, rounded-2xl, no 1px borders (tonal layering)
- **5 Winner HTML files** in `design/winner/`

### Frontend (DONE -- implemented 2026-03-22)
- **Tech stack**: Next.js 15 + React 19 + Tailwind v4 + SWR
- **Build**: 12/12 pages, 0 errors, all static prerendered
- **Layout**: TopNav (glassmorphism, fixed) + Footer (Azure Foundry branding)
- **8 new/updated pages**:

| Route | Source | Description |
|-------|--------|-------------|
| `/` | `landing-v4.html` | Hero + Stats + Platforms(3 Tier) + News + Skills + Footer |
| `/explore/skills` | `skills-marketplace.html` | Search + Source tabs + Sidebar filters + 3-col card grid |
| `/explore/mcp` | `mcp-directory.html` | Hero search + Featured 3 + Category tabs + 4-col grid |
| `/explore/platforms` | `catalog.html` (upgraded) | Tier-grouped cards + Type filter + GitHub links |
| `/news` | `news-center.html` | Featured article + Feed + Version tracker + Tags + Subscribe |
| `/pricing` | `pricing.html` | 12-platform table + 3 Recommendation cards + Enterprise CTA |
| `/deploy` | (existing) | 4-step deploy wizard (unchanged) |
| `/arena` | (existing) | Arena battle page (unchanged) |

### Key Files Changed/Created

| File | Action |
|------|--------|
| `web/app/layout.tsx` | Rewritten: Sidebar → TopNav + Footer |
| `web/app/page.tsx` | Rewritten: Dashboard → Landing |
| `web/app/globals.css` | Updated: Azure Foundry MD3 tokens from Winner HTML |
| `web/components/top-nav.tsx` | New: Fixed glassmorphism top navigation |
| `web/components/footer.tsx` | New: Azure Foundry branded footer |
| `web/lib/api.ts` | Updated: Added ProviderTier, installCmd, github, price |
| `web/app/explore/skills/page.tsx` | New: Skills Marketplace |
| `web/app/explore/mcp/page.tsx` | New: MCP Server Directory |
| `web/app/explore/platforms/page.tsx` | New: Platform Overview (Tier-grouped) |
| `web/app/news/page.tsx` | New: News Center |
| `web/app/pricing/page.tsx` | New: Pricing Comparison |

### Kept Unchanged
- `web/components/sidebar.tsx` — Not imported anymore but kept for reference
- `web/components/top-bar.tsx` — Not imported anymore but kept for reference
- `web/components/ui/card.tsx` — Used by deploy/arena pages
- `web/components/ui/badge.tsx` — Used by deploy/arena/catalog pages
- `web/app/catalog/page.tsx` — Old catalog, still accessible at /catalog
- `web/app/deploy/page.tsx` — Deploy wizard unchanged
- `web/app/arena/page.tsx` — Arena page unchanged

## Next Steps
- [ ] Connect explore/platforms to real API (currently uses SWR + getProviders)
- [ ] Add real news feed API or CMS integration
- [ ] Skills/MCP: connect to backend data source (currently static data)
- [ ] Deploy to Vercel/CF Pages
- [ ] Delete unused sidebar.tsx and top-bar.tsx
- [ ] UI polish round 2-3 (responsive fine-tuning, animation)

## Commands

```bash
cd /Users/mauricewen/Projects/22-openclaw-foundry
npx tsc --noEmit                    # Backend check (should PASS)
npx tsx --test tests/providers.test.ts  # 28/28 should PASS
cd web && npm run build             # Frontend build (12/12 pages, 0 errors)
cd web && npm run dev               # Start frontend dev server :3200
```
