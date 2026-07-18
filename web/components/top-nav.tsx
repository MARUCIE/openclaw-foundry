'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useI18n, LanguageSwitcher } from '@/lib/i18n';
import { API_BASE } from '@/lib/api-base';

interface SessionUser {
  id: string;
  email: string;
  display_name: string | null;
}

function readSessionUser(): SessionUser | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = window.localStorage.getItem('openclaw_session_user');
    return raw ? (JSON.parse(raw) as SessionUser) : null;
  } catch {
    return null;
  }
}

function readSessionToken(): string {
  if (typeof window === 'undefined') return '';
  try { return window.localStorage.getItem('openclaw_session_token') || ''; } catch { return ''; }
}

function clearSession() {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.removeItem('openclaw_session_token');
    window.localStorage.removeItem('openclaw_session_user');
    window.localStorage.removeItem('openclaw_session_expires');
  } catch { /* ignore */ }
}

// 2026-05-16 cohort-focus IA: 3-advisor swarm (Hara + Jobs + Godin) converged
// unanimously — remove /api-docs, /arena, /explore/platforms from nav. Cohort
// use case = browse + install skills/packs; nav must signal "this is for you"
// not "this is a developer platform". Audit: outputs/reports/research-learning-swarm/
// 2026-05-16-skill-pipeline-audit.{md,html}
const NAV_ITEMS = [
  { href: '/', key: 'nav.home' },
  { href: '/packs', key: 'nav.packs' },
  // 2026-05-16 cohort feedback channel — Before/After workflow stickwall;
  // anonymous entries + comments, backed by Worker D1 v7. Sits AFTER packs
  // because the use sequence is install pack → hit blocker → post to wall.
  { href: '/wall', key: 'nav.wall' },
  // 2026-05-18 蜕变墙 (Breakthroughs) — same data model as /wall, inverted
  // visual hierarchy (after_method hero, before_state recedes). Pairs with
  // /wall: cohort posts stuck-points there → solved entries become public
  // breakthroughs here. Sits AFTER wall because the narrative arc is
  // problem → transformation.
  { href: '/breakthroughs', key: 'nav.breakthroughs' },
];

export function TopNav() {
  const pathname = usePathname();
  const { t } = useI18n();
  const ctaHref = '/packs';
  const ctaLabel = t('nav.getStarted');

  const [user, setUser] = useState<SessionUser | null>(null);
  const [authReady, setAuthReady] = useState(false);
  useEffect(() => {
    setUser(readSessionUser());
    setAuthReady(true);
    // Listen for cross-tab login/logout so badge updates without page reload.
    const onStorage = (e: StorageEvent) => {
      if (e.key === 'openclaw_session_user' || e.key === 'openclaw_session_token') {
        setUser(readSessionUser());
      }
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, []);

  async function handleLogout() {
    const token = readSessionToken();
    if (token) {
      try {
        await fetch(`${API_BASE}/api/auth/logout`, {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}` },
        });
      } catch { /* network may fail; clearSession still applies locally */ }
    }
    clearSession();
    setUser(null);
    // Soft refresh — keep current page but UI updates immediately
    if (typeof window !== 'undefined') window.location.assign(window.location.pathname + window.location.hash);
  }

  const emailPrefix = user?.email?.split('@')[0] || '';

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
                  fontFamily: 'var(--font-inter), system-ui, sans-serif',
                  color: isActive ? 'var(--surface-tint)' : 'var(--on-surface-variant)',
                }}
              >
                {t(item.key)}
              </Link>
            );
          })}
        </div>

        {/* CTA + auth badge */}
        <div className="flex items-center gap-3">
          <LanguageSwitcher />
          {authReady && !user && (
            <Link
              href="/login?return=/packs#wall"
              className="px-4 py-2 rounded-xl font-bold text-[13px] transition-all"
              style={{
                background: 'var(--surface-container)',
                color: 'var(--on-surface)',
                fontFamily: 'var(--font-inter), system-ui, sans-serif',
              }}
            >
              {t('nav.signIn')}
            </Link>
          )}
          {user && (
            <div
              className="flex items-center gap-2 px-3 py-2 rounded-xl text-[13px] font-bold"
              style={{
                background: 'var(--surface-container)',
                color: 'var(--on-surface)',
                fontFamily: 'var(--font-inter), system-ui, sans-serif',
              }}
              title={user.email}
            >
              <span className="opacity-85">{emailPrefix}@···</span>
              <button
                type="button"
                onClick={handleLogout}
                className="text-[var(--on-surface-variant)] hover:text-[var(--primary)] ml-1 underline-offset-2 hover:underline"
              >
                {t('nav.signOut')}
              </button>
            </div>
          )}
          <Link
            href={ctaHref}
            className="px-6 py-2.5 rounded-xl font-bold text-sm active:scale-95 transition-all duration-150"
            style={{
              background: 'var(--primary-container)',
              color: 'var(--on-primary)',
              fontFamily: 'var(--font-inter), system-ui, sans-serif',
            }}
          >
            {ctaLabel}
          </Link>
        </div>
      </div>
    </nav>
  );
}
