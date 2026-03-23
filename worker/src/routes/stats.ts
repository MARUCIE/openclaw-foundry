import { Hono } from 'hono';
import type { Env } from '../index';

export const stats = new Hono<{ Bindings: Env }>();

stats.get('/', async (c) => {
  const db = c.env.DB;

  // Provider stats
  const { results: typeRows } = await db.prepare(
    'SELECT type, COUNT(*) as cnt FROM providers GROUP BY type'
  ).all();
  const byType: Record<string, number> = {};
  let totalProviders = 0;
  for (const r of typeRows || []) {
    byType[(r as any).type] = (r as any).cnt;
    totalProviders += (r as any).cnt;
  }

  // Deploy stats
  const deployRow = await db.prepare(
    'SELECT COUNT(*) as cnt FROM deploy_jobs WHERE created_at > datetime("now", "-7 days")'
  ).first();

  // Skill count
  const skillRow = await db.prepare('SELECT COUNT(*) as cnt FROM skills').first();

  return c.json({
    providers: { total: totalProviders, byType },
    deploys: { recent: (deployRow as any)?.cnt || 0, jobs: [] },
    arena: { recent: 0, matches: [] },
    skills: { total: (skillRow as any)?.cnt || 0 },
    uptime: 0,
  });
});
