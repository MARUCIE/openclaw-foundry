import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { providers } from './routes/providers';
import { skills } from './routes/skills';
import { stats } from './routes/stats';
import { feedback } from './routes/feedback';
import { events } from './routes/events';
import { collections } from './routes/collections';
import { tenants } from './routes/tenants';
import { arena } from './routes/arena';
import { packs } from './routes/packs';
import { deploy } from './routes/deploy';
import { wall } from './routes/wall';
import { auth } from './routes/auth';
import { wechatAuth } from './routes/auth-wechat';
import { authMiddleware } from './middleware/auth';

export interface Env {
  DB: D1Database;
  STORAGE: R2Bucket;
  CACHE: KVNamespace;
  ENVIRONMENT: string;
  // Auth-related env (v8): set via `wrangler secret put` post-merge
  WALL_PEPPER?: string;
  RESEND_API_KEY?: string;
  MAGIC_LINK_BASE_URL?: string;
  RESEND_FROM?: string;
  // Enterprise WeChat (企业微信) self-built app OAuth — set via `wrangler secret put`
  WECHAT_CORP_ID?: string;
  WECHAT_AGENT_ID?: string;
  WECHAT_SECRET?: string;
  PAGES_BASE_URL?: string;
}

const app = new Hono<{ Bindings: Env }>();

// CORS — allow GET + POST for feedback/tenants/arena
app.use('*', cors({
  origin: (origin) => {
    if (!origin) return undefined;
    const allowed = [
      'https://agent-foundry.pages.dev',
      'http://localhost:3200',
      'http://localhost:3000',
    ];
    return allowed.includes(origin) ? origin : undefined;
  },
  allowMethods: ['GET', 'POST', 'OPTIONS'],
  allowHeaders: ['Content-Type', 'Authorization'],
  credentials: false,
}));

// Global error handler
app.onError((err, c) => {
  console.error('Unhandled error:', err.message);
  return c.json({ error: 'Internal Server Error' }, 500);
});

// Health — surface-level (cheap, used by uptime probes)
app.get('/api/health', (c) => {
  return c.json({ status: 'ok', version: '5.0.0-arsenal', runtime: 'cloudflare-workers' });
});

// Deep health — exercises D1 + KV + last-cron-heartbeat
// Returns degraded JSON (not 500) so external monitors can see WHICH component failed
app.get('/api/health/deep', async (c) => {
  const checks: Record<string, { ok: boolean; latency_ms?: number; detail?: string }> = {};
  let allOk = true;

  // D1 probe
  const t0 = Date.now();
  try {
    await c.env.DB.prepare('SELECT 1 as x').first();
    checks.d1 = { ok: true, latency_ms: Date.now() - t0 };
  } catch (err: any) {
    checks.d1 = { ok: false, latency_ms: Date.now() - t0, detail: String(err?.message || err).slice(0, 200) };
    allOk = false;
  }

  // KV probe (write-read round trip with unique key)
  const t1 = Date.now();
  try {
    const key = `healthcheck:${Date.now()}`;
    await c.env.CACHE.put(key, 'ok', { expirationTtl: 60 });
    const v = await c.env.CACHE.get(key);
    checks.kv = { ok: v === 'ok', latency_ms: Date.now() - t1 };
    if (v !== 'ok') allOk = false;
  } catch (err: any) {
    checks.kv = { ok: false, latency_ms: Date.now() - t1, detail: String(err?.message || err).slice(0, 200) };
    allOk = false;
  }

  // Last cron run heartbeat (from KV)
  try {
    const last = await c.env.CACHE.get('cron:last_run', 'json') as { ts?: string; status?: string; rows?: number } | null;
    if (last && last.ts) {
      const ageMs = Date.now() - new Date(last.ts).getTime();
      const ageHours = ageMs / 3_600_000;
      checks.cron = {
        ok: ageHours < 25 && last.status === 'success',
        latency_ms: 0,
        detail: `last_run=${last.ts} age_h=${ageHours.toFixed(1)} status=${last.status} rows=${last.rows ?? 0}`
      };
      if (!checks.cron.ok) allOk = false;
    } else {
      checks.cron = { ok: false, detail: 'never-run-or-heartbeat-missing' };
      allOk = false;
    }
  } catch (err: any) {
    checks.cron = { ok: false, detail: String(err?.message || err).slice(0, 200) };
    allOk = false;
  }

  return c.json({
    status: allOk ? 'ok' : 'degraded',
    version: '5.0.0-arsenal',
    checks,
    probed_at: new Date().toISOString(),
  }, allOk ? 200 : 200); // 200 even on degraded — monitors should parse JSON for granular signal
});

