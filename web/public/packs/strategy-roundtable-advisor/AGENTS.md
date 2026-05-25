# 战略圆桌顾问 · Advisor Matrix

本包内置 3 位只读 advisor，用来补强战略圆桌的判断维度。它们不是执行者，而是质询者。

## advisor-munger

调用方式：`Task(subagent_type="advisor-munger")`

关注：

- 多重心智模型。
- 反向思考。
- 能力圈。
- 激励机制。
- 误判心理学。

适合问题：

- 我们是不是高估了这个机会？
- 这个判断里有哪些认知偏差？
- 哪些前提一旦错了会让方案整体坍塌？

## advisor-drucker

调用方式：`Task(subagent_type="advisor-drucker")`

关注：

- 客户价值。
- 组织目标。
- 管理责任。
- 业务成果。
- 资源聚焦。

适合问题：

- 这个战略到底为谁创造价值？
- 哪些动作只是内部忙碌，不产生客户成果？
- 团队应该如何定义目标和职责？

## advisor-meadows

调用方式：`Task(subagent_type="advisor-meadows")`

关注：

- 系统反馈回路。
- 杠杆点。
- 延迟效应。
- 结构性瓶颈。
- 副作用。

适合问题：

- 哪个小变化可能产生大影响？
- 这个战略会造成什么二阶后果？
- 组织或业务系统里真正的约束在哪里？

## 推荐协作模式

1. 先用 `cognitive-skeleton` 选择模型。
2. 再用 `multi-expert-roundtable-report` 形成初稿。
3. 对关键争议分别询问 Munger / Drucker / Meadows。
4. 最后把分歧收敛为金字塔报告。

## 禁止事项

- 不要让 advisor 直接改文件。
- 不要把 advisor 输出当最终答案。
- 不要机械投票。
- 避免只保留共识而删除分歧。
- 禁止忽略二阶风险和退出条件。

---

Maurice | maurice_wen@proton.me
