import type { Metadata } from 'next';

// Server layout co-located with the 'use client' catalog page.
export const metadata: Metadata = { title: 'Platform Catalog' };

export default function CatalogLayout({ children }: { children: React.ReactNode }) {
  return children;
}
