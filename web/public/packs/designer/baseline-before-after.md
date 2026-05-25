# Baseline · Before vs After · Designer

## Quality Signals

| Area | Signal | Minimum |
| --- | --- | --- |
| PM boundary | Validation question and owner are explicit | 100% |
| Hierarchy | One primary action per screen | 100% |
| State coverage | Key UI states documented | 100% |
| Token discipline | Hardcoded visual values | <=20% |
| Handoff | Component-state-data table completeness | 100% |
| Responsive | Mobile and desktop reviewed | Required |

## Baseline Tasks

| # | Task | Family | Baseline (h) | Target (h) | Saved % | Quality signal |
| --- | --- | --- | ---: | ---: | ---: | --- |
| 1 | PM intake review | S1 | 2.0 | 0.5 | 75 | PM questions separated from design debt |
| 2 | Experience map | S1 | 4.0 | 1.0 | 75 | screen hierarchy complete |
| 3 | Component-state handoff | S1 | 2.0 | 0.5 | 75 | table completeness 100% |
| 4 | Token set CSS | S2 | 1.5 | 0.2 | 87 | semantic tokens |
| 5 | Token drift audit | S2 | 3.0 | 0.8 | 73 | hardcoded values flagged |
| 6 | Brand swap | S2 | 6.0 | 1.5 | 75 | structure unchanged |
| 7 | Aesthetic probe | S3 | 1.0 | 0.2 | 80 | 7 dimensions scored |
| 8 | Top 3 fix plan | S3 | 3.0 | 0.8 | 73 | component/token/state bound |
| 9 | Responsive design QA | S3 | 4.0 | 1.0 | 75 | mobile + desktop checked |
| 10 | Quarterly design system refresh | S3 | 12.0 | 4.0 | 67 | Hara + Jobs review |

**Baseline total**: 38.5 h / month · **Target**: 10.5 h / month · **Saved**: 72.7%

## Failure Signals

1. Designer invents product direction instead of escalating PM decisions.
2. Screen has multiple primary actions.
3. State coverage is happy-path only.
4. Token drift is hidden until frontend implementation.
5. Handoff lacks data shape or responsive constraint.

---

Maurice | maurice_wen@proton.me
