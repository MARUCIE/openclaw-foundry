# 数据分析师 · 顾问矩阵

2 位 advisor 跑在独立上下文，工具只读。

## 顾问 (2)

### research-analyst
调用：`Task(subagent_type="research-analyst")`
视角：Research orchestrator. 把 'ad-hoc 看数据' 当研究跑——多角度、引文、综合。

### advisor-systems-thinking
调用：`Task(subagent_type="advisor-systems-thinking")`
视角：Systems Thinking lens. 系统动力学、反馈回路、杠杆点。


## 推荐调用

**深度数据探索**：
```python
Task(subagent_type="research-analyst", prompt="过去 30 天用户留存下降，从多角度找原因")
```

**系统杠杆点分析**：
```python
Task(subagent_type="advisor-systems-thinking", prompt="这 5 个指标之间的反馈回路是什么？")
```

---

Agent Foundry Team

<!-- OCF:PACK-MATURITY:START -->
# Advisor Routing for 数据分析师 (data-analyst)

Use these capability-neutral advisors for independent review. They are not
modeled after real people and must not cite biographical authority.

## advisor-quality-gate

- Use for acceptance criteria, evidence sufficiency, and artifact completeness.
- Checks whether the answer satisfies the role boundary.
- Checks whether the output is runnable, reviewable, and reusable.
- Checks whether the first-use demo would produce the expected artifact.
- Checks whether validation evidence is stronger than a style opinion.

## advisor-delivery-risk

- Use for failure modes, operational risk, compliance exposure, and rollout
  readiness.
- Checks role-specific risk: metric ambiguity; dashboard theater; aggregation bias; actionless reporting.
- Checks whether any irreversible or credential-gated action is hidden.
- Checks whether a production handoff has owner, timing, and rollback notes.
- Checks whether the pack avoids concrete person names in public output.

## Routing Protocol

1. Main agent drafts the role artifact.
2. advisor-quality-gate reviews acceptance and evidence.
3. advisor-delivery-risk reviews downside and release safety.
4. Main agent resolves conflicts into one recommendation.
5. Main agent reports unresolved gaps instead of burying them.

## Collaboration Rules

- Keep advisors narrow and capability-based.
- Do not spawn advisors for trivial copy edits.
- Do not ask advisors to rewrite the whole answer.
- Do not use advisor output as a substitute for validation.
- Do not confuse a maturity badge with production certification.
- Avoid duplicate review passes when one evidence gate is enough.
- Avoid personality labels, famous names, or school-of-thought branding.
- Prefer concrete acceptance checks over abstract critique.

## Minimum Hand-Off

- Outcome: what changed or what decision is recommended.
- Evidence: command, source, table, or artifact inspected.
- Risk: what still might fail.
- Next action: one executable instruction for the operator.
<!-- OCF:PACK-MATURITY:END -->
