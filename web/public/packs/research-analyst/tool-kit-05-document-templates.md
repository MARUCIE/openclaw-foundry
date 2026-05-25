# Tool-Kit 05 · Document Templates · Research Analyst

> 5 类研究文档模板。每个含结构 / 必填字段 / 反模式自检。

## Template 1 · 三角验证摘要 1-Pager

```markdown
# <主题> · 三角验证摘要

| 元数据 | 值 |
|--------|---|
| Claim | <1 句核心主张> |
| 研究日期 | YYYY-MM-DD |
| 复核日期 | YYYY-MM-DD (+90 天) |

## 1. Primary source
- 原文：<URL>
- 发布日期：
- 关键引述：「...」

## 2. Secondary source
- 来源：
- 发布日期：
- 与 Primary 一致度：⭐⭐⭐⭐⭐

## 3. Adversarial source
- 来源：
- 反对的核心论点：
- 反对的证据强度：⭐⭐⭐⭐⭐

## 4. 综合判断
- A∧B∧¬C 强度评分 (1-5)：
- 我的判断：
- Falsification condition：如果 <Y> 发生，我错。

## 5. Top 3 Unanswered Questions
1.
2.
3.
```

必填：所有 5 段 + 复核日期 + falsification + ≥3 unanswered。

反模式自检：
- ❌ Adversarial source 缺失或来自同阵营 → confirmation bias
- ❌ Unanswered 段空 → 研究价值低
- ❌ 复核日期未填 → 90 天后 silently stale

## Template 2 · 月度政策追踪报告

```markdown
# 月度政策追踪 · YYYY-MM

## 本月主题（≤2 句）

## 政策影响排序（ICP）
| # | 政策 | I | P | C | I×P-C | 影响客户群 |
|---|------|---|---|---|-------|-----------|

## Top 3 客户分群影响（量化）

## 我们的 SOP 调整清单
| 节点 | 操作 | 截止 | 责任人 |
|------|------|------|--------|

## 上月 unanswered 跟进
- [ ] <上月遗留>: 状态 / 答案
- [ ] ...

## 本月新增 Top 3 unanswered
1.
2.
3.
```

## Template 3 · 竞品深度扫描

```markdown
# 竞品扫描 · <COMPETITOR> · YYYY-MM-DD

## 5 维扫描
| 维度 | 现状 | 6 个月变化 | 信源 |
|------|------|-----------|------|
| 产品 | | | |
| 定价 | | | |
| 客户群 | | | |
| 渠道 | | | |
| 信号变化 | | | |

## Top 3 我们应警惕的信号
1. <信号>：紧迫度 ⭐⭐⭐⭐⭐ ｜ Falsification：如果 <Y> 不发生，我错
2.
3.

## 我们的应对建议（≤3 个，按 ICP 排序）
```

## Template 4 · 行业 trend 1-pager

```markdown
# <INDUSTRY> · 行业 trend · 窗口 <WINDOW>

## 1. 市场规模
- 当前规模：¥X / $Y（信源 + 日期）
- 3 年 CAGR：

## 2. 增长驱动（≥3）
- 驱动 1（evidence）
- 驱动 2
- 驱动 3

## 3. 玩家格局
| Top | 玩家 | 市占 (est.) | 信源 |
|-----|------|-------------|------|

## 4. 关键趋势（≥3，按确定性排序）
- ⭐⭐⭐⭐⭐ 趋势 A
- ⭐⭐⭐⭐ 趋势 B
- ⭐⭐⭐ 趋势 C

## 5. 我们的机会（按 ICP 排序）
- 机会 1：
- 机会 2：

## 6. Top 3 Unanswered
```

## Template 5 · SOTA paper 摘要

```markdown
# <PAPER TITLE> · 5 分钟摘要

## Problem
（≤80 字）

## Approach
（≤80 字，可简化公式）

## Claim
（≤80 字，含 baseline 对比数字）

## Evidence quality
评分 ⭐⭐⭐⭐⭐ + 1 句 critique

## What's next
作者建议 vs 你认为的下一步

## 与我们工作的关联（如有）
ROI 估算 / 6 个月内是否值得 PoC
```

---

Agent Foundry Team
