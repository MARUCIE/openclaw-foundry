# Job Packs PRD -- OpenClaw Foundry

> From 3 role packs to systematic Job Pack taxonomy. Covering real-world tech company org charts.

**Version**: 1.0 | **Date**: 2026-03-26

---

## 1. Executive Summary

Current state: 3 packs (finance-tax-pm, fullstack-indie, frontend-engineer), manually curated, no inheritance model.

Target state: 20+ Job Packs organized by job family lines, with a shared inheritance tree, differentiated configs per role, and RICE-prioritized V1 scope of 8--10 packs.

Core insight: Job Packs are not just skill bundles -- they are **opinionated work environments**. Each pack encodes a role's quality priorities, domain knowledge, tool chain, and starter workflows. The pack IS the onboarding.

---

## 2. Job Family Tree (Taxonomy)

Based on a typical 200--500 person Chinese tech company. 6 job families, 22 roles.

```
Job Family Tree
==============================================================================

A. Engineering Line (工程线) ................................................ 7 roles
   A1. Frontend Engineer          前端工程师          [EXISTS]
   A2. Backend Engineer            后端工程师
   A3. Full-Stack Engineer         全栈工程师
   A4. Mobile Engineer             移动端工程师       (iOS/Android/Flutter)
   A5. Data Engineer               数据工程师         (ETL/Warehouse/Pipeline)
   A6. DevOps / SRE                运维/SRE工程师
   A7. QA / Test Engineer          测试工程师

B. Product Line (产品线) ................................................... 3 roles
   B1. Product Manager             产品经理
   B2. UX Designer                 交互/用户体验设计师
   B3. Technical Writer            技术文档工程师

C. Data & AI Line (数据与AI线) ............................................ 3 roles
   C1. Data Analyst                数据分析师
   C2. ML / AI Engineer            机器学习/AI工程师
   C3. AI Product Manager          AI产品经理

D. Business & Operations Line (业务与运营线) .............................. 4 roles
   D1. Growth / Marketing          增长/营销
   D2. Operations                  运营
   D3. Customer Success            客户成功
   D4. Finance & Tax PM            财税合规PM         [EXISTS as finance-tax-pm]

E. Management Line (管理线) ................................................ 3 roles
   E1. Engineering Manager         工程经理/技术主管
   E2. CTO / Tech Director         技术总监/CTO
   E3. Startup Founder             创业者/独立开发者   [EXISTS as fullstack-indie]

F. Creative & Content Line (创意与内容线) ................................. 2 roles
   F1. Content Creator / Writer    内容创作者
   F2. UI / Visual Designer        视觉设计师
```

### Taxonomy Rationale

| Design Decision | Why |
|----------------|-----|
| 6 families, not 4 | Separates Data/AI from Engineering (different tools); separates Creative from Product (different workflows) |
| 22 roles, not 15 | Covers specialization; real companies differentiate backend vs frontend vs mobile |
| Chinese + English | Target market is Chinese tech; English for code/config identifiers |
| No "junior/senior" | Level affects prompt depth, not pack identity. Level is a parameter, not a separate pack |

---

## 3. Per-Role Configuration Differentiation

### 3.1 CLAUDE.md Core Differences

Each CLAUDE.md encodes 4 dimensions of role-specific behavior:

| Dimension | Description | Example Variation |
|-----------|-------------|-------------------|
| **Quality Priority** | What the role optimizes for first | Engineer: Correctness > Readability; Designer: Aesthetics > Correctness; PM: Clarity > Detail |
| **Domain Knowledge** | Role-specific expertise injected as rules | Backend: API design patterns, DB normalization; Finance: tax codes, accounting standards |
| **Work Rules** | Behavioral constraints | QA: never skip edge case analysis; DevOps: always include rollback plan; PM: always include user story format |
| **Output Format** | Default output structure | Engineer: code blocks + tests; PM: PRD tables + user stories; Analyst: charts + executive summary |

#### Detailed CLAUDE.md Matrix

