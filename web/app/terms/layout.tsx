import type { Metadata } from 'next';
import { pageMetadata } from '@/lib/page-metadata';

// Server layout co-located with the 'use client' terms page.
export const metadata: Metadata = pageMetadata({
  title: 'Terms of Service',
  description: 'Agent Foundry terms of service — acceptable use of the skill-pack marketplace, passwordless accounts, third-party pack licenses, and liability limits.',
  path: '/terms',
});

export default function TermsLayout({ children }: { children: React.ReactNode }) {
  return children;
}
