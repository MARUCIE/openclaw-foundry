# Job Packs Execution Plan

> PDCA execution plan for upgrading 3 role packs → 8 job packs with layer inheritance

## Architecture Decision (from swarm brainstorm 2026-03-26)

### Data Model: 2 Tables + Pre-generation

```
pack_layers (不可变内容块)
├── universal         → 所有岗位: git safety, output format, no emoji
├── line-engineering  → 开发线: github MCP, code review, conventional commits
├── line-product      → 产品线: figma MCP, PRD template, RICE framework
├── line-data         → 数据AI线: jupyter MCP, SQL, pandas rules
├── line-business     → 业务运营线: search MCP, compliance, CRM rules
├── line-management   → 管理线: reporting, delegation, OKR format
├── role-frontend     → React 19, Tailwind v4, WCAG 2.1, CWV targets
├── role-backend      → Go/Python/Java, DB design, API design, error handling
├── role-devops       → Docker, Terraform, CI/CD, monitoring
├── role-pm           → PRD, user stories, metrics, stakeholder mgmt
├── role-data-analyst → SQL, visualization, A/B testing, cohort analysis
├── role-growth       → SEO, CRO, email, social, content strategy
├── role-founder      → Ship-first, monolith, Supabase, Stripe
└── role-finance-tax  → VAT, Golden Tax, bookkeeping, compliance

config_packs (组合引用 + 展示元数据)
├── frontend-engineer    → ["universal", "line-engineering", "role-frontend"]
├── backend-engineer     → ["universal", "line-engineering", "role-backend"]
├── devops-sre           → ["universal", "line-engineering", "role-devops"]
├── product-manager      → ["universal", "line-product", "role-pm"]
├── data-analyst         → ["universal", "line-data", "role-data-analyst"]
├── growth-marketing     → ["universal", "line-business", "role-growth"]
├── startup-founder      → ["universal", "line-engineering", "role-founder"]
└── finance-tax-pm       → ["universal", "line-business", "role-finance-tax"]
```

### UX Pattern: Question Tree → 1 Recommendation

```
Open /packs → "你主要用 Claude Code 做什么？"
  → [写代码] → "什么方向？" → [前端/后端/DevOps/全栈]
  → [做产品] → 推荐 product-manager
  → [做数据] → 推荐 data-analyst
  → [做运营/增长] → 推荐 growth-marketing
  → [创业/独立开发] → 推荐 startup-founder
Result: 1 个推荐 pack + install 命令 + "查看全部"折叠入口
```

### Generation Pipeline

```
seed-layers.sql + seed-packs.sql
  → scripts/generate-packs.ts (build time)
    → web/public/packs/{id}/CLAUDE.md  (layer concat)
    → web/public/packs/{id}/AGENTS.md  (layer concat)
    → web/public/packs/{id}/settings.json (MCP merge)
    → web/public/packs/{id}/prompts.md (role-specific)
    → web/public/packs/{id}/install.sh (templated)
    → web/public/data/packs.json (listing)
```

---

## PDCA Phases

### Phase 1: Data Layer (Plan + Do)
- [ ] Create migration-v5.sql: pack_layers + updated config_packs
- [ ] Write seed-layers.sql: 1 universal + 5 line layers + 8 role layers = 14 layers
- [ ] Write seed-packs-v2.sql: 8 packs with layer_ids references
- [ ] Execute migration + seed on D1

### Phase 2: Generation Script (Do)
- [ ] Create scripts/generate-packs.ts: read layers → merge → write files
- [ ] Generate 8 x 5 = 40 static files to public/packs/
- [ ] Generate packs.json listing with line grouping
- [ ] Verify: each CLAUDE.md = universal + line + role concatenated

### Phase 3: Frontend Redesign (Do)
- [ ] Rebuild /packs with question tree (2-3 steps → 1 recommendation)
- [ ] Add "Browse All" toggle with Tab-by-line grouping
- [ ] Keep install command as primary CTA
- [ ] i18n: add keys for all 8 packs + question tree

### Phase 4: Verify + Deploy (Check + Act)
- [ ] Build 16/16 PASS
- [ ] Test install.sh for all 8 packs in /tmp
- [ ] Push + deploy
- [ ] Open browser verification

## V1 Scope: 8 Packs (RICE ordered)

| Priority | Pack ID | Role | Line | Layers |
|----------|---------|------|------|--------|
| 1 | backend-engineer | 后端工程师 | engineering | universal + line-eng + role-backend |
| 2 | frontend-engineer | 前端工程师 | engineering | universal + line-eng + role-frontend |
| 3 | product-manager | 产品经理 | product | universal + line-product + role-pm |
| 4 | devops-sre | 运维/SRE | engineering | universal + line-eng + role-devops |
| 5 | data-analyst | 数据分析师 | data | universal + line-data + role-data-analyst |
| 6 | growth-marketing | 增长/营销 | business | universal + line-business + role-growth |
| 7 | startup-founder | 创业者 | engineering | universal + line-eng + role-founder |
| 8 | finance-tax-pm | 财税合规PM | business | universal + line-business + role-finance-tax |

---
Maurice | 2026-03-26
