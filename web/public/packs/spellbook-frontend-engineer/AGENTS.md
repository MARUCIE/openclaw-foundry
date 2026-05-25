# 前端工程师 · 代理矩阵

## 协作约定

岗位包标准：所有 spellbook 代理在 `.claude/agents/spellbook/` 命名空间下，与
AI-Fleet 现有 23 个代理（advisor-* / bmad-* / code-reviewer / doc-writer 等）
零冲突。卸载时 `rm -rf .claude/agents/spellbook/` 一键清空。

## 本包提供的代理 (0)

本包不引入新代理，依赖 AI-Fleet 已有的代理矩阵。

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
