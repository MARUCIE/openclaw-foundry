# Codex Adapter: Planning with Files

Target home for Codex-facing wrapper guidance around the shared `planning-with-files` workflow.

Current live load surface:

- `codex-skills/planning-with-files/`

## Current host mapping

- `plan` -> `task_plan.md`
- `evidence` -> `notes.md`
- `progress` -> inline progress updates inside `task_plan.md` or separate task artifacts when needed
- `deliverable` -> `deliverable.md`

## Current host-specific behavior

- Uses a lightweight Codex skill wrapper with no embedded hooks.
- Aligns more closely with AI-Fleet's project-level `task_plan.md` / `notes.md` / `deliverable.md` convention.

## Migration rule

Do not duplicate the shared workflow definition here.
Keep this adapter limited to Codex loading behavior and file-name translation.

## 是什么

Codex Adapter: Planning with Files 用来把 战略圆桌顾问 场景里的任务输入转成可执行的流程、检查清单和交付物。

Target home for Codex-facing wrapper guidance around the shared `planning-with-files` workflow. Current live load surface:

它的价值在于让 战略决策线 在 Claude Code、Codex、Gemini、Hermes 或 OpenClaw 中复用同一套岗位能力，而不是依赖一次性的聊天提示词。

## 怎么用

1. 明确当前任务目标、输入材料、约束和期望交付物，再加载 `planning-with-files`。
2. 按 skill 文档中的流程、检查清单或工具建议执行，优先复用仓库已有规范与真实命令。
3. 把关键判断、风险、验证命令和产出路径记录到当前任务文档或交付说明中。
4. 用最小可证明的检查确认结果有效；发现缺口时回到 skill 清单补齐。

## 架构图

```mermaid
flowchart LR
  A[任务输入] --> B[加载 Codex Adapter: Planning with Files]
  B --> C[执行流程与检查清单]
  C --> D[生成交付物与风险记录]
  D --> E[验证结果并沉淀复盘]
```
