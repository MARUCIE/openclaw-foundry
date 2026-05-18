'use client';

// Before/After 卡点墙 — dedicated route page.
// The same board is also rendered inline as a tab on /packs (#wall).
// This route stays for direct links + sharing.

import WallBoard from '@/components/wall-board';

export default function WallPage() {
  return (
    <div className="page-shell py-12 space-y-10">
      {/* Header */}
      <div className="flex items-center gap-4">
        <div className="w-2 h-12 rounded-full" style={{ background: 'var(--primary)' }} />
        <div>
          <h1 className="text-4xl md:text-5xl font-black tracking-tight text-balance" style={{ color: 'var(--on-surface)' }}>
            卡点墙
          </h1>
          <p className="text-sm font-bold uppercase tracking-widest opacity-50 mt-1">
            匿名登记你工作流里的卡点，别人可以回复
          </p>
        </div>
      </div>

      <WallBoard />
    </div>
  );
}
