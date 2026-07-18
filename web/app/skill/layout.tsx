import type { Metadata } from 'next';
import { pageMetadata } from '@/lib/page-metadata';

// Server layout co-located with the 'use client' skill (detail) page.
export const metadata: Metadata = pageMetadata({
  title: 'Skill Detail',
  description: 'Skill detail — per-platform install commands, quality rating, permission manifest, what-it-does scenarios, and user deploy records for a curated agent skill.',
  path: '/skill',
});

export default function SkillLayout({ children }: { children: React.ReactNode }) {
  return children;
}
