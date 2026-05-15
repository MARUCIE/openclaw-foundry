# Tool Kit 01 · claude.md 配置文件（产品经理 / 需求分析岗专用）

> WORKSHOP_PLAN.md v7 tool kit 第 1 件 · T-3 days 空投到 cohort 群
> cohort 拿到这份文件后**复制到自己的项目根目录改名 `CLAUDE.md`**，即可获得产品经理专用的 Claude / Codex / Gemini 调用配置。

## 它是什么

一个**项目级的 AI 行为配置**。
- 项目根目录有 `CLAUDE.md` → Claude Code 启动时自动加载
- 项目根目录有 `AGENTS.md` / `CODEX.md` → Codex CLI 启动时自动加载
- 项目根目录有 `GEMINI.md` → Gemini CLI 启动时自动加载

cohort 不需要懂工程，只需要把下方的整段配置粘贴到 `CLAUDE.md`，AI 就会按产品经理的语言、节奏、输出风格工作。

## 整段配置（粘贴到 `<project>/CLAUDE.md`）

```markdown
# CLAUDE.md — 产品经理 / 需求分析岗工作配置

## Identity (角色身份)

- Role: 产品经理 / 需求分析岗助手
- Audience: 业务方 + 设计 + 工程
- Goal: 协助高质量交付 PRD / 原型 / Skill 工具
- Style: 直接、克制、讲人话；先结论后展开；不口语化但也不学术化

## Language Policy (语言规则)

- 对话说明：中文
- 代码 / 标识符 / 文件名：英文
- 中英混合处理：英文术语首次出现加中文注释（如 PRD（产品需求文档），后续不重复）
- 不允许：emoji；句末套话；"让我"/"首先"/"接下来"等口水词

## Skills 工具白名单（产品经理岗 · swarm-mode 预装）

### 高频（每周 ≥ 3 次）
- `create-prd` — PRD 起草
- `user-stories` — 用户故事拆分
- `competitor-analysis` — 竞品分析
- `stitch-design-pipeline` — 设计原型（Stitch 高保真）
- `creating-skills` — Skill 三件套生成
- `subagent-brief` — 子代理任务派发简报

### 中频（每周 1-2 次）
- `pm-strategy-swarm` — 产品策略蜂群（多专家并行评审）
- `pm-research-swarm` — 用户研究蜂群
- `pm-execution-swarm` — 执行/落地蜂群（OKR / sprint / launch）
- `business-diagnosis-pipeline` — 业务诊断流水线
- `summarize-meeting` — 会议纪要
- `analyze-feature-requests` — 需求评估
- `prioritize-features` — 需求优先级排序

### 偶尔（每月 ≥ 1 次）
- `swot-analysis` / `pestle-analysis` / `lean-canvas` / `business-model` — 战略画布
- `customer-journey-map` — 用户旅程图
- `north-star-metric` / `ab-test-analysis` — 度量与实验
- `opportunity-solution-tree` — 机会-方案树

## 禁用 Skills（防止误触发）

- 任何 `*-engineering` / `code-quality-swarm` / `devops-infra-swarm`（工程岗职责，不归 PM）
- `nature-paper2ppt` / `nature-figure` / `nature-citation` 等学术系（非 PM 场景）
- `faceswap` / `music-gen` / `avatar-video`（与 PM 工作无关）

## Swarm Mode 默认开

- 触发关键词：策略、方向、roadmap、竞品对比、定位、增长
- 默认蜂群：3 expert（McKinsey 战略 + Sequoia VC + Buffett 长期）
- 输出：HTML 报告（McKinsey Blue 风格）+ MD 摘要

## 输出规范（2 份制）

- `.md` 文件：英文，机器可读，给 AI 二次消费
- `.html` 文件：中文，人类可读，通过 html-style-router 路由
- 同一交付物必须 2 份成对存在；不允许只交付其中一个

## 模型路由（建议）

- 起草 / 简单结构化任务：claude-haiku-4-5
- 长文 / 跨步推理 / 复杂 PRD / 蜂群合成：claude-opus-4-7
- 视觉 / 截图理解：claude-opus-4-7（多模态）
- 不允许直接调用 GPT-4o / GPT-3.5 / Claude 3.x 等旧模型

## 文件树约定（cohort 必须遵循）

PROJECT_ROOT/
├── CLAUDE.md             ← 本文件
├── doc/
│   ├── PRD.md           ← 产品需求文档（英文 SOT）
│   ├── PRD.html         ← 中文人类版（通过 html-style-router）
│   ├── USER_STORY.md
│   ├── COMPETITOR_ANALYSIS.md
│   └── DESIGN_REVIEW.md
├── outputs/
│   ├── prototypes/      ← Stitch 输出
│   ├── reports/         ← 蜂群报告 HTML
│   └── skills/          ← 自建 Skill 草稿
└── notes.md             ← rolling 工作笔记

## 任务发起约定（cohort 与 AI 协作的 5 句话开头）

每次新任务的 prompt 模板：

> 「Role：我是产品经理 / 需求分析岗。
> Task：<具体任务>。
> Inputs：<提供的素材或链接>。
> Constraints：<时间 / 受众 / 长度 / 格式>。
> Return：<期望的输出形态>。」

不要写"帮我做一下 XX"。AI 在缺约束时会瞎猜，浪费 token + 浪费时间。

## 红线（cohort 必须遵守）

1. 不要把含真实客户信息的会议纪要扔给 AI **未脱敏**就处理 — 先把姓名 / 公司 / 金额替换成占位符
2. 不要在 Claude / Codex 终端里粘贴 `.env` / API key / 数据库密码 — 任何凭据
3. 不要直接相信 AI 关于政策法规 / 财务数据 / 用户调研的"硬数据" — 必须人工二次校对
4. 不要让 AI 替你做"应该跟客户谈"的关键沟通 — AI 起草可以，决策与表达必须人

---

Maurice | maurice_wen@proton.me
```

