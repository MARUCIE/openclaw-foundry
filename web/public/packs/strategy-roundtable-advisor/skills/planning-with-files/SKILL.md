---
name: "planning-with-files"
description: "用本地三份文件作为“外置工作记忆”，避免长任务在对话变长后发生目标漂移："
---
# Planning with Files（Codex Skill）

## 目的

用本地三份文件作为“外置工作记忆”，避免长任务在对话变长后发生目标漂移：

- `task_plan.md`: objective, stages, progress, decisions (append-only recommended)
- `notes.md`: research findings and evidence (append-only recommended)
- `deliverable.md`: the final human-facing output

## 何时使用

- 任务多步骤、周期长，或非常容易丢上下文/跑偏。
- 你需要可审计轨迹：决策与证据必须落盘到文件，而不是只存在于对话。

## 必须遵循的工作流（循环）

1. 确保三份文件存在（不得覆盖已有内容；建议追加式写入）。
2. 做关键决策前：重读 `task_plan.md`，刷新目标与当前阶段。
3. 把研究发现与证据写入 `notes.md`（建议包含时间戳与来源）。
4. 回写 `task_plan.md`（进度、决策、风险、下一步）。
5. 仅在读完 `task_plan.md` 与 `notes.md` 后，再编写 `deliverable.md`（面向人类的最终交付）。

## 推荐初始化方式（环境已安装 AI-Fleet）

如果环境已安装 AI-Fleet，优先使用现有生成器初始化三文件：

```bash
ai skills run planning-with-files "Your goal"
```

如需把三文件放到指定目录：

```bash
ai skills run planning-with-files "Your goal" --output ./state/sessions/pwf/
```

## 备用初始化方式（无 AI-Fleet）

如果环境没有 AI-Fleet，则手动创建这三份文件并写入最小结构，然后按上面的循环执行。不要凭空“编造进度/证据”；模板保持最小化并尽量追加式写入。

## 是什么

Planning with Files（Codex Skill） 用来把 战略圆桌顾问 场景里的任务输入转成可执行的流程、检查清单和交付物。

用本地三份文件作为“外置工作记忆”，避免长任务在对话变长后发生目标漂移：

它的价值在于让 战略决策线 在 Claude Code、Codex、Gemini、Hermes 或 OpenClaw 中复用同一套岗位能力，而不是依赖一次性的聊天提示词。

## 怎么用

1. 明确当前任务目标、输入材料、约束和期望交付物，再加载 `planning-with-files`。
2. 按 skill 文档中的流程、检查清单或工具建议执行，优先复用仓库已有规范与真实命令。
3. 把关键判断、风险、验证命令和产出路径记录到当前任务文档或交付说明中。
4. 用最小可证明的检查确认结果有效；发现缺口时回到 skill 清单补齐。

## 架构图

```mermaid
flowchart LR
  A[任务输入] --> B[加载 Planning with Files（Codex Skill）]
  B --> C[执行流程与检查清单]
  C --> D[生成交付物与风险记录]
  D --> E[验证结果并沉淀复盘]
```
