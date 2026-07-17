import type { Metadata } from 'next';

// Server layout co-located with the 'use client' news page.
export const metadata: Metadata = { title: 'News' };

export default function NewsLayout({ children }: { children: React.ReactNode }) {
  return children;
}
