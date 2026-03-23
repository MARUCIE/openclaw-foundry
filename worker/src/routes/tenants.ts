// Tenant management: lightweight API users
// Registration is public, other endpoints require auth

import { Hono } from 'hono';
import type { Env } from '../index';
import type { TenantRow } from '../types';

export const tenants = new Hono<{ Bindings: Env }>();

function generateId(): string {
  const bytes = new Uint8Array(8);
  crypto.getRandomValues(bytes);
  return 'ten_' + Array.from(bytes).map(b => b.toString(16).padStart(2, '0')).join('');
}

function generateApiKey(): string {
  const bytes = new Uint8Array(24);
  crypto.getRandomValues(bytes);
  return 'ocf_' + Array.from(bytes).map(b => b.toString(16).padStart(2, '0')).join('');
}

// Register (public)
tenants.post('/register', async (c) => {
  const db = c.env.DB;
  const body = await c.req.json<{ name: string; email?: string }>();

  if (!body.name || body.name.length < 2) {
    return c.json({ error: 'name is required (min 2 chars)' }, 400);
  }

  const id = generateId();
  const apiKey = generateApiKey();
  const now = new Date().toISOString();

  await db.prepare(
    `INSERT INTO tenants (id, name, email, api_key, tier, active, created_at, last_active_at)
     VALUES (?, ?, ?, ?, 'free', 1, ?, ?)`
  ).bind(id, body.name, body.email || '', apiKey, now, now).run();

  return c.json({
    tenant: { id, name: body.name, email: body.email || '', tier: 'free' },
    api_key: apiKey,
  }, 201);
});

// Get current tenant profile (requires auth — checked by middleware)
tenants.get('/me', async (c) => {
  const tenant = (c as any).get('tenant') as TenantRow | undefined;
  if (!tenant) return c.json({ error: 'Unauthorized' }, 401);

  return c.json({
    tenant: {
      id: tenant.id,
      name: tenant.name,
      email: tenant.email,
      tier: tenant.tier,
      created_at: tenant.created_at,
      last_active_at: tenant.last_active_at,
    },
    usage: {
      daily_requests: tenant.daily_requests,
      daily_reset: tenant.daily_reset,
    },
  });
});