```
Role                   Quality Priority                    Domain Injection                     Key Rules
─────────────────────  ──────────────────────────────────  ───────────────────────────────────  ──────────────────────────────────
A1 Frontend            Readability > Perf > Correctness    React/Vue patterns, a11y, CWV        Component-first, mobile-first
A2 Backend             Correctness > Perf > Readability    API design, DB patterns, auth         Contract-first, idempotency
A3 Full-Stack          Speed > Correctness > Perf          End-to-end patterns, monorepo         Ship fast, iterate later
A4 Mobile              UX > Perf > Correctness             Platform guidelines, offline-first    60fps, battery-aware
A5 Data Eng            Correctness > Perf > Readability    SQL, Spark, pipeline patterns          Idempotent pipelines, schema-first
A6 DevOps              Reliability > Security > Speed      IaC, K8s, monitoring                  Rollback plan mandatory
A7 QA                  Correctness > Coverage > Speed      Test patterns, boundary analysis       Always test sad path first

B1 Product             Clarity > Actionability > Detail    PRD patterns, metrics, A/B             User story format, RICE scoring
B2 UX Design           Usability > Aesthetics > Speed      Design system, heuristics              Wireframe before visual
B3 Tech Writer         Accuracy > Readability > Brevity    API doc patterns, diagrams             Show, don't tell

C1 Data Analyst        Accuracy > Insight > Speed          SQL, statistics, visualization         Source citation mandatory
C2 ML Engineer         Reproducibility > Perf > Speed      ML ops, experiment tracking            Baseline before innovation
C3 AI PM               Feasibility > Impact > Clarity      AI capabilities, limitations           Evals before launch

D1 Growth              Impact > Speed > Accuracy           Channel, funnel, attribution           Hypothesis-driven
D2 Operations          Efficiency > Accuracy > Speed       SOP, automation, metrics               Process before ad-hoc
D3 Customer Success    Empathy > Accuracy > Speed          CRM, onboarding, churn                 Listen before solve
D4 Finance/Tax PM      Compliance > Accuracy > Speed       Tax law, accounting standards          Regulatory cite required

E1 Eng Manager         Balance > Depth > Speed             Team health, sprint patterns           Trade-off analysis
E2 CTO                 Strategy > Breadth > Detail         Architecture, build-vs-buy             Decision memo format
E3 Founder             Speed > Breadth > Depth             GTM, MVP, runway math                  80/20, ship this week

F1 Content             Engagement > Accuracy > SEO         Writing craft, audience analysis       Hook in first line
F2 UI Design           Aesthetics > Consistency > Speed    Visual hierarchy, color theory          Brand guidelines first
```

### 3.2 Recommended MCP Servers

Sourced from MCP Registry (11,870 servers). Each role gets 2--4 high-value MCP servers.

```
Role                   MCP Server 1              MCP Server 2              MCP Server 3              Optional 4
─────────────────────  ────────────────────────  ────────────────────────  ────────────────────────  ────────────────────
A1 Frontend            chrome-devtools           github                    figma-context             --
A2 Backend             github                    postgres/mysql            docker                    redis
A3 Full-Stack          github                    supabase                  cloudflare                vercel
A4 Mobile              github                    firebase                  expo                      --
A5 Data Eng            github                    postgres                  bigquery/snowflake        dbt
A6 DevOps              github                    docker                    kubernetes                prometheus
A7 QA                  github                    chrome-devtools           playwright                --

B1 Product             linear/jira               figma-context             notion                    --
B2 UX Design           figma-context             chrome-devtools           notion                    --
B3 Tech Writer         github                    notion                    mintlify                  --

C1 Data Analyst        postgres                  google-sheets             tableau/metabase          --
C2 ML Engineer         github                    wandb                     huggingface               --
C3 AI PM               github                    langsmith                 anthropic-console         --

D1 Growth              google-analytics          google-ads                meta-ads                  --
D2 Operations          notion                    google-sheets             zapier                    --
D3 Customer Success    hubspot/intercom          gmail                     google-calendar           --
D4 Finance/Tax PM      tavily-search             excel-analysis            --                        --

E1 Eng Manager         github                    linear/jira               google-calendar           --
E2 CTO                 github                    cloudflare                --                        --
E3 Founder             github                    supabase                  stripe                    --

F1 Content             tavily-search             wordpress                 --                        --
F2 UI Design           figma-context             chrome-devtools           nanobanana (image gen)    --
```

