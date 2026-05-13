---
name: new-api-endpoint
description: "Use when adding a new REST or GraphQL API endpoint to an existing backend. Trigger: 'add endpoint', 'new route', 'new API', 'create POST/GET/PUT/DELETE', 'add mutation/query'. NOT for: full API design from scratch (use architecture-decision), frontend data fetching (use react-best-practices), or API documentation only (use reverse-document)."
allowed-tools: Bash, Read, Write, Edit, Grep, Glob
---

# New API Endpoint

Scaffolding and validation workflow for adding API endpoints to existing backends.
Auto-detects the framework, follows project conventions, and ensures the endpoint
is complete (route + handler + validation + types + tests).

## When to Use

- Adding a CRUD endpoint to an existing API
- Exposing a new service capability via HTTP
- Adding a webhook receiver or callback endpoint
- Extending an existing resource with new actions

## Supported Frameworks (Auto-Detect)

| Framework | Detection | Route Pattern |
|-----------|-----------|--------------|
| Next.js App Router | `app/api/` directory | `app/api/[resource]/route.ts` |
| Next.js Pages | `pages/api/` directory | `pages/api/[resource].ts` |
| Express | `express()` in entry file | `router.get('/resource', handler)` |
| Hono | `new Hono()` in entry file | `app.get('/resource', handler)` |
| FastAPI | `@app.get` decorators | `@app.post('/resource')` |
| Flask | `@app.route` decorators | `@app.route('/resource', methods=['POST'])` |
| Go/Gin | `gin.Default()` | `r.POST("/resource", handler)` |
| Go/Chi | `chi.NewRouter()` | `r.Post("/resource", handler)` |
| Cloudflare Workers | `wrangler.toml` + `export default` | `router.post('/resource', handler)` |

## Workflow

### Phase 1: Discovery

1. Detect framework from project files
2. Find existing endpoints to understand conventions:
   - File naming pattern (singular vs plural, kebab vs camel)
   - Auth middleware usage (JWT, API key, session)
   - Validation approach (Zod, Joi, Pydantic, struct tags)
   - Response format (JSON envelope, error shape)
   - Test patterns (integration vs unit, test file location)

### Phase 2: Scaffold

Generate all files for the endpoint:

```
[resource]/
  route.ts          # Route handler (Next.js) or controller
  schema.ts         # Input/output validation schemas
  service.ts        # Business logic (if complex)
  [resource].test.ts # Tests
```

### Phase 3: Checklist

```
Endpoint Completeness:
- [ ] Route registered and reachable
- [ ] HTTP method correct (GET for read, POST for create, etc.)
- [ ] Input validation with proper error messages
- [ ] Auth/authz middleware applied (if required)
- [ ] Response type defined and consistent with other endpoints
- [ ] Error handling follows project pattern (status codes, error shape)
- [ ] Rate limiting considered (if public-facing)
- [ ] Test covers happy path + at least 1 error case
- [ ] TypeScript types exported for client consumption
```

## Conventions by HTTP Method

| Method | Purpose | Status Codes | Body |
|--------|---------|-------------|------|
| GET | Read resource(s) | 200, 404 | Response body |
| POST | Create resource | 201, 400, 409 | Created resource |
| PUT | Replace resource | 200, 404 | Updated resource |
| PATCH | Partial update | 200, 404 | Updated resource |
| DELETE | Remove resource | 204, 404 | Empty |

## Response Envelope (if project uses one)

```typescript
// Success
{ "data": T, "meta"?: { pagination } }

// Error
{ "error": { "code": string, "message": string, "details"?: any } }
```

Always match the existing project's envelope pattern — don't introduce a new one.

## Gotchas

1. **Match the existing error shape exactly.** Every project has a different error format (`{ error: string }` vs `{ code, message }` vs `{ errors: [] }`). Read 2-3 existing endpoints to identify the pattern. A mismatched error shape breaks frontend error handling silently — the client parses `error.message` but your endpoint returns `error.error`.

2. **Next.js App Router `route.ts` exports named functions, not default.** `export async function GET()` not `export default function handler()`. This is the #1 mistake when adding endpoints to App Router projects that also have Pages Router endpoints. Check which router the existing endpoints use before scaffolding.

3. **Don't forget CORS for cross-origin endpoints.** If the API is consumed by a different domain (common with Cloudflare Workers + separate frontend), you need OPTIONS handler + Access-Control headers. Check if the project has global CORS middleware; if not, add it to the new endpoint. Missing CORS fails silently in server logs but throws in the browser.

4. **Validation errors should return 400, not 500.** If Zod/Pydantic throws on invalid input and you don't catch it, the framework returns 500 (Internal Server Error). Always wrap validation in try/catch and return 400 with the validation error details. A 500 on bad input triggers false alerts in monitoring.

5. **Check if the route conflicts with existing routes.** Dynamic routes like `/api/users/[id]` and `/api/users/me` can conflict depending on the framework's route matching order. Express matches first-defined; Next.js uses specificity. Always test that both the new route AND existing routes still work after adding the new one.

## Anti-Patterns

- Never hardcode auth logic in the handler (use middleware)
- Never return raw database errors to the client (information disclosure)
- Never skip input validation even for internal-only endpoints
- Never create endpoints without at least one test
- Never use `any` types for request/response in TypeScript