// ═══ Public routes (no auth) ═══
app.route('/api/providers', providers);
app.route('/api/skills', skills);
app.route('/api/stats', stats);
app.route('/api/feedback', feedback);
app.route('/api/events', events);
app.route('/api/collections', collections);
app.route('/api/arena', arena);
app.route('/api/packs', packs);
app.route('/api/deploy', deploy);
app.route('/api/wall', wall);
app.route('/api/auth', auth);
app.route('/api/auth/wechat', wechatAuth);

// Tenant registration is public
app.route('/api/tenants', tenants);

// ═══ Authenticated routes (Arsenal API) ═══
const arsenal = new Hono<{ Bindings: Env }>();
arsenal.use('*', authMiddleware);

// Advanced skill search with permission filtering
arsenal.get('/search', async (c) => {
  const db = c.env.DB;
  const search = c.req.query('q') || '';
  const category = c.req.query('category');
  const rating = c.req.query('rating');
  const maxNetwork = c.req.query('network'); // none | outbound_only | full
  const minSuccessRate = parseFloat(c.req.query('min_success_rate') || '0');
  const excludeStale = c.req.query('exclude_stale') === 'true';
  const limit = Math.min(parseInt(c.req.query('limit') || '50'), 100);
  const offset = Math.max(parseInt(c.req.query('offset') || '0'), 0);

  const conditions: string[] = [];
  const params: (string | number)[] = [];

  if (search) {
    conditions.push('(name LIKE ? OR description LIKE ? OR author LIKE ?)');
    const q = `%${search}%`;
    params.push(q, q, q);
  }
  if (category) {
    conditions.push('category = ?');
    params.push(category);
  }
  if (rating) {
    conditions.push('rating = ?');
    params.push(rating);
  }
  if (minSuccessRate > 0) {
    conditions.push('deploy_success_rate >= ?');
    params.push(minSuccessRate);
  }
  if (excludeStale) {
    conditions.push('stale = 0');
  }

  const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

  const { results } = await db.prepare(
    `SELECT * FROM skills ${where} ORDER BY composite_score DESC, score DESC LIMIT ? OFFSET ?`
  ).bind(...params, limit, offset).all();

  return c.json({ total: (results || []).length, skills: results || [] });
});

// Skill x Provider compatibility matrix
arsenal.get('/compare', async (c) => {
  const db = c.env.DB;
  const skillIds = (c.req.query('skills') || '').split(',').filter(Boolean);

  if (!skillIds.length) {
    return c.json({ error: 'skills query param required (comma-separated IDs)' }, 400);
  }

  const placeholders = skillIds.map(() => '?').join(',');
  const { results: feedbackRows } = await db.prepare(
    `SELECT skill_id, provider_id, outcome, COUNT(*) as cnt
     FROM deploy_feedback
     WHERE skill_id IN (${placeholders}) AND provider_id != ''
     GROUP BY skill_id, provider_id, outcome`
  ).bind(...skillIds).all<{ skill_id: string; provider_id: string; outcome: string; cnt: number }>();

  // Build matrix: { skillId: { providerId: { success, fail, rate } } }
  const matrix: Record<string, Record<string, { success: number; fail: number; rate: number }>> = {};
  for (const row of feedbackRows || []) {
    if (!matrix[row.skill_id]) matrix[row.skill_id] = {};
    if (!matrix[row.skill_id][row.provider_id]) {
      matrix[row.skill_id][row.provider_id] = { success: 0, fail: 0, rate: 0 };
    }
    if (row.outcome === 'success') matrix[row.skill_id][row.provider_id].success = row.cnt;
    if (row.outcome === 'fail') matrix[row.skill_id][row.provider_id].fail = row.cnt;
  }

  // Calculate rates
  for (const sid of Object.keys(matrix)) {
    for (const pid of Object.keys(matrix[sid])) {
      const entry = matrix[sid][pid];
      const total = entry.success + entry.fail;
      entry.rate = total > 0 ? entry.success / total : 0;
    }
  }

  return c.json({ matrix });
});

app.route('/api/arsenal', arsenal);

