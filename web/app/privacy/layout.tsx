import type { Metadata } from 'next';
import { pageMetadata } from '@/lib/page-metadata';

// Server layout co-located with the 'use client' privacy page.
export const metadata: Metadata = pageMetadata({
  title: 'Privacy Policy',
  description: 'Agent Foundry privacy policy — what we collect, why, and your choices. Passwordless sign-in, no third-party ad-tracking pixels, and we never sell personal data.',
  path: '/privacy',
});

export default function PrivacyLayout({ children }: { children: React.ReactNode }) {
  return children;
}
