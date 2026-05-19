---
name: observability-setup
description: "Use when adding monitoring, logging, metrics, or alerting to a project. Trigger: 'add monitoring', 'set up Grafana', 'add health check', 'configure alerts', 'add logging', 'set up uptime monitoring', 'add metrics endpoint', 'observability'. NOT for: performance profiling (use perf-profile), infrastructure security scanning (use infra-patrol), or pipeline failure diagnosis (use pipeline-triage)."
allowed-tools: Bash, Read, Write, Edit, Grep, Glob
---

## 是什么

把"健康检查 + 指标 + 日志 + 告警"四件套一次性接进项目，把"线上有没有挂"从靠用户反馈，升级到自己 60 秒内主动发现。让产品同学在发布后不用反复刷网页验证，故障平均恢复时间（MTTR）从"等用户投诉"压到"机器人推送 + 仪表盘秒级回报"。

## 怎么用

1. 给每个服务加一个 `/health` 端点（endpoint），不需要鉴权，让监控工具能直接探活。
2. 接入结构化日志（structured logging），用 pino 或 structlog 输出 JSON，自动带上时间戳 + 等级 + requestId（请求标识），别再用 `console.log`。
3. 暴露 `/metrics` 端点采集 Prometheus（指标系统）数据，重点看 RED 三件套：请求量、错误率、响应耗时（p50/p95/p99）。
4. 把 `/health` 接到 Uptime Kuma（开源监控，AI-Fleet 标准）上，间隔 60 秒一探，连续失败 3 次推 Telegram 告警。
5. 告警只看现象不看原因（"错误率超过 5%"而不是"磁盘满了"），每条告警必须配运行手册（runbook）链接，避免告警疲劳。

## 架构图

```mermaid
flowchart LR
  Service[业务服务] --> Health[/health 端点]
  Service --> Metrics[/metrics 端点]
  Service --> Logs[结构化日志 JSON]
  Health --> Kuma[Uptime Kuma 探活]
  Metrics --> Grafana[Grafana 仪表盘]
  Kuma --> Alert[Telegram 告警]
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
