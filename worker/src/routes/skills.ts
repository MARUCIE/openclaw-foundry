import { Hono } from 'hono';
import type { Env } from '../index';
import type { SkillRow, CountRow, SyncRow } from '../types';
import { safeJsonArray, safeJsonObject } from '../types';

export const skills = new Hono<{ Bindings: Env }>();

skills.get('/', async (c) => {
  const db = c.env.DB;
  const category = c.req.query('category');
  const rating = c.req.query('rating');
  const search = c.req.query('search');
  const limit = Math.min(Math.max(parseInt(c.req.query('limit') || '50') || 50, 1), 100);
  const offset = Math.max(parseInt(c.req.query('offset') || '0') || 0, 0);

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

  // Counts: filtered + total
  const countRow = await db.prepare(`SELECT COUNT(*) as cnt FROM skills ${where}`).bind(...params).first<CountRow>();
  const total = countRow?.cnt || 0;
  const totalRawRow = await db.prepare('SELECT COUNT(*) as cnt FROM skills').first<CountRow>();
  const totalRaw = totalRawRow?.cnt || 0;
  const syncRow = await db.prepare('SELECT MAX(synced_at) as latest FROM skills').first<SyncRow>();
  const syncedAt = syncRow?.latest || '';

  // Fetch page
  const { results } = await db.prepare(
    `SELECT * FROM skills ${where} ORDER BY composite_score DESC, score DESC LIMIT ? OFFSET ?`
  ).bind(...params, limit, offset).all<SkillRow>();

  // Categories summary
  const { results: catRows } = await db.prepare(
    'SELECT category, COUNT(*) as cnt FROM skills GROUP BY category'
  ).all<{ category: string; cnt: number }>();
  const byCategory: Record<string, number> = {};
  for (const r of catRows || []) {
    byCategory[r.category] = r.cnt;
  }

  // Rating summary
  const { results: ratingRows } = await db.prepare(
    'SELECT rating, COUNT(*) as cnt FROM skills GROUP BY rating'
  ).all<{ rating: string; cnt: number }>();
  const byRating: Record<string, number> = {};
  for (const r of ratingRows || []) {
    byRating[r.rating] = r.cnt;
  }

  const mapped = (results || []).map((s) => ({
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
    platforms: safeJsonArray(s.platforms),
    official: Boolean(s.official),
    score: s.score,
    rating: s.rating,
    url: s.url,
    source: s.source || 'clawhub',
    sourceUrl: s.source_url || '',
    repositoryUrl: s.repository_url || '',
    remoteUrl: s.remote_url || '',
    // v2 curation fields
    deploySuccessRate: (s as any).deploy_success_rate ?? -1,
    deployCount: (s as any).deploy_count ?? 0,
    stale: Boolean((s as any).stale),
    permissionManifest: safeJsonObject((s as any).permission_manifest),
    // v3 curation fields
    editorialTagline: (s as any).editorial_tagline || '',
    trendingScore: (s as any).trending_score ?? 0,
    compositeScore: (s as any).composite_score ?? 0,
    reviewUp: (s as any).review_up ?? 0,
    reviewDown: (s as any).review_down ?? 0,
    stalePenalty: (s as any).stale_penalty ?? 0,
  }));

  return c.json({
    meta: {
      source: 'openclaw-foundry',
      syncedAt,
      totalRaw,
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
  ).all<{ category: string; cnt: number }>();

  const categories: Record<string, number> = {};
  for (const r of results || []) {
    categories[r.category] = r.cnt;
  }

  return c.json({ categories });
});
