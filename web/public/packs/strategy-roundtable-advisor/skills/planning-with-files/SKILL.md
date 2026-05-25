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
