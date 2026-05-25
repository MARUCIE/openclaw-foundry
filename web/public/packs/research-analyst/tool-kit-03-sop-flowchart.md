# Tool-Kit 03 · SOP Flowchart · Research Analyst

> 3 张 mermaid 流程图覆盖最高频研究工作流。

## SOP-A · 新研究任务启动 → 交付

```mermaid
flowchart TD
    A[收到研究 brief] --> B{MECE 拆 question tree}
    B --> C[识别 unknown unknowns]
    C --> D{F2 AutoResearch Round 1}
    D --> E[Top 5 信源 + 10 atomic claims]
    E --> F{F1 信源三角验证}
    F -->|3 信源同阵营| G[Find adversarial source]
    F -->|跨阵营 ≥3| H[Draft synthesis]
    G --> F
    H --> I{Falsify check}
    I -->|不可证伪| J[Rewrite with falsification condition]
    I -->|可证伪| K[1-pager / report]
    J --> H
    K --> L{Top 3 unanswered identified?}
    L -->|否| M[Add unanswered section]
    L -->|是| N[Deliver + log next research round]
    M --> N
```

**关键控制点**：
- 节点 B：question tree 必须 MECE，≤7 leaf，每 leaf 有 deliverable 形式
- 节点 F：3 信源必须跨阵营（primary + secondary + adversarial），单阵营 ≥3 都不算合格
- 节点 I：falsify check 强制 → 不可证伪的研究等于零价值
- 节点 L：unanswered 段强制 → 不识别 gap 等于自满

**失效信号**：
1. ≥1 leaf 的 deliverable 与 brief 偏离 → 解读偏差
2. 信源全部 <12 个月 → 缺历史 context；全部 >24 个月 → stale
3. unanswered 段空 → 研究价值低

## SOP-B · 政策追踪 → SOP 落地

```mermaid
flowchart LR
    A[订阅政策信源 RSS/官网] --> B{日扫}
    B --> C[新政策？]
    C -->|是| D[三角验证摘要 S1-P1]
    C -->|否| B
    D --> E{question tree S1-P2}
    E --> F[影响 ICP 排序]
    F --> G{触发协同}
    G --> H[compliance-expert: SOP delta]
    G --> I[executive-strategist: 客户告知]
    G --> J[data-analyst: 量化客户影响]
    H --> K[月度报告 S1-P3]
    I --> K
    J --> K
```

**关键控制点**：
- 节点 B：每日固定时段扫，至少 3 个独立信源（避免单源依赖反模式）
- 节点 F：ICP 排序必须用客观数据（影响数字 / 概率估算 / 控制成本），不允许"凭感觉"
- 节点 K：月度报告必须包含上月 unanswered 是否已解答

**失效信号**：
1. 日扫覆盖 <3 信源 → 单源风险
2. 月度报告无 unanswered follow-up → 闭环断
3. 协同延迟 >7 日 → 政策影响延期

## SOP-C · SOTA paper 研究 → 工程落地

```mermaid
flowchart TD
    A[识别 SOTA 信号<br/>会议/arxiv/GitHub trending] --> B{S3-P1 5 分钟摘要}
    B --> C{潜力评分 ≥3.5?}
    C -->|否| D[归档到知识库]
    C -->|是| E{S3-P2 跨 paper synthesis}
    E --> F[找 ≥3 paper 同方向]
    F --> G{S3-P3 工程落地评估}
    G --> H{GO?}
    H -->|NO_GO| I[6 个月后 re-eval]
    H -->|GO| J[output 1-pager 给 CTO/PM]
    J --> K[PoC 启动]
```

**关键控制点**：
- 节点 B：5 分钟硬约束，超时则放弃这篇（防止 paper-rabbit-hole）
- 节点 G：ROI 估算必须含 break-even 时长，否则不允许 GO
- 节点 H：GO 决策必须有 1 个 NO_GO 的 falsification condition

**失效信号**：
1. 5 分钟摘要 >15 分钟 → paper 太深，不适合作为本周 SOTA scan 单元
2. GO 但 6 个月后 PoC 仍未启动 → 研究→落地链路断
3. 跨 paper synthesis 全部一致 → 没找到 adversarial paper

---

Agent Foundry Team
