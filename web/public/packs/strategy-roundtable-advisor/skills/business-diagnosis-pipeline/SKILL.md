---
name: "business-diagnosis-pipeline"
description: "> PIPELINE (sequential execution, A->B->C) | 栋哥商业诊断工具箱: 商业模式诊断 + 对标分析 + 内容创作 + 执行力 + 概念拆解"
---
# Business Diagnosis (dontbesilent)

> PIPELINE (sequential execution, A->B->C) | 栋哥商业诊断工具箱: 商业模式诊断 + 对标分析 + 内容创作 + 执行力 + 概念拆解

## Skills (6 available)
- `dbs`
- `dbs-benchmark`
- `dbs-content`
- `dbs-deconstruct`
- `dbs-diagnosis`
- `dbs-unblock`

## How to Use
1. Match the user's task to the most relevant sub-skill above
2. Read the matching canonical skill file in this repo (for example `skills/shared/<skill-name>/SKILL.md`, `skills_infra/shared/<skill-name>/SKILL.md`, or `layers/L3-intelligence/skills/skills/<skill-name>/SKILL.md`) or the installed host mirror when working outside the repo
3. Follow the SPEC.md instructions
4. If multiple skills apply, combine their approaches

## 是什么

Business Diagnosis (dontbesilent) 用来把 战略圆桌顾问 场景里的任务输入转成可执行的流程、检查清单和交付物。

> PIPELINE (sequential execution, A->B->C) | 栋哥商业诊断工具箱: 商业模式诊断 + 对标分析 + 内容创作 + 执行力 + 概念拆解

它的价值在于让 战略决策线 在 Claude Code、Codex、Gemini、Hermes 或 OpenClaw 中复用同一套岗位能力，而不是依赖一次性的聊天提示词。

## 怎么用

1. 明确当前任务目标、输入材料、约束和期望交付物，再加载 `business-diagnosis-pipeline`。
2. 按 skill 文档中的流程、检查清单或工具建议执行，优先复用仓库已有规范与真实命令。
3. 把关键判断、风险、验证命令和产出路径记录到当前任务文档或交付说明中。
4. 用最小可证明的检查确认结果有效；发现缺口时回到 skill 清单补齐。

## 架构图

```mermaid
flowchart LR
  A[任务输入] --> B[加载 Business Diagnosis (dontbesilent)]
  B --> C[执行流程与检查清单]
  C --> D[生成交付物与风险记录]
  D --> E[验证结果并沉淀复盘]
```
