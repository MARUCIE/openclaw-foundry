'use client';

// Before/After 卡点墙 — dedicated route page.
// The same board is also rendered inline as a tab on /packs (#wall).
// This route stays for direct links + sharing.
//
// v6: header CTA "提一个卡点" makes intent visible — read = open, post = login.
// 已展示的条目是 cohort seed examples (含 mock + real). 引导大家加自己的.

import { useEffect, useState } from 'react';
import Link from 'next/link';
import WallBoard from '@/components/wall-board';
import { readSession, loginRedirect } from '@/lib/session';

export default function WallPage() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [authReady, setAuthReady] = useState(false);
  useEffect(() => {
    setIsLoggedIn(readSession().user !== null);
    setAuthReady(true);
  }, []);

  const ctaHref = isLoggedIn ? '#post' : loginRedirect('/wall#post');
  const ctaLabel = !authReady ? '...' : isLoggedIn ? '提一个卡点 ▶' : '登录后提一个卡点 ▶';

  return (
    <div className="page-shell py-12 space-y-10">
      {/* Header — with prominent post CTA */}
      <div className="flex items-start gap-4 flex-wrap">
        <div className="w-2 h-12 rounded-full shrink-0" style={{ background: 'var(--primary)' }} />
        <div className="flex-1 min-w-0">
          <h1 className="text-4xl md:text-5xl font-black tracking-tight text-balance" style={{ color: 'var(--on-surface)' }}>
            卡点墙
          </h1>
          <p className="text-sm font-bold uppercase tracking-widest opacity-50 mt-1">
            匿名登记你工作流里的卡点，别人可以回复
          </p>
        </div>
        <Link
          href={ctaHref}
          className="inline-flex items-center gap-2 px-5 py-3 rounded-2xl font-bold text-sm shrink-0 transition-all shadow-lg hover:shadow-xl active:scale-95"
          style={{ background: 'var(--primary)', color: 'white', opacity: authReady ? 1 : 0.6 }}
        >
          <span aria-hidden="true" className="material-symbols-outlined text-base">add_comment</span>
          {ctaLabel}
        </Link>
      </div>

      {/* Cohort-intent context — entries below are seed examples + real cohort posts */}
      <p className="text-sm opacity-70 leading-relaxed">
        ↓ 下面是工作坊战友公开过的卡点（含示例 + 真实）。看到熟悉的场景？{' '}
        <Link href={ctaHref} className="font-bold underline" style={{ color: 'var(--primary)' }}>
          加一个你自己的
        </Link>{' '}
        ， 解决后会自动出现在{' '}
        <Link href="/breakthroughs" className="font-bold underline" style={{ color: 'var(--primary)' }}>
          蜕变墙
        </Link>。
      </p>

      <WallBoard />
    </div>
  );
}
