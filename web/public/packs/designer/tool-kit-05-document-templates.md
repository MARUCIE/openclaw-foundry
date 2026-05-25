# Tool-Kit 05 · Document Templates · Designer

> 5 类模板覆盖设计评审、token 系统和工程 handoff。

## Template 1 · Design Intake Review

```markdown
# Design Intake Review · <slug> · v<X>

## PM Intent
| Field | Value |
| --- | --- |
| PRD link | |
| PM validation question | |
| Target user job | |
| Success signal | |
| Decision owner | PM |

## Design Decision
- Status: GO / RECONVENE_WITH_PM / DESIGN_SYSTEMIZE
- Top risks:
  1.
  2.
  3.

## Scope Boundary
- Designer will own:
- PM must decide:
- Frontend must validate:
```

## Template 2 · Component-State Handoff

```markdown
# Component-State Handoff · <slug>

| Screen | Component | State | Data shape | Responsive constraint | Accessibility note | Owner |
| --- | --- | --- | --- | --- | --- | --- |
| dashboard | FilterBar | default / selected / disabled | `{filters: Array<{id: string, label: string}>}` | wrap under 768px | focus ring visible | Design + FE |
```

## Template 3 · Brand Token Set CSS

```css
:root {
  --color-bg-canvas: <hex>;
  --color-bg-surface: <hex>;
  --color-bg-elevated: <hex>;
  --color-text-primary: <hex>;
  --color-text-secondary: <hex>;
  --color-accent: <hex>;
  --color-success: <hex>;
  --color-warning: <hex>;
  --color-danger: <hex>;
  --color-border: <hex>;
  --color-focus: <hex>;

  --font-family-sans: <stack>;
  --text-xs: 0.75rem;
  --text-sm: 0.875rem;
  --text-base: 1rem;
  --text-lg: 1.125rem;
  --text-xl: 1.5rem;

  --space-1: 0.25rem;
  --space-2: 0.5rem;
  --space-3: 0.75rem;
  --space-4: 1rem;
  --space-6: 1.5rem;
  --space-8: 2rem;

  --radius-sm: 0.25rem;
  --radius-md: 0.5rem;
  --radius-lg: 0.75rem;
}
```

## Template 4 · Aesthetic Probe Report

```markdown
# Aesthetic Probe · <screen> · YYYY-MM-DD

| Dimension | Score | Evidence | Fix |
| --- | ---: | --- | --- |
| Hierarchy clarity | | | |
| Spacing rhythm | | | |
| Type discipline | | | |
| Color discipline | | | |
| Interaction affordance | | | |
| State completeness | | | |
| Responsive readiness | | | |

Average: X.X / 5

## Top 3 Fixes
1.
2.
3.

## Keep / Change / Remove
| Element | Action | Reason |
| --- | --- | --- |
```

## Template 5 · Design Decision Log

```markdown
# Design Decision Log · <project>

| Date | Decision | Options considered | Choice | Reason | Reversibility | Owner |
| --- | --- | --- | --- | --- | --- | --- |
| YYYY-MM-DD | | | | | low/med/high | |
```

---

Maurice | maurice_wen@proton.me
