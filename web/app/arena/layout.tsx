import type { Metadata } from 'next';
import { pageMetadata } from '@/lib/page-metadata';

// Server layout co-located with the 'use client' arena page.
export const metadata: Metadata = pageMetadata({
  title: 'Arena',
  description: 'Arena — run the same agent task across 2–5 platforms head-to-head and score deploy speed, test pass rate, feature support, and coverage.',
  path: '/arena',
});

export default function ArenaLayout({ children }: { children: React.ReactNode }) {
  return children;
}
