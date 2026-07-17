import type { Metadata } from 'next';

// Server layout co-located with the 'use client' admin/customers page.
export const metadata: Metadata = { title: 'Customer Management' };

export default function AdminCustomersLayout({ children }: { children: React.ReactNode }) {
  return children;
}
