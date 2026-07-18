import type { Metadata } from 'next';

// Canonical production host. Cloudflare Pages project `agent-foundry` serves the
// static export (`.github/workflows/deploy.yml` deploys `web/out` to it); the old
// `openclaw-foundry.pages.dev` 301-redirects here and no custom domain is bound,
// so this pages.dev subdomain is the permanent canonical origin.
export const SITE_URL = 'https://agent-foundry.pages.dev';
export const SITE_NAME = 'Agent Foundry';
export const SITE_TAGLINE = 'The Curated AI Agent Skill Marketplace';
export const OG_IMAGE = '/og.png';

type PageMetaInput = {
  /** The route title (also used as og:title; the root `%s · Agent Foundry` template is applied by the resolver). */
  title: string;
  /** One-line, truthful description grounded in the page's rendered content. */
  description: string;
  /** Clean canonical path, no trailing slash, e.g. `/packs` (`/` served as `packs.html`). */
  path: string;
};

// Per-route metadata: self-canonical + Open Graph + Twitter card, all sharing the
// one site-wide og:image. openGraph/twitter are declared per route because Next
// REPLACES (does not deep-merge) these objects across segments — so each route must
// carry the image itself or inner routes would ship no card image. Relative urls
// resolve against the root `metadataBase`.
export function pageMetadata({ title, description, path }: PageMetaInput): Metadata {
  return {
    title,
    description,
    alternates: { canonical: path },
    openGraph: {
      type: 'website',
      siteName: SITE_NAME,
      url: path,
      title,
      description,
      images: [{ url: OG_IMAGE, width: 1200, height: 630, alt: `${SITE_NAME} — ${SITE_TAGLINE}` }],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [OG_IMAGE],
    },
  };
}
