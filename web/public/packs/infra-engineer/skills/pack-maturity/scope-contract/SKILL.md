---
name: infra-engineer-scope-contract
description: Scope Contract Workflow
---

# Scope Contract Workflow

## What It Does

Turns an ambiguous request into a bounded role contract with outcomes, non-goals, inputs, outputs, risks, and validation.

## When To Use

- Use when operating the 基础架构工程师 pack.
- Use when a concrete artifact, evidence gate, or handoff is required.
- Do not use for generic chat responses.

## Procedure

1. Restate the user outcome in one sentence.
2. List role-owned scope and explicit non-goals.
3. Name required inputs and unavailable inputs.
4. Define the artifact and validation method.
5. Return a stop, go, iterate, or escalate decision.

## Output Contract

- Result first.
- Evidence second.
- Risk third.
- Next action last.

## 是什么

Scope Contract Workflow 用来把 基础架构工程师 场景里的任务输入转成可执行的流程、检查清单和交付物。

Scope Contract Workflow

它的价值在于让 研发职能线 在 Claude Code、Codex、Gemini、Hermes 或 OpenClaw 中复用同一套岗位能力，而不是依赖一次性的聊天提示词。

## 怎么用

1. 明确当前任务目标、输入材料、约束和期望交付物，再加载 `scope-contract`。
2. 按 skill 文档中的流程、检查清单或工具建议执行，优先复用仓库已有规范与真实命令。
3. 把关键判断、风险、验证命令和产出路径记录到当前任务文档或交付说明中。
4. 用最小可证明的检查确认结果有效；发现缺口时回到 skill 清单补齐。

## 架构图

```mermaid
flowchart LR
  A[任务输入] --> B[加载 Scope Contract Workflow]
  B --> C[执行流程与检查清单]
  C --> D[生成交付物与风险记录]
  D --> E[验证结果并沉淀复盘]
```
