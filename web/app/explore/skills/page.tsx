'use client';

import { Suspense } from 'react';
import { MarketplaceShell } from '@/components/marketplace-shell';

export default function SkillsMarketplacePage() {
  return (
    <Suspense fallback={<div className="page-shell py-12" />}>
      <MarketplaceShell />
    </Suspense>
  );
}
