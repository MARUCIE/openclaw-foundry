# Tool Kit 02 · 提示词模板（PDCA × 3 场景族 矩阵）

> WORKSHOP_PLAN.md v7 tool kit 第 2 件 · T-3 days 空投 · 共 12 条 prompts
> [scenarios/](scenarios/) 下的 3 个文件是**深度版**（含示例 + Why this works）；本文件是**索引 + PDCA 矩阵 + 复制即用版**，方便 cohort 在工作现场快速查找。

## PDCA 矩阵

| PDCA 阶段 | 族 1 · PRD 流程 | 族 2 · 原型 UI | 族 3 · Coze Skill |
|-----------|----------------|----------------|-------------------|
| **P · Plan**（计划） | 1. 需求收集 → 清单 | 1. 资产盘点 | 1. Skill 候选识别 |
| **D · Do**（执行） | 2. 用户故事 → PRD<br/>3. 评审纪要<br/>4. Epic 拆分 | 2. 复用决策<br/>3. 低保真线框<br/>4. 流程图 | 2. Skill 三件套<br/>3. 链路设计 |
| **C · Check**（检查） | 5. 竞品分析 + 单点深挖 | 5. 走查 checklist 生成 | 4. 冒烟测试 |
| **A · Act**（改进） | — | 6. 走查执行 + 缺陷分级 | 5. 上线 / 度量 / 推广 |

共 12 条 prompts 覆盖 PM 日常工作 90%+ 高频场景。

---

### 提示词 P1 · 需求收集 → 结构化清单

**场景**：用户访谈录音、客诉工单、Slack 长讨论 → 提取需求项
**完整版**：[scenarios/01-prd-requirement-design.md](scenarios/01-prd-requirement-design.md) Prompt 1
**Why work**：JSON-as-output 强约束结构；evidence_quote 防臆造

```
你是产品经理。下面是一段未结构化的需求素材，请抽取为 JSON 数组：
[{"need_id","user_role","trigger_scene","current_pain","expected_outcome","frequency","evidence_quote"}]
要求：1) 只抽取显性或带原文证据的需求；2) 合并重复条目；3) 不臆造 user_role，缺失填 TBD
原文：{raw_input}
```

### 提示词 D1 · 用户故事 → PRD 章节

**场景**：拿到 1 个 user story → 生成 PRD 各章节草稿
**完整版**：[scenarios/01-prd-requirement-design.md](scenarios/01-prd-requirement-design.md) Prompt 2
**Why work**：模板驱动 + 反向指标条款防 Goodhart

```
你是高级产品经理，按公司 PRD 模板为以下 user story 生成草稿：{user_story}
SECTIONS：1) 背景与问题  2) 目标(SMART × 3)  3) 范围(In/Out-of-scope)  4) 用户故事+验收(Given-When-Then ≥3)  5) 核心流程(Mermaid)  6) 风险与依赖  7) 指标(主+反向)
末尾输出 ## 待确认(P0) 列表收集所有 ❓。不要生成代码或工程实现细节。
```

### 提示词 D2 · 评审纪要 → 行动项

**场景**：评审会 30-60 min 录音转文字 → 行动项 + 决议
**完整版**：[scenarios/01-prd-requirement-design.md](scenarios/01-prd-requirement-design.md) Prompt 3
**Why work**：3 张表分开决议/行动项/未决项，减少扯皮

```
你是会议秘书。下面是评审会转录（含时间戳）。输出 3 个 Markdown 表格：
1) 决议表(决议/决策人/时间戳/反对意见)  2) 行动项表(Action/Owner/Due/状态/验收标准)  3) 未决项表(议题/阻塞/下次评审)
规则：决议必须有明确拍板人；Action Owner 必须是真人名；验收标准必须 5 分钟内由非当事人判断。
原文：{transcript}
末尾输出 ≤80 字的纪要 TL;DR，注明 P0 风险若有。
```

### 提示词 D3 · Epic → Story → Task 拆分

