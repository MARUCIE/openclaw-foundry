import type { Metadata } from 'next';

// Server layout co-located with the 'use client' packs page so app-router can
// collect per-route metadata (a client component cannot export metadata).
export const metadata: Metadata = { title: 'Skill Packs' };

export default function PacksLayout({ children }: { children: React.ReactNode }) {
  return children;
}
