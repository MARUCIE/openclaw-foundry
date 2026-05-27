---
name: "cognitive-reflection"
description: "This skill upgrades reflection from \"append another note\" to a compact learning system:"
---
# cognitive-reflection

## Overview

This skill upgrades reflection from "append another note" to a compact learning system:

- `Knowledge Architecture`: observations -> connected hypotheses -> promoted rules
- `Decision Journal`: compact log of non-obvious decisions, reversals, and costly misses
- `Quality Gate`: evidence-first promotion criteria so mediocre output does not self-promote

The core idea is simple:

- memory without reflection becomes a growing correction log
- reflection without promotion stays local to one session
- promotion without quality gates turns noise into permanent rules

This skill is the missing meta-layer above the existing `reflection` checkpoint workflow.

## When To Use

- The user provides a note, decision, correction, or failure pattern that should survive across sessions
- A repeated mistake should become a durable rule rather than another diary entry
- You want to inject the three reflection blocks into `CLAUDE.md`
- You need to score whether a candidate rule is strong enough to promote
- You want a compact decision index inside `CLAUDE.md` instead of turning it into a long notebook

Use `reflection` instead when:

- you only need a milestone checkpoint in `notes.md` / `task_plan.md`
- you are recording progress, not evolving rules

## Core Pattern

1. Retrieve:
   - search existing rules, notes, postmortems, and memory before treating a note as "new"
2. Connect:
   - merge related observations into one candidate rule or decision, instead of storing fragments
3. Evaluate:
   - ask whether the candidate is evidence-backed, reusable, failure-specific, and worth the prompt budget
4. Promote:
   - only then write it into `CLAUDE.md` as a compact promoted rule + journal entry

## Commands

Install or refresh the managed block:

```bash
python3 scripts/cognitive_reflection.py install --json
ai skills run cognitive-reflection "install"
ai cognitive-reflection install
ai cognitive-reflection /path/to/project install
```

Default target behavior:

- no project directory: prefer `~/.claude/CLAUDE.md` when it exists
- with `project_dir`: default to `<project_dir>/CLAUDE.md`
- explicit `--target` always wins

Evaluate a candidate decision or lesson:

```bash
python3 scripts/cognitive_reflection.py evaluate \
  --project-root . \
  --target CLAUDE.md \
  --note "Pricing test lost users after free tier removal was ignored in onboarding assumptions." \
  --decision "Connect pricing, onboarding, and competitor packaging changes before shipping onboarding changes." \
  --rule "Treat pricing/package changes as onboarding inputs, not separate observations." \
  --failure-mode "isolated observations never turned into a product rule" \
  --json
```

Promote a rule after it passes the gate:

```bash
python3 scripts/cognitive_reflection.py promote \
  --target CLAUDE.md \
  --rule "Treat pricing/package changes as onboarding inputs, not separate observations." \
  --decision "Connect pricing, onboarding, and competitor packaging changes before shipping onboarding changes." \
  --failure-mode "isolated observations never turned into a product rule" \
  --evidence "Repeated observation across notes + user correction + verification pass" \
  --json
```

## What It Is Good At

- keeping `CLAUDE.md` compact while still making it evolve
- turning corrections into durable, reusable rules
- preventing "smart notebook" behavior where observations never connect
- creating a traceable promotion cycle instead of silent self-congratulation

## What It Is Not

- a replacement for raw notes, postmortems, or rolling ledgers
- a generic journaling system
- a guarantee that every observation deserves promotion
- a substitute for tests, metrics, or user correction

## Gotchas

- Do not dump raw observations straight into `CLAUDE.md`; only compact promoted rules and decision summaries belong there.
- A single anecdote is not a rule. If the candidate has weak evidence, keep it as an observation.
- If the same decision already exists in the journal, update or reuse it; do not rename duplicates as "new learning."
- Quality Gate is supposed to reject noise. A rejected promotion is a healthy outcome, not a failure.
- This skill complements `reflection`; it does not replace milestone checkpoints in `notes.md` and `task_plan.md`.

## Verification

```bash
python3 scripts/cognitive_reflection.py install --target /tmp/CLAUDE.md --json
python3 scripts/cognitive_reflection.py evaluate --project-root . --target CLAUDE.md --note "..." --decision "..." --rule "..." --json
python3 scripts/cognitive_reflection.py promote --target /tmp/CLAUDE.md --rule "..." --decision "..." --failure-mode "..." --json
python3 -m unittest tests.test_cognitive_reflection -v
```

## 是什么

cognitive-reflection 用来把 战略圆桌顾问 场景里的任务输入转成可执行的流程、检查清单和交付物。

This skill upgrades reflection from \"append another note\" to a compact learning system:

它的价值在于让 战略决策线 在 Claude Code、Codex、Gemini、Hermes 或 OpenClaw 中复用同一套岗位能力，而不是依赖一次性的聊天提示词。

## 怎么用

1. 明确当前任务目标、输入材料、约束和期望交付物，再加载 `cognitive-reflection`。
2. 按 skill 文档中的流程、检查清单或工具建议执行，优先复用仓库已有规范与真实命令。
3. 把关键判断、风险、验证命令和产出路径记录到当前任务文档或交付说明中。
4. 用最小可证明的检查确认结果有效；发现缺口时回到 skill 清单补齐。

## 架构图

```mermaid
flowchart LR
  A[任务输入] --> B[加载 cognitive-reflection]
  B --> C[执行流程与检查清单]
  C --> D[生成交付物与风险记录]
  D --> E[验证结果并沉淀复盘]
```
