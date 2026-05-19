---
name: observability-setup
description: "Use when adding monitoring, logging, metrics, or alerting to a project. Trigger: 'add monitoring', 'set up Grafana', 'add health check', 'configure alerts', 'add logging', 'set up uptime monitoring', 'add metrics endpoint', 'observability'. NOT for: performance profiling (use perf-profile), infrastructure security scanning (use infra-patrol), or pipeline failure diagnosis (use pipeline-triage)."
allowed-tools: Bash, Read, Write, Edit, Grep, Glob
---

## 是什么

把项目的可观测性（Observability）三件套——健康端点、指标、日志——一次铺到位，并把告警接到值班通道，让线上从“出事才知道”变成“出事自动叫人”，把 MTTR（Mean Time To Recovery，平均恢复时间）从小时级压到分钟级。

## 怎么用

1. 先给服务加一个 `/health` 端点返回上下游依赖的真实状态，而不是只回 200。
2. 用 Prometheus（指标采集）或等价方案暴露关键业务指标，让仪表盘能从“服务有没有跑”升到“跑得好不好”。
3. 把结构化日志（JSON 行）写到标准输出，让日志采集器（Loki、Elasticsearch 等）能按字段检索而不是 grep 全文。
4. 用 Uptime Kuma 或 Grafana 配置告警规则，按严重程度分级到 IM、邮件、电话三档。
5. 上线后做一次故障演练（混沌测试），验证告警真的会触发，不要等真实事故才发现告警是哑的。

## 架构图

```mermaid
flowchart LR
  应用服务 --> 健康端点
  应用服务 --> 指标采集
  应用服务 --> 结构化日志
  指标采集 --> 仪表盘与告警
  结构化日志 --> 日志检索系统
  仪表盘与告警 --> 值班通道
```

# Observability Setup

Configure monitoring, logging, metrics collection, and alerting for a project.
Covers the full observability stack from health endpoints to dashboard setup.

## When to Use

- New project needs a `/health` endpoint
- Setting up Uptime Kuma, Grafana, or similar monitoring
- Adding structured logging to an application
- Configuring alerting (PagerDuty, Telegram, Discord)
- Adding Prometheus metrics or OpenTelemetry instrumentation

## Three Pillars

### 1. Metrics (Numbers over time)

```
What to measure:
- Request rate (req/s)
- Error rate (5xx/total)
- Latency (p50, p95, p99)
- Saturation (CPU, memory, disk, connections)

RED method (request-driven): Rate, Errors, Duration
USE method (resource-driven): Utilization, Saturation, Errors
```

#### Health Endpoint Pattern

Every service needs a `/health` or `/api/health` endpoint:

```typescript
// Minimal health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() })
})

// Deep health check (checks dependencies)
app.get('/health/deep', async (req, res) => {
  const checks = {
    database: await checkDB(),
    redis: await checkRedis(),
    external_api: await checkExternalAPI(),
  }
  const allHealthy = Object.values(checks).every(c => c.status === 'ok')
  res.status(allHealthy ? 200 : 503).json({
    status: allHealthy ? 'ok' : 'degraded',
    checks,
    timestamp: new Date().toISOString(),
    version: process.env.VERSION || 'unknown',
  })
})
```

#### Prometheus Metrics (Node.js)

```typescript
import { collectDefaultMetrics, register, Counter, Histogram } from 'prom-client'

collectDefaultMetrics()

const httpRequestDuration = new Histogram({
  name: 'http_request_duration_seconds',
  help: 'Duration of HTTP requests in seconds',
  labelNames: ['method', 'route', 'status'],
  buckets: [0.01, 0.05, 0.1, 0.5, 1, 5],
})

// Middleware
app.use((req, res, next) => {
  const end = httpRequestDuration.startTimer()
  res.on('finish', () => {
    end({ method: req.method, route: req.route?.path || 'unknown', status: res.statusCode })
  })
  next()
})

// Metrics endpoint
app.get('/metrics', async (req, res) => {
  res.set('Content-Type', register.contentType)
  res.end(await register.metrics())
})
```

### 2. Logging (Events with context)

