---
name: bigdata-machine-learning
description: Machine learning toolkit for big data teams. Includes scikit-learn, PyTorch Lightning, Transformers, SHAP for model training, deployment, and interpretation. Use when building ML pipelines, training models, or explaining predictions.
---

## 是什么

把 scikit-learn（传统机器学习）、PyTorch Lightning（深度学习）、Transformers（预训练 NLP）、SHAP（可解释性）、Dask-ML（大规模训练）一站式集成，帮大数据团队把"TB 级数据 + 业务问题"系统化转成"可上线的预测能力 + 可追溯的实验记录"，让分类、回归、文本、图像、强化学习任务共用一套规范。

## 怎么用

1. 按任务类型自动选型：分类回归走 scikit-learn，文本走 Transformers，图像走 Lightning，强化学习走 stable-baselines3，让选型不再靠工程师个人偏好。
2. 把 Pipeline（管线）+ cross_val_score（交叉验证）封成标准模板，让团队成员的实验结果可比可复现。
3. 单机塞不下的数据切到 Dask-ML（分布式机器学习），让 TB 级训练不再需要重写代码。
4. 流式数据用 partial_fit（增量学习），让模型可以一边收新样本一边迭代，不用每周全量重训。
5. 用 MLflow（实验追踪）记录参数 + 指标 + 模型，再用 SHAP 给关键预测出归因报告，让模型上线后业务、合规、风控都能溯源。

## 架构图

```mermaid
flowchart LR
    A[原始数据] --> B[Pipeline 标准化]
    B --> C[选型 + 训练]
    C --> D[MLflow 追踪]
    D --> E[SHAP 解释]
    E --> F[模型上线]
```

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
