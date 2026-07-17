import type { Metadata } from 'next';

// Server layout co-located with the 'use client' wall page (also covers wall/detail).
export const metadata: Metadata = { title: 'Skill Wall' };

export default function WallLayout({ children }: { children: React.ReactNode }) {
  return children;
}
