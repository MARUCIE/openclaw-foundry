'use client';

// /auth/callback?token=... — magic-link consume page.
// Reads ?token from URL, calls /api/auth/consume, persists Bearer in
// localStorage as `openclaw_session_token`, redirects to the return URL.

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';

const API_BASE = process.env.NEXT_PUBLIC_API_BASE || process.env.NEXT_PUBLIC_API_URL || 'https://openclaw-foundry-api.maoyuan-wen-683.workers.dev';

interface ConsumeResponse {
  bearer_token?: string;
  expires_at?: string;
  user?: { id: string; email: string; display_name: string | null; email_verified_at: string };
  error?: string;
}

function CallbackInner() {
  const sp = useSearchParams();
  const router = useRouter();
  const token = sp?.get('token') || '';
  const [status, setStatus] = useState<'consuming' | 'success' | 'error'>('consuming');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    if (!token) {
      setStatus('error');
      setErrorMsg('链接缺少 token 参数');
      const t = setTimeout(() => router.replace('/login?error=invalid'), 1200);
      return () => clearTimeout(t);
    }

    let cancelled = false;
    (async () => {
      try {
        const r = await fetch(`${API_BASE}/api/auth/consume?token=${encodeURIComponent(token)}`);
        const data: ConsumeResponse = await r.json().catch(() => ({} as ConsumeResponse));
        if (cancelled) return;
        if (!r.ok || !data.bearer_token) {
          throw new Error(data.error || `HTTP ${r.status}`);
        }
        // Persist Bearer token + user identity in localStorage
        try {
          window.localStorage.setItem('openclaw_session_token', data.bearer_token);
          if (data.user) {
            window.localStorage.setItem('openclaw_session_user', JSON.stringify(data.user));
          }
          if (data.expires_at) {
            window.localStorage.setItem('openclaw_session_expires', data.expires_at);
          }
        } catch (storageErr) {
          // localStorage unavailable — sign-in cannot persist on this device
          console.warn('localStorage unavailable; session will not persist beyond this tab', storageErr);
        }
        setStatus('success');
        // Recover the return URL set by /login, or default to /packs#wall
        let returnTo = '/packs#wall';
        try {
          const saved = window.localStorage.getItem('openclaw_login_return');
          if (saved && saved.startsWith('/')) returnTo = saved;
          window.localStorage.removeItem('openclaw_login_return');
        } catch { /* keep default */ }
        const t = setTimeout(() => {
          // Use window.location instead of router.replace so the hash (#wall) reliably activates the tab
          window.location.assign(returnTo);
        }, 800);
        return () => clearTimeout(t);
      } catch (err) {
        if (cancelled) return;
        const msg = err instanceof Error ? err.message : '登陆失败';
        setStatus('error');
        setErrorMsg(msg);
        // Map specific server errors to /login query codes
        const code = msg.includes('过期') ? 'expired' : msg.includes('已被使用') ? 'expired' : 'invalid';
        const t = setTimeout(() => router.replace(`/login?error=${code}`), 1800);
        return () => clearTimeout(t);
      }
    })();

    return () => { cancelled = true; };
  }, [token, router]);

  return (
    <div className="page-shell py-24 max-w-xl">
      <div className="p-10 rounded-[2rem] text-center space-y-5" style={{ background: 'var(--surface-container-low)', border: '1px solid var(--outline-variant)' }}>
        {status === 'consuming' && (
          <>
            <div className="w-16 h-16 rounded-full mx-auto flex items-center justify-center animate-pulse" style={{ background: 'var(--surface-container)', color: 'var(--primary)' }}>
              <span aria-hidden="true" className="material-symbols-outlined text-3xl">key</span>
            </div>
            <h2 className="text-xl font-black tracking-tight">正在验证登陆链接…</h2>
          </>
        )}
        {status === 'success' && (
          <>
            <div className="w-16 h-16 rounded-full mx-auto flex items-center justify-center" style={{ background: 'var(--primary)', color: 'white' }}>
              <span aria-hidden="true" className="material-symbols-outlined text-3xl">check_circle</span>
            </div>
            <h2 className="text-xl font-black tracking-tight">登陆成功，正在跳转…</h2>
          </>
        )}
        {status === 'error' && (
          <>
            <div className="w-16 h-16 rounded-full mx-auto flex items-center justify-center" style={{ background: '#fee2e2', color: '#991b1b' }}>
              <span aria-hidden="true" className="material-symbols-outlined text-3xl">error</span>
            </div>
            <h2 className="text-xl font-black tracking-tight">登陆失败</h2>
            <p className="text-sm opacity-70">{errorMsg}</p>
            <p className="text-xs opacity-50">即将跳转回登陆页…</p>
          </>
        )}
      </div>
    </div>
  );
}

export default function AuthCallbackPage() {
  return (
    <Suspense fallback={<div className="page-shell py-12 opacity-60 text-sm">加载中…</div>}>
      <CallbackInner />
    </Suspense>
  );
}
