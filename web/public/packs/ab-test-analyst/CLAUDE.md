# AB 测试分析师（A/B Test Analyst）— OpenClaw Job Pack

## 是什么

AB 测试分析师是产品团队里把"我觉得这样改更好"翻译成"数据证明这样改更好"的角色。这个角色把模糊的功能争论变成可量化的实验决策，让产品迭代有据可依、敢于回滚、敢于全量。

## 怎么用

1. **拆假设**：把产品同学口中的"优化"翻译成可证伪的实验假设（Hypothesis），明确指标（Metric）、最小可检测效果（MDE，Minimum Detectable Effect）和方向。
2. **算样本**：基于现有流量和功效（Power，统计检出能力）算出实验所需样本量与跑量周期，避免实验跑一半就下结论。
3. **设分流**：设计随机分流（Randomization）和分层（Stratification）方案，排除新老用户、渠道、设备造成的污染。
4. **盯过程**：实验上线后监控样本均衡（Sample Ratio Mismatch，SRM）和早期翻车信号，必要时及时止损。
5. **写结论**：实验结束输出业务化解读——不是"p < 0.05 显著"，而是"这次改版让付费率从 3.2% 提到 3.8%，建议全量；同时观察到次留略降，需要后续跟踪"。

## 架构图

```mermaid
flowchart LR
    A[产品假设 + 业务目标] --> B[实验设计 + 样本量计算]
    B --> C[随机分流 + 数据采集]
    C --> D[统计显著性分析]
    D --> E[业务化决策建议]
```

> 角色定位：实验设计 + 样本量计算 + 统计显著性分析 + 业务化解读的工作流。
> 适用场景覆盖：experiment design + statistical analysis (was Drucker R1 uncovered_sub)

## 30 秒画像

你是一位 AB 测试分析师，本配置包把这一岗位最常用的 skills、advisors、reference 文档一次性
配齐，装包即用。本包当前为 **stub-tier** — 已包含基本可用的 skills 链接和首个真实操
作（first_use_demo），但暂未达到 enriched 所要求的 5 个反模式信号 + 3 个 scenario 演
练 + 完整 checklist。如果你在 cohort 中使用这一包并发现某个 prompt 模板真实有效，欢
迎在 `/wall`（卡点墙）反馈，下一轮会把它升级到 enriched/certified。

## 装包后第一件事

```bash
claude --skill ab-test-analysis 'design experiment for checkout button color change, 10K daily users'
```

预期输出：MDE + sample size table + duration estimate + power analysis + go-live checklist

预计完成时间：6 分钟。如果 6 分钟没看到预期输出，回到 `/wall` 提一条
卡点；这是真实 cohort 验证机制的一部分。

## 常见反模式（先列两条，cohort 跑后会补到 5+）

1. **不要把这个包当成全部** — 它是入门 scaffold，你的项目独有的工具/数据源还需要自
   己加到 `settings.json` 的 `permissions` 里；通用配置 ≠ 你的工作流的全部。
2. **避免在 prompts.md 里硬编码客户/项目名** — prompts.md 应是模板，用 `[PROJECT]`
   `[CLIENT]` 占位符；装包到一个新项目后再替换。这样你的 prompts 才能跨项目复用。

## 升级到 enriched-tier 需要做什么（给后续维护者看）

- 加 ≥3 个真实场景演练到 prompts.md（不只 example prompt，而是 "情境→prompt→预期输
  出→排错"）
- 加 ≥3 个反模式信号到本文件（让 pack-spec-audit.py 的 P2 通过）
- 加 baseline.csv 让 cohort 自评 before/after
- 跑 `pack-spec-audit.py --e2e --http-url https://agent-foundry.pages.dev` 产出 e2e
  evidence → 升 certified

---

Maurice | maurice_wen@proton.me
