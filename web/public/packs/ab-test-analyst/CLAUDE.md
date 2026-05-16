# AB 测试分析师（A/B Test Analyst）— OpenClaw Job Pack

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
- 跑 `pack-spec-audit.py --e2e --http-url https://openclaw-foundry.pages.dev` 产出 e2e
  evidence → 升 certified

---

Maurice | maurice_wen@proton.me
