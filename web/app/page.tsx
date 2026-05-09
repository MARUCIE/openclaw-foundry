'use client';

// Agent Capability Marketplace — root home (T4 IA restructure 2026-05-09).
// Renders the same shared marketplace shell as /explore/skills.
// The previous marketing landing has been demoted to /about.

import { Suspense } from 'react';
import { MarketplaceShell } from '@/components/marketplace-shell';

export default function HomePage() {
  return (
    <Suspense fallback={<div className="page-shell py-12" />}>
      <MarketplaceShell />
    </Suspense>
  );
}