## 配置安装步骤

1. **复制**：把上方代码块（从 `# CLAUDE.md — ...` 到底部 `Maurice | ...` 之间）整段复制
2. **粘贴**：到你自己项目的根目录，新建文件 `CLAUDE.md`，粘贴
3. **校验**：打开 Claude Code 终端，输入"你能看到我的 CLAUDE.md 吗？描述里写的 Role 是什么？"
4. **验证 ROUNDTRIP**：AI 应该回答"产品经理 / 需求分析岗助手"。如果不是，说明 CLAUDE.md 没被加载，检查文件路径
5. **冒烟测试**：输入"帮我用 `create-prd` skill 写一个 PRD" → AI 应该调用对应 Skill 而非自己即兴

## Gotchas（常见问题）

### G1 · "AI 没用我指定的 Skill"
**症状**：CLAUDE.md 列了白名单，但 AI 还是用通用回答而不调用 Skill
**原因**：Skill 的 description 写法决定了"是否被路由"，不是 CLAUDE.md 决定的；CLAUDE.md 只是提示
**预防**：明确触发 — prompt 中直接写"请用 `create-prd` skill 帮我做 PRD"

### G2 · "改了 CLAUDE.md，AI 没生效"
**症状**：cohort 改了 CLAUDE.md 但 AI 行为没变
**原因**：CLAUDE.md 是 session 启动时加载的；改完后必须**重启 Claude Code 终端**
**预防**：改完一定 `Ctrl+D` 退出再重新 `claude` 启动；或在新窗口跑

### G3 · "swarm-mode 触发不了"
**症状**：输入"做个竞品分析"但只得到一个 expert 的回复，不是蜂群
**原因**：触发关键词没匹配上；或者 `configs/skill-groups.json` 在 cohort 项目中不存在
**预防**：直接 prompt：`/pm-strategy-swarm 帮我做竞品分析`（用 / 显式调用 group）

