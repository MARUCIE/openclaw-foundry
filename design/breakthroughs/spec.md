# 蜕变墙 (Breakthroughs) — Design Spec

> Stitch-design-pipeline output, methodology-only variant (no remote Stitch generation; production-token-bound).
>
> Page slug: `/breakthroughs` · Nav label: 蜕变墙 · EN canonical: Breakthroughs
>
> Pair: [[卡点墙]] (`/wall`) — same data model, inverted visual hierarchy.

## 1. Page intent (one paragraph)

蜕变墙是 openclaw-foundry cohort 的成果展示墙。它和卡点墙读同一个 `/api/wall` 数据源，但翻转了视觉重心 —— 卡点墙强调"我卡在哪"（before_state 平铺），蜕变墙强调"我变成了什么"（after_method 上位，before_state 下沉为对照背景）。设计目的：让 cohort 看到同伴的真实蜕变路径，而不是抽象成功学，从而激发自己的下一次尝试。

## 2. Inherited tokens (production-bound, do NOT redefine)

| Token | Value | Where used |
|-------|-------|------------|
| `--primary` | indigo (per existing `wall-board.tsx:357`) | role chip, after_method accent bar |
| `--surface-container-highest` | (per footer ecosystem block 26b1885) | section wrappers |
| `--surface-container` | | role badge, breakthrough card body |
| `--on-surface` | | primary text |
| `--surface-tint` | | top border on section anchors |
| `border-radius: rounded-2xl` | | breakthrough card, section wrappers |
| Font: Inter | | inherited globally |
| `material-symbols-outlined` | | arrow + reaction icons |

## 3. Page structure (top → bottom)

```
+-----------------------------------------------+
|  page-shell py-12 space-y-10                  |
|                                                |
|  [Header]                                      |
|  | 2px indigo bar | 蜕变墙                    |
|                  | BREAKTHROUGHS · cohort 公开 |
|                  | 的 before/after 蜕变案例 — |
|                  | 同伴在这里把"卡点"翻成    |
|                  | "蜕变"，你可以学                |
|                                                |
|  [Filter row — optional, single line]          |
|  全部蜕变 · 角色: 全部 ▽ · 排序: 最新 ▽       |
|                                                |
|  [Breakthrough grid]                           |
|  +--------+  +--------+                        |
|  | card 1 |  | card 2 |  (1 col mobile,       |
|  +--------+  +--------+   2 col md+)          |
|  ...                                            |
|                                                |
|  [Empty state — if no data]                    |
|  | 还没有蜕变记录。去 [卡点墙] 提一个卡点，    |
|  | 解决之后就会在这里出现你的蜕变。           |
|                                                |
+-----------------------------------------------+
```

## 4. BreakthroughCard anatomy (the hero)

```
+----------------------------------------------+
|  [role chip]  匿名  ·  3 天前                 |
|                                                |
|  AFTER (large, font-bold, opacity-100)        |
|  ─────────────────────────────────────────    |
|  我现在每周用 GPT 跑 3 个用户访谈摘要，       |
|  把原来 1 天的工作压到 1 小时。               |
|                                                |
|  ↳ before (small, opacity-60, italic)         |
|     我之前手动整理访谈记录，一份要 8 小时，  |
|     做 3 份就是一周时间。                     |
|                                                |
|  💡 suggestion (callout, if present)           |
|     prompt 模板放在 [/skills/interview-       |
|     summarizer]，自己改 3 行就能跑           |
|                                                |
|  ♡ 12   →                                      |
+----------------------------------------------+
```

Hierarchy inversion vs wall-board.tsx:
- wall-board: `Before：` + `After：` 同等字号 + 平铺 (entry.before_state.slice(0, 200))
- breakthroughs: After 字号 1.125rem font-bold + Before 字号 0.875rem opacity-60 italic + 前缀 `↳` 标示蜕变路径

## 5. Component contract

```typescript
// components/breakthrough-wall.tsx (client component)
interface BreakthroughCardProps {
  entry: WallEntry;  // SAME schema as wall-board.tsx
  showSuggestion: boolean;
  onLike: (id: string) => void;
}

// Read-only view — no posting form (posting happens on /wall/detail).
// Filter applied: after_method.length >= 30 (substance threshold)
//                 + sort by like_count DESC, created_at DESC
```

## 6. Data strategy (this cycle = mock; next cycle = same /api/wall)

- **This cycle (T6)**: 3 hardcoded MOCK_BREAKTHROUGHS sample entries to validate visual hierarchy + responsive layout. Empty-state component built but not exercised.
- **Next cycle (out of scope for goal 64344e)**: swap mock → `useSWR(/api/wall?filter=breakthroughs)`. Worker route adds query param to existing `/api/wall` GET handler; no new D1 table needed because schema already supports both views.

This 2-cycle split honors Maurice's "设计个页面再实现" — page-first, data-second.

## 7. Anti-patterns rejected

1. ❌ Create new D1 table `wall_breakthroughs` — schema already has before_state + after_method; new table = data duplication + sync drift
2. ❌ Pivot to a different color (e.g. green for "success") — breaks brand consistency; the contrast is typographic + directional, not chromatic
3. ❌ Allow posting from /breakthroughs — fragments the cohort posting flow; one entry point (/wall/detail) only
4. ❌ Generate via remote Stitch tool with existing "Digital Lithograph" theme — that theme uses zero-radius + Public Sans which contradicts current production
5. ❌ Hide the [[卡点墙]] cross-link — the narrative arc IS the value; breakthroughs without a stuck-wall origin look like aspirational marketing

## 8. Responsive

- `xl` (≥1280px): 3 col grid
- `md` (≥768px): 2 col grid
- mobile: 1 col, card full-width with same hierarchy

## 9. A11y

- Card root = `<article aria-label="蜕变案例 by 匿名">`
- Like button: `aria-pressed` + `aria-label="点赞" / "已点赞"`
- prefers-reduced-motion: no transitions on hover

## 10. Verify checklist (T9 live)

- [x] Nav shows 4 tabs: 首页 / 岗位配置包 / 卡点墙 / 蜕变墙
- [x] /breakthroughs URL returns 200
- [x] Page renders 3 mock cards with After-hero + Before-recede hierarchy
- [x] surface-container-highest visual anchor present
- [x] Empty-state component exists in source (even if not rendered with mock data present)

---

Maurice | maurice_wen@proton.me
