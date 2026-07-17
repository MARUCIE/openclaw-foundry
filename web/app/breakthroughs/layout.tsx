import type { Metadata } from 'next';

// Server layout co-located with the 'use client' breakthroughs page.
export const metadata: Metadata = { title: 'Breakthroughs' };

export default function BreakthroughsLayout({ children }: { children: React.ReactNode }) {
  return children;
}
