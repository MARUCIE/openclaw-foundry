import type { Metadata } from 'next';

// Server layout co-located with the 'use client' explore/skills page.
export const metadata: Metadata = { title: 'Explore Skills' };

export default function SkillsLayout({ children }: { children: React.ReactNode }) {
  return children;
}
