# Research Analyst · Prompt Library

> 3 场景 × 3-4 prompts = 11 条立即可用 prompt
> 每条 prompt 标注：输入形状 / 期望输出 / Worked example
> 假定已加载 `~/.claude/skills/research/*`

---

## 场景 S1 · 政策与监管研究（Policy & Regulatory Research）

### S1-P1 · 政策原文 → 三角验证摘要

**输入**：1 份政策原文 + 受影响行业
**输出**：6 段三角验证摘要（claim / primary / secondary / adversarial / 综合判断 / unanswered）

```text
你是信源驱动的研究分析师。阅读以下政策原文（针对 <<<INDUSTRY>>>），按 F1 信源三角验证输出：
1) Claim：本政策对 <<<INDUSTRY>>> 的核心影响（1 句）
2) Primary source：政策原文 + 文号 + 关键条款
3) Secondary source：1 份行业头部分析 / 1 份学术 paper（请用 web-search 找）
4) Adversarial source：1 份与主张相反的论点 / 反例
5) 综合判断：A∧B∧¬C 的强度评分 (1-5) + 理由
6) Top 3 unanswered questions：还需研究什么
原文：<<<PASTE>>>
```

### S1-P2 · 政策影响 question tree（MECE）

**输入**：政策摘要 + 目标决策（如"是否应进入 X 子行业"）
**输出**：question tree (≤7 leaf) + 每个 leaf 的 deliverable 形式

```text
基于政策摘要 + 决策"<<<DECISION_QUESTION>>>", 按 MECE 拆出 ≤7 个子问题，
每个 leaf 标注：[ deliverable: 数字 / 表格 / 1-pager / 决策树 ]
然后排序：哪个 leaf 最不确定 / 最值得先研究？
摘要：<<<PASTE>>>
```

### S1-P3 · 月度政策追踪报告

**输入**：本月发布的 ≥5 项政策清单
**输出**：报告含 5 段（本月主题 / 影响排序 / Top 3 客户分群影响 / 我们的 SOP 调整 / Top 3 unanswered）

```text
基于本月政策清单，输出月度追踪报告：
1) 本月主题（≤2 句）
2) 政策影响排序（按 I×P-C 模型）
3) Top 3 客户分群影响（量化）
4) 我们的 SOP 调整清单（具体节点 + 截止日期）
5) Top 3 unanswered（启动下月研究的起点）
清单：<<<PASTE>>>
```

---

## 场景 S2 · 市场与竞品研究

### S2-P1 · 竞品深度扫描（5 维）

**输入**：竞品名 + 我方所在赛道
**输出**：5 维扫描表 + Top 3 我们应警惕的信号

```text
对竞品 <<<COMPETITOR>>>（赛道 <<<MARKET>>>）做深度扫描：
1) 产品：核心功能 + 最近 6 个月新增功能（含官网截图 / 发布日期）
2) 定价：报价单 / 公开定价 + 折扣信号
3) 客户群：公开客户名单 / 行业分布
4) 渠道：自营 / 合作伙伴 / 直销
5) 信号变化：招聘 / 投资 / 发布会 / 媒体报道 ↑↓ trend
最后输出 Top 3 应警惕的信号（按紧迫度排序）+ falsification condition
请用 web-multi-search 跨 3 引擎搜索，每条结论标注信源 + 日期
```

### S2-P2 · 行业 trend 1-pager

```text
为 <<<INDUSTRY>>>（窗口 <<<WINDOW_MONTHS>>> 个月）起草 1-pager：
1) 市场规模（数字 + 信源 + 日期）
2) 增长驱动（≥3 个，每个有 1 句 evidence）
3) 玩家格局（Top 5 + 市占率估算）
4) 关键趋势（≥3 个，按确定性排序）
5) 我们的机会（按 ICP 排序，每个 ≤30 字）
信源要求：≥3 个独立信源，至少 1 个 adversarial 视角
```

### S2-P3 · 客户行业研究（targeted）

```text
为 <<<CLIENT_NAME>>>（推荐方案 <<<SOLUTION>>>）做客户行业研究：
1) 业务模式（≤3 句）
2) 当前痛点（≥3 个，量化）
3) 决策链（KP 角色 + 影响者）
4) 类似客户案例（≥2 个，含 outcome）
5) 切入点（≥2 个 hypothesis + 每个的 first call 议题）
信源：官网 + 年报 + 招聘 + 公开新闻 + 1 个 adversarial（前员工评价 / 客户投诉）
```

---

## 场景 S3 · SOTA 技术研究

### S3-P1 · SOTA paper 5 分钟摘要

```text
按 5 段输出 paper 摘要（每段 ≤80 字）：
1) Problem：作者想解决什么问题
2) Approach：核心方法
3) Claim：实证结果（数字 + 对比 baseline）
4) Evidence quality：实验设计可信度评分 (1-5) + 1 句 critique
5) What's next：作者建议的下一步 + 你认为的真正下一步
paper：<<<URL OR PASTE>>>
```

### S3-P2 · 跨 paper synthesis

```text
对以下 ≥3 篇 paper 做跨 paper synthesis：
1) 综合表：每行 1 篇 paper，列 = problem / approach / claim / sample size / year
2) Top 3 跨 paper 收敛
3) Top 3 跨 paper 分歧（按重要性排序）
4) 你的判断（如果你必须在 30 天内决定 X，你会基于哪一派的结论 + 为什么）
papers：<<<LIST OF URLS>>>
```

### S3-P3 · SOTA → 工程落地评估

```text
对 SOTA 技术 <<<TECH>>>（我们现状：<<<CURRENT_STACK>>>）做落地评估：
1) 技术成熟度（PoC / Demo / Early production / Mature / Commodity）
2) 落地成本（人月 + 基建 + license）
3) ROI 估算（节省的 X 业务时长 × 业务 hourly cost vs 落地成本）
4) Top 3 风险（按 I×P-C 排序）
5) GO / NO-GO + 6-month re-eval condition
```

### S3-P4 · Iterative Research AutoResearch 1 轮

```text
对关键词 "<<<KEYWORD>>>" 执行 1 轮 AutoResearch (30 分钟):
1) Broad scan: 5 关键词 × 3 引擎，≥20 候选标题
2) Filter: Top 5 标题
3) Deep read: Top 5 → ≥10 atomic claims
4) Connect: → 1 个 mental model
5) Falsify: 3 个失效场景
6) 下一轮启动: Top 3 unanswered
```

---

Agent Foundry Team