### 3.3 Recommended Skills Per Role

Target: 4--8 skills per pack (sweet spot: enough to be useful, not overwhelming).

```
Role                   Total Skills   Category Split                                          Key Skills
─────────────────────  ────────────   ──────────────────────────────────────────────────────   ──────────────────────────────────
A1 Frontend            6              3 code + 1 design + 1 test + 1 deploy                   react-best-practices, gsap-core, frontend-testing
A2 Backend             6              3 code + 1 db + 1 security + 1 deploy                   fastapi-templates, sql-queries, security-best-practices
A3 Full-Stack          7              3 code + 1 db + 1 deploy + 1 design + 1 security        react-best-practices, fastapi-templates, deploy-preview
A4 Mobile              5              3 code + 1 test + 1 deploy                              (flutter/swift/kotlin skills TBD)
A5 Data Eng            5              2 data + 1 sql + 1 pipeline + 1 code                    sql-queries, data-pipeline, dbt-guide
A6 DevOps              6              2 infra + 1 security + 1 deploy + 1 monitor + 1 docker  docker-optimizer, infra-patrol, deploy-preview
A7 QA                  5              2 test + 1 code + 1 automation + 1 security              frontend-testing, adversarial-review

B1 Product             5              2 product + 1 research + 1 analysis + 1 writing          create-prd, user-stories, competitor-analysis
B2 UX Design           5              2 design + 1 research + 1 frontend + 1 proto             frontend-design, ui-ux-polish, design-taste-frontend
B3 Tech Writer         4              2 writing + 1 code + 1 research                         deep-research, baoyu-translate

C1 Data Analyst        5              2 sql + 1 viz + 1 research + 1 analysis                  sql-queries, ab-test-analysis, deep-research
C2 ML Engineer         5              2 ml + 1 code + 1 experiment + 1 deploy                  (ml skills TBD)
C3 AI PM               5              2 product + 1 ai + 1 research + 1 eval                   create-prd, deep-research

D1 Growth              5              2 marketing + 1 seo + 1 analytics + 1 content            agentic-seo, gtm-strategy, deep-research
D2 Operations          4              2 efficiency + 1 automation + 1 docs                     (ops automation skills TBD)
D3 Customer Success    4              2 support + 1 analytics + 1 comm                         (cs skills TBD)
D4 Finance/Tax PM      5              2 compliance + 1 sql + 1 excel + 1 pipeline              compliance-docs, sql-queries, excel-analysis

E1 Eng Manager         5              2 management + 1 code-review + 1 planning + 1 comm       code-review, create-prd, release-checklist
E2 CTO                 6              2 architecture + 1 security + 1 strategy + 1 review + 1  adversarial-review, security-best-practices
E3 Founder             8              2 code + 1 deploy + 1 product + 1 growth + 1 design +    lean-canvas, launch-checklist, gtm-strategy

F1 Content             5              2 writing + 1 research + 1 seo + 1 translate             deep-research, agentic-seo, wechat-article-writer
F2 UI Design           5              2 design + 1 frontend + 1 proto + 1 image                frontend-design, design-taste-frontend
```

### 3.4 Starter Prompts (Scenario Categories)

Each pack ships with 4--6 starter prompts covering the role's most common day-1 tasks.

| Role | Prompt Categories | Example Prompts (zh) |
|------|-------------------|----------------------|
| A1 Frontend | component build, perf audit, responsive, a11y | "构建一个可访问的下拉菜单组件" |
| A2 Backend | API design, DB schema, auth flow, error handling | "设计一个订单服务的 RESTful API" |
| A3 Full-Stack | scaffold, full feature, deploy, debug | "搭建一个带用户认证的 SaaS 脚手架" |
| A6 DevOps | infra audit, deploy pipeline, incident response, monitoring | "检查这个 K8s 集群的健康状态并生成报告" |
| B1 Product | PRD, user story, competitive analysis, metrics | "为这个功能写一份 PRD" |
| C1 Data Analyst | SQL query, dashboard, A/B test, cohort | "分析过去 30 天的用户留存率" |
| D1 Growth | channel plan, landing page, A/B copy, funnel | "设计这个产品的冷启动获客方案" |
| D4 Finance/Tax | invoice audit, tax calc, compliance check, report | "检查这份合同的增值税发票条款是否合规" |
| E3 Founder | MVP scope, pitch deck, runway, GTM | "帮我做一个精益画布分析" |
| F1 Content | article outline, SEO, social copy, newsletter | "为这个话题写一篇公众号长文" |

