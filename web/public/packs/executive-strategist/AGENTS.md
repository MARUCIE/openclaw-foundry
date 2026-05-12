# 高管战略顾问 · 顾问矩阵

## 协作约定

本包的 5 位 advisor 是 AI-Fleet 13-advisor 套件中最聚焦于战略思考的子集
（Buffett/Munger/Drucker/Meadows/Taleb）。他们都跑在独立上下文里，工具
权限受限（只读 + WebSearch），不能修改文件。这是 by design：advisor
的输出是判断，不是执行。

## 本包提供的顾问 (5)

### advisor-buffett
调用方式：`Task(subagent_type="advisor-buffett")`
安装路径：`.claude/agents/advisor-buffett.md`
视角：护城河思维 / 长期复利 / 说不的纪律。投资决策、战略聚焦、资源分配。

### advisor-munger
调用方式：`Task(subagent_type="advisor-munger")`
安装路径：`.claude/agents/advisor-munger.md`
视角：多重心智模型分析 / 风险识别 / inversion。重大决策、tradeoff、能力圈检查。

### advisor-drucker
调用方式：`Task(subagent_type="advisor-drucker")`
安装路径：`.claude/agents/advisor-drucker.md`
视角：业务增长 / 价值定义 / 客户聚焦。增长战略、功能优先级、'应不应做'决策。

### advisor-meadows
调用方式：`Task(subagent_type="advisor-meadows")`
安装路径：`.claude/agents/advisor-meadows.md`
视角：系统动力学 / 反馈回路 / 杠杆点。系统设计、cascading effect、小变化大影响。

### advisor-taleb
调用方式：`Task(subagent_type="advisor-taleb")`
安装路径：`.claude/agents/advisor-taleb.md`
视角：Antifragility / 黑天鹅 / skin in the game / asymmetric risk。风险评估、压力测试。


## 推荐调用模式

**单 advisor — 锐利判断**：
```python
Task(subagent_type="advisor-buffett", prompt="我们应不应该收购 X 公司？")
```

**多 advisor — 视角分歧**：
```python
# 同问题问 3 个 advisor，看分歧
Task(subagent_type="advisor-buffett", prompt="...")   # moat lens
Task(subagent_type="advisor-meadows", prompt="...")   # systems lens
Task(subagent_type="advisor-taleb", prompt="...")     # tail-risk lens
```

**蜂群审计模式**：所有 5 个并行 → 看共识 vs 分歧 → 决策的多维度照射。

---

Maurice | maurice_wen@proton.me
