import type { Metadata } from 'next';
import { pageMetadata } from '@/lib/page-metadata';

// Server layout co-located with the 'use client' pricing page.
export const metadata: Metadata = pageMetadata({
  title: 'Pricing',
  description: 'Platform pricing — compare AI agent platforms side by side on price, model, and skills, with picks for individual, team, and enterprise use.',
  path: '/pricing',
});

export default function PricingLayout({ children }: { children: React.ReactNode }) {
  return children;
}
