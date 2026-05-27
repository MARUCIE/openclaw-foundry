---
name: investment-analyst-delivery-review
description: Delivery Review Workflow
---

# Delivery Review Workflow

## What It Does

Combines role output, risk review, validation evidence, and next action into a final operator-ready handoff.

## When To Use

- Use when operating the 投资分析师 pack.
- Use when a concrete artifact, evidence gate, or handoff is required.
- Do not use for generic chat responses.

## Procedure

1. Lead with the recommendation or completed artifact.
2. Attach evidence and known assumptions.
3. Run delivery-risk review for the role.
4. Resolve or hand off blockers.
5. End with one executable next action.

## Output Contract

- Result first.
- Evidence second.
- Risk third.
- Next action last.

## 是什么

Delivery Review Workflow 用来把 投资分析师 场景里的任务输入转成可执行的流程、检查清单和交付物。

Delivery Review Workflow

它的价值在于让 业务职能线 在 Claude Code、Codex、Gemini、Hermes 或 OpenClaw 中复用同一套岗位能力，而不是依赖一次性的聊天提示词。

## 怎么用

1. 明确当前任务目标、输入材料、约束和期望交付物，再加载 `delivery-review`。
2. 按 skill 文档中的流程、检查清单或工具建议执行，优先复用仓库已有规范与真实命令。
3. 把关键判断、风险、验证命令和产出路径记录到当前任务文档或交付说明中。
4. 用最小可证明的检查确认结果有效；发现缺口时回到 skill 清单补齐。

## 架构图

```mermaid
flowchart LR
  A[任务输入] --> B[加载 Delivery Review Workflow]
  B --> C[执行流程与检查清单]
  C --> D[生成交付物与风险记录]
  D --> E[验证结果并沉淀复盘]
```