---

## 4. Inheritance Model

### 4.1 Three-Layer Inheritance

```
Layer 0: Universal Base (all packs inherit)
  |
  +-- CLAUDE.md: Language rules, output format, safety constraints
  +-- MCP: github (universal for all code-touching roles)
  +-- Skills: deep-research (universal lookup capability)
  +-- Settings: base model config, token limits
  |
Layer 1: Job Family Base (per family)
  |
  +-- engineering-base:   git workflow, code review norms, test expectations
  +-- product-base:       user-centric rules, RICE framework, metrics focus
  +-- data-base:          accuracy rules, source citation, SQL conventions
  +-- business-base:      ROI mindset, SOP format, metrics dashboards
  +-- management-base:    decision memo format, trade-off templates
  +-- creative-base:      audience analysis, engagement metrics, brand guard
  |
Layer 2: Role-Specific (individual pack)
  |
  +-- Role-specific quality priorities
  +-- Role-specific domain knowledge
  +-- Role-specific MCP servers
  +-- Role-specific skills
  +-- Role-specific starter prompts
```

### 4.2 Shared Config Inheritance Map

```
                                 ┌─────────────┐
                                 │ universal-   │
                                 │ base         │
                                 │ github, deep-│
                                 │ research     │
                                 └──────┬───────┘
                    ┌──────┬──────┬─────┼──────┬──────┐
                    v      v      v     v      v      v
              ┌─────────┐┌────┐┌────┐┌─────┐┌────┐┌─────┐
              │engineer-││prod││data││biz- ││mgmt││creat│
              │base     ││base││base││base ││base││base │
              └────┬────┘└─┬──┘└─┬──┘└──┬──┘└─┬──┘└──┬──┘
           ┌─┬─┬─┬┴┬─┬─┐ ┌┴┬─┐ ┌┴┬─┐ ┌┴┬─┬┐ ┌┴┬─┐ ┌┴─┐
           v v v v v v v v v v v v v v v v v v v v v v
          A1 A2 A3 A4 A5 A6 A7 B1 B2 B3 C1 C2 C3 D1 D2 D3 D4 E1 E2 E3 F1 F2
```

### 4.3 Shared Resources Per Family

| Family | Shared MCP | Shared Skills | Shared CLAUDE.md Rules |
|--------|-----------|---------------|----------------------|
| Engineering (A) | github, docker | code-review, security-best-practices | git commit conventions, PR format, test coverage expectations |
| Product (B) | figma-context, notion | create-prd, user-stories | User story format, RICE scoring, metrics definitions |
| Data/AI (C) | postgres, github | sql-queries, deep-research | Source citation mandatory, reproducibility rules |
| Business (D) | google-sheets, tavily | deep-research | ROI calculation rules, SOP template |
| Management (E) | github, google-calendar | code-review | Decision memo format, trade-off matrix template |
| Creative (F) | tavily-search | deep-research, baoyu-translate | Audience-first rules, engagement metrics |

---

## 5. RICE Priority Ranking

Scoring criteria:
- **Reach**: How many potential users have this role? (1--10 scale, based on developer community composition)
- **Impact**: How much value does a well-configured pack deliver? (1--10)
- **Confidence**: Do we have the skills/MCP servers to deliver now? (1--10)
- **Effort**: How many person-hours to create? (1--10, lower = easier)

