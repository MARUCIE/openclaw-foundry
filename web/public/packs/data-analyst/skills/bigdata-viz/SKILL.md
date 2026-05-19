---
name: bigdata-visualization
description: Data visualization toolkit for big data teams. Includes Matplotlib, Seaborn, Plotly for static and interactive charts. Use when creating dashboards, reports, or exploring data visually.
---

## 是什么

帮你把一张冷冰冰的数据表，变成业务方一眼能看出"哪里出问题"的图。让周报、复盘、向上汇报这种沟通环节，从"我念数字"升级到"我讲故事"，决策会议的对齐效率直接翻倍。

## 怎么用

1. 先想清楚这张图要回答的业务问题（趋势变化？结构对比？异常定位？），问题不清楚就别动手做图。
2. 静态出图（周报截图、PPT 嵌入）走 Matplotlib + Seaborn（Python 经典绘图库组合，发表级别质量），导出 PNG/SVG 即可。
3. 交互探索（看板、给业务方自己拖拽）走 Plotly（交互式图表库，鼠标 hover 显示明细），输出 HTML 直接发邮件。
4. 配色和坐标轴必须为业务读者优化：异常色固定红、正常色固定蓝绿、Y 轴从 0 起步避免误读趋势幅度。
5. 每张图自带一句结论文字（标题或副标题），让接收方不用看图就知道你想说什么，看图只是验证你的结论。

## 架构图

```mermaid
flowchart LR
    A[业务问题] --> B{出图目的}
    B -->|静态报告| C[Matplotlib<br/>+ Seaborn]
    B -->|交互探索| D[Plotly<br/>HTML]
    C --> E[PNG/SVG]
    D --> F[嵌入看板]
    E --> G[一句话结论]
    F --> G
```

# Big Data Visualization Toolkit

## Overview

大数据团队可视化工具集，覆盖静态图表到交互式Dashboard。

## Quick Reference

| 工具 | 类型 | 场景 |
|------|------|------|
| **Matplotlib** | 静态 | 论文、报告、精细控制 |
| **Seaborn** | 静态 | 统计图表、快速美观 |
| **Plotly** | 交互 | Dashboard、Web展示 |

## 选择指南

```
输出目标:
├── 报告/论文 → Matplotlib + Seaborn
├── 内部分享 → Plotly (交互)
├── Dashboard → Plotly + Dash
└── 实时监控 → Plotly + Streaming
```

## 子Skills

- `matplotlib/` - 基础绑图库
- `seaborn/` - 统计可视化
- `plotly/` - 交互式图表
- `scientific-visualization/` - 科学可视化

## 常用模式

### 快速统计图 (Seaborn)
```python
import seaborn as sns
import matplotlib.pyplot as plt

# 分布图
sns.histplot(data=df, x="value", hue="category")

# 相关性热力图
sns.heatmap(df.corr(), annot=True, cmap="coolwarm")

plt.savefig("report.png", dpi=300)
```

### 交互式Dashboard (Plotly)
```python
import plotly.express as px

fig = px.scatter(
    df, x="x", y="y",
    color="category",
    size="value",
    hover_data=["name", "date"]
)
fig.write_html("dashboard.html")
```

### 大数据可视化技巧

```python
# 采样可视化 (数据量大时)
sample = df.sample(n=10000)
px.scatter(sample, x="x", y="y")

# 聚合后可视化
agg = df.groupby("category").agg({"value": "mean"})
px.bar(agg, x=agg.index, y="value")

# 分位数可视化
px.box(df, x="category", y="value")
```

## 团队规范

1. **颜色方案**: 使用公司品牌色
2. **字体大小**: 标题14pt, 标签12pt
3. **分辨率**: 报告300dpi, Web 72dpi
4. **格式**: PDF用于报告, HTML用于分享

---

猪哥云-数据产品部 | 大数据团队专用
