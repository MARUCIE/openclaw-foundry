
# Document Templates for 运维工程师

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

- preflight checklist: owner, input, output, validation.
- canary plan: owner, input, output, validation.
- rollback command set: owner, input, output, validation.
- incident timeline: owner, input, output, validation.

## Assumption Ledger

| Assumption | Why it matters | Confidence | Expiry | Validation |
| --- | --- | --- | --- | --- |
| Example assumption | It changes the recommendation | medium | before rollout | inspect source |

## Risk Matrix

| Risk | Trigger | Impact | Prevention | Response |
| --- | --- | --- | --- | --- |
| alert fatigue | Before rollout | high | quality gate | reduce scope |

## Decision Readout

1. Conclusion.
2. Evidence.
3. Options considered.
4. Tradeoff.
5. Recommendation.
6. Next action.

## First-use Demo Template

- Role: 运维工程师
- Demo: prepare a production deploy runbook with preflight, canary, rollback, incident channel, and post-checks
- Expected output: preflight checklist + canary plan + rollback command set + incident timeline
- Time target: under 8 minutes
- Pass condition: a user can copy the next action into an agent host
- Fail condition: the output is generic, unvalidated, or lacks owner handoff
