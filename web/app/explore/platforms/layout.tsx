import type { Metadata } from 'next';

// Server layout co-located with the 'use client' explore/platforms page.
export const metadata: Metadata = { title: 'Platform Overview' };

export default function PlatformsLayout({ children }: { children: React.ReactNode }) {
  return children;
}
