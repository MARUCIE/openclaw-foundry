import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { providers } from './routes/providers';
import { skills } from './routes/skills';
import { stats } from './routes/stats';

export interface Env {
  DB: D1Database;
  STORAGE: R2Bucket;
  CACHE: KVNamespace;
  ENVIRONMENT: string;
}

const app = new Hono<{ Bindings: Env }>();

// CORS — restrict to known origins
app.use('*', cors({
  origin: (origin) => {
    if (!origin) return false;
    const allowed = [
      'https://openclaw-foundry.pages.dev',
      'http://localhost:3200',
      'http://localhost:3000',
    ];
    return allowed.includes(origin) ? origin : false;
  },
  allowMethods: ['GET', 'OPTIONS'],
  credentials: false,
}));

// Global error handler
app.onError((err, c) => {
  console.error('Unhandled error:', err.message);
  return c.json({ error: 'Internal Server Error' }, 500);
});

// Health
app.get('/api/health', (c) => {
  return c.json({ status: 'ok', version: '4.0.0', runtime: 'cloudflare-workers' });
});

// Routes
app.route('/api/providers', providers);
app.route('/api/skills', skills);
app.route('/api/stats', stats);

// Cron handler — daily ClawHub sync
export default {
  fetch: app.fetch,

  async scheduled(event: ScheduledEvent, env: Env, ctx: ExecutionContext) {
    // Triggered by cron (0 6 * * *)
    // In production: fetch from ClawHub API/scraper endpoint and update D1
    console.log(`Cron triggered at ${new Date(event.scheduledTime).toISOString()}`);

    // Option 1: Call external scraper service
    // Option 2: Fetch from prebuild static data and sync to D1
    // For now: log and skip (data seeded via CLI)
    ctx.waitUntil(Promise.resolve());
  },
};
