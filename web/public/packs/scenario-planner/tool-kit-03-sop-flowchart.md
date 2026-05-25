# SOP 流程图 · 业务分析 / 场景规划岗端到端工作流

> 把 BA 的日 / 周 / 季周期画成一张 Mermaid 流程图。这是一张"墙图"：决定要用哪条 prompt 之前先看一眼。
> 节点 ID 与可选的 `core/harness/sop_engine.py` 状态机一一对应（每个节点是一个状态）。

## 完整 SOP（≤ 20 节点）

```mermaid
flowchart TD
    START([每日开工]) --> S1[F1.1 收件夹扫描 — 邮件/会议纪要/IM]
    S1 -->|新客户事件| F1A[跑 §1.1 联系日志骨架]
    S1 -->|新政策公告| F3A[跑 §3.1 政策摄入草稿]
    S1 -->|新 lead 入站| F2A[跑 §2.1 商机录入表]
    S1 -->|无以上事件| S2[继续在做的工作]

    F1A --> CRM[(CRM 记录已落档)]
    F3A --> POLICYQ{P0 或 P1?}
    POLICYQ -->|P0 / P1| F3B[跑 §3.2 1-pager 生成]
    POLICYQ -->|P2 / 背景| DIGEST[(进入 §3.4 当日摘要队列)]
    F3B --> F3C[跑 §3.3 按客户适用性]
    F3C --> ALERT[发送受影响客户提醒]
    F2A --> Q1{4 项 BANT 字段是否齐全?}
    Q1 -->|齐全| F2B[首次互动后跑 §2.2 风险画像]
    Q1 -->|不齐| ASK[补问 discovery 问题，明日再来]

    S2 --> WEEKLY{是否周五?}
    WEEKLY -->|是| WK1[跑 §1.2 工时分类]
    WEEKLY -->|否| END([继续])
    WK1 --> WK2[跑 §1.3 周报缺口扫描]
    WK2 --> WK3[手写周度状态报告]
    WK3 --> WK4[跑 §1.4 相关方触达盘点]
    WK4 --> WK5[发送周度摘要]

    DIGEST --> EOD{是否到下班?}
    EOD -->|是| F3D[跑 §3.4 每日摘要编排]
    EOD -->|否| END
    F3D --> CHANNEL[(发到合规 channel)]

    %% 季度入口
    QUARTER([季度收口]) --> F2C[对所有客户跑 §2.3 流失信号复盘]
    F2C --> F2D[对 top WATCH 客户跑 §2.4 交叉销售]
    F2D --> ACCT_PLAN[客户计划复盘会]

    %% 应急 / 失败路径
    FAIL{prompt 输出不可用?} -->|第 2 次重试仍失败| HARNESS[core/harness/loop_detector.py 自动触发]
    HARNESS --> PIVOT[切换策略：缩小范围 / 换 prompt / 转人工]
    PIVOT --> LOG[登记到 data-collection/cohort-feedback-form.md T+1 Q4]

    style START fill:#0066B3,stroke:#002855,color:#fff
    style END fill:#1B7F4B,stroke:#002855,color:#fff
    style HARNESS fill:#D4850D,stroke:#002855,color:#fff
    style PIVOT fill:#C4281C,stroke:#002855,color:#fff
```

## 节点 ID 参考（可选，用于 `sop_engine.py` 状态机）

| Node ID | 状态 | 触发 | 下一状态 |
|---------|------|------|---------|
| `START` | daily-start | 当班开始 | `S1` |
| `S1` | inbox-sweep | 扫未读 | 按事件类型分支 |
| `F1A` | contact-log | 新客户事件 | `CRM` |
| `F3A` | policy-ingest | 新公告 | `POLICYQ` |
| `F2A` | opportunity-intake | 新 lead | `Q1` |
| `S2` | resume-work | 无新事件 | `WEEKLY` |
| `WK1`-`WK5` | weekly-cycle | 周五 | 顺序 |
| `F3B`-`F3D` | policy-cycle | 高优先级公告 | 顺序 |
| `F2B`-`F2D` | opportunity-cycle | 已资质化 lead | 顺序 |
| `HARNESS` | loop-detector | 第 2 次重试失败 | `PIVOT` |
| `PIVOT` | strategy-change | 模型卡住 | `LOG` |
| `LOG` | failure-log | 始终 | 下一个周期的 `START` |

## 日 / 周 / 季入口

| 节奏 | 入口节点 | 典型耗时 | 典型出口 |
|------|---------|---------|---------|
| 每个班次开始 | `START` → `S1` | 15-30 分钟 | `S2`（继续在做的工作） |
| 每周五 | `WEEKLY` → `WK1` | 90 分钟 | `WK5`（周度摘要发出） |
| 每天下班 | `EOD` → `F3D` | 20 分钟 | `CHANNEL`（摘要发出） |
| 季度收口 | `QUARTER` → `F2C` | 4 小时 | `ACCT_PLAN` |

## 应急路径

同一个 prompt 在同一个输入上失败 2 次时：

1. 已安装 harness 时，`core/harness/loop_detector.py` 会自动触发（你不用手动调）
2. harness 把 PIVOT 建议写到 `state/loop-detector.log`
3. 你读一下建议，切换策略（缩小范围 / 换 prompt / 转人工）
4. 把这次失败登记到 `data-collection/cohort-feedback-form.md` T+1 Q4 — 这是下一轮 prompt 模板迭代的输入

未安装 harness 时，规则同样生效：手动检查"是否同一 prompt 同一输入连续失败 2 次"，触发即换策略。

第 3 次重试同一方案是硬规则禁止的。

## 打印版

要把流程图贴到墙上，用 [Mermaid Live Editor](https://mermaid.live)：把上面的 mermaid 代码块粘贴进去，导出 2× PNG，A3 打印。

---

AI 训战工作坊 · scenario-planner pack · 业务分析 / 场景规划岗
Agent Foundry Team
