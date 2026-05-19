---
name: fastapi-templates
description: "Production-ready FastAPI project templates with async, dependency injection, and testing. Use when: starting FastAPI project, 'FastAPI best practices', async Python API. NOT for: Flask or Django projects."
source: "https://github.com/alirezarezvani/claude-skills"
---

## 是什么

帮你把一个 FastAPI（高性能异步 Python Web 框架）后端从零搭到能上线的状态，让接口默认就是异步、有依赖注入、有 Pydantic（数据校验库）校验、有测试夹具，不必再在每个新项目里重新踩同样的坑。

## 怎么用

1. 用本技能给出的目录骨架（`app/api/`、`app/core/`、`app/services/`、`tests/`）作为新仓库的起点，避免把业务、路由、配置写在同一个文件里。
2. 所有路由处理函数都按 `async def` 声明，让请求在等待数据库或外部接口时不阻塞事件循环。
3. 把数据库会话、当前用户、共享配置都通过 `Depends()` 注入，让单元测试可以替换为夹具而无需改业务代码。
4. 请求体与返回体强制走 Pydantic 模型，不允许接收或返回裸字典，让接口契约始终有据可查。
5. 上线前用 `tests/conftest.py` 提供的 async client（异步客户端）夹具跑一遍端到端测试，确认中间件、鉴权、错误处理都按预期工作。

## 架构图

```mermaid
flowchart LR
  A[请求] --> B[中间件 鉴权 日志]
  B --> C[路由处理函数 async]
  C --> D[Depends 注入]
  D --> E[Service 业务逻辑]
  E --> F[响应 Pydantic 模型]
```

name: fastapi-templates

# FastAPI Templates

Production FastAPI setup: async, DI, middleware, testing, deployment.

## Project Structure
```
app/
  api/v1/endpoints/    # Route handlers
  core/config.py       # Settings via pydantic-settings
  models/              # SQLAlchemy/Pydantic models
  services/            # Business logic
  middleware/          # Auth, CORS, logging
tests/
  conftest.py          # Fixtures (async client, test DB)
```

## Constraints
1. Always use async def for route handlers (sync blocks the event loop)
2. Use Depends() for database sessions, auth, and shared logic
3. Pydantic models for request/response validation (never raw dicts)
4. Background tasks via BackgroundTasks, not asyncio.create_task()

## Source

GitHub: https://github.com/alirezarezvani/claude-skills
