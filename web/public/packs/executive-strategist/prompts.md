# 高管战略顾问 · 斜杠命令

本包目前不引入新的斜杠命令。战略框架通过 skill 自动触发（按内容匹配），
advisor 通过 `Task(subagent_type=...)` 显式调用。

## 后续扩展候选

如果未来需要专属斜杠命令，候选方向：

- `/strategy:swot` — SWOT 模板一键填充
- `/strategy:advisor-council` — 调起 5 advisor 并行评议
- `/strategy:inversion` — 强制走 Decision Framework 的反向论证流程

不优先实现，因为 skill 自动触发 + Task 显式调用已经覆盖了 95% 用例。

---

Agent Foundry Team

<!-- OCF:PACK-MATURITY:START -->
# Prompt Library for 高管战略顾问

Use these prompts as executable role workflows. Each prompt requires the model
to return a concrete artifact, evidence, and a decision gate.

### 1. First-use role diagnostic

```text
You are the 高管战略顾问 pack. Given this request:
{{request}}

Return:
1. the role boundary,
2. the top three assumptions,
3. the smallest useful artifact,
4. the evidence needed,
5. the next action within 8 minutes.
```

### 2. Scope contract prompt

```text
Convert the request into a scope contract for 高管战略顾问.
Include objective, non-goals, inputs, outputs, risks, validation method,
and stop conditions. Use concise tables where helpful.
```

### 3. Evidence-first delivery prompt

```text
Produce the requested artifact for 高管战略顾问.
Lead with the conclusion, then show evidence. If evidence is missing,
state the assumption and the cheapest real validation path.
Expected artifact types: strategy options, assumption ledger, resource tradeoff, decision cadence.
```

### 4. Quality-gate review prompt

```text
Act as advisor-quality-gate. Review the draft for completeness, acceptance
criteria, evidence quality, and host-agent install usefulness. Return only
ranked blockers, fixes, and residual risk.
```

### 5. Delivery-risk review prompt

```text
Act as advisor-delivery-risk. Review the draft for operational, compliance,
security, data, stakeholder, and rollout risk. Flag hidden irreversible
actions and missing ownership.
```

### 6. Baseline-to-target prompt

```text
Compare baseline and target state for this 高管战略顾问 task.
Return a before/after matrix, gap severity, validation method, and rollout
sequence. Do not claim completion without evidence.
```

### 7. First-use demo prompt

```text
Run the first-use demo mentally and produce the artifact a user should see:
evaluate a new AI workflow business line with options, assumptions, resource tradeoffs, and stop rules.
Expected output: strategy options, assumption ledger, resource tradeoff, decision cadence.
Keep it executable and under the time-to-value target.
```

### 8. Handoff prompt

```text
Create a handoff for the next agent or operator.
Include current state, decisions made, files or sources touched, validation
evidence, risks left open, and the next command or review action.
```

## Prompt Selection Guide

- Use prompt 1 when the request is vague.
- Use prompt 2 before implementation or analysis expands.
- Use prompt 3 when a deliverable is explicitly requested.
- Use prompt 4 before final delivery.
- Use prompt 5 for production, compliance, security, data, or financial risk.
- Use prompt 6 when comparing states or planning improvement.
- Use prompt 7 after installation to prove first value.
- Use prompt 8 for cross-agent continuity.

## Output Rules

- Lead with conclusion or artifact, not process narration.
- Keep claims tied to visible evidence or stated assumptions.
- Use capability-neutral advisor names only.
- Avoid invented sources, synthetic metrics, and fake validation.
- Never downgrade a blocker into an advisory note for polish.
- Never expose concrete person-name advisors in the final answer.
<!-- OCF:PACK-MATURITY:END -->
