import type { Metadata } from 'next';
import { pageMetadata } from '@/lib/page-metadata';

// Server layout co-located with the 'use client' deploy page.
export const metadata: Metadata = pageMetadata({
  title: 'Deploy',
  description: 'Deploy — a four-step wizard to configure and launch an AI agent blueprint to any platform: pick a platform, set autonomy and model routing, then deploy.',
  path: '/deploy',
});

export default function DeployLayout({ children }: { children: React.ReactNode }) {
  return children;
}
