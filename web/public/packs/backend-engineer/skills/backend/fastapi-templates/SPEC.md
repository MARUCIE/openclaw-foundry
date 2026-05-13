---
name: fastapi-templates
description: "Production-ready FastAPI project templates with async, dependency injection, and testing. Use when: starting FastAPI project, 'FastAPI best practices', async Python API. NOT for: Flask or Django projects."
source: "https://github.com/alirezarezvani/claude-skills"
---
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
