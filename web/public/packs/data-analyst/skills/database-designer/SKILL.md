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
