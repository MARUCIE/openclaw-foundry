import type { Metadata } from 'next';

// Server layout co-located with the 'use client' skill (detail) page.
export const metadata: Metadata = { title: 'Skill Detail' };

export default function SkillLayout({ children }: { children: React.ReactNode }) {
  return children;
}
