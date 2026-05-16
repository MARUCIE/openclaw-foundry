'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useI18n, LanguageSwitcher } from '@/lib/i18n';

// 2026-05-16 cohort-focus IA: 3-advisor swarm (Hara + Jobs + Godin) converged
// unanimously — remove /api-docs, /arena, /explore/platforms from nav. Pages
// stay live at URLs for admin/dev direct access. Cohort use case = browse +
// install skills/packs; nav must signal "this is for you" not "this is a
// developer platform". Audit: outputs/reports/research-learning-swarm/
// 2026-05-16-skill-pipeline-audit.{md,html}
const NAV_ITEMS = [
  { href: '/', key: 'nav.home' },
  { href: '/packs', key: 'nav.packs' },
  // 2026-05-16 cohort feedback channel — Before/After workflow stickwall;
  // anonymous entries + comments, backed by Worker D1 v7. Sits AFTER packs
  // because the use sequence is install pack → hit blocker → post to wall.
  { href: '/wall', key: 'nav.wall' },
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
                className="nav-link font-medium tracking-tight text-[13px] py-1"
                data-active={isActive ? 'true' : undefined}
                style={{
                  fontFamily: 'Inter, system-ui, sans-serif',
                  color: isActive ? 'var(--surface-tint)' : 'var(--on-surface-variant)',
                }}
              >
                {t(item.key)}
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
