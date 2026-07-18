import type { MetadataRoute } from 'next';
import { SITE_URL } from '@/lib/page-metadata';

// `output: 'export'` requires metadata routes to opt into static generation explicitly.
export const dynamic = 'force-static';

// Static sitemap emitted at build time under `output: 'export'` -> `out/sitemap.xml`.
// Next renders metadata routes (sitemap.ts) statically at build, so keep this a pure
// static array — a thrown error here would fail the build. Absolute urls are required:
// `metadataBase` does not prefix sitemap entries. Excludes the /explore/platforms
// redirect, auth (/login, /auth/*), /admin, and the param-only /skill and /wall/detail
// shells that render no standalone content in the static export.
export default function sitemap(): MetadataRoute.Sitemap {
  const paths = [
    '',
    'packs',
    'wall',
    'breakthroughs',
    'news',
    'api-docs',
    'pricing',
    'catalog',
    'arena',
    'deploy',
    'explore/skills',
    'explore/mcp',
    'privacy',
    'terms',
  ];
  const lastModified = new Date();
  return paths.map((p) => ({
    url: p ? `${SITE_URL}/${p}` : SITE_URL,
    lastModified,
  }));
}
