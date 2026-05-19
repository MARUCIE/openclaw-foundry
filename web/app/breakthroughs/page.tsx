'use client';

// 蜕变墙 (Breakthroughs) — dedicated route page.
// Pairs with /wall (卡点墙). Same data model, inverted visual hierarchy:
// /wall      → before_state and after_method shown flat side-by-side (problem-centric)
// /breakthroughs → after_method dominant + before_state recedes (transformation arc)
//
// Design spec: design/breakthroughs/spec.md
// v6: header CTA "提交你的蜕变" routes to /wall posting form — single posting
// entry point preserved (anti-pattern #3 in spec). Mock entries shown below
// are seed examples per Maurice intent; live /api/wall wire is next-cycle.

import { useEffect, useState } from 'react';
import Link from 'next/link';
import BreakthroughWall from '@/components/breakthrough-wall';
import { readSession, loginRedirect } from '@/lib/session';

export default function BreakthroughsPage() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [authReady, setAuthReady] = useState(false);
  useEffect(() => {
    setIsLoggedIn(readSession().user !== null);
    setAuthReady(true);
  }, []);

  const ctaHref = isLoggedIn ? '/wall#post' : loginRedirect('/wall#post');
  const ctaLabel = !authReady ? '...' : isLoggedIn ? '提交你的蜕变 ▶' : '登录后提交你的蜕变 ▶';

  return (
    <div className="page-shell py-12 space-y-10">
      {/* Header — parallels /wall structure + prominent post CTA */}
      <div className="flex items-start gap-4 flex-wrap">
        <div className="w-2 h-12 rounded-full shrink-0" style={{ background: 'var(--primary)' }} />
        <div className="flex-1 min-w-0">
          <h1 className="text-4xl md:text-5xl font-black tracking-tight text-balance" style={{ color: 'var(--on-surface)' }}>
            蜕变墙
          </h1>
          <p className="text-sm font-bold uppercase tracking-widest opacity-50 mt-1">
            同伴公开的蜕变案例 — 把卡点翻成蜕变
          </p>
        </div>
        <Link
          href={ctaHref}
          className="inline-flex items-center gap-2 px-5 py-3 rounded-2xl font-bold text-sm shrink-0 transition-all shadow-lg hover:shadow-xl active:scale-95"
          style={{ background: 'var(--primary)', color: 'white', opacity: authReady ? 1 : 0.6 }}
        >
          <span aria-hidden="true" className="material-symbols-outlined text-base">auto_awesome</span>
          {ctaLabel}
        </Link>
      </div>

      {/* Cohort-intent context — bridge to /wall posting flow */}
      <p className="text-sm opacity-70 leading-relaxed">
        ↓ 下面是工作坊战友的蜕变案例（含示例 + 真实）。蜕变的起点是{' '}
        <Link href="/wall" className="font-bold underline" style={{ color: 'var(--primary)' }}>
          卡点墙
        </Link>{' '}
        —— 先公开你的卡点，解决之后会自动汇聚到这里。点击「提交你的蜕变」后，你会先填写一个卡点 —— 解决后它就自动出现在这里。
      </p>

      <BreakthroughWall />
    </div>
  );
}
