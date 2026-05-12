# 原型设计师 · 顾问矩阵

3 位 advisor 跑在独立上下文，工具只读。

## 顾问 (3)

### advisor-jobs
调用：`Task(subagent_type="advisor-jobs")`
视角：Steve Jobs lens. 产品体验、设计卓越、用户惊喜。'这够好吗？'的最高标准。

### advisor-hara
调用：`Task(subagent_type="advisor-hara")`
视角：Kenya Hara lens. 系统极简、结构清晰、'空' 的设计哲学。

### advisor-catmull
调用：`Task(subagent_type="advisor-catmull")`
视角：Ed Catmull lens. 创意文化、坦诚反馈、心理安全。


## 推荐调用

**单 advisor 锐评**：
```python
Task(subagent_type="advisor-jobs", prompt="评议这个落地页的首屏体验")
```

**三家分歧（推荐默认）**：
```python
Task(subagent_type="advisor-jobs", prompt="...")
Task(subagent_type="advisor-hara", prompt="...")
Task(subagent_type="advisor-catmull", prompt="...")
```

---

Maurice | maurice_wen@proton.me
