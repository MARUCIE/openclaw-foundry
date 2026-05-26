## 核心协作团队
- PO: 负责需求合规性与业务逻辑
- TO: 负责技术实现与架构设计
- QO: 负责质量守门与业财税一致性校验

---

## 数据质量 Agent
检查数据管线的幂等性、Schema 兼容性、脱敏覆盖率。

---

## 性能调优 Agent
分析任务执行计划。

<!-- OCF:PACK-MATURITY:START -->
# Advisor Routing for 大数据工程师 (bigdata-engineer)

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
- Checks role-specific risk: silent schema drift; late-arriving data; unbounded warehouse spend; non-idempotent backfill.
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
