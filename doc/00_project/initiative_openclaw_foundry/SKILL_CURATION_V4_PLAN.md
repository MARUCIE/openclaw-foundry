# Skill Curation Pipeline v4 — SOTA Upgrade Plan

> From bulk import to curated marketplace. 7 critical defects → 6-phase remediation.

**Version**: 1.0 | **Date**: 2026-03-26

---

## Executive Summary

Current state: 2000 skills from 2 sources (ClawHub 1500 + MCP Registry 500), with 7 critical quality defects that make the marketplace unusable for curation: 75% S-rated (no differentiation), 27 duplicate "mcp-server" entries, zero editorial content, zero icons, zero tags, "Other" as the largest category, and 3-day stale data.

Target state: A SOTA-curated skill marketplace with normalized bell-curve ratings, unique names, multi-dimensional tags, editorial taglines, auto-assigned icons, clean categories, and daily fresh sync.

---

## Audit Findings (7 Defects)

| # | Defect | Severity | Current | Target |
|---|--------|----------|---------|--------|
| 1 | Rating inflation | P0 | S:75% A:25% | S:5% A:15% B:40% C:30% D:10% |
| 2 | Duplicate names | P0 | 27x "mcp-server", 16 groups | 0 duplicates |
| 3 | Zero editorial | P1 | 0 taglines, 0 trending | S/A: 100% tagline coverage |
| 4 | Zero icons | P1 | 0/2000 | 100% icon coverage |
| 5 | Zero tags | P1 | Single category only | 3-5 tags per skill |
| 6 | "Other" is #1 | P2 | 3548 score, largest cat | <5% of skills |
| 7 | Stale data | P2 | 3 days since last sync | Daily auto-sync |

---

## 6-Phase PDCA Plan

### Phase 1: Dedup + Rename (P0)
- Identify all duplicate names (16 groups, 27x "mcp-server")
- Merge duplicates by source URL (keep highest-scored)
- Generate unique names: `{author}/{skill-name}` or description-based slug
- Add dedup gate to sync pipeline (prevent future duplicates)
- **Deliverable**: Clean dataset with 0 duplicate names

### Phase 2: Rating Calibration (P0)
- New composite score formula:
  ```
  score = (norm_downloads * 0.3) + (norm_stars * 0.25) + (freshness * 0.2) + (desc_quality * 0.15) + (platform_count * 0.1)
  ```
- Rating thresholds from percentile distribution:
  - S: top 5% (≈100 skills)
  - A: 5-20% (≈300 skills)
  - B: 20-60% (≈800 skills)
  - C: 60-90% (≈600 skills)
  - D: bottom 10% (≈200 skills)
- **Deliverable**: Bell-curve rating distribution, recalculated for all skills

### Phase 3: Tag System (P1)
- 3 tag dimensions:
  - **tech-stack**: language/framework tags (python, typescript, react, docker, etc.)
  - **scenario**: use-case tags (code-review, deployment, data-analysis, etc.)
  - **platform**: Claude Code, Cursor, Windsurf, VS Code, etc.
- Tagging method: LLM batch (Gemini Flash) from name + description
- Storage: `tags` JSON array field in skills table
- Frontend: tag filter chips on /explore/skills
- **Deliverable**: 3-5 tags per skill, filterable in UI

### Phase 4: Editorial Content (P1)
- Auto-generate editorial tagline (1-line Chinese pitch) for S/A skills via LLM
- Assign Material Symbol icons by category mapping (23 categories → 23 icons)
- Calculate trending score: download velocity (7d delta / total)
- **Deliverable**: 400+ taglines, 2000 icons, trending ranking

### Phase 5: Classification Optimization (P2)
- Reclassify "Other" bucket: LLM re-categorize with stricter rules
- Add sub-categories for top categories (区块链 Web3 → DeFi/NFT/Wallet/Chain)
- Update category taxonomy in skills-categories.json
- **Deliverable**: "Other" < 5%, cleaner category distribution

### Phase 6: Sync Pipeline Hardening (P2)
- Add quality gate: reject skills with score < threshold
- Auto-dedup on each sync (by name + author + source URL)
- Daily quality report: new/removed/degraded skills
- Cron: daily 06:00 UTC (existing)
- **Deliverable**: Self-healing pipeline with quality assurance

---

## Tag Taxonomy (Phase 3 Detail)

### tech-stack tags (30+)
```
python, typescript, javascript, go, rust, java, kotlin, swift
react, vue, nextjs, fastapi, django, express, spring
docker, kubernetes, terraform, aws, gcp, azure, cloudflare
postgresql, mysql, redis, mongodb, sqlite, supabase
pytorch, tensorflow, langchain, openai, anthropic, gemini
```

### scenario tags (20+)
```
code-review, deployment, monitoring, testing, debugging
data-analysis, visualization, etl, sql-query
content-creation, seo, marketing, social-media
project-management, documentation, translation
security-audit, compliance, authentication
ai-agent, llm-integration, rag, embedding
```

### platform tags (6)
```
claude-code, cursor, windsurf, vscode, cline, remote
```

---

## Scoring Formula (Phase 2 Detail)

### Input normalization (0-1 scale)
```
norm_downloads = log10(downloads + 1) / log10(max_downloads + 1)
norm_stars = log10(stars + 1) / log10(max_stars + 1)
freshness = max(0, 1 - days_since_update / 365)
desc_quality = min(1, len(description) / 200)
platform_count = len(platforms) / max_platforms
```

### Composite score
```
composite = (norm_downloads * 0.3) + (norm_stars * 0.25) + (freshness * 0.2) + (desc_quality * 0.15) + (platform_count * 0.1)
```

### Rating thresholds (percentile-based)
```
S: composite >= P95  (top 5%)
A: composite >= P80  (top 20%)
B: composite >= P40  (top 60%)
C: composite >= P10  (top 90%)
D: composite < P10   (bottom 10%)
```

---

## Key Decisions

| # | Decision | Rationale | Rejected Alternative |
|---|----------|-----------|---------------------|
| 1 | Percentile-based ratings | Guarantees bell curve regardless of raw data quality | Fixed thresholds (inflate/deflate with data changes) |
| 2 | LLM batch tagging | 2000 skills too many for manual; Gemini Flash is fast + cheap | Manual tagging (impossible at scale) |
| 3 | `{author}/{name}` dedup | Matches npm/GitHub convention; preserves provenance | Hash-based dedup (loses readability) |
| 4 | 3 tag dimensions | Covers discovery axes (what tech, what for, where) | Single flat tag list (no structure) |
| 5 | Daily quality report | Catches degradation early; builds trust | Silent sync (issues accumulate) |

---

## Success Metrics

| Metric | Current | Target | Measurement |
|--------|---------|--------|-------------|
| Rating distribution std dev | 0 (bimodal) | Normal (σ ≈ 0.8) | Stats on composite score |
| Duplicate names | 16 groups | 0 | Unique constraint check |
| Editorial coverage (S/A) | 0% | 100% | tagline non-null count |
| Icon coverage | 0% | 100% | icon non-null count |
| Tag coverage | 0% | 95%+ | skills with ≥3 tags |
| "Other" category share | 17.7% | <5% | Category distribution |
| Sync freshness | 3 days | <24 hours | Last sync timestamp |

---

Maurice | maurice_wen@proton.me
