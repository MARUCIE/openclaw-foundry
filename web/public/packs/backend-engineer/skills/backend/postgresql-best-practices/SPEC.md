---
name: postgresql-best-practices
description: "PostgreSQL query optimization, indexing, and schema design. Use when: slow queries, 'optimize SQL', PG performance, index strategy, database tuning. NOT for: schema migration execution (use new-migration)."
source: "https://github.com/affaan-m/everything-claude-code"
---

## 是什么

帮你把 PostgreSQL（关系型数据库）从能跑升级到能扛住生产流量，让慢查询、锁等待、连接数飙高这类典型生产事故在写代码与上线前就被发现，而不是被监控告警追着改。

## 怎么用

1. 把可疑慢查询交给本技能，用 `EXPLAIN ANALYZE` 看真实行数与估算行数的差距，判断是统计信息过期还是索引没命中。
2. 让本技能评估当前索引策略：高基数列是否走 B-Tree（平衡树索引）、布尔/枚举列是否适合部分索引、JSONB（二进制 JSON）字段是否需要 GIN（通用倒排索引）+ `jsonb_path_ops`。
3. 让本技能检查连接数与连接池：是否需要引入 PgBouncer（连接池中间件），并发上限是否与应用并发量匹配。
4. 让本技能扫一遍代码里的 SQL（结构化查询语言），把 `SELECT *`、`NOT IN`、生产环境同步加索引等高风险写法替换成安全写法（明列字段、`NOT EXISTS`、`CREATE INDEX CONCURRENTLY`）。
5. 修改完成后，再跑一次本技能用相同负载场景对比执行计划，确认收益不是错觉。

## 架构图

```mermaid
flowchart LR
  A[慢查询样本] --> B[EXPLAIN ANALYZE]
  B --> C[索引与连接评估]
  C --> D[SQL 改写建议]
  D --> E[灰度发布]
  E --> F[执行计划复测]
```

name: postgresql-best-practices

# PostgreSQL Best Practices

Optimize PostgreSQL queries, indexes, and schema for production workloads.

## Constraints
1. Always use EXPLAIN ANALYZE (not just EXPLAIN) to see actual vs estimated rows
2. Prefer partial indexes for queries with WHERE clauses on boolean/enum columns
3. Use connection pooling (PgBouncer) for apps with >50 concurrent connections
4. Never use SELECT * in production queries; always specify columns

## Gotchas
**1. NOT IN is O(n*m) — use NOT EXISTS or LEFT JOIN IS NULL.** NOT IN also returns no rows if the subquery contains a single NULL. NOT EXISTS handles NULLs correctly.
**2. Adding an index on a large table locks writes.** Use CREATE INDEX CONCURRENTLY to avoid blocking. It takes longer but doesn't lock.
**3. JSONB indexes need explicit operator class.** CREATE INDEX ON t USING GIN (data jsonb_path_ops) for @> queries. Without jsonb_path_ops, the index is 2-3x larger.

## Source

GitHub: https://github.com/affaan-m/everything-claude-code
