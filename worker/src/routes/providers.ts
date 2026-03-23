import { Hono } from 'hono';
import type { Env } from '../index';

export const providers = new Hono<{ Bindings: Env }>();

const TIER_MAP: Record<number, string> = { 1: 'full-auto', 2: 'semi-auto', 3: 'guided' };

providers.get('/', async (c) => {
  const type = c.req.query('type');
  const db = c.env.DB;

  let query = 'SELECT * FROM providers';
  const params: string[] = [];
  if (type) {
    query += ' WHERE type = ?';
    params.push(type);
  }
  query += ' ORDER BY tier ASC, name ASC';

  const { results } = await db.prepare(query).bind(...params).all();

  const mapped = (results || []).map((p: any) => ({
    id: p.id,
    name: p.name,
    vendor: p.vendor,
    type: p.type,
    tier: p.tier,
    platforms: (() => { try { return JSON.parse(p.platforms || '[]'); } catch { return []; } })(),
    status: p.status,
    consoleUrl: p.console_url,
    docUrl: p.doc_url,
    imChannels: (() => { try { return JSON.parse(p.im_channels || '[]'); } catch { return []; } })(),
    description: p.description,
    installCmd: p.install_cmd,
    github: p.github,
  }));

  return c.json({ total: mapped.length, providers: mapped });
});

providers.get('/:id', async (c) => {
  const id = c.req.param('id');
  const db = c.env.DB;

  const row = await db.prepare('SELECT * FROM providers WHERE id = ?').bind(id).first();
  if (!row) return c.json({ error: 'Provider not found' }, 404);

  return c.json({
    provider: {
      ...row,
      platforms: (() => { try { return JSON.parse((row as any).platforms || '[]'); } catch { return []; } })(),
      imChannels: (() => { try { return JSON.parse((row as any).im_channels || '[]'); } catch { return []; } })(),
    },
    available: true,
    requirements: [],
  });
});
