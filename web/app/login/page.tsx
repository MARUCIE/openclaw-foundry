'use client';

// /login — passwordless email magic-link request page.
// On submit: POST /api/auth/request with {email}. On success: show "已发送，请查收邮箱"
// state with delivery hint. Magic link points to /auth/callback?token=... (handled
// in web/app/auth/callback/page.tsx).

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';

const API_BASE = process.env.NEXT_PUBLIC_API_BASE || process.env.NEXT_PUBLIC_API_URL || 'https://openclaw-foundry-api.maoyuan-wen-683.workers.dev';

const EMAIL_RX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function LoginInner() {
  const sp = useSearchParams();
  const returnTo = sp?.get('return') || '/packs#wall';
  const errorCode = sp?.get('error');

  const [email, setEmail] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [sent, setSent] = useState<{ delivered_via: string; expires_minutes: number } | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Reset error banner on email edit
  useEffect(() => { if (error) setError(null); }, [email]);

  // Map error query → human message
  useEffect(() => {
    if (!errorCode) return;
    const map: Record<string, string> = {
      expired: '链接已过期或被使用，请重新申请',
      invalid: '链接无效，请重新申请',
    };
    setError(map[errorCode] || `登陆失败：${errorCode}`);
  }, [errorCode]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = email.trim().toLowerCase();
    if (!EMAIL_RX.test(trimmed)) {
      setError('请输入有效的邮箱地址');
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      const r = await fetch(`${API_BASE}/api/auth/request`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: trimmed }),
      });
      const data = await r.json().catch(() => ({}));
      if (!r.ok) {
        throw new Error(data.error || `HTTP ${r.status}`);
      }
      // Persist return URL for the callback to redirect to
      try { window.localStorage.setItem('openclaw_login_return', returnTo); } catch { /* localStorage may be unavailable */ }
      setSent({ delivered_via: data.delivered_via || 'unknown', expires_minutes: data.expires_minutes || 15 });
    } catch (err) {
      setError(err instanceof Error ? err.message : '发送失败，请稍后重试');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="page-shell py-12 space-y-10 max-w-2xl">
      {/* Header */}
      <div className="flex items-center gap-4">
        <div className="w-2 h-12 rounded-full" style={{ background: 'var(--primary)' }} />
        <div>
          <h1 className="text-4xl md:text-5xl font-black tracking-tight text-balance" style={{ color: 'var(--on-surface)' }}>
            登陆
          </h1>
          <p className="text-sm font-bold uppercase tracking-widest opacity-50 mt-1">
            Sign in · 邮箱注册即登陆，无需密码
          </p>
        </div>
      </div>

      {!sent && (
        <section className="p-8 rounded-[2rem] space-y-6" style={{ background: 'var(--surface-container-low)', border: '1px solid var(--outline-variant)' }}>
          <div className="space-y-2">
            <h2 className="text-xl font-black tracking-tight">输入邮箱，发送登陆链接</h2>
            <p className="text-sm opacity-70 leading-relaxed">
              我们会发送一封含登陆链接的邮件到你的邮箱，点击即完成登陆——无需设置密码。链接 15 分钟内有效，仅限单次使用。
            </p>
          </div>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-black uppercase tracking-widest opacity-60 mb-2">邮箱</label>
              <input
                type="email" autoComplete="email" required
                value={email} onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border bg-[var(--surface-container-lowest)] text-base"
                style={{ borderColor: 'var(--outline-variant)' }}
                placeholder="你的邮箱地址"
              />
            </div>
            {error && (
              <div className="text-sm px-4 py-3 rounded-xl flex items-start gap-3" style={{ background: '#fee2e2', color: '#991b1b' }}>
                <span aria-hidden="true" className="material-symbols-outlined text-base">error</span>
                <span>{error}</span>
              </div>
            )}
            <div className="flex items-center gap-4">
              <button
                type="submit" disabled={submitting || !email.trim()}
                className="px-6 py-3 rounded-xl font-bold text-sm transition-all disabled:opacity-50 flex items-center gap-2"
                style={{ background: 'var(--primary)', color: 'white' }}
              >
                <span aria-hidden="true" className="material-symbols-outlined text-base">send</span>
                {submitting ? '正在发送...' : '发送登陆链接'}
              </button>
              <Link href={returnTo} className="text-sm font-bold opacity-50 hover:opacity-100">
                ← 返回
              </Link>
            </div>
          </form>
        </section>
      )}

      {sent && (
        <section className="p-8 rounded-[2rem] space-y-5" style={{ background: 'var(--surface-container-low)', border: '1px solid var(--outline-variant)' }}>
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl flex items-center justify-center" style={{ background: 'var(--primary)', color: 'white' }}>
              <span aria-hidden="true" className="material-symbols-outlined">mark_email_read</span>
            </div>
            <h2 className="text-xl font-black tracking-tight">已发送，请查收邮箱</h2>
          </div>
          <p className="text-sm leading-relaxed opacity-80">
            登陆链接已发送到 <strong>{email}</strong>。请在 {sent.expires_minutes} 分钟内点击邮件中的链接完成登陆。
          </p>
          <div className="space-y-3 text-xs opacity-60">
            <p>没收到？检查垃圾邮件文件夹，或 <button onClick={() => setSent(null)} className="underline font-bold opacity-100 hover:text-[var(--primary)]">用别的邮箱试试</button>。</p>
            {sent.delivered_via === 'console_fallback' && (
              <p className="px-3 py-2 rounded-lg" style={{ background: 'var(--surface-container)', color: 'var(--on-surface-variant)' }}>
                <strong>dev notice:</strong> RESEND_API_KEY 暂未配置，邮件改写到 worker 日志。Maurice 上线时 `wrangler secret put RESEND_API_KEY` 后即恢复真实邮件投递。
              </p>
            )}
          </div>
        </section>
      )}
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="page-shell py-12 opacity-60 text-sm">加载中…</div>}>
      <LoginInner />
    </Suspense>
  );
}
