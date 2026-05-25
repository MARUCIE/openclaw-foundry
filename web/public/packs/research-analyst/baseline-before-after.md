# Baseline · Before vs After · Research Analyst

> 10 项有代表性研究任务。

## 质量信号优先

| 领域 | 信号 | 下限 |
|------|------|------|
| 信源 | adversarial 视角覆盖率 | 100%（每份报告必含） |
| 摘要 | 每条主张的来源引用 | 1:1 |
| 综合 | 跨 paper 收敛与分歧识别 | ≥3 each |
| 报告 | unanswered questions | ≥3 each |
| 落地 | falsification condition | 100%（每个 GO 决策必含） |

## 10 项 baseline 任务

| # | 任务 | 族 | Baseline (h) | 目标 (h) | 节省 % | 质量信号 |
|---|------|-----|-------------:|---------:|-------:|---------|
| 1 | 政策原文 → 三角验证摘要 | S1 | 2.5 | 0.5 | 80 | adv 信源 0 → 1 |
| 2 | 政策 question tree | S1 | 3.0 | 0.5 | 83 | MECE 验证 0 → 100% |
| 3 | 月度政策报告 | S1 | 8.0 | 2.0 | 75 | unanswered 0 → 3 |
| 4 | 竞品深度扫描 | S2 | 6.0 | 1.5 | 75 | 5 维全覆盖 50% → 100% |
| 5 | 行业 trend 1-pager | S2 | 10.0 | 2.5 | 75 | adversarial 信源 0 → 1 |
| 6 | 客户行业研究 | S2 | 5.0 | 1.0 | 80 | 切入点 1 → 2+ |
| 7 | SOTA paper 摘要 | S3 | 1.0 | 0.1 | 90 | evidence quality 评分强制 |
| 8 | 跨 paper synthesis | S3 | 8.0 | 2.0 | 75 | 收敛+分歧识别强制 |
| 9 | SOTA 工程落地评估 | S3 | 6.0 | 1.5 | 75 | falsification condition 100% |
| 10 | AutoResearch 1 轮 | S3 | 2.0 | 0.5 | 75 | 3 信源跨阵营强制 |

**Baseline 合计**：51.5 h / 周  ·  **目标**：12.1 h / 周  ·  **整体节省**：76.5%

## 失效信号（任一即返工）

1. Adversarial 信源缺失 → 单源解读
2. Unanswered 段空 → 研究价值低
3. 综合段是"分别认为" → 没真正综合
4. 摘要 >15 分钟 → 超时
5. Falsification condition 缺失 → 不可证伪

---

Agent Foundry Team
