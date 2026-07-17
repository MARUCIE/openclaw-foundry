import type { Metadata } from 'next';

// Server layout co-located with the 'use client' login page.
export const metadata: Metadata = { title: 'Sign In' };

export default function LoginLayout({ children }: { children: React.ReactNode }) {
  return children;
}
