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
