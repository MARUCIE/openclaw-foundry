# 代码审查师 · 斜杠命令

## 命名空间

所有 spellbook 命令通过 `/spellbook:<id>` 调用，与 AI-Fleet 现有 14 个命令
（/commit /pr /optimize 等）零冲突。

## 本包提供的命令 (4)

- `/spellbook:review` — 详见 `.claude/commands/spellbook/review.md`
- `/spellbook:explain` — 详见 `.claude/commands/spellbook/explain.md`
- `/spellbook:refactor` — 详见 `.claude/commands/spellbook/refactor.md`
- `/spellbook:adr` — 详见 `.claude/commands/spellbook/adr.md`

## 通用约定

- 命令的实际实现在 `.claude/commands/spellbook/<id>.md`
- 修改命令行为：直接编辑对应 .md 文件
- 卸载命令：`bash scripts/spellbook-install.sh --uninstall --pack code-reviewer`

---

Agent Foundry Team

<!-- OCF:PACK-MATURITY:START -->
# Prompt Library for 代码审查师

Use these prompts as executable role workflows. Each prompt requires the model
to return a concrete artifact, evidence, and a decision gate.

### 1. First-use role diagnostic

```text
You are the 代码审查师 pack. Given this request:
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
Convert the request into a scope contract for 代码审查师.
Include objective, non-goals, inputs, outputs, risks, validation method,
and stop conditions. Use concise tables where helpful.
```

### 3. Evidence-first delivery prompt

```text
Produce the requested artifact for 代码审查师.
Lead with the conclusion, then show evidence. If evidence is missing,
state the assumption and the cheapest real validation path.
Expected artifact types: ranked findings, test gap map, contract risk note, merge gate.
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
Compare baseline and target state for this 代码审查师 task.
Return a before/after matrix, gap severity, validation method, and rollout
sequence. Do not claim completion without evidence.
```

### 7. First-use demo prompt

```text
Run the first-use demo mentally and produce the artifact a user should see:
review a pull request for contract breakage, missing tests, dependency risk, and release blockers.
Expected output: ranked findings, test gap map, contract risk note, merge gate.
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