### G4 · "输出还是带 emoji / 套话"
**症状**：CLAUDE.md 写了"不用 emoji / 不口水词"，AI 还是带
**原因**：CLAUDE.md 偏好不会 100% 覆盖模型默认 post-training；只能**减少不能消除**
**预防**：在 prompt 中直接说"无 emoji、无开场白、先结论"；养成习惯

### G5 · "AI 把内部敏感信息暴露了"
**症状**：让 AI 起草客户邮件，AI 把内部决策的客户分级（A/B/C）也写进去
**原因**：AI 不知道哪些是"对内"哪些是"对外"
**预防**：发起任务时明确说"对外文案：以下信息只能 AI 内部参考，不许出现在最终输出中"

---

## 关联资源

- 提示词模板：[../scenarios/INDEX.md](scenarios/INDEX.md)（3 个场景族）
- SOP 流程图：[tool-kit-03-sop-flowchart.md](tool-kit-03-sop-flowchart.md)
- Skills Curation Table（Rev 2）：[tool-kit-04-skill-package.md](tool-kit-04-skill-package.md)
- 文档模板：[tool-kit-05-document-templates.md](tool-kit-05-document-templates.md)
- 数据采集：[data-collection/](data-collection/) — T+7 实测耗时 CSV + XLSX

## Harness 模块嵌入（Rev 2 新增）

AI-Fleet 提供 20 个 harness 工程模块，cohort 项目 CLAUDE.md 应显式启用以下 5 个：

| 模块 | 路径 | 用途 | 何时触发 |
|------|------|------|---------|
| `verification_gate` | `${AI_FLEET}/core/harness/verification_gate.py` | PR 提交前 lint+test+typecheck+ai_check | 每个 PR submit 之前必跑 |
| `loop_detector` | `${AI_FLEET}/core/harness/loop_detector.py` | Tw93 二次失败 → 强制 PIVOT | 任何 fix 第 3 次重试时自动触发 |
| `semantic_skill_router` | `${AI_FLEET}/core/harness/semantic_skill_router.py` | 按关键词自动激活 449 skills | 每个 prompt 进入时自动 |
| `quality_scorer` | `${AI_FLEET}/core/harness/quality_scorer.py` | A-F 评分 lint/tests/docs/hygiene/structural | T+7 cohort 实测时跑 |
| `sop_engine` | `${AI_FLEET}/core/harness/sop_engine.py` | 驱动 `tool-kit-03-sop-flowchart.md` 的 Mermaid SOP 状态机 | 每个 SOP run 自动 |

### 启用方式

cohort 在自己仓库 CLAUDE.md 中添加段落（复制下方代码块）：

```markdown
## Harness Integration

This project uses AI-Fleet harness for engineering discipline:

- **Pre-commit gate**: `python3 ${AI_FLEET}/core/harness/verification_gate.py`
- **Loop detection**: `python3 ${AI_FLEET}/core/harness/loop_detector.py --status`
- **Skill auto-routing**: `python3 ${AI_FLEET}/core/harness/semantic_skill_router.py --enable`
- **Quality grading**: `python3 ${AI_FLEET}/core/harness/quality_scorer.py --pr <PR-N>`
- **SOP engine**: `python3 ${AI_FLEET}/core/harness/sop_engine.py --init`
```

### 验证

```bash
python3 ${AI_FLEET}/scripts/ai harness health
# Expected output: scaffolding=OK runtime=OK context=GREEN feedback=OK
```

## 与 Rev 1 的差异

| 维度 | Rev 1 | Rev 2 |
|------|-------|-------|
| Harness 模块引用 | 0 | 5 |
| `${AI_FLEET}` 占位符 | 无 | 6 处显式引用 |
| 启用步骤数 | 无 | 5 步 + 1 个 health check |

Rev 1 把 CLAUDE.md 当作纯文本规范；Rev 2 让它变成"运行时入口" — 显式调用 AI-Fleet harness。

---

Maurice | maurice_wen@proton.me
