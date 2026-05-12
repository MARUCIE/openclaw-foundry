# 研究分析师 · 顾问矩阵

3 位 advisor 跑在独立上下文，工具只读 + WebSearch。

## 顾问 (3)

### research-analyst
调用：`Task(subagent_type="research-analyst")`
视角：Research orchestrator. 跨源检索 + 综合 + 引文管理。默认入口。

### advisor-orwell
调用：`Task(subagent_type="advisor-orwell")`
视角：George Orwell lens. 通过语言清晰看清思考——压缩冗长、识别 bullshit。

### advisor-drucker
调用：`Task(subagent_type="advisor-drucker")`
视角：Peter Drucker lens. 业务价值定义、客户聚焦、'做这件事到底为什么'。


## 推荐调用

**深度研究**：
```python
Task(subagent_type="research-analyst", prompt="扫描过去 6 个月 X 领域的 SOTA 进展")
```

**研究翻译为决策**：
```python
Task(subagent_type="advisor-drucker", prompt="基于这份研究，我们应该改变哪些优先级？")
```

---

Maurice | maurice_wen@proton.me
