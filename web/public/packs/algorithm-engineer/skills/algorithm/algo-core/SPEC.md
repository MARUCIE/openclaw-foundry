---
name: algorithm-toolkit
description: Core algorithm toolkit for algorithm teams. Includes graph algorithms, symbolic math, optimization, simulation, and probabilistic programming. Use when designing algorithms, mathematical modeling, or solving optimization problems.
---

# Algorithm Team Core Toolkit

## Overview

算法团队核心工具集，覆盖图算法、数学建模、优化、仿真等领域。

## Quick Reference

| 工具 | 场景 | 典型应用 |
|------|------|----------|
| **networkx** | 图算法 | 社交网络、知识图谱、路径规划 |
| **sympy** | 符号计算 | 公式推导、自动微分 |
| **pymoo** | 多目标优化 | 参数调优、资源分配 |
| **simpy** | 离散事件仿真 | 排队系统、流程模拟 |
| **statsmodels** | 统计建模 | 时间序列、回归分析 |
| **pymc** | 贝叶斯推断 | 不确定性量化、A/B测试 |

## 子Skills

- `networkx/` - 图论算法
- `sympy/` - 符号数学
- `pymoo/` - 多目标优化
- `simpy/` - 离散仿真
- `statsmodels/` - 统计模型
- `pymc/` - 概率编程

## 常用模式

### 图算法 (NetworkX)
```python
import networkx as nx

G = nx.DiGraph()
G.add_edges_from([(1,2), (2,3), (1,3)])

# 最短路径
path = nx.shortest_path(G, 1, 3)

# PageRank
pr = nx.pagerank(G)

# 社区发现
communities = nx.community.louvain_communities(G)
```

### 多目标优化 (pymoo)
```python
from pymoo.algorithms.moo.nsga2 import NSGA2
from pymoo.optimize import minimize

algorithm = NSGA2(pop_size=100)
res = minimize(problem, algorithm, ('n_gen', 200))
```

### 贝叶斯推断 (PyMC)
```python
import pymc as pm

with pm.Model() as model:
    mu = pm.Normal('mu', mu=0, sigma=1)
    obs = pm.Normal('obs', mu=mu, sigma=1, observed=data)
    trace = pm.sample(1000)
```

### 离散仿真 (SimPy)
```python
import simpy

def process(env):
    while True:
        yield env.timeout(1)
        print(f"Time: {env.now}")

env = simpy.Environment()
env.process(process(env))
env.run(until=10)
```

---

猪哥云-数据产品部 | 算法团队专用
