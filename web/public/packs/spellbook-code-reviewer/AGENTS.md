# 代码审查师 · 代理矩阵

## 协作约定

岗位包标准：所有 spellbook 代理在 `.claude/agents/spellbook/` 命名空间下，与
AI-Fleet 现有 23 个代理（advisor-* / bmad-* / code-reviewer / doc-writer 等）
零冲突。卸载时 `rm -rf .claude/agents/spellbook/` 一键清空。

## 本包提供的代理 (3)

### spellbook/code-reviewer
调用方式：`Task(subagent_type="spellbook-code-reviewer")`
安装路径：`.claude/agents/spellbook/code-reviewer.md`

### spellbook/code-reviewer-spec
调用方式：`Task(subagent_type="spellbook-code-reviewer-spec")`
安装路径：`.claude/agents/spellbook/code-reviewer-spec.md`

### spellbook/code-reviewer-quality
调用方式：`Task(subagent_type="spellbook-code-reviewer-quality")`
安装路径：`.claude/agents/spellbook/code-reviewer-quality.md`


## 调用示例

```
# 当 PR diff 超过 5 个文件或 300 行
Task(subagent_type="spellbook-code-reviewer", prompt="Review PR #42")

# 当需要部署前安全扫描
Task(subagent_type="spellbook-security-auditor", prompt="Audit dependencies")

# 当需要找测试覆盖率盲点
Task(subagent_type="spellbook-test-coverage-agent", prompt="Find gaps in module X")
```

---

Agent Foundry Team

<!-- OCF:PACK-MATURITY:START -->
# Advisor Routing for 代码审查师 (spellbook-code-reviewer)

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
- Checks role-specific risk: style-only review; missing edge cases; unverified assumptions; dependency drift.
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
