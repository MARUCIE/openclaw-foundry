---
name: database-designer
description: "Database schema design, migration planning, and RLS policies. Use when: schema design, 'design database', table relationships, row-level security. NOT for: query optimization (use postgresql-best-practices)."
source: "https://github.com/alirezarezvani/claude-skills"
---

## 是什么

帮你把"业务流程"翻译成一张张数据表和它们之间的关系，让产品上线一年后再加功能，也不会因为最初表设计错了就要重写。同时把租户隔离（同一套系统不同客户看自己的数据）、字段规范、删除策略这些容易踩坑的事一次性定清楚。

## 怎么用

1. 先把核心业务实体列出来（用户、订单、商品……），每一个对应一张表，关系用主外键（一张表的字段指向另一张表的 ID，建立连接）连接。
2. 每张表强制带 id（UUID，全局唯一标识符，避免自增 ID 冲突）、created_at、updated_at 三列，后期审计、回滚、增量同步全靠它们。
3. 列举的有限值（订单状态、用户角色）用 ENUM（枚举类型，约束只能取固定几个值），少于 20 项时优先 ENUM 而不是另开一张表。
4. 多租户业务必开 RLS（行级安全策略，让数据库自己控制"用户 A 只能查自己的数据"），默认拒绝再加白名单。
5. 外键关系必须明确写 ON DELETE 行为（删主表时子表怎么办：级联删 / 置空 / 拒绝），别留默认值，否则线上误删一发不可收拾。

## 架构图

```mermaid
flowchart LR
    A[业务流程] --> B[实体抽取]
    B --> C[3NF 范式表]
    C --> D[加 id/时间戳]
    D --> E[ENUM 受限字段]
    E --> F[RLS 租户隔离]
    F --> G[ON DELETE 策略]
```

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
