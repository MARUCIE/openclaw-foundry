import type { Metadata } from 'next';
import { pageMetadata } from '@/lib/page-metadata';

// Server layout co-located with the 'use client' api-docs page.
export const metadata: Metadata = pageMetadata({
  title: 'API Docs',
  description: 'Arsenal API — programmatic REST access to the curated, locally verified skill catalog with quality ratings, permission manifests, and deploy feedback.',
  path: '/api-docs',
});

export default function ApiDocsLayout({ children }: { children: React.ReactNode }) {
  return children;
}