// Cron handler — daily sync + feedback aggregation
export default {
  fetch: app.fetch,

  async scheduled(event: ScheduledEvent, env: Env, ctx: ExecutionContext) {
    const startedAt = new Date(event.scheduledTime).toISOString();
    console.log(`Cron triggered at ${startedAt}`);

    // Heartbeat (write-then-read pattern so /api/health/deep can prove the cron ran)
    // Status flips to 'success' at the end; failure leaves it 'running' so deep-health surfaces it.
    await env.CACHE.put('cron:last_run', JSON.stringify({
      ts: startedAt,
      status: 'running',
      rows: 0,
    }), { expirationTtl: 86400 * 7 });

    let rowsTouched = 0;
    let finalStatus: 'success' | 'partial' | 'failed' = 'success';

    ctx.waitUntil((async () => {
      try {
        // Step 1: Aggregate deploy_feedback (legacy) into skill stats
        await env.DB.prepare(
          `UPDATE skills SET
             deploy_success_rate = COALESCE(
               (SELECT CAST(SUM(CASE WHEN f.outcome = 'success' THEN 1 ELSE 0 END) AS REAL)
                     / NULLIF(SUM(CASE WHEN f.outcome IN ('success','fail') THEN 1 ELSE 0 END), 0)
                FROM deploy_feedback f WHERE f.skill_id = skills.id),
               -1
             ),
             deploy_count = COALESCE(
               (SELECT COUNT(*) FROM deploy_feedback f WHERE f.skill_id = skills.id),
               0
             )`
        ).run();
        console.log('Step 1: deploy_feedback aggregation done');

        // Step 2: Aggregate skill_events into review counts
        await env.DB.prepare(
          `UPDATE skills SET
             review_up = COALESCE(
               (SELECT COUNT(*) FROM skill_events e
                WHERE e.skill_id = skills.id AND e.event_type = 'review_up' AND e.weight >= 0.5), 0),
             review_down = COALESCE(
               (SELECT COUNT(*) FROM skill_events e
                WHERE e.skill_id = skills.id AND e.event_type = 'review_down' AND e.weight >= 0.5), 0)`
        ).run();
        console.log('Step 2: review aggregation done');

        // Step 3: Compute trending_score (7-day window, time-decayed)
        await env.DB.prepare(
          `UPDATE skills SET
             trending_score = COALESCE(
               (SELECT SUM(
                  CASE e.event_type
                    WHEN 'install' THEN 3.0
                    WHEN 'deploy_ok' THEN 2.0
                    WHEN 'review_up' THEN 2.0
                    WHEN 'view' THEN 0.1
                    ELSE 0
                  END
                  * e.weight
                  * (1.0 / (1.0 + julianday('now') - julianday(e.created_at)))
                )
                FROM skill_events e
                WHERE e.skill_id = skills.id
                  AND e.created_at > datetime('now', '-7 days')
               ), 0.0)`
        ).run();
        console.log('Step 3: trending_score done');

        // Step 4: Compute stale_penalty (continuous decay, not just boolean)
        // B2: 7-day fail rate > 60% triggers penalty; also factor in stale boolean
        await env.DB.prepare(
          `UPDATE skills SET
             stale_penalty = CASE
               WHEN stale = 1 THEN 0.8
               WHEN deploy_success_rate >= 0 AND deploy_success_rate < 0.4 THEN 0.5
               ELSE 0.0
             END`
        ).run();
        console.log('Step 4: stale_penalty done');

        // Step 5: Compute composite_score (the unified ranking signal)
        await env.DB.prepare(
          `UPDATE skills SET
             composite_score =
               score * 0.35
               + CASE WHEN deploy_success_rate >= 0 THEN deploy_success_rate * 100 ELSE 0 END * 0.30
               + (review_up - review_down) * 5 * 0.20
               + trending_score * 0.10
               + (1.0 - stale_penalty) * 10 * 0.05`
        ).run();
        console.log('Step 5: composite_score done');

        console.log('Cron: all 5 steps completed successfully');

        // Approximate rowsTouched via a SUM probe over the skills table
        try {
          const r = await env.DB.prepare('SELECT COUNT(*) as n FROM skills').first<{ n: number }>();
          rowsTouched = r?.n ?? 0;
        } catch {
          rowsTouched = -1;
        }
      } catch (err) {
        console.error('Cron aggregation failed:', err);
        finalStatus = 'failed';
      }

      // Final heartbeat — surfaces the true outcome to /api/health/deep
      await env.CACHE.put('cron:last_run', JSON.stringify({
        ts: startedAt,
        status: finalStatus,
        rows: rowsTouched,
        completed_at: new Date().toISOString(),
      }), { expirationTtl: 86400 * 7 });
    })());
  },
};
