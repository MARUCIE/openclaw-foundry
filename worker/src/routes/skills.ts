import { Hono } from 'hono';
import type { Env } from '../index';

export const skills = new Hono<{ Bindings: Env }>();

skills.get('/', async (c) => {
  const db = c.env.DB;
  const category = c.req.query('category');
  const rating = c.req.query('rating');
  const search = c.req.query('search');
  const limit = parseInt(c.req.query('limit') || '50');
  const offset = parseInt(c.req.query('offset') || '0');

  // Build query
  const conditions: string[] = [];
  const params: (string | number)[] = [];

  if (category) {
    conditions.push('category = ?');
    params.push(category);
  }
  if (rating) {
    conditions.push('rating = ?');
    params.push(rating);
  }
  if (search) {
    conditions.push('(name LIKE ? OR description LIKE ? OR author LIKE ?)');
    const q = `%${search}%`;
    params.push(q, q, q);
  }

  const where = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

  // Count
  const countRow = await db.prepare(`SELECT COUNT(*) as cnt FROM skills ${where}`).bind(...params).first();
  const total = (countRow as any)?.cnt || 0;

  // Fetch page
  const { results } = await db.prepare(
    `SELECT * FROM skills ${where} ORDER BY score DESC LIMIT ? OFFSET ?`
  ).bind(...params, limit, offset).all();

  // Categories summary
  const { results: catRows } = await db.prepare(
    'SELECT category, COUNT(*) as cnt FROM skills GROUP BY category'
  ).all();
  const byCategory: Record<string, number> = {};
  for (const r of catRows || []) {
    byCategory[(r as any).category] = (r as any).cnt;
  }

  // Rating summary
  const { results: ratingRows } = await db.prepare(
    'SELECT rating, COUNT(*) as cnt FROM skills GROUP BY rating'
  ).all();
  const byRating: Record<string, number> = {};
  for (const r of ratingRows || []) {
    byRating[(r as any).rating] = (r as any).cnt;
  }

  const mapped = (results || []).map((s: any) => ({
    id: s.id,
    name: s.name,
    slug: s.slug,
    author: s.author,
    description: s.description,
    category: s.category,
    icon: s.icon,
    downloads: s.downloads,
    downloadsDisplay: s.downloads_display,
    stars: s.stars,
    starsDisplay: s.stars_display,
    versions: s.versions,
    platforms: JSON.parse(s.platforms || '[]'),
    official: Boolean(s.official),
    score: s.score,
    rating: s.rating,
    url: s.url,
  }));

  return c.json({
    meta: {
      source: 'https://clawhub.ai/skills',
      syncedAt: (results?.[0] as any)?.synced_at || '',
      totalProcessed: total,
      byCategory,
      byRating,
    },
    total,
    offset,
    limit,
    skills: mapped,
  });
});

skills.get('/categories', async (c) => {
  const db = c.env.DB;
  const { results } = await db.prepare(
    'SELECT category, COUNT(*) as cnt FROM skills GROUP BY category ORDER BY cnt DESC'
  ).all();

  const categories: Record<string, number> = {};
  for (const r of results || []) {
    categories[(r as any).category] = (r as any).cnt;
  }

  return c.json({ categories });
});
