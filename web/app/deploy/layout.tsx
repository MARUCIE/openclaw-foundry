import type { Metadata } from 'next';

// Server layout co-located with the 'use client' deploy page.
export const metadata: Metadata = { title: 'Deploy' };

export default function DeployLayout({ children }: { children: React.ReactNode }) {
  return children;
}
