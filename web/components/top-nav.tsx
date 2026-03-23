'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const NAV_ITEMS = [
  { href: '/explore/platforms', label: '部署' },
  { href: '/explore/skills', label: '导航' },
  { href: '/news', label: '资讯' },
  { href: '/arena', label: '竞技场' },
  { href: '/pricing', label: '定价' },
];

export function TopNav() {
  const pathname = usePathname();

  return (
    <nav
      className="fixed top-0 w-full z-50 shadow-[0px_20px_40px_rgba(25,27,35,0.06)]"
      style={{
        background: 'rgba(250, 248, 255, 0.8)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
      }}
    >
      <div className="flex justify-between items-center px-6 md:px-12 h-20 max-w-[1440px] mx-auto">
        {/* Logo */}
        <Link
          href="/"
          className="text-2xl font-black tracking-tighter font-headline"
          style={{ color: 'var(--primary)' }}
        >
          OpenClaw Foundry
        </Link>

        {/* Center nav links */}
        <div className="hidden md:flex items-center gap-8 desktop-nav">
          {NAV_ITEMS.map(item => {
            const isActive = pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className="nav-link font-semibold tracking-tight text-sm py-1"
                data-active={isActive ? 'true' : undefined}
                style={{
                  fontFamily: 'Manrope, sans-serif',
                  color: isActive ? 'var(--surface-tint)' : 'var(--on-surface-variant)',
                }}
              >
                {item.label}
              </Link>
            );
          })}
        </div>

        {/* CTA */}
        <div className="flex items-center gap-4">
          <Link
            href="/explore/platforms"
            className="px-6 py-2.5 rounded-xl font-bold text-sm active:scale-95 transition-all duration-150"
            style={{
              background: 'var(--primary-container)',
              color: 'var(--on-primary)',
              fontFamily: 'Manrope, sans-serif',
            }}
          >
            开始使用
          </Link>
        </div>
      </div>
    </nav>
  );
}
