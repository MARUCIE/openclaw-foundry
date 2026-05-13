---
name: data-pipeline
description: "Design ETL/ELT data pipelines and warehouse architectures. Use when: data pipeline design, 'ETL workflow', data warehouse, batch/stream processing. NOT for: SQL queries (use sql-queries)."
source: "https://github.com/alirezarezvani/claude-skills"
---
name: data-pipeline

# Data Pipeline Designer

Design production data pipelines: batch ETL, streaming ELT, data warehouse patterns.

## Patterns
- **Batch ETL**: Extract (API/DB) -> Transform (Python/Spark) -> Load (warehouse)
- **Streaming**: Source -> Kafka/Kinesis -> Transform -> Sink
- **ELT**: Extract -> Load raw -> Transform in warehouse (dbt)

## Constraints
1. Always design for idempotency (re-running should not duplicate data)
2. Use incremental loads by default, full refresh only when schema changes
3. Log row counts at each stage for data quality monitoring
4. Schema evolution: additive changes only, never drop columns in production

## Source

GitHub: https://github.com/alirezarezvani/claude-skills
