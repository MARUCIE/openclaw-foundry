# Tool-Kit 05 · Document Templates · Prototype Designer

> 5 类文档模板覆盖原型设计常用产物。

## Template 1 · Prototype Handoff Spec

```markdown
# Prototype Handoff · <slug> · v<X>

## Metadata
| Field | Value |
|-------|-------|
| PRD link | |
| Screens | <N> |
| Brand vibe | claude-warm / stripe-minimal / linear-dark / custom |
| Token set | <CSS file or tailwind extend> |
| Aesthetic probe score | X.X/5 |

## Screen × Component × State × Data shape

| Screen | Component | States | Data shape | Notes |
|--------|-----------|--------|------------|-------|
| 1-welcome | Hero | default / loaded | `{title, subtitle, cta_text}` | |
| 1-welcome | Footer | default | `{links: [{label, href}]}` | |
| ... | | | | |

## Mock data justification
- 姓名 "张伟" 选自国内 Top 10 姓名 → cohort 不质疑
- 金额 "¥3,420" 是从公司 2025 年中位数推算 → 真实感

## Open questions for PM
- Q1:
- Q2:
```

## Template 2 · Brand Token Set CSS

```css
:root {
  /* === Color === */
  --color-bg-canvas: <hex>;
  --color-bg-surface: <hex>;
  --color-bg-surface-elevated: <hex>;
  --color-text-primary: <hex>;
  --color-text-secondary: <hex>;
  --color-accent-primary: <hex>;
  --color-accent-success: <hex>;
  --color-accent-warning: <hex>;
  --color-accent-danger: <hex>;
  --color-border-subtle: <hex>;

  /* === Type === */
  --font-family-sans: <stack>;
  --font-family-serif: <stack>;
  --font-family-mono: <stack>;
  --text-xs: 0.75rem;
  --text-sm: 0.875rem;
  --text-base: 1rem;
  --text-lg: 1.125rem;
  --text-xl: 1.5rem;

  /* === Spacing === */
  --space-1: 0.25rem;
  --space-2: 0.5rem;
  --space-3: 0.75rem;
  --space-4: 1rem;
  --space-6: 1.5rem;
  --space-8: 2rem;
  --space-12: 3rem;

  /* === Radius === */
  --radius-sm: 0.25rem;
  --radius-md: 0.5rem;
  --radius-lg: 0.75rem;

  /* === Shadow === */
  --shadow-sm: 0 1px 2px rgba(0,0,0,0.05);
  --shadow-md: 0 4px 12px rgba(0,0,0,0.08);
}
```

## Template 3 · Aesthetic Probe Report

```markdown
# Aesthetic Probe · <prototype-slug> · YYYY-MM-DD

## Scores (1-5)
| Dim | Score | Notes |
|-----|-------|-------|
| Token adherence | | |
| Hierarchy clarity | | |
| White space | | |
| Type harmony | | |
| Color discipline | | |
| Interaction affordance | | |
| Mobile responsive | | |

**Average**: X.X / 5

## Top 3 Fixes (priority order)
1.
2.
3.

## Keep vs Change
| Element | Keep? | Why |
|---------|-------|-----|

## Re-probe schedule
Re-run probe after fixes ship.
```

## Template 4 · Design Decision Log

```markdown
# Design Decision Log · <project>

| Date | Decision | Options considered | Choice | Reason | Reversibility |
|------|----------|---------------------|--------|--------|---------------|
| YYYY-MM-DD | | | | | low/med/high |
```

## Template 5 · Mock Data Library

```markdown
# Mock Data Library

## 姓名
张伟 / 王芳 / 李娜 / 刘洋 / 陈静 / 杨明 / 黄霞 / 周强 / 吴敏 / 徐磊

## 公司
苍蓝航运 / 灵鹊数据 / 江湖一笔 / 守山科技 / 远方咨询 / ...

## 邮箱
zhangwei@cangya.com / wangfang@lingque.cn / ...

## 数字（真实感的）
- 月销售额：¥143,200 / ¥2,840,000 / ¥18,500
- 用户数：1,847 / 23,409 / 156,832
- 转化率：3.4% / 12.7% / 0.8%

## 日期
- 近期：2026-04-22 / 2026-04-15
- 远一点：2025-Q3 / 2025-11

## 反模式
- ❌ "Name: User" "Company: Test Inc"  → cohort 立刻不信
- ❌ 全部用 "100" "1000" 整数  → 不真实
```

---

Maurice | maurice_wen@proton.me
