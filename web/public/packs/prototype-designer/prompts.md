# Prototype Designer · Prompt Library

> 3 场景 × 3-4 prompts = 10 条立即可用 prompt
> 每条标注：输入形状 / 期望输出 / Worked example
> 假定已加载 `~/.claude/skills/design/*`

---

## 场景 S1 · PRD → Prototype（核心日常）

### S1-P1 · PRD 收敛 check

**输入**：PM 给的 PRD 文件 + screen count 期望
**输出**：收敛 check 报告（5 段）

```text
你是原型设计师。在做原型之前，先检查这份 PRD 是否准备好：
1) Screen budget: 期望 <<<N>>> 屏，PRD 实际暗示多少屏？>5 屏说明 scope 不收敛。
2) Cognitive budget: 每屏 ≤3 个核心交互？标出超过的屏。
3) Mock data 真实感: PRD 里给的数据是真名/真金额/真日期，还是 "user1" "100元" 这种占位？
4) Brand vibe: 有明确风格参考吗（claude-warm / stripe-minimal / linear-dark / custom）？没有就先问。
5) 决策：GO（可以做） / RECONVENE（回 PM 收敛） / RESEARCH（缺 SOTA 参考，需先调研）

PRD：<<<PASTE>>>
```

### S1-P2 · 3-5 屏 clickable HTML 原型

```text
基于以下 PRD + brand vibe "<<<VIBE>>>"，按 stitch-prototype skill 出 clickable HTML 原型：
- Screen count: <<<N>>>（≤5）
- 每屏 ≤3 核心交互
- 所有视觉走 token（不硬编码颜色/字号/间距）
- Mock data 真实感（真名 + 真金额 + 真日期）
- 屏间跳转用 anchor + scroll
- 末尾 footer 含 handoff spec 表 (screen × component × state × data shape)

PRD：<<<PASTE>>>
输出文件名：prototype-<<<SLUG>>>-<<<VIBE>>>.html
```

### S1-P3 · 原型 → handoff spec 提取

```text
读以下 HTML 原型文件，提取 handoff spec：
- 表格列：screen / component / states / data shape / notes
- 每个 component 至少列 1 个 state（default 或 loaded）
- 每个 data shape 用 TypeScript-like 类型表示，如 `{title: string, items: Array<{id, label}>}`
- 末尾加 "Open questions for PM"（≤5 条）

HTML：<<<PASTE OR PATH>>>
```

---

## 场景 S2 · Token system / Brand swap

### S2-P1 · 单页 token set CSS 生成

```text
基于 brand vibe "<<<VIBE>>>"（参考 html-style-router），生成完整 token set：
- Color: bg-canvas / bg-surface / bg-surface-elevated / text-primary / text-secondary / accent-primary / accent-success / accent-warning / accent-danger / border-subtle
- Type: font-family-sans / serif / mono + text-xs/sm/base/lg/xl
- Spacing: space-1/2/3/4/6/8/12
- Radius: radius-sm/md/lg
- Shadow: shadow-sm/md

输出 :root CSS variable 块 + 末尾的 cheatsheet 表（token name / value / 何时使用）。
```

### S2-P2 · 现有原型 token 重构

```text
读以下硬编码的 HTML 原型，把所有视觉硬编码替换为 token：
- 找出所有硬编码颜色（hex/rgb/tailwind 数字 class）→ 替换为 var(--color-*)
- 找出所有硬编码字号 → 替换为 var(--text-*)
- 找出所有硬编码间距 → 替换为 var(--space-*)
- 输出 token-driven 版本 + 重构 diff 报告（多少处硬编码改成了 token）

HTML：<<<PASTE>>>
Token set: <<<PASTE 或 SET_NAME>>>
```

### S2-P3 · Brand swap（保结构换风格）

```text
读以下 token-driven 原型，把它从 "<<<FROM_VIBE>>>" 换到 "<<<TO_VIBE>>>"：
- 只换 :root token 值，不改 HTML 结构
- 输出 1 份新 token CSS + 1 份对比表（哪些 token 变了 / 变了多少）
- 自审：换风格后 aesthetic 7 维评分预测

HTML：<<<PASTE>>>
Old token set: <<<SET_NAME>>>
New token set: <<<SET_NAME>>>
```

---

## 场景 S3 · Aesthetic probe / Refresh

### S3-P1 · Aesthetic probe 7 维自审

```text
对以下原型做 7 维 aesthetic probe（满分 5 分）：
1) Token adherence（硬编码占比 → 评分）
2) Hierarchy clarity（一眼分主次 → 评分）
3) White space（留白比例 ≥40% → 评分）
4) Type harmony（≤3 字号 ≤2 字重 → 评分）
5) Color discipline（≤2 accent → 评分）
6) Interaction affordance（可点击元素一眼可识别 → 评分）
7) Mobile responsive（320/768/1440 都过 → 评分）

输出：7 维评分 + 平均分 + Top 3 改进（按优先级） + 保留 vs 改清单。
7 维平均 ≥4 才允许交付；<4 就回 F3 loop。

HTML：<<<PASTE OR PATH>>>
```

### S3-P2 · Top 3 改进落地

```text
基于 probe 报告的 Top 3 改进，逐条修改 HTML：
- Fix 1: <Top 1 描述>，HTML 改动：<具体片段>
- Fix 2: ...
- Fix 3: ...
- Re-probe 预测：哪些维度评分会上升

输出：fix patch + re-probe 预测。

Probe 报告：<<<PASTE>>>
原始 HTML：<<<PASTE>>>
```

### S3-P3 · Mobile responsive 改造

```text
对以下 desktop-only 原型做 mobile responsive 改造：
- 测试断点：320px / 375px / 768px / 1024px / 1440px
- 改造原则：mobile-first，flexbox/grid 优先，禁用固定宽度
- 输出每个断点的截图描述 + 必要的 media query CSS 片段

HTML：<<<PASTE>>>
```

### S3-P4 · 季度 SOTA refresh（Hara+Jobs 双审）

```text
对以下 live 原型做季度 refresh：
1) 调用 advisor-hara: 输出 [HARA AUDIT] 含 Unnecessary / Essential / White Space / Verdict
2) 调用 advisor-jobs: 输出 Focus-as-Saying-No + One-Sentence Definition + Selective Perfectionism 评分
3) 如果两 advisor 评分差 ≥1，回 PM 拍板
4) 落地：要么 token swap（小改）要么 restructure（大改）
5) 出 1 张 before/after 对比表

原型：<<<PASTE OR URL>>>
SOTA refs: Mobbin / Linear / Stripe 的当下趋势
```

---

Maurice | maurice_wen@proton.me
