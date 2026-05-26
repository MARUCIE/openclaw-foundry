
# Document Templates for AB 测试分析师

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

- experiment spec: owner, input, output, validation.
- power table: owner, input, output, validation.
- guardrail metrics: owner, input, output, validation.
- decision readout: owner, input, output, validation.

## Assumption Ledger

| Assumption | Why it matters | Confidence | Expiry | Validation |
| --- | --- | --- | --- | --- |
| Example assumption | It changes the recommendation | medium | before rollout | inspect source |

## Risk Matrix

| Risk | Trigger | Impact | Prevention | Response |
| --- | --- | --- | --- | --- |
| peeking bias | Before rollout | high | quality gate | reduce scope |

## Decision Readout

1. Conclusion.
2. Evidence.
3. Options considered.
4. Tradeoff.
5. Recommendation.
6. Next action.

## First-use Demo Template

- Role: AB 测试分析师
- Demo: design an experiment for checkout copy with MDE, sample size, guardrail metrics, and decision rules
- Expected output: experiment spec + power table + guardrail metrics + decision readout
- Time target: under 8 minutes
- Pass condition: a user can copy the next action into an agent host
- Fail condition: the output is generic, unvalidated, or lacks owner handoff
