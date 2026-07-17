import type { Metadata } from 'next';

// Server layout co-located with the 'use client' terms page.
export const metadata: Metadata = { title: 'Terms of Service' };

export default function TermsLayout({ children }: { children: React.ReactNode }) {
  return children;
}
