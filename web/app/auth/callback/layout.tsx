import type { Metadata } from 'next';

// Server layout co-located with the 'use client' auth/callback page.
export const metadata: Metadata = { title: 'Signing In' };

export default function AuthCallbackLayout({ children }: { children: React.ReactNode }) {
  return children;
}
