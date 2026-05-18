# Tool-Kit 03 · SOP Flowchart · Prototype Designer

> 3 张 mermaid 流程图覆盖原型设计最高频工作流。

## SOP-A · PRD → Clickable HTML Prototype（30 分钟内）

```mermaid
flowchart TD
    A[收到 PRD / 用户故事] --> B{≤2 页 markdown?}
    B -->|否| C[Reframe: 让 PM 浓缩到 1-2 页]
    B -->|是| D{Pick brand vibe}
    C --> D
    D --> E[Pick visual base<br/>via html-style-router]
    E --> F[Sketch screens<br/>文字描述每屏 layout]
    F --> G{Screen count ≤5?}
    G -->|>5| H[Scope creep alert<br/>回头跟 PM 对齐]
    G -->|≤5| I[Generate HTML<br/>tailwind + tokens + vanilla JS]
    I --> J[Wire 屏间 jumps]
    J --> K[Add mock data<br/>真实感姓名 / 数字]
    K --> L{Aesthetic probe self-review}
    L -->|<4 分| M[Top 3 fix]
    L -->|≥4 分| N[Handoff spec 表]
    M --> L
    N --> O[交付 PM + Eng]
```

**关键控制点**：
- 节点 B：PRD ≤2 页是硬约束，超过说明需求未收敛，先回头
- 节点 G：>5 屏是 scope creep 信号，必须对齐
- 节点 L：aesthetic probe <4 分不交付（除非 PM 紧急确认）

**失效信号**：
1. PRD >3 页 → 需求没收敛，做原型是错的
2. >5 屏 → scope creep
3. Mock data 无真实感 → PM 不信
4. Token 硬编码 >20% → 后续改主题工作量大

## SOP-B · 原型 → 工程交付（handoff）

```mermaid
flowchart LR
    A[Prototype HTML] --> B{Handoff spec 完整?}
    B -->|否| C[补 component / state / data shape 表]
    B -->|是| D[Eng kickoff meeting]
    C --> D
    D --> E{Component breakdown<br/>谁切谁组装}
    E --> F[Design 切图 / token 导出]
    E --> G[Eng 写组件骨架]
    F --> H{Visual QA round}
    G --> H
    H -->|不通过| I[Top 3 fix list 回 Eng]
    H -->|通过| J[Deploy preview]
    I --> H
    J --> K{PM acceptance}
    K -->|不通过| L[改 prototype OR 改 eng impl]
    K -->|通过| M[Ship]
    L --> H
```

**关键控制点**：
- 节点 B：handoff spec 表必须 (screen / component / state / data shape) 4 列齐
- 节点 H：visual QA 要原型 + 实现 side-by-side 对比，不能只看实现
- 节点 K：PM 不通过时优先改 prototype（如果原型本身就错了）

**失效信号**：
1. Handoff spec 缺 data shape → eng 用 mock data 上线
2. Visual QA 跳过 → 上线后 PM 才发现"不像设计"
3. PM 不通过后只改 eng 不动 prototype → 下次复用还是错

## SOP-C · 原型 → SOTA design refresh（季度）

```mermaid
flowchart TD
    A[季度启动<br/>列出所有 live 原型] --> B{Aesthetic 评分 ≥4?}
    B -->|否| C[加入 refresh 队列]
    B -->|是| D[归档保留]
    C --> E{Pick 1 refresh per sprint}
    E --> F[Reference SOTA picks<br/>Mobbin / Linear / Stripe / 当下趋势]
    F --> G[Token swap<br/>不动结构只换色彩/字体/间距]
    G --> H{Hara 审 + Jobs 审}
    H -->|RESTRUCTURE| I[结构也改]
    H -->|PRUNE| J[删冗余元素]
    H -->|CLEAN| K[Ship refresh]
    I --> H
    J --> H
```

**关键控制点**：
- 节点 B：评分 <4 分的原型才进 refresh 队列（防止低 ROI 折腾）
- 节点 G：先试 token swap（最小改动）；不行再动结构（高成本）
- 节点 H：双 advisor 审，防止"我觉得好看了"的自评通胀

**失效信号**：
1. Refresh 队列 >5 → 季度产能不够，需要砍 scope
2. Token swap 后评分没上 0.5 → 改 token 没解决根本问题，要动结构
3. Hara/Jobs 评分差 ≥1 → 两个 advisor 不一致，需要回 PM 拍板

---

Maurice | maurice_wen@proton.me
