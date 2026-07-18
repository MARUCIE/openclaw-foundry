import type { Metadata } from 'next';
import { pageMetadata } from '@/lib/page-metadata';

// Server layout co-located with the 'use client' catalog page.
export const metadata: Metadata = pageMetadata({
  title: 'Platform Catalog',
  description: 'Platform Catalog — browse and filter AI agent deployment platforms by type (desktop, cloud, SaaS, mobile, remote) and status (stable, beta, preview).',
  path: '/catalog',
});

export default function CatalogLayout({ children }: { children: React.ReactNode }) {
  return children;
}
