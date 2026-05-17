'use client';

// Whole-site login wall. Wraps the entire app shell. If the user has no
// session token in localStorage and is requesting anything other than the
// auth flow itself (/login + /auth/callback), redirect to /login with a
// `return=<current-path-with-search-and-hash>` query so they land back here
// after successful sign-in.
//
// Reads/writes split: this guard only protects the UI surface. The Worker
// API (/api/wall GET etc.) still serves public reads — but the user can't
// reach the UI to see them unauthenticated. Writes (POST /api/wall) remain
// gated by requireAuth() on the server side as defense-in-depth.

import { useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';

const PUBLIC_PATHS = ['/login', '/auth/callback'];

function isPublicPath(pathname: string): boolean {
  return PUBLIC_PATHS.some(
    (p) => pathname === p || pathname.startsWith(p + '/')
  );
}

function hasSessionToken(): boolean {
  if (typeof window === 'undefined') return false;
  try {
    return !!window.localStorage.getItem('openclaw_session_token');
  } catch {
    return false;
  }
}

export function SiteGuard({ children }: { children: React.ReactNode }) {
  const pathname = usePathname() || '/';
  const router = useRouter();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (isPublicPath(pathname)) {
      setReady(true);
      return;
    }
    if (hasSessionToken()) {
      setReady(true);
      return;
    }
    // Unauthenticated visit to a gated path → bounce to /login with return URL
    const returnTo =
      pathname +
      (typeof window !== 'undefined' ? window.location.search + window.location.hash : '');
    router.replace(`/login?return=${encodeURIComponent(returnTo)}`);
    // Stay in "verifying" overlay until navigation happens
  }, [pathname, router]);

  // Cross-tab logout: if another tab clears the token, re-evaluate this tab
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const onStorage = (e: StorageEvent) => {
      if (e.key !== 'openclaw_session_token') return;
      if (isPublicPath(pathname)) return;
      if (!hasSessionToken()) {
        setReady(false);
        const returnTo =
          pathname + window.location.search + window.location.hash;
        router.replace(`/login?return=${encodeURIComponent(returnTo)}`);
      }
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, [pathname, router]);

  if (!ready) {
    return (
      <div
        className="min-h-dvh flex items-center justify-center"
        style={{ background: 'rgba(250, 248, 255, 0.6)' }}
        aria-live="polite"
      >
        <div className="flex flex-col items-center gap-3 opacity-70">
          <span aria-hidden="true" className="material-symbols-outlined text-3xl animate-pulse">lock</span>
          <p className="text-sm font-bold tracking-tight">验证登陆状态…</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
