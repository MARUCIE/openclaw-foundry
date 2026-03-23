// Auth middleware: Bearer token -> D1 lookup -> tenant context
// Hickey principle: auth is a value, not a framework

import type { Context, Next } from 'hono';
import type { TenantRow } from '../types';

const TIER_LIMITS: Record<string, number> = {
  free: 100,
  pro: 1000,
  partner: -1, // unlimited
};

export async function authMiddleware(c: Context<any>, next: Next) {
  const token = c.req.header('Authorization')?.replace('Bearer ', '');
  if (!token) {
    return c.json({ error: 'Missing Authorization header' }, 401);
  }

  const db = c.env.DB;
  const tenant = await db.prepare(
    'SELECT * FROM tenants WHERE api_key = ? AND active = 1'
  ).bind(token).first<TenantRow>();

  if (!tenant) {
    return c.json({ error: 'Invalid or inactive API key' }, 401);
  }

  // Rate limiting: check daily quota
  const today = new Date().toISOString().slice(0, 10);
  let dailyRequests = tenant.daily_requests;

  if (tenant.daily_reset !== today) {
    // New day: reset counter
    dailyRequests = 0;
    await db.prepare(
      'UPDATE tenants SET daily_requests = 0, daily_reset = ? WHERE id = ?'
    ).bind(today, tenant.id).run();
  }

  const limit = TIER_LIMITS[tenant.tier] ?? 100;
  if (limit !== -1 && dailyRequests >= limit) {
    return c.json({
      error: 'Daily rate limit exceeded',
      limit,
      used: dailyRequests,
      reset: 'next UTC day',
    }, 429);
  }

  // Increment usage counter and update last_active
  await db.prepare(
    'UPDATE tenants SET daily_requests = daily_requests + 1, last_active_at = ? WHERE id = ?'
  ).bind(new Date().toISOString(), tenant.id).run();

  c.set('tenant', tenant);
  await next();
}
