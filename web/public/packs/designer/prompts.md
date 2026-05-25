# Designer · Prompt Library

> 3 scenarios x 3 prompts = 9 prompts for design review, systemization, and handoff.
> Prototype generation belongs to `product-manager`; this pack starts after PM intent is scoped.

---

## S1 · PM Flow → Experience Architecture

### S1-P1 · PM Prototype Intake Review

```text
你是设计师，不是产品经理。读取以下 PRD / 原型 / 流程草图，只评审体验结构和交付风险：
1) PM validation question: 这个原型要验证什么？
2) Screen hierarchy: 每屏主行动、次行动、信息优先级是否清楚？
3) State coverage: empty / loading / error / disabled / selected / mobile 是否缺失？
4) Scope control: 哪些 screen/component 应该合并、删除或交给 PM 重新收敛？
5) Design handoff risk: 哪些地方会让前端工程实现时猜测？

输出：GO / RECONVENE_WITH_PM / DESIGN_SYSTEMIZE 三档决策 + Top 5 风险。

输入：<<<PASTE OR PATH>>>
```

### S1-P2 · Experience Map + Screen Hierarchy

```text
基于 PM 已收敛的产品意图，输出体验架构：
- User job: 一句话说明用户当前任务
- Screen map: entry / primary / secondary / exit
- Per-screen hierarchy: H1 / primary CTA / secondary action / supporting evidence
- State map: empty / loading / error / success / disabled / selected
- Remove list: 至少列 3 个应删除或降级的信息块

输入：<<<PASTE OR PATH>>>
```

### S1-P3 · Component-State Handoff

```text
把以下设计/原型转成工程 handoff 表：
- screen
- component
- state
- data shape (TypeScript-like)
- responsive constraint
- accessibility note
- open question for PM/FE

不要重写 PRD，不要新增产品假设。

输入：<<<PASTE OR PATH>>>
```

---

## S2 · Design System / Tokens

### S2-P1 · Token Set Definition

```text
为以下界面定义 design token set：
- colors: canvas / surface / elevated / text-primary / text-secondary / accent / success / warning / danger / border / focus
- typography: family / scale / weight rules
- spacing: 4px 基线的语义 spacing
- radius: component radius rules
- shadow: only if it clarifies layering
- state tokens: hover / active / disabled / selected / focus

输出 :root CSS variables + token usage table。

品牌/场景：<<<PASTE>>>
```

### S2-P2 · Token Drift Audit

```text
审计以下 HTML/CSS/截图描述里的 token drift：
1) 硬编码颜色、字号、间距、圆角、阴影
2) 组件状态不一致
3) 移动端 spacing 风险
4) 可访问性对比度风险

输出：drift inventory + replacement token + priority。

输入：<<<PASTE OR PATH>>>
```

### S2-P3 · Brand Swap Without Structure Drift

```text
把以下 token-driven design 从 <<<FROM_STYLE>>> 转为 <<<TO_STYLE>>>：
- 只改 token，不改信息架构
- 保留 PM 的验证路径
- 输出 token diff 表
- 预测哪些组件需要人工复核

输入：<<<PASTE OR PATH>>>
```

---

## S3 · Aesthetic Probe / Design QA

### S3-P1 · 7-Dimension Design Review

```text
对以下界面做 7 维设计评审（1-5 分）：
1) Hierarchy clarity
2) Spacing rhythm
3) Type discipline
4) Color discipline
5) Interaction affordance
6) State completeness
7) Responsive readiness

输出：分数表 + Top 3 修复 + Keep / Change / Remove 清单。

输入：<<<PASTE OR URL OR SCREENSHOT NOTES>>>
```

### S3-P2 · Fix Plan For Top 3 Design Debt

```text
基于以下设计评审报告，输出可执行修复计划：
- 每个 fix 必须说明 changed component / token / state / verification viewport
- 不新增产品功能
- 不把 PM 原型改成另一个产品假设

报告：<<<PASTE>>>
```

### S3-P3 · Design Simplicity + Product Experience Double Review

```text
用 Design Simplicity + Product Experience 两个 advisor 评审以下界面：
- Design Simplicity: unnecessary / essential / white space / simplicity verdict
- Jobs: focus-as-saying-no / one-sentence definition / selective perfectionism
- 如果两个视角冲突，输出 PM 决策问题，不替 PM 决策

输入：<<<PASTE OR URL>>>
```

---

Agent Foundry Team
