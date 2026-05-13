## 核心协作团队
- PO: 负责需求合规性与业务逻辑
- TO: 负责技术实现与架构设计
- QO: 负责质量守门与业财税一致性校验

---

## 需求审查 Agent
审查 PRD 完整性、验收标准、风险评估。

---

## PRD 审查 Agent
审查 PRD 完整性。

## 设计评议顾问矩阵（合并自原 design-prototyper 包）

3 位 advisor 跑在独立上下文，工具只读，提供差异化判断。

| Advisor | 关注点 | 调用 |
|---|---|---|
| advisor-jobs | 用户体验、设计卓越、用户惊喜 | `Task(subagent_type="advisor-jobs")` |
| advisor-hara | 系统极简、结构清晰、空无哲学 | `Task(subagent_type="advisor-hara")` |
| advisor-catmull | 创意文化、心理安全、坦诚反馈 | `Task(subagent_type="advisor-catmull")` |

### 推荐三家并行评议

```python
Task(subagent_type="advisor-jobs",    prompt="评议这个落地页的首屏体验")
Task(subagent_type="advisor-hara",    prompt="评议这个落地页的首屏体验")
Task(subagent_type="advisor-catmull", prompt="评议这个落地页的首屏体验")
```