**场景**：1 个 Epic ≥ 3 周工作量 → 5-12 个 Story → 每 Story 3-5 个 Task
**完整版**：[scenarios/01-prd-requirement-design.md](scenarios/01-prd-requirement-design.md) Prompt 4
**Why work**：硬性 DoD 可观察 + 垂直切片 + 估算上限三重约束防"假拆分"

```
将下面 Epic 拆为 Story → Task。EPIC：{epic_description}
拆分规则：1) Story ≤ 5 估算点；2) Task ≤ 1 天工作量；3) 垂直切片优先；4) Task 必须有可观察 DoD；5) 信息不足先列 ## 拆分前提与假设
输出 Epic Summary / Story List 表 / Task Breakdown 嵌套清单 / 估算总和 / 关键路径假设。
```

### 提示词 C1 · 竞品分析 · 多源数据 + 维度对比

**场景**：3-5 个竞品 × 5 个维度 → 结构化对比报告
**完整版**：[scenarios/01-prd-requirement-design.md](scenarios/01-prd-requirement-design.md) Prompt 5
**Why work**：分 3 步走避免幻觉对比表；强制 evidence URL

```
你是市场情报分析师。COMPETITORS：{competitors}  DIMENSIONS：{dimensions}
Step1：访问每个竞品官网/产品页/定价页/客户案例/changelog，每项必带 URL，无数据标 N/A 不臆造
Step2：对比矩阵表（每格证据 URL 必填）
Step3：洞察提炼 — 空白区/拥挤区/价格锚定/风险信号
语气：克制、不夸大、不站队。
```

### 提示词 D4 · 原型线框 (Stitch 输入版)

**场景**：拿到 1 个 user story → 生成 Stitch 可直接接收的"高保真 prompt"
**完整版**：[scenarios/02-prototype-design-ui.md](scenarios/02-prototype-design-ui.md) Prompt 1
**Why work**：Empty/Loading/Error 三态强制思考，避免线框只画 happy path

```
为以下 user story 生成低保真线框（≤5 屏）：{user_story}  PLATFORM：{platform}  BRAND：{brand_palette}
Step1：屏幕拆分（屏名动词起头/目标/进入退出条件/关键数据元素）
Step2：每屏组件树（Material/iOS 标准词汇 + 数据来源 + 状态变化）
Step3：每屏 1 段 Stitch Prompt（含 Layout/Visual style/Constraints）
不要描述视觉装饰，留给 Stitch 控制。
```

### 提示词 P2 · 设计资产盘点

**场景**：本组当前所有 colors/typography/spacing/components → 结构化清单
**完整版**：[scenarios/02-prototype-design-ui.md](scenarios/02-prototype-design-ui.md) Prompt 2
**Why work**：先盘点才能谈复用；"诊断而非裁判"防空泛批评

```
你是设计系统审计师。SCREENSHOTS：{screenshots_or_figma_links}
1) 颜色 Token 表(token/值/出现位置/语义/保留合并)
2) 字体 Token 表  3) 间距圆角 Token 表  4) 组件清单(实例数/变体数/一致性评分)
5) 跨项目复用候选 (≥3 + 抽象等级 + 工作量 + 收益)
6) 设计债清单（自相矛盾/Token 滥用/命名漂移）
语气：诊断而非裁判。
```

### 提示词 D5 · 设计资产复用决策

**场景**：1 个新需求 + 现有库 → 哪些复用 / 微调 / 新建
**完整版**：[scenarios/02-prototype-design-ui.md](scenarios/02-prototype-design-ui.md) Prompt 3
**Why work**：硬约束"业务语义不匹配才允许新建"阻止增量审美投机

```
NEW REQ：{new_requirement}  LIBRARY：{existing_library_inventory}
输出复用决策表（屏幕/组件 | 直接复用 | 微调复用 | 新建必要+理由）
规则：1) 优先级 复用>微调>新建；2) 微调必须明确改什么；3) 新建必须给"未来 3 个项目能否复用"预测
末尾 ≤100 字总结：净增 = 复用 N + 微调 M + 新建 K，其中 X 个 one-off。
```

### 提示词 D6 · 交互流程图 (Mermaid)

