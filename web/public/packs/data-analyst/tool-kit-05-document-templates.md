
# Document Templates for 数据分析师

## One-page Brief

| Field | Content |
| --- | --- |
| Outcome | The business or engineering result to achieve |
| Boundary | What this pack owns and does not own |
| Inputs | Source files, data, issue, PR, log, or stakeholder context |
| Artifact | The named deliverable |
| Evidence | Command, source, check, or reviewer |
| Decision | stop / go / iterate / escalate |
| Risk | Top residual risk and owner |

## Artifact Matrix

- metric contract: owner, input, output, validation.
- cohort analysis: owner, input, output, validation.
- anomaly worksheet: owner, input, output, validation.
- decision readout: owner, input, output, validation.

## Assumption Ledger

| Assumption | Why it matters | Confidence | Expiry | Validation |
| --- | --- | --- | --- | --- |
| Example assumption | It changes the recommendation | medium | before rollout | inspect source |

## Risk Matrix

| Risk | Trigger | Impact | Prevention | Response |
| --- | --- | --- | --- | --- |
| metric ambiguity | Before rollout | high | quality gate | reduce scope |

## Decision Readout

1. Conclusion.
2. Evidence.
3. Options considered.
4. Tradeoff.
5. Recommendation.
6. Next action.

## First-use Demo Template

- Role: 数据分析师
- Demo: diagnose a revenue dashboard drop with metric contract, cohort split, anomaly checks, and action readout
- Expected output: metric contract + cohort analysis + anomaly worksheet + decision readout
- Time target: under 8 minutes
- Pass condition: a user can copy the next action into an agent host
- Fail condition: the output is generic, unvalidated, or lacks owner handoff
