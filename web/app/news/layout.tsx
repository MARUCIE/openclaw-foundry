import type { Metadata } from 'next';
import { pageMetadata } from '@/lib/page-metadata';

// Server layout co-located with the 'use client' news page.
export const metadata: Metadata = pageMetadata({
  title: 'News',
  description: 'News Center — the latest OpenClaw ecosystem news, version updates, tutorials, and community picks, with a live version tracker.',
  path: '/news',
});

export default function NewsLayout({ children }: { children: React.ReactNode }) {
  return children;
}
