
# Document Templates for 安全审计师

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

- threat model: owner, input, output, validation.
- control map: owner, input, output, validation.
- dependency audit: owner, input, output, validation.
- release security gate: owner, input, output, validation.

## Assumption Ledger

| Assumption | Why it matters | Confidence | Expiry | Validation |
| --- | --- | --- | --- | --- |
| Example assumption | It changes the recommendation | medium | before rollout | inspect source |

## Risk Matrix

| Risk | Trigger | Impact | Prevention | Response |
| --- | --- | --- | --- | --- |
| auth bypass | Before rollout | high | quality gate | reduce scope |

## Decision Readout

1. Conclusion.
2. Evidence.
3. Options considered.
4. Tradeoff.
5. Recommendation.
6. Next action.

## First-use Demo Template

- Role: 安全审计师
- Demo: audit a Worker API change for auth bypass, secret exposure, dependency CVEs, and deployment gate
- Expected output: threat model + control map + dependency audit + release security gate
- Time target: under 8 minutes
- Pass condition: a user can copy the next action into an agent host
- Fail condition: the output is generic, unvalidated, or lacks owner handoff
