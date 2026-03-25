// Curated collections: flat table with JSON skill_ids
// No join tables. Collections are editorially curated (human-signed).

import { Hono } from 'hono';
import type { Env } from '../index';

export const collections = new Hono<{ Bindings: Env }>();

interface CollectionRow {
  id: string;
  name: string;
  tagline: string;
  description: string;
  skill_ids: string;
  curator: string;
  cover_type: string;
  featured: number;
  install_count: number;
  created_at: string;
}

// List collections (public)
collections.get('/', async (c) => {
  const db = c.env.DB;
  const featured = c.req.query('featured');
  const limit = Math.min(parseInt(c.req.query('limit') || '20'), 50);

  let query = 'SELECT * FROM collections';
  const params: (string | number)[] = [];

  if (featured === 'true') {
    query += ' WHERE featured = 1';
  }

  query += ' ORDER BY featured DESC, install_count DESC LIMIT ?';
  params.push(limit);

  const { results } = await db.prepare(query).bind(...params).all<CollectionRow>();

  const mapped = (results || []).map(col => ({
    id: col.id,
    name: col.name,
    tagline: col.tagline,
    description: col.description,
    skillIds: JSON.parse(col.skill_ids || '[]'),
    curator: col.curator,
    coverType: col.cover_type,
    featured: Boolean(col.featured),
    installCount: col.install_count,
    createdAt: col.created_at,
  }));

  return c.json({ total: mapped.length, collections: mapped });
});

// Get single collection with resolved skills
collections.get('/:id', async (c) => {
  const db = c.env.DB;
  const id = c.req.param('id');

  const col = await db.prepare(
    'SELECT * FROM collections WHERE id = ?'
  ).bind(id).first<CollectionRow>();

  if (!col) return c.json({ error: 'Collection not found' }, 404);

  const skillIds: string[] = JSON.parse(col.skill_ids || '[]');

  // Resolve skill details
  let skills: unknown[] = [];
  if (skillIds.length > 0) {
    const placeholders = skillIds.map(() => '?').join(',');
    const { results } = await db.prepare(
      `SELECT id, name, slug, author, description, category, rating, score,
              deploy_success_rate, composite_score
       FROM skills WHERE id IN (${placeholders})`
    ).bind(...skillIds).all();
    skills = results || [];
  }

  return c.json({
    collection: {
      id: col.id,
      name: col.name,
      tagline: col.tagline,
      description: col.description,
      skillIds,
      curator: col.curator,
      coverType: col.cover_type,
      featured: Boolean(col.featured),
      installCount: col.install_count,
      createdAt: col.created_at,
    },
    skills,
  });
});

// Track collection install (increment counter)
collections.post('/:id/install', async (c) => {
  const db = c.env.DB;
  const id = c.req.param('id');

  await db.prepare(
    'UPDATE collections SET install_count = install_count + 1 WHERE id = ?'
  ).bind(id).run();

  return c.json({ ok: true });
});