```
Rank  Role                   Reach  Impact  Confidence  Effort  RICE Score    Status
────  ─────────────────────  ─────  ──────  ──────────  ──────  ──────────    ──────
 1    A2 Backend Engineer       9      9         9         3      24.3        NEW
 2    A3 Full-Stack Engineer    8      9         9         3      21.6        UPGRADE (from fullstack-indie)
 3    B1 Product Manager        7      8         8         3      14.9        NEW
 4    A6 DevOps / SRE           6      9         8         4      10.8        NEW
 5    C1 Data Analyst           7      8         7         4       9.8        NEW
 6    A1 Frontend Engineer      8      8         9         3      19.2        UPGRADE (exists, add inheritance)
 7    D1 Growth / Marketing     6      7         7         4       7.4        NEW
 8    E3 Startup Founder        5      8         9         3      12.0        UPGRADE (from fullstack-indie)
 9    D4 Finance & Tax PM       3      9         8         3       7.2        UPGRADE (exists)
10    A7 QA / Test Engineer     5      7         7         4       6.1        NEW

--- V2 Boundary ---

11    C2 ML / AI Engineer       4      8         5         5       3.2
12    E1 Engineering Manager    4      7         6         4       4.2
13    A4 Mobile Engineer        5      7         5         5       3.5
14    A5 Data Engineer          4      8         6         5       3.8
15    F1 Content Creator        5      6         7         3       7.0
16    B2 UX Designer            4      7         6         4       4.2
17    E2 CTO / Tech Director    2      8         6         4       2.4
18    B3 Technical Writer       3      6         6         3       3.6
19    C3 AI Product Manager     2      7         5         4       1.8
20    D2 Operations             3      5         4         4       1.5
21    D3 Customer Success       2      5         4         5       0.8
22    F2 UI Designer            3      6         5         4       2.3
```

### RICE Score Formula

```
RICE = (Reach x Impact x Confidence) / Effort
```

### Why Backend Engineer Ranks #1

1. **Reach 9**: Backend is the largest single engineering specialization in Chinese tech companies
2. **Impact 9**: Backend tasks (API design, DB, auth) have high AI leverage -- structured, pattern-heavy
3. **Confidence 9**: We have sql-queries, fastapi-templates, security-best-practices, docker-optimizer ready
4. **Effort 3**: All required skills and MCP servers exist; only need CLAUDE.md + assembly

---

## 6. V1 Scope -- 8 Packs

### V1 Selection Rationale

| # | Pack ID | Role | Rationale |
|---|---------|------|-----------|
| 1 | `backend-engineer` | A2 Backend Engineer | Highest RICE. Largest audience in Chinese tech. All skills ready |
| 2 | `fullstack-engineer` | A3 Full-Stack Engineer | UPGRADE from fullstack-indie. Second highest reach. Covers indie + team devs |
| 3 | `product-manager` | B1 Product Manager | Non-engineering #1. PRD/story/analysis skills ready. High differentiation |
| 4 | `devops-sre` | A6 DevOps/SRE | Strong skills (infra-patrol, docker-optimizer, deploy-preview). Underserved market |
| 5 | `data-analyst` | C1 Data Analyst | Bridge role between business and engineering. SQL + viz skills ready |
| 6 | `frontend-engineer` | A1 Frontend | UPGRADE existing. Add inheritance, polish, more skills |
| 7 | `growth-marketing` | D1 Growth/Marketing | Non-technical role. SEO + GTM + research skills ready. Expands TAM |
| 8 | `startup-founder` | E3 Startup Founder | UPGRADE from fullstack-indie. Broadens to include product + growth + code |

### What V1 Covers

```
Coverage by Job Family:
  Engineering (A):  3/7  (Frontend, Backend, Full-Stack -- core triad)
  Product (B):      1/3  (PM -- the keystone)
  Data/AI (C):      1/3  (Analyst -- most accessible)
  Business (D):     1/4  (Growth -- highest leverage)
  Management (E):   1/3  (Founder -- unique value prop)
  Creative (F):     0/2  (V2)

Coverage by User Type:
  Individual developer:     3 packs (Frontend, Backend, Full-Stack)
  Team member:              2 packs (PM, DevOps)
  Business role:            2 packs (Analyst, Growth)
  Solo operator:            1 pack  (Founder)
```

### V1 Migration Plan (Existing Packs)

