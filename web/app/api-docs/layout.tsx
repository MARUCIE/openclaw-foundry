import type { Metadata } from 'next';

// Server layout co-located with the 'use client' api-docs page.
export const metadata: Metadata = { title: 'API Docs' };

export default function ApiDocsLayout({ children }: { children: React.ReactNode }) {
  return children;
}
