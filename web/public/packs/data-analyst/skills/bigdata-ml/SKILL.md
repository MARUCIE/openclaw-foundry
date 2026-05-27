---
name: bigdata-machine-learning
description: Machine learning toolkit for big data teams. Includes scikit-learn, PyTorch Lightning, Transformers, SHAP for model training, deployment, and interpretation. Use when building ML pipelines, training models, or explaining predictions.
---

# Big Data Machine Learning Toolkit

## Overview

大数据团队机器学习工具集，从传统ML到深度学习全覆盖。

## Quick Reference

| 工具 | 场景 | 规模 |
|------|------|------|
| **scikit-learn** | 传统ML | 中等数据 |
| **PyTorch Lightning** | 深度学习 | GPU训练 |
| **Transformers** | NLP/LLM | 预训练模型 |
| **SHAP** | 模型解释 | 可解释AI |

## 选择指南

```
任务类型:
├── 分类/回归 → scikit-learn
├── 时间序列 → scikit-learn + statsmodels
├── 文本处理 → Transformers
├── 图像处理 → PyTorch Lightning
├── 强化学习 → stable-baselines3
└── 模型解释 → SHAP
```

## 子Skills

- `scikit-learn/` - 传统机器学习
- `pytorch-lightning/` - 深度学习框架
- `transformers/` - NLP预训练模型
- `shap/` - 模型可解释性
- `stable-baselines3/` - 强化学习

## 常用模式

### 标准ML Pipeline (scikit-learn)
```python
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import StandardScaler
from sklearn.ensemble import RandomForestClassifier
from sklearn.model_selection import cross_val_score

pipeline = Pipeline([
    ('scaler', StandardScaler()),
    ('classifier', RandomForestClassifier())
])

scores = cross_val_score(pipeline, X, y, cv=5)
print(f"CV Score: {scores.mean():.3f} ± {scores.std():.3f}")
```

### 深度学习训练 (PyTorch Lightning)
```python
import pytorch_lightning as pl
from pytorch_lightning.callbacks import EarlyStopping

trainer = pl.Trainer(
    max_epochs=100,
    accelerator="gpu",
    callbacks=[EarlyStopping(monitor="val_loss")]
)
trainer.fit(model, train_loader, val_loader)
```

### NLP任务 (Transformers)
```python
from transformers import pipeline

# 文本分类
classifier = pipeline("text-classification", model="bert-base-chinese")
result = classifier("这个产品质量很好")

# 文本生成
generator = pipeline("text-generation", model="gpt2")
```

### 模型解释 (SHAP)
```python
import shap

explainer = shap.TreeExplainer(model)
shap_values = explainer.shap_values(X)

# 特征重要性
shap.summary_plot(shap_values, X)

# 单样本解释
shap.force_plot(explainer.expected_value, shap_values[0], X.iloc[0])
```

## 大数据ML最佳实践

### 1. 大规模训练
```python
# 使用Dask-ML
from dask_ml.model_selection import train_test_split
from dask_ml.linear_model import LogisticRegression

X_train, X_test = train_test_split(X_dask, y_dask)
model = LogisticRegression()
model.fit(X_train, y_train)
```

### 2. 增量学习
```python
from sklearn.linear_model import SGDClassifier

model = SGDClassifier()
for chunk in data_chunks:
    model.partial_fit(chunk.X, chunk.y, classes=[0, 1])
```

### 3. 模型版本管理
```python
import mlflow

with mlflow.start_run():
    mlflow.log_params(params)
    mlflow.log_metrics(metrics)
    mlflow.sklearn.log_model(model, "model")
```

## 团队规范

1. **实验追踪**: 使用MLflow记录所有实验
2. **模型版本**: 模型+数据版本绑定
3. **可解释性**: 关键模型必须提供SHAP解释
4. **部署流程**: 模型 → 测试 → 审核 → 上线

---

猪哥云-数据产品部 | 大数据团队专用

## 是什么

Big Data Machine Learning Toolkit 用来把 数据分析师 场景里的任务输入转成可执行的流程、检查清单和交付物。

Machine learning toolkit for big data teams. Includes scikit-learn, PyTorch Lightning, Transformers, SHAP for model training, deployment, and interpretation. Use when building ML pipelines, training models, or explaining predictions.

它的价值在于让 数据AI职能线 在 Claude Code、Codex、Gemini、Hermes 或 OpenClaw 中复用同一套岗位能力，而不是依赖一次性的聊天提示词。

## 怎么用

1. 明确当前任务目标、输入材料、约束和期望交付物，再加载 `bigdata-ml`。
2. 按 skill 文档中的流程、检查清单或工具建议执行，优先复用仓库已有规范与真实命令。
3. 把关键判断、风险、验证命令和产出路径记录到当前任务文档或交付说明中。
4. 用最小可证明的检查确认结果有效；发现缺口时回到 skill 清单补齐。

## 架构图

```mermaid
flowchart LR
  A[任务输入] --> B[加载 Big Data Machine Learning Toolkit]
  B --> C[执行流程与检查清单]
  C --> D[生成交付物与风险记录]
  D --> E[验证结果并沉淀复盘]
```