| Current Pack | V1 Action |
|-------------|-----------|
| `finance-tax-pm` | KEEP as-is (niche value, low effort to maintain). Add inheritance in V2 |
| `fullstack-indie` | SPLIT into `fullstack-engineer` (team) + `startup-founder` (solo). Deprecate old ID |
| `frontend-engineer` | UPGRADE in-place. Add inheritance layer, expand skills |

### V1 Deliverable Per Pack (5 files)

```
packs/{pack-id}/
  CLAUDE.md         -- Role-specific rules (inherits from base + family)
  AGENTS.md         -- Recommended agent personas for this role
  settings.json     -- MCP server config (installable by Claude Code)
  prompts.md        -- 4-6 starter prompts, organized by scenario
  install.sh        -- One-line installer: curl | bash
```

### V1 Technical Changes

1. **Inheritance engine**: `packs/_base/` + `packs/_family-{name}/` directories, `install.sh` merges layers
2. **packs.json schema**: Add `family`, `inherits`, `level` fields
3. **Web UI**: Show family tree nav, pack comparison table, inheritance badges
4. **API**: `GET /api/packs?family=engineering` filter, `GET /api/packs/:id/resolved` merged config

---

## 7. Schema Changes

### packs.json v2

```json
{
  "total": 8,
  "families": [
    {
      "id": "engineering",
      "name": "Engineering Line",
      "nameZh": "工程线",
      "icon": "code",
      "color": "#003ea8",
      "sharedMcp": ["github"],
      "sharedSkills": ["code-review", "security-best-practices"]
    }
  ],
  "packs": [
    {
      "id": "backend-engineer",
      "family": "engineering",
      "role": "Backend Engineer",
      "roleZh": "后端工程师",
      "description": "...",
      "descriptionZh": "...",
      "icon": "dns",
      "color": "#005136",
      "inherits": ["universal-base", "engineering-base"],
      "mcpServers": ["postgres", "docker", "redis"],
      "skillIds": ["fastapi-templates", "sql-queries", "docker-optimizer", "security-best-practices", "code-review", "deploy-preview"],
      "prompts": ["..."],
      "version": "1.0",
      "downloadCount": 0,
      "createdAt": "2026-03-26T00:00:00Z"
    }
  ]
}
```

### Inheritance Resolution Order

```
install.sh logic:
1. Download universal-base/ files
2. Download {family}-base/ files (overrides/merges)
3. Download {pack-id}/ files (overrides/merges)
4. CLAUDE.md: concatenate (base + family + role sections)
5. settings.json: deep merge (role MCP servers + family MCP + base MCP)
6. prompts.md: role-specific only (no inheritance)
7. AGENTS.md: role-specific only
```

---

## 8. Success Metrics

| Metric | V1 Target (3 months) | Measurement |
|--------|---------------------|-------------|
| Total packs | 8 (from 3) | Count in packs.json |
| Install count | 500 total | Download tracking API |
| Job family coverage | 5/6 families | Taxonomy check |
| Pack NPS | > 40 | Post-install survey (future) |
| Avg skills per pack | 5-7 | Schema validation |
| Inheritance reuse | > 60% config shared | Diff analysis base vs role |

---

## 9. Risk Mitigations

| Risk | Mitigation |
|------|-----------|
| Inheritance engine complexity delays V1 | Ship V1 with flat files first; add inheritance in V1.1 |
| Skills gaps for some roles (mobile, ML) | Mark packs as "beta" when skills are < 4; do not block launch |
| MCP server availability varies by platform | Install.sh checks MCP availability; graceful skip if missing |
| Pack bloat (too many skills overwhelm users) | Hard cap: 8 skills max per pack. Curate, don't accumulate |
| Low adoption of non-engineering packs | Seed with community content; Growth and PM packs have strong word-of-mouth potential |

---

## 10. Roadmap

```
V1.0 (4 weeks)     8 packs, flat files, RICE top-8
V1.1 (2 weeks)     Inheritance engine, family base configs
V2.0 (6 weeks)     +6 packs (ML, Mobile, CTO, UX, Content, Operations)
V2.1 (2 weeks)     Level variants (junior/senior modifier per pack)
V3.0 (8 weeks)     Community-contributed packs, review pipeline, pack marketplace
```

---

Maurice | maurice_wen@proton.me
