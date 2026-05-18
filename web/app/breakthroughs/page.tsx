'use client';

// 蜕变墙 (Breakthroughs) — dedicated route page.
// Pairs with /wall (卡点墙). Same data model, inverted visual hierarchy:
// /wall      → before_state and after_method shown flat side-by-side (problem-centric)
// /breakthroughs → after_method dominant + before_state recedes (transformation arc)
//
// Design spec: design/breakthroughs/spec.md
// This-cycle scope (per Maurice "设计个页面再实现"): page-first MVP with
// MOCK_BREAKTHROUGHS sample data + empty-state component. Live /api/wall
// integration is next-cycle scope (schema already supports both views;
// just needs a filter param on the existing GET endpoint).

import BreakthroughWall from '@/components/breakthrough-wall';

export default function BreakthroughsPage() {
  return (
    <div className="page-shell py-12 space-y-10">
      {/* Header — parallels /wall header structure for visual consistency */}
      <div className="flex items-center gap-4">
        <div className="w-2 h-12 rounded-full" style={{ background: 'var(--primary)' }} />
        <div>
          <h1 className="text-4xl md:text-5xl font-black tracking-tight text-balance" style={{ color: 'var(--on-surface)' }}>
            蜕变墙
          </h1>
          <p className="text-sm font-bold uppercase tracking-widest opacity-50 mt-1">
            Breakthroughs · cohort 公开的 before/after 蜕变案例 — 同伴在这里把卡点翻成蜕变
          </p>
        </div>
      </div>

      <BreakthroughWall />
    </div>
  );
}
