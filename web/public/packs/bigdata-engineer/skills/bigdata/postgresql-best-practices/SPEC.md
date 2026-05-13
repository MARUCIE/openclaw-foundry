---
name: postgresql-best-practices
description: "PostgreSQL query optimization, indexing, and schema design. Use when: slow queries, 'optimize SQL', PG performance, index strategy, database tuning. NOT for: schema migration execution (use new-migration)."
source: "https://github.com/affaan-m/everything-claude-code"
---
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
