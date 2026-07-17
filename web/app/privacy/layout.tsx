import type { Metadata } from 'next';

// Server layout co-located with the 'use client' privacy page.
export const metadata: Metadata = { title: 'Privacy Policy' };

export default function PrivacyLayout({ children }: { children: React.ReactNode }) {
  return children;
}
