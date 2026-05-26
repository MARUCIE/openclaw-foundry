## 核心协作团队
- PO: 负责需求合规性与业务逻辑
- TO: 负责技术实现与架构设计
- QO: 负责质量守门与业财税一致性校验

---

## 研发专项 Agent
- Refactor: 负责代码重构建议
- TestGen: 负责测试用例自动生成

---

## 架构审查 Agent
审查基础设施设计、高可用。

<!-- OCF:PACK-MATURITY:START -->
# Advisor Routing for 基础架构工程师 (infra-engineer)

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
- Checks role-specific risk: configuration drift; missing rollback path; secret exposure; single-region fragility.
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
