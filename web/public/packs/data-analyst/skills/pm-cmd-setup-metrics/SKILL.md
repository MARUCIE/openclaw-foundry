---
name: pm-cmd-setup-metrics
description: Design a product metrics dashboard with North Star metric, input metrics, health metrics, and alert thresholds
argument-hint: "<product or feature area>"
---

## 是什么

帮你用一条命令把"产品该度量什么"这件事一次性想清楚：北极星指标、输入指标、健康度指标、告警阈值全部出齐。让新功能上线第二天就能看到数据信号，不用再等三周才搭好看板。

## 怎么用

1. 给一句话产品或功能定位（比如"SaaS 项目管理工具"或"新上线的支付流程"），命令会顺着这个语境推荐指标。
2. 命令先帮你定北极星指标（产品最核心的客户价值衡量），再配 3–5 个输入指标作为日常驱动杠杆。
3. 自动补 2–3 个健康度指标（崩溃率、加载时长、客诉率这种基础体验信号），防止只盯北极星而忽略地基。
4. 每个指标自带建议阈值（什么算正常、什么算预警、什么算告警），不用从零拍脑袋定。
5. 输出可以直接交给开发做埋点（数据采集代码）、交给数据团队建表，PM 不用再写指标定义文档。

## 架构图

```mermaid
flowchart LR
    A[产品定位输入] --> B[北极星推荐]
    B --> C[输入指标 ×3-5]
    B --> D[健康度 ×2-3]
    C --> E[阈值建议]
    D --> E
    E --> F[埋点 + 看板]
```

# /setup-metrics -- Product Metrics Dashboard Design

Design a comprehensive metrics framework for your product or feature — from selecting the right North Star to defining alert thresholds that catch problems early.

## Invocation

```
/setup-metrics SaaS project management tool
/setup-metrics New checkout flow we just launched
/setup-metrics             # asks what you're measuring
```

## Workflow

### Step 1: Understand What to Measure

Ask the user:
- What product or feature area are you setting up metrics for?
- What stage is it in? (pre-launch, recently launched, mature)
- What are the current business goals or OKRs?
- Do you have existing metrics? What's missing or broken?
- What analytics tools are you using? (helps tailor implementation advice)

### Step 2: Define the Metrics Framework

Apply the **metrics-dashboard** skill:

**North Star Metric:**
- Identify the single metric that best captures the value your product delivers to users
- Validate against criteria: measures value delivery, is a leading indicator, is actionable
- Define the metric precisely (formula, data source, time window)

**Input Metrics (3-5):**
- Identify the levers that drive the North Star
- Each input metric should be directly actionable by a team
- Map the causal chain: Input → North Star → Business Outcome

**Health Metrics (3-5):**
- Metrics that should stay stable — if they degrade, something is wrong
- Examples: error rates, latency, support ticket volume, NPS, churn rate
- Define "healthy" ranges and degradation thresholds

**Counter-Metrics (1-2):**
- Metrics that could indicate you're optimizing the wrong way
- Example: if North Star is "daily active users", counter-metric is "session quality" to prevent empty engagement

### Step 3: Design Alert Thresholds

For each metric:

| Metric | Green | Yellow | Red | Check Frequency |
|--------|-------|--------|-----|----------------|
| [metric] | [healthy range] | [warning] | [critical] | [daily/weekly] |

- **Yellow**: Investigate — something may be off
- **Red**: Act immediately — page someone or escalate

### Step 4: Create Dashboard Spec

```
## Metrics Dashboard: [Product/Feature]

**North Star**: [metric name]
**Definition**: [precise formula]
**Current value**: [if known]
**Target**: [goal]

### Input Metrics
| Metric | Definition | Owner | Target | Current |
|--------|-----------|-------|--------|---------|

### Health Metrics
| Metric | Healthy Range | Yellow Threshold | Red Threshold |
|--------|-------------|-----------------|---------------|

### Counter-Metrics
| Metric | Why It Matters | Watch For |
|--------|---------------|-----------|

### Metrics Tree
North Star: [metric]
├── Input: [metric 1] → driven by [team/action]
├── Input: [metric 2] → driven by [team/action]
├── Input: [metric 3] → driven by [team/action]
└── Counter: [metric] → watch for [degradation signal]

### Implementation Notes
- Data sources: [where each metric comes from]
- Refresh frequency: [real-time / hourly / daily]
- Tool recommendations: [based on user's stack]

### Review Cadence
- **Daily**: Glance at North Star and health metrics
- **Weekly**: Review input metrics trends, discuss in team standup
- **Monthly**: Deep dive — are inputs driving the North Star as expected?
- **Quarterly**: Reassess the metrics framework itself
```

Save as a markdown file to the user's workspace.

### Step 5: Offer Next Steps

- "Want me to **write SQL queries** to compute these metrics?"
- "Should I **create OKRs** based on this metrics framework?"
- "Want me to **build a cohort analysis** to set realistic baselines?"
- "Should I **set up a weekly metrics review template**?"

## Notes

- A good North Star is rare — most teams pick vanity metrics. Push for a metric that captures *user value delivered*, not just engagement
- Input metrics should be MECE (mutually exclusive, collectively exhaustive) in explaining the North Star
- If the product is pre-launch, define metrics now but note that baselines will need calibration after launch
- Counter-metrics prevent Goodhart's Law — when a metric becomes a target, it ceases to be a good metric
- Recommend starting with fewer metrics, well-instrumented, over a sprawling dashboard nobody checks
