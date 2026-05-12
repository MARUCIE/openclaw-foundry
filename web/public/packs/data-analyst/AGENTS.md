# 数据分析师 · 顾问矩阵

2 位 advisor 跑在独立上下文，工具只读。

## 顾问 (2)

### research-analyst
调用：`Task(subagent_type="research-analyst")`
视角：Research orchestrator. 把 'ad-hoc 看数据' 当研究跑——多角度、引文、综合。

### advisor-meadows
调用：`Task(subagent_type="advisor-meadows")`
视角：Donella Meadows lens. 系统动力学、反馈回路、杠杆点。


## 推荐调用

**深度数据探索**：
```python
Task(subagent_type="research-analyst", prompt="过去 30 天用户留存下降，从多角度找原因")
```

**系统杠杆点分析**：
```python
Task(subagent_type="advisor-meadows", prompt="这 5 个指标之间的反馈回路是什么？")
```

---

Maurice | maurice_wen@proton.me
