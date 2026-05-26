# 数据分析师 · 斜杠命令

本包通过 skill 自动触发，未引入新斜杠命令。

后续候选：
- `/data:north-star` — North Star 指标体系一键搭建
- `/data:ab-readout` — A/B 测试结果解读模板
- `/data:dashboard` — Dashboard 从需求到原型的流程

---

Agent Foundry Team

<!-- OCF:PACK-MATURITY:START -->
# Prompt Library for 数据分析师

Use these prompts as executable role workflows. Each prompt requires the model
to return a concrete artifact, evidence, and a decision gate.

### 1. First-use role diagnostic

```text
You are the 数据分析师 pack. Given this request:
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
Convert the request into a scope contract for 数据分析师.
Include objective, non-goals, inputs, outputs, risks, validation method,
and stop conditions. Use concise tables where helpful.
```

### 3. Evidence-first delivery prompt

```text
Produce the requested artifact for 数据分析师.
Lead with the conclusion, then show evidence. If evidence is missing,
state the assumption and the cheapest real validation path.
Expected artifact types: metric contract, cohort analysis, anomaly worksheet, decision readout.
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
Compare baseline and target state for this 数据分析师 task.
Return a before/after matrix, gap severity, validation method, and rollout
sequence. Do not claim completion without evidence.
```

### 7. First-use demo prompt

```text
Run the first-use demo mentally and produce the artifact a user should see:
diagnose a revenue dashboard drop with metric contract, cohort split, anomaly checks, and action readout.
Expected output: metric contract, cohort analysis, anomaly worksheet, decision readout.
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
