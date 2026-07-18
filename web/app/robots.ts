import type { MetadataRoute } from 'next';
import { SITE_URL } from '@/lib/page-metadata';

// `output: 'export'` requires metadata routes to opt into static generation explicitly.
export const dynamic = 'force-static';

// Emitted at build time under `output: 'export'` -> `out/robots.txt`. Whether
// Cloudflare Pages serves this project file or its zone-managed content-signals
// robots.txt wins is verified post-deploy; `/sitemap.xml` stays discoverable at the
// well-known path regardless of the Sitemap line below.
export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: '*', allow: '/' },
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
