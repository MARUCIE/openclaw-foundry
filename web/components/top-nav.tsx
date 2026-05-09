'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useI18n, LanguageSwitcher } from '@/lib/i18n';

// T4 IA restructure: home IS the Agent Capability Marketplace, so /explore/skills
// is dropped from the visible nav (route still alive as alias for old links).
const NAV_ITEMS = [
  { href: '/', key: 'nav.home', fallback: 'Home' },
  { href: '/packs', key: 'nav.packs', fallback: 'Packs' },
  { href: '/api-docs', key: 'nav.api' },
  { href: '/arena', key: 'nav.arena' },
  { href: '/explore/platforms', key: 'nav.deploy' },
  { href: '/about', key: 'nav.about', fallback: 'About' },
];

export function TopNav() {
  const pathname = usePathname();
  const { t } = useI18n();
  const ctaHref = '/explore/platforms';
  const ctaLabel = t('nav.getStarted');

  return (
    <nav
      className="fixed top-0 w-full z-50 shadow-[0px_20px_40px_rgba(25,27,35,0.06)]"
      style={{
        background: 'rgba(250, 248, 255, 0.8)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
      }}
    >
      <div className="page-shell flex justify-between items-center h-20">
        {/* Logo */}
          <Link
            href="/"
            className="text-2xl font-black tracking-tighter"
            style={{ color: 'var(--primary)' }}
          >
            Agent Foundry
        </Link>

        {/* Center nav links — always visible since home IS the marketplace */}
        <div className="hidden md:flex items-center gap-8 desktop-nav">
          {NAV_ITEMS.map(item => {
            const isActive = item.href === '/' ? pathname === '/' : pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className="nav-link font-semibold tracking-tight text-sm py-1"
                data-active={isActive ? 'true' : undefined}
                style={{
                  fontFamily: 'Inter, system-ui, sans-serif',
                  color: isActive ? 'var(--surface-tint)' : 'var(--on-surface-variant)',
                }}
              >
                {t(item.key) || (item as any).fallback || item.key}
              </Link>
            );
          })}
        </div>

        {/* CTA */}
        <div className="flex items-center gap-4">
          <LanguageSwitcher />
          <Link
            href={ctaHref}
            className="px-6 py-2.5 rounded-xl font-bold text-sm active:scale-95 transition-all duration-150"
            style={{
              background: 'var(--primary-container)',
              color: 'var(--on-primary)',
              fontFamily: 'Inter, system-ui, sans-serif',
            }}
          >
            {ctaLabel}
          </Link>
        </div>
      </div>
    </nav>
  );
}
