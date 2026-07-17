import type { Metadata } from 'next';

// Server layout co-located with the 'use client' arena page.
export const metadata: Metadata = { title: 'Arena' };

export default function ArenaLayout({ children }: { children: React.ReactNode }) {
  return children;
}