**场景**：1 个 user story → 主路径 + ≥3 异常分支 + fallback
**完整版**：[scenarios/02-prototype-design-ui.md](scenarios/02-prototype-design-ui.md) Prompt 4
**Why work**：异常分支硬性 ≥3 + 流程契约预期成功率

```
为以下 user story 生成 Mermaid flowchart：{user_story}  KNOWN EXCEPTIONS：{known_exceptions}
要求：1) 主路径 ≤7 步；2) 异常分支 ≥3（输入错误 + 服务端错误 + 业务规则拒绝）；3) 每异常必带 fallback；4) Mermaid 标准节点形状
末尾输出 ## 流程契约（主路径预期成功率/异常触发率/完成定义）。
```

### 提示词 C2 · 设计走查 Checklist

**场景**：1 个设计稿 → 10 项走查清单 + 可自动检查列
**完整版**：[scenarios/02-prototype-design-ui.md](scenarios/02-prototype-design-ui.md) Prompt 5
**Why work**："可自动检查"列是降低漏检率的杠杆

```
为以下设计稿生成 10 项走查 checklist：{design_link}  PLATFORM：{platform}  A11Y：{accessibility_target}
表格列：走查项 / 通过标准 / 可自动检查(Y/N) / 自动工具
10 项必须覆盖：一致性、可达性、状态完整、文案、信息层级、触控目标、跨平台、国际化、性能、异常分支 1:1 对应
末尾走查策略（优先自动 3 项 + 必须人工 3 项）。
```

### 提示词 P3 · Skill 候选识别

**场景**：cohort 进 workshop 前 → 自我审查"应做 Skill 的 3-5 项"
**完整版**：[scenarios/03-coze-skill-application.md](scenarios/03-coze-skill-application.md) Prompt 1
**Why work**：4 项强约束筛选 + "不要做"列防越界

```
RECENT TASKS：{your_recent_tasks}（≥10 项 + 耗时）
筛选标准（4 项全过才入选）：频率 ≥每周1次 / 变量 ≤5 / 输出有结构 / 痛点明确
输出候选表 + 推荐顺序（先做哪 1 个 + 后做哪 2 个 + 不要做哪 2 个+解释）
不要"全做"。
```

### 提示词 D7 · Skill 三件套生成

**场景**：1 个候选 Skill → frontmatter (name + description + Use when/Trigger/NOT for)
**完整版**：[scenarios/03-coze-skill-application.md](scenarios/03-coze-skill-application.md) Prompt 2
**Why work**：description 是模型层路由触发条件，不是给人看的功能介绍

```
为以下 Skill 生成 frontmatter：PURPOSE：{skill_purpose}  TRIGGERS：{trigger_keywords}  ANTI-PATTERNS：{anti_patterns}
输出 YAML frontmatter（name kebab-case ≤4 词 + description 含 Use when 2-3 场景 + Trigger 中英关键词 + NOT for ≥1）
末尾 ≤80 字解释为什么能精准触发又不误触发。
```

---

## 复制即用指南

1. **找你今天要做的事**：查 PDCA 矩阵，定位对应的 P/D/C/A 提示词
2. **复制 prompt 段**：包含 ` ```...``` ` 之间的内容
3. **填 Variables**：把 `{占位符}` 替换为你的真实输入
4. **粘贴到 Claude / Codex / Gemini**：等输出
5. **5 分钟人工校对**：基线已包含这部分预算
6. **失败回写**：[checklist-delivery.md](checklist-delivery.md) "工具反馈"段

## 用 Skill 替代复制粘贴（下一步）

当某个 prompt 你**每周用 ≥ 3 次**，把它转成自己的 Skill。流程：
1. 用 P3 (Skill 候选识别) 复核它确实值得 Skill 化
2. 用 D7 (Skill 三件套) 生成 frontmatter
3. 用 [scenarios/03-coze-skill-application.md](scenarios/03-coze-skill-application.md) Prompt 3 生成 SKILL.md 主体
4. 注册到你的项目 `.claude/skills/<name>/SKILL.md`
5. 验证可被自动路由（输入触发关键词后看 AI 是否调用）

---

Maurice | maurice_wen@proton.me
