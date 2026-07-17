import type { Metadata } from 'next';

// Server layout co-located with the 'use client' pricing page.
export const metadata: Metadata = { title: 'Pricing' };

export default function PricingLayout({ children }: { children: React.ReactNode }) {
  return children;
}
