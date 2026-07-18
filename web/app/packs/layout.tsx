import type { Metadata } from 'next';
import { pageMetadata } from '@/lib/page-metadata';

// Server layout co-located with the 'use client' packs page so app-router can
// collect per-route metadata (a client component cannot export metadata).
export const metadata: Metadata = pageMetadata({
  title: 'Skill Packs',
  description: 'Job Packs — one-click, role-tailored configs for AI coding agents: download CLAUDE.md, AGENTS.md, MCP servers, and starter prompts crafted for your role.',
  path: '/packs',
});

export default function PacksLayout({ children }: { children: React.ReactNode }) {
  return children;
}
