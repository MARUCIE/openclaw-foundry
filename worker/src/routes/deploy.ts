// Deploy jobs: start deployment, track status, list history
// Simulated execution for v0 — real deployment backends come later

import { Hono } from 'hono';
import type { Env } from '../index';

export const deploy = new Hono<{ Bindings: Env }>();

// Start a deploy job
deploy.post('/', async (c) => {
  const db = c.env.DB;
  const body = await c.req.json<{ provider: string; blueprint: Record<string, unknown> }>();

  const jobId = crypto.randomUUID();
  const now = new Date().toISOString();

  // Simulate deploy steps
  const logs = [
    { name: 'Validate Blueprint', status: 'ok', message: 'Schema valid, version 2.0' },
    { name: 'Check Provider', status: 'ok', message: `${body.provider} available` },
    { name: 'Install Dependencies', status: 'ok', message: 'All requirements met' },
    { name: 'Deploy Agent', status: 'ok', message: 'Agent deployed successfully' },
  ];

  await db.prepare(
    `INSERT INTO deploy_jobs (id, provider_id, status, blueprint, logs, created_at, completed_at)
     VALUES (?, ?, 'success', ?, ?, ?, ?)`
  ).bind(
    jobId,
    body.provider,
    JSON.stringify(body.blueprint),
    JSON.stringify(logs),
    now,
    now,
  ).run();

  return c.json({ jobId, status: 'success' });
});

// Get deploy job status
deploy.get('/:jobId', async (c) => {
  const db = c.env.DB;
  const jobId = c.req.param('jobId');

  const row = await db.prepare(
    'SELECT * FROM deploy_jobs WHERE id = ?'
  ).bind(jobId).first<{
    id: string; provider_id: string; status: string;
    blueprint: string; logs: string; created_at: string; completed_at: string;
  }>();

  if (!row) return c.json({ error: 'Job not found' }, 404);

  return c.json({
    jobId: row.id,
    provider: row.provider_id,
    status: row.status,
    logs: JSON.parse(row.logs || '[]'),
    createdAt: row.created_at,
    completedAt: row.completed_at,
  });
});
