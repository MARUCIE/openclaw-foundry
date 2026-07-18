import type { Metadata } from 'next';
import { pageMetadata } from '@/lib/page-metadata';

// Server layout co-located with the 'use client' explore/skills page.
export const metadata: Metadata = pageMetadata({
  title: 'Explore Skills',
  description: 'Explore the Agent Capability Marketplace — search and filter locally-verified skills and MCP servers by category and S/A/B/C rating, install to any tool.',
  path: '/explore/skills',
});

export default function SkillsLayout({ children }: { children: React.ReactNode }) {
  return children;
}
