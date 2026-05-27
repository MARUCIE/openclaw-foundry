---
name: bigdata-processing
description: Core big data processing toolkit for data teams. Includes Polars, Dask, Vaex for large-scale data processing, ETL pipelines, and distributed computing. Use when working with datasets larger than memory, building data pipelines, or optimizing data processing performance.
---

# Big Data Processing Toolkit

## Overview

大数据团队核心处理工具集，包含高性能DataFrame库和分布式计算框架。

## Quick Reference

| 工具 | 场景 | 数据规模 |
|------|------|----------|
| **Polars** | 单机高性能分析 | GB级 |
| **Dask** | 分布式/超内存处理 | TB级 |
| **Vaex** | 超大文件惰性处理 | 100GB+ |

## 选择指南

```
数据大小判断:
├── < 10GB → Polars (最快)
├── 10GB - 100GB → Polars (streaming) 或 Dask
├── > 100GB → Dask (分布式)
└── 超大单文件 → Vaex (内存映射)

任务类型:
├── 简单ETL → Polars
├── 复杂管道 → Dask
├── 交互分析 → Vaex
└── 机器学习 → Dask + Dask-ML
```

## 子Skills

- `polars/` - 高性能DataFrame，替代Pandas
- `dask/` - 分布式计算框架
- `vaex/` - 大规模数据惰性处理
- `exploratory-data-analysis/` - 探索性数据分析
- `statistical-analysis/` - 统计分析方法
- `zarr-python/` - 分块数组存储

## 常用模式

### ETL Pipeline (Polars)
```python
import polars as pl

# 读取 -> 转换 -> 写入
(
    pl.scan_csv("raw/*.csv")
    .filter(pl.col("status") == "valid")
    .with_columns(
        pl.col("amount").cast(pl.Float64),
        pl.col("date").str.to_datetime()
    )
    .group_by("category")
    .agg(pl.col("amount").sum())
    .collect()
    .write_parquet("output/summary.parquet")
)
```

### 分布式处理 (Dask)
```python
import dask.dataframe as dd
from dask.distributed import Client

client = Client()  # 启动本地集群

ddf = dd.read_parquet("data/*.parquet")
result = ddf.groupby("key").agg({"value": "sum"}).compute()
```

### 超大文件分析 (Vaex)
```python
import vaex

df = vaex.open("huge_file.hdf5")  # 不加载到内存
df.mean(df.column)  # 惰性计算
```

## 性能最佳实践

1. **文件格式**: Parquet > CSV (10x faster)
2. **惰性计算**: 使用 `scan_*` 而非 `read_*`
3. **列选择**: 尽早选择需要的列
4. **分区策略**: 按日期/类别分区大数据集
5. **并行度**: CPU核心数 = 并行任务数

## 团队使用建议

```bash
# 查看具体skill详情
ai skills info bigdata-core/polars
ai skills info bigdata-core/dask
```

---

猪哥云-数据产品部 | 大数据团队专用

## 是什么

Big Data Processing Toolkit 用来把 数据分析师 场景里的任务输入转成可执行的流程、检查清单和交付物。

Core big data processing toolkit for data teams. Includes Polars, Dask, Vaex for large-scale data processing, ETL pipelines, and distributed computing. Use when working with datasets larger than memory, building data pipelines, or optimi...

它的价值在于让 数据AI职能线 在 Claude Code、Codex、Gemini、Hermes 或 OpenClaw 中复用同一套岗位能力，而不是依赖一次性的聊天提示词。

## 怎么用

1. 明确当前任务目标、输入材料、约束和期望交付物，再加载 `bigdata-core`。
2. 按 skill 文档中的流程、检查清单或工具建议执行，优先复用仓库已有规范与真实命令。
3. 把关键判断、风险、验证命令和产出路径记录到当前任务文档或交付说明中。
4. 用最小可证明的检查确认结果有效；发现缺口时回到 skill 清单补齐。

## 架构图

```mermaid
flowchart LR
  A[任务输入] --> B[加载 Big Data Processing Toolkit]
  B --> C[执行流程与检查清单]
  C --> D[生成交付物与风险记录]
  D --> E[验证结果并沉淀复盘]
```