```
Structured logging rules:
- JSON format in production, pretty in development
- Include: timestamp, level, message, requestId, userId
- Levels: debug < info < warn < error
- Never log secrets, tokens, passwords, or PII
- Log at boundaries: incoming request, outgoing call, error catch
```

#### Structured Logger Setup

```typescript
// pino (Node.js) — fastest structured logger
import pino from 'pino'

const logger = pino({
  level: process.env.LOG_LEVEL || 'info',
  transport: process.env.NODE_ENV === 'development'
    ? { target: 'pino-pretty' }
    : undefined,
})

// Per-request child logger with requestId
app.use((req, res, next) => {
  req.log = logger.child({ requestId: req.headers['x-request-id'] || crypto.randomUUID() })
  next()
})
```

```python
# Python — structlog
import structlog

structlog.configure(
    processors=[
        structlog.processors.TimeStamper(fmt="iso"),
        structlog.processors.JSONRenderer(),
    ]
)
logger = structlog.get_logger()
```

### 3. Alerting (Action triggers)

```
Alert design rules:
- Alert on symptoms (high error rate), not causes (disk full)
- Every alert must have a runbook link
- Use severity levels: critical (page) / warning (ticket) / info (log)
- Avoid alert fatigue: start strict, loosen if needed
```

#### Uptime Kuma Setup (AI-Fleet standard)

```bash
# AI-Fleet uses Uptime Kuma at http://100.106.223.39:3001 (Tailscale)
# Add a new monitor via API or UI:
# Type: HTTP(s)
# URL: https://your-app.com/health
# Interval: 60s
# Retry: 3
# Notification: Telegram bot
```

#### Telegram Alert Pattern

```typescript
async function sendAlert(message: string) {
  const botToken = process.env.TELEGRAM_BOT_TOKEN
  const chatId = process.env.TELEGRAM_ALERT_CHAT_ID
  await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ chat_id: chatId, text: message, parse_mode: 'Markdown' }),
  })
}
```

## Quick Start by Stack

### Next.js + Vercel
```
1. Add /api/health route
2. Enable Vercel Analytics (vercel.json: { "analytics": true })
3. Add Vercel Speed Insights (<SpeedInsights />)
4. Configure Uptime Kuma for /api/health
```

### Cloudflare Workers
```
1. Add /health route in worker
2. Use Workers Analytics Engine (built-in)
3. Configure Uptime Kuma for /health
4. Use wrangler tail for real-time logs
```

### Python FastAPI
```
1. Add /health endpoint
2. Add prometheus-fastapi-instrumentator
3. Configure structlog
4. Mount /metrics endpoint
```

## Gotchas

1. **Health endpoints must not require auth.** Monitoring tools (Uptime Kuma, Grafana, load balancers) call `/health` without tokens. If your health endpoint sits behind auth middleware, monitoring will always report "down" (401). Exclude `/health` from auth middleware explicitly.

2. **Deep health checks can cause cascading failures.** If `/health/deep` checks the database and the DB is slow, the health check times out, the load balancer marks the service as unhealthy, and routes traffic away — making the DB even more overloaded. Set a short timeout (2s) on deep checks and return "degraded" instead of hanging.

3. **Prometheus metric cardinality explosion kills performance.** Using request path as a label (`/users/123`, `/users/456`) creates infinite time series. Always use route patterns (`/users/:id`), never actual paths. Same for user IDs, session IDs, or any high-cardinality value.

4. **`console.log` in production is not logging.** It's unstructured, unsearchable, and loses context. Always use a structured logger (pino, winston, structlog) that outputs JSON with timestamp + level + requestId. The cost of switching later is high because you have to retrofit every log call.

5. **Don't alert on every 5xx — alert on error rate.** A single 500 error is noise. Alert when error rate exceeds a threshold (e.g., >5% of requests in a 5-minute window). This prevents alert fatigue while still catching real incidents. Use Uptime Kuma's "keyword" monitor type to check for `"status":"ok"` in health response rather than just HTTP 200.

## Anti-Patterns

- Never log request/response bodies in production (PII risk + storage cost)
- Never use `console.log` as your production logging strategy
- Never create alerts without a documented response procedure
- Never expose `/metrics` publicly without authentication
- Never check health by hitting a resource-intensive endpoint (use a dedicated lightweight check)
