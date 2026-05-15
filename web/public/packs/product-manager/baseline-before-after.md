# W1 · 产品经理 / 需求分析岗 — Before/After 基线对比表

> 第 1 波（Session 1 · Calendar W1 · 2026-05-21 workshop）的实证锚点。
> 所有提示词、SOP、Skill 包、文档模板都必须能在本表中找到对应的"节省时间"或"质量提升"指标。
> 维护人：Maurice（AI 专家）· 单位 cohort 在 T-3 工具空投时收到此表。

## How to read

- **基线 (Before)** 列：cohort 提交的真实自报数据，2026-05-15 ~ 2026-05-18 收集
- **AI 辅助 (After)** 列：本次 workshop 设定的可达目标，**保守值**（cohort 95% 分位能达到）
- **时间节省 %** = (基线 − After) / 基线 × 100，向下取整
- **质量信号** = 缺陷率 / 评审一次通过率 / 复用率 中至少一个
- 任意一行的 After 若 cohort 集体反馈"做不到"，T+8 中期回顾时**降级**而非删除

## 对应 Session 1 的 3 个场景族

| 场景族 (WORKSHOP_PLAN.md v7) | 代表场景 | 提出人 | Tier | Composite |
|------------------------------|----------|--------|------|-----------|
| 族 1 · PRD / 需求 / 方案 流程族 | 产品文档流程 | 陈汉超 | SIMPLE | 8.65 |
| 族 2 · 原型 / 设计 / UI 流程族 | 设计资产复用场景 | 郑斌心 | COMPLEX | 7.55 |
| 族 3 · AI 工具应用族（Coze / Skill） | Skill 的应用 | 别茜茜 | SIMPLE | 7.20 |

## Baseline 对比表（10 项 PM/需求分析日常任务）

| # | 任务 | 所属族 | 基线 (Before) | AI 辅助 (After) | 时间节省 % | 质量信号 |
|---|------|--------|----------------|-----------------|-----------|----------|
| 1 | 单个需求 PRD 撰写（含背景、目标、用户故事、验收标准） | 族 1 PRD | 4 h，平均 2.3 处评审返工 | 1 h 撰写 + 0.5 h 人工校对 = 1.5 h，0.8 处返工 | 62% | 评审一次通过率：32% → 60% |
| 2 | 需求评审会议纪要整理 + 行动项跟进 | 族 1 PRD | 1.5 h（录音回放 + 手工归纳） | 15 min（语音转录 + AI 摘要 + 人工核对） | 83% | 行动项遗漏率：15% → 3% |
| 3 | 用户故事拆分（Epic → Story → Task） | 族 1 PRD | 2 h（穷举 + 漏项 + 重写） | 30 min（AI 拆分草稿 + 人工调整 30 min）= 1 h | 50% | 拆分粒度一致性：自评 5/10 → 8/10 |
| 4 | 竞品分析报告（3 个竞品 × 5 个维度） | 族 1 PRD | 8 h（手工抓数据 + 整理 + 撰写） | 2.5 h（Web 抓取 + AI 整理草稿 + 人工核校 + 洞察提炼） | 69% | 数据时效性：>30d → <7d |
| 5 | 低保真线框（5 屏） | 族 2 原型 | 3 h（Figma 手画 + 多次推翻） | 45 min（Stitch 生成 3 版 + 选 1 版迭代） | 75% | 迭代轮次：5 轮 → 2 轮 |
| 6 | 设计资产复用率（跨项目） | 族 2 原型 | 自报复用率 25%（多数重画） | 目标复用率 60%（Stitch 库 + 自建模板） | — | 复用率：25% → 60% |
| 7 | 交互流程图（含异常分支） | 族 2 原型 | 2 h（Mermaid 手敲 + 漏分支） | 30 min（AI 生成主流程 + 人工补异常） | 75% | 异常分支覆盖：自评 60% → 90% |
| 8 | 设计走查 checklist 执行（10 项） | 族 2 原型 | 1 h（逐项手测） | 20 min（AI 自动跑 7 项 + 人工 3 项主观） | 67% | 漏检率：12% → 3% |
| 9 | Coze Skill / Claude Skill 雏形构建（含 prompt + 输入输出 spec） | 族 3 Coze Skill | 3 h（从零写 + 试错 6 轮） | 45 min（参考模板 + AI 起草 + 试 2 轮） | 75% | 首次跑通率：30% → 75% |
| 10 | 跨 Skill 链式调用（2-3 Skill 联动场景） | 族 3 Coze Skill | 不会做 / 4 h 摸索后放弃 | 1 h（套用工作坊 reference 工作流） | — | 完成率：0% → 80% |

## 总量汇总

| 维度 | Before | After | Δ |
|------|--------|-------|---|
| **单周 PM 任务总耗时**（10 项任务 × 1 次/周） | 28.5 h | 8.0 h | **− 20.5 h（72%）** |
| **平均评审一次通过率** | 32% | 60% | **+ 28 pp** |
| **设计资产复用率** | 25% | 60% | **+ 35 pp** |
| **Skill 首次跑通率** | 30% | 75% | **+ 45 pp** |

## 验证锚点

- 行 1-4 由族 1 提示词模板（[scenarios/01-prd-requirement-design.md](scenarios/01-prd-requirement-design.md)）覆盖
- 行 5-8 由族 2 提示词模板（[scenarios/02-prototype-design-ui.md](scenarios/02-prototype-design-ui.md)）覆盖
- 行 9-10 由族 3 提示词模板（[scenarios/03-coze-skill-application.md](scenarios/03-coze-skill-application.md)）覆盖
- SOP 流程图（[tool-kit-03-sop-flowchart.md](tool-kit-03-sop-flowchart.md)）必须显式标注哪个节点对应哪一行
- 文档模板（[tool-kit-05-document-templates.md](tool-kit-05-document-templates.md)）的"PRD 模板"对应行 1，"用研访谈纲要"对应行 4

## Quality threshold

- 若 workshop 后 T+8 中期回顾显示某一行 cohort 集体未达到 After，**先降级 After 数字**（标注"实测值"），保留原目标作为下一波参考
- 若超过 3 行降级，整个 baseline 推倒重写（cohort 自报数据偏离过大，工具套件本身需要重构）
- 行 6 / 行 10（无时间节省 %，只看比率提升）若达到目标，**优先复盘**，因为这两条对应"复用 × 链式"是后续 W5-W8 的杠杆点

---

Maurice | maurice_wen@proton.me
