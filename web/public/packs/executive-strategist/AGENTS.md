# 高管战略顾问 · 顾问矩阵

## 协作约定

本包的 5 位 advisor 是 AI-Fleet 13-advisor 套件中最聚焦于战略思考的子集
（Strategic Focus/Decision Framework/Business Value/Systems Thinking/Tail Risk）。他们都跑在独立上下文里，工具
权限受限（只读 + WebSearch），不能修改文件。这是 by design：advisor
的输出是判断，不是执行。

## 本包提供的顾问 (5)

### advisor-strategic-focus
调用方式：`Task(subagent_type="advisor-strategic-focus")`
安装路径：`.claude/agents/advisor-strategic-focus.md`
视角：护城河思维 / 长期复利 / 说不的纪律。投资决策、战略聚焦、资源分配。

### advisor-decision-framework
调用方式：`Task(subagent_type="advisor-decision-framework")`
安装路径：`.claude/agents/advisor-decision-framework.md`
视角：多重心智模型分析 / 风险识别 / inversion。重大决策、tradeoff、能力圈检查。

### advisor-business-value
调用方式：`Task(subagent_type="advisor-business-value")`
安装路径：`.claude/agents/advisor-business-value.md`
视角：业务增长 / 价值定义 / 客户聚焦。增长战略、功能优先级、'应不应做'决策。

### advisor-systems-thinking
调用方式：`Task(subagent_type="advisor-systems-thinking")`
安装路径：`.claude/agents/advisor-systems-thinking.md`
视角：系统动力学 / 反馈回路 / 杠杆点。系统设计、cascading effect、小变化大影响。

### advisor-tail-risk
调用方式：`Task(subagent_type="advisor-tail-risk")`
安装路径：`.claude/agents/advisor-tail-risk.md`
视角：Antifragility / 黑天鹅 / skin in the game / asymmetric risk。风险评估、压力测试。


## 推荐调用模式

**单 advisor — 锐利判断**：
```python
Task(subagent_type="advisor-strategic-focus", prompt="我们应不应该收购 X 公司？")
```

**多 advisor — 视角分歧**：
```python
# 同问题问 3 个 advisor，看分歧
Task(subagent_type="advisor-strategic-focus", prompt="...")   # moat lens
Task(subagent_type="advisor-systems-thinking", prompt="...")   # systems lens
Task(subagent_type="advisor-tail-risk", prompt="...")     # tail-risk lens
```

**蜂群审计模式**：所有 5 个并行 → 看共识 vs 分歧 → 决策的多维度照射。

---

Agent Foundry Team

<!-- OCF:PACK-MATURITY:START -->
# Advisor Routing for 高管战略顾问 (executive-strategist)

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
- Checks role-specific risk: narrative bias; unpriced downside; resource dilution; weak stop rule.
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
