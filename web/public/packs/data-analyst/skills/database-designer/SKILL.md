---
name: database-designer
description: "Database schema design, migration planning, and RLS policies. Use when: schema design, 'design database', table relationships, row-level security. NOT for: query optimization (use postgresql-best-practices)."
source: "https://github.com/alirezarezvani/claude-skills"
---
name: database-designer

# Database Designer

Design database schemas with proper normalization, indexing strategy, and security.

## Constraints
1. Start with 3NF, denormalize only when query performance requires it
2. Every table needs: id (UUID), created_at, updated_at
3. Foreign keys must have ON DELETE behavior explicitly set
4. Use ENUM types for columns with < 20 fixed values
5. RLS: enable on all tenant-scoped tables, deny-by-default

## Source

GitHub: https://github.com/alirezarezvani/claude-skills

## 是什么

Database Designer 用来把 数据分析师 场景里的任务输入转成可执行的流程、检查清单和交付物。

Database schema design, migration planning, and RLS policies. Use when: schema design, 'design database', table relationships, row-level security. NOT for: query optimization (use postgresql-best-practices).

它的价值在于让 数据AI职能线 在 Claude Code、Codex、Gemini、Hermes 或 OpenClaw 中复用同一套岗位能力，而不是依赖一次性的聊天提示词。

## 怎么用

1. 明确当前任务目标、输入材料、约束和期望交付物，再加载 `database-designer`。
2. 按 skill 文档中的流程、检查清单或工具建议执行，优先复用仓库已有规范与真实命令。
3. 把关键判断、风险、验证命令和产出路径记录到当前任务文档或交付说明中。
4. 用最小可证明的检查确认结果有效；发现缺口时回到 skill 清单补齐。

## 架构图

```mermaid
flowchart LR
  A[任务输入] --> B[加载 Database Designer]
  B --> C[执行流程与检查清单]
  C --> D[生成交付物与风险记录]
  D --> E[验证结果并沉淀复盘]
```
