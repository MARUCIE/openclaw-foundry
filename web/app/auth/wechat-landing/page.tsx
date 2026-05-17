'use client';

// /auth/wechat-landing?code=...&state=... — Enterprise WeChat OAuth callback.
// This is the redirect_uri configured in the WeChat self-built app trusted-domain panel.
// Flow: WeChat bounces here with ?code → fetch /api/auth/wechat/exchange on Worker →
// receive Bearer + user → persist to localStorage (same keys as email magic-link
// flow, so wall-board + top-nav don't care which provider was used) → redirect to
// the return URL embedded in the state.

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';

const API_BASE =
  process.env.NEXT_PUBLIC_API_BASE ||
  process.env.NEXT_PUBLIC_API_URL ||
  'https://openclaw-foundry-api.maoyuan-wen-683.workers.dev';

interface ExchangeResponse {
  bearer_token?: string;
  expires_at?: string;
  user?: {
    id: string;
    email: string;
    display_name: string | null;
    email_verified_at: string;
  };
  return_to?: string;
  provider?: string;
  error?: string;
  detail?: string;
}

function WechatLandingInner() {
  const sp = useSearchParams();
  const router = useRouter();
  const code = sp?.get('code') || '';
  const state = sp?.get('state') || '';
  const [status, setStatus] = useState<'consuming' | 'success' | 'error'>('consuming');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    if (!code) {
      setStatus('error');
      setErrorMsg('链接缺少 code 参数（你可能取消了企业微信授权）');
      const t = setTimeout(() => router.replace('/login?error=wechat_cancelled'), 1500);
      return () => clearTimeout(t);
    }
    let cancelled = false;
    (async () => {
      try {
        const url = `${API_BASE}/api/auth/wechat/exchange?code=${encodeURIComponent(code)}&state=${encodeURIComponent(state)}`;
        const r = await fetch(url);
        const data: ExchangeResponse = await r.json().catch(() => ({} as ExchangeResponse));
        if (cancelled) return;
        if (!r.ok || !data.bearer_token) {
          throw new Error(data.error || data.detail || `HTTP ${r.status}`);
        }
        try {
          window.localStorage.setItem('openclaw_session_token', data.bearer_token);
          if (data.user) {
            window.localStorage.setItem('openclaw_session_user', JSON.stringify(data.user));
          }
          if (data.expires_at) {
            window.localStorage.setItem('openclaw_session_expires', data.expires_at);
          }
        } catch (storageErr) {
          console.warn('localStorage unavailable; session will not persist beyond this tab', storageErr);
        }
        setStatus('success');
        const returnTo = data.return_to && data.return_to.startsWith('/') ? data.return_to : '/packs#wall';
        const t = setTimeout(() => {
          window.location.assign(returnTo);
        }, 600);
        return () => clearTimeout(t);
      } catch (err) {
        if (cancelled) return;
        const msg = err instanceof Error ? err.message : '企业微信登陆失败';
        setStatus('error');
        setErrorMsg(msg);
        const t = setTimeout(() => router.replace('/login?error=wechat_failed'), 1800);
        return () => clearTimeout(t);
      }
    })();
    return () => { cancelled = true; };
  }, [code, state, router]);

  return (
    <div className="page-shell py-24 max-w-xl">
      <div
        className="p-10 rounded-[2rem] text-center space-y-5"
        style={{ background: 'var(--surface-container-low)', border: '1px solid var(--outline-variant)' }}
      >
        {status === 'consuming' && (
          <>
            <div
              className="w-16 h-16 rounded-full mx-auto flex items-center justify-center animate-pulse"
              style={{ background: 'var(--surface-container)', color: 'var(--primary)' }}
            >
              <span aria-hidden="true" className="material-symbols-outlined text-3xl">qr_code_scanner</span>
            </div>
            <h2 className="text-xl font-black tracking-tight">正在验证企业微信授权…</h2>
          </>
        )}
        {status === 'success' && (
          <>
            <div
              className="w-16 h-16 rounded-full mx-auto flex items-center justify-center"
              style={{ background: 'var(--primary)', color: 'white' }}
            >
              <span aria-hidden="true" className="material-symbols-outlined text-3xl">check_circle</span>
            </div>
            <h2 className="text-xl font-black tracking-tight">企业微信登陆成功，正在跳转…</h2>
          </>
        )}
        {status === 'error' && (
          <>
            <div
              className="w-16 h-16 rounded-full mx-auto flex items-center justify-center"
              style={{ background: '#fee2e2', color: '#991b1b' }}
            >
              <span aria-hidden="true" className="material-symbols-outlined text-3xl">error</span>
            </div>
            <h2 className="text-xl font-black tracking-tight">企业微信登陆失败</h2>
            <p className="text-sm opacity-70">{errorMsg}</p>
            <p className="text-xs opacity-50">即将跳转回登陆页…</p>
          </>
        )}
      </div>
    </div>
  );
}

export default function WechatLandingPage() {
  return (
    <Suspense fallback={<div className="page-shell py-12 opacity-60 text-sm">加载中…</div>}>
      <WechatLandingInner />
    </Suspense>
  );
}
