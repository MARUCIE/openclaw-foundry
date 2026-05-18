'use client';

// WallBoard — shared component rendered in two mounts:
// 1. /wall as a dedicated route (for direct links + sharing)
// 2. /packs as an inline tab ("岗位配置包后面做单独的一个页签")
//
// Backend: Worker /api/wall (see worker/src/routes/wall.ts).
// Auth gate (v8): POST endpoints require Bearer session — only verified-email users
// can post entries + comments. GET endpoints stay public. Identity is derived from
// the Bearer session; the WallBoard reads `openclaw_session_token` from localStorage.

import { useEffect, useState } from 'react';
import Link from 'next/link';
import useSWR, { mutate } from 'swr';

const API_BASE = process.env.NEXT_PUBLIC_API_BASE || process.env.NEXT_PUBLIC_API_URL || 'https://openclaw-foundry-api.maoyuan-wen-683.workers.dev';

interface SessionUser {
  id: string;
  email: string;
  display_name: string | null;
  email_verified_at: string;
}

function readSession(): { token: string; user: SessionUser | null } {
  if (typeof window === 'undefined') return { token: '', user: null };
  let token = '';
  let user: SessionUser | null = null;
  try {
    token = window.localStorage.getItem('openclaw_session_token') || '';
    const raw = window.localStorage.getItem('openclaw_session_user');
    if (raw) user = JSON.parse(raw) as SessionUser;
  } catch {
    // localStorage unavailable — treat as signed out
  }
  return { token, user };
}

function clearSession() {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.removeItem('openclaw_session_token');
    window.localStorage.removeItem('openclaw_session_user');
    window.localStorage.removeItem('openclaw_session_expires');
  } catch { /* ignore */ }
}

interface WallEntry {
  id: string;
  role_slug: string | null;
  before_state: string;
  after_method: string;
  suggestion: string | null;
  created_at: string;
  comment_count: number;
  like_count: number;
  liked: 0 | 1;
  anon_uid_hash: string;
  user_id?: string | null;
}

export const ROLE_OPTIONS = [
  { id: '', label: '不指定岗位' },
  { id: 'backend-engineer', label: '后端工程师' },
  { id: 'frontend-engineer', label: '前端工程师' },
  { id: 'test-engineer', label: '测试工程师' },
  { id: 'infra-engineer', label: '基建工程师' },
  { id: 'ops-engineer', label: '运维工程师' },
  { id: 'algorithm-engineer', label: '算法工程师' },
  { id: 'bigdata-engineer', label: '大数据工程师' },
  { id: 'product-manager', label: '产品经理' },
  { id: 'scenario-planner', label: '场景规划师' },
  { id: 'data-analyst', label: '数据分析师' },
  { id: 'compliance-expert', label: '合规专家' },
  { id: 'executive-strategist', label: '战略主管' },
  { id: 'research-analyst', label: '研究分析师' },
  { id: 'prototype-designer', label: '原型设计师' },
  { id: 'investment-analyst', label: '投资分析师' },
  { id: 'ab-test-analyst', label: 'AB 测试分析师' },
  { id: 'internal-control-specialist', label: '内控专家' },
];

// Fetcher accepts an optional Bearer so the GET /api/wall endpoint can return
// per-user `liked` state. Anonymous browsers still see counts; they just see
// `liked: 0` for every row.
function makeFetcher(token: string) {
  return async (url: string): Promise<{ entries: WallEntry[] }> => {
    const headers: Record<string, string> = {};
    if (token) headers.Authorization = `Bearer ${token}`;
    const r = await fetch(url, { headers });
    if (!r.ok) throw new Error(`HTTP ${r.status}`);
    return r.json();
  };
}

export default function WallBoard() {
  const [sessionToken, setSessionToken] = useState('');
  const [user, setUser] = useState<SessionUser | null>(null);
  const [authReady, setAuthReady] = useState(false);

  // Restore session from localStorage + verify against /api/auth/me on mount.
  useEffect(() => {
    const { token, user: cached } = readSession();
    if (!token) {
      setAuthReady(true);
      return;
    }
    // Optimistic: show cached identity, then re-validate server-side
    setSessionToken(token);
    setUser(cached);
    (async () => {
      try {
        const r = await fetch(`${API_BASE}/api/auth/me`, { headers: { Authorization: `Bearer ${token}` } });
        if (!r.ok) {
          clearSession();
          setSessionToken('');
          setUser(null);
        } else {
          const data = await r.json() as { user: SessionUser };
          if (data.user) setUser(data.user);
        }
      } catch {
        // Network issue — keep cached identity; submit will reveal real auth state
      } finally {
        setAuthReady(true);
      }
    })();
  }, []);

  const swrKey = `${API_BASE}/api/wall?limit=50`;
  const { data, error, isLoading } = useSWR<{ entries: WallEntry[] }>(
    swrKey,
    makeFetcher(sessionToken),
    { refreshInterval: 30000 },
  );

  // Toggle like — optimistic update + revalidate. Anonymous users get redirected
  // to login via the same return-path pattern as the entry form.
  const [likePending, setLikePending] = useState<Record<string, boolean>>({});
  async function handleLike(entryId: string) {
    if (!sessionToken) {
      const ret = typeof window !== 'undefined' ? window.location.pathname + window.location.hash : '/packs#wall';
      window.location.href = `/login?return=${encodeURIComponent(ret)}`;
      return;
    }
    if (likePending[entryId]) return;
    setLikePending(prev => ({ ...prev, [entryId]: true }));
    // Optimistic: flip liked + adjust count immediately.
    mutate(swrKey, (curr: { entries: WallEntry[] } | undefined) => {
      if (!curr) return curr;
      return {
        entries: curr.entries.map(e => e.id !== entryId ? e : {
          ...e,
          liked: (e.liked ? 0 : 1) as 0 | 1,
          like_count: e.like_count + (e.liked ? -1 : 1),
        }),
      };
    }, { revalidate: false });
    try {
      const r = await fetch(`${API_BASE}/api/wall/${entryId}/like`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${sessionToken}` },
      });
      if (r.status === 401) {
        clearSession();
        setSessionToken('');
        setUser(null);
      }
      // Revalidate from server to reconcile concurrent likes from other users.
      mutate(swrKey);
    } catch {
      mutate(swrKey); // rollback by re-fetching truth
    } finally {
      setLikePending(prev => { const n = { ...prev }; delete n[entryId]; return n; });
    }
  }

  const [role, setRole] = useState('');
  const [before, setBefore] = useState('');
  const [after, setAfter] = useState('');
  const [suggestion, setSuggestion] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!sessionToken) {
      setSubmitError('请先登陆后再发布');
      return;
    }
    if (!before.trim() || !after.trim()) {
      setSubmitError('Before 和 After 都不能为空');
      return;
    }
    setSubmitting(true);
    setSubmitError(null);
    try {
      const r = await fetch(`${API_BASE}/api/wall`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${sessionToken}` },
        body: JSON.stringify({ role_slug: role || null, before_state: before, after_method: after, suggestion: suggestion || null }),
      });
      if (r.status === 401) {
        clearSession();
        setSessionToken('');
        setUser(null);
        throw new Error('登陆已失效，请重新登陆');
      }
      if (!r.ok) {
        const t = await r.text();
        throw new Error(`HTTP ${r.status}: ${t.slice(0, 200)}`);
      }
      setBefore(''); setAfter(''); setSuggestion(''); setRole('');
      mutate(`${API_BASE}/api/wall?limit=50`);
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : '提交失败');
    } finally {
      setSubmitting(false);
    }
  }

  const emailPrefix = user?.email?.split('@')[0] || '';

  return (
    <div className="space-y-10">
      {/* Submit form OR logged-out CTA — #post scroll target for header CTA */}
      {authReady && !sessionToken && (
        <section id="post" className="p-8 rounded-[2rem] space-y-5" style={{ background: 'var(--surface-container-low)', border: '1px solid var(--outline-variant)' }}>
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-2xl flex items-center justify-center shrink-0" style={{ background: 'var(--primary)', color: 'white' }}>
              <span aria-hidden="true" className="material-symbols-outlined">lock</span>
            </div>
            <div className="flex-1 space-y-2">
              <h2 className="text-xl font-black tracking-tight">登陆后发布卡点</h2>
              <p className="text-sm leading-relaxed opacity-80">
                只有验证邮箱的成员可以发布卡点和评论。浏览墙面无需登陆——读完整功能需登陆，是为了让你的贡献不被冒名。
              </p>
            </div>
          </div>
          <div>
            <Link
              href={`/login?return=${encodeURIComponent(typeof window !== 'undefined' ? window.location.pathname + window.location.hash : '/packs#wall')}`}
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-sm transition-all shadow-lg hover:shadow-xl"
              style={{ background: 'var(--primary)', color: 'white' }}
            >
              <span aria-hidden="true" className="material-symbols-outlined text-base">mail</span>
              邮箱登陆
            </Link>
          </div>
        </section>
      )}
      {sessionToken && (
      <section id="post" className="p-8 rounded-[2rem] space-y-5" style={{ background: 'var(--surface-container-low)', border: '1px solid var(--outline-variant)' }}>
        <div className="flex items-center justify-between gap-4">
          <h2 className="text-xl font-black tracking-tight">提交新卡点</h2>
          {user && (
            <span className="text-xs font-bold opacity-70 px-3 py-1.5 rounded-full" style={{ background: 'var(--surface-container)' }}>
              {emailPrefix}@···（已验证）
            </span>
          )}
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-black uppercase tracking-widest opacity-60 mb-2">岗位（可选）</label>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value)}
              className="w-full md:w-1/2 px-4 py-2 rounded-xl border bg-[var(--surface-container-lowest)]"
              style={{ borderColor: 'var(--outline-variant)' }}
            >
              {ROLE_OPTIONS.map(o => <option key={o.id} value={o.id}>{o.label}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-black uppercase tracking-widest opacity-60 mb-2">Before · 现在卡在哪？</label>
            <textarea
              value={before} onChange={(e) => setBefore(e.target.value)}
              rows={4} maxLength={2000}
              className="w-full px-4 py-3 rounded-xl border bg-[var(--surface-container-lowest)] text-sm"
              style={{ borderColor: 'var(--outline-variant)' }}
              placeholder="例：业财对账 SQL 跑 12 分钟才出结果，集成 KSF 发票流时对方 API 把 amount 序列化成字符串..."
            />
          </div>
          <div>
            <label className="block text-xs font-black uppercase tracking-widest opacity-60 mb-2">After · 你目前怎么试的？</label>
            <textarea
              value={after} onChange={(e) => setAfter(e.target.value)}
              rows={4} maxLength={2000}
              className="w-full px-4 py-3 rounded-xl border bg-[var(--surface-container-lowest)] text-sm"
              style={{ borderColor: 'var(--outline-variant)' }}
              placeholder="例：加了复合索引 + materialized view，跨库 JOIN 改成两步聚合，但仍然 5 分钟..."
            />
          </div>
          <div>
            <label className="block text-xs font-black uppercase tracking-widest opacity-60 mb-2">建议 / 想问的（可选）</label>
            <textarea
              value={suggestion} onChange={(e) => setSuggestion(e.target.value)}
              rows={2} maxLength={800}
              className="w-full px-4 py-3 rounded-xl border bg-[var(--surface-container-lowest)] text-sm"
              style={{ borderColor: 'var(--outline-variant)' }}
              placeholder="例：有人试过把这种聚合下沉到 DuckDB 吗？"
            />
          </div>
          {submitError && (
            <div className="text-sm font-medium px-4 py-2 rounded-xl" style={{ background: '#fee2e2', color: '#991b1b' }}>
              {submitError}
            </div>
          )}
          <div className="flex items-center gap-4">
            <button
              type="submit" disabled={submitting}
              className="px-6 py-2.5 rounded-xl font-bold text-sm transition-all disabled:opacity-50"
              style={{ background: 'var(--primary-container)', color: 'var(--on-primary)' }}
            >
              {submitting ? '提交中...' : '匿名发布'}
            </button>
            <span className="text-xs opacity-50">已验证邮箱发布，identity 仅以哈希形式公开，仅你本人能看到"（你发的）"标记。</span>
          </div>
        </form>
      </section>
      )}

      {/* List */}
      <section className="space-y-4">
        <h2 className="text-xl font-black tracking-tight">最近 50 条卡点</h2>
        {error && (
          <div className="p-4 rounded-xl" style={{ background: '#fee2e2', color: '#991b1b' }}>
            后端暂不可达：{(error as Error).message}（如果是开发期，先把 worker 部署起来）
          </div>
        )}
        {isLoading && (
          <div className="space-y-3">
            {[1, 2, 3].map(i => <div key={i} className="h-32 rounded-[1.5rem] animate-pulse bg-[var(--surface-container-low)]" />)}
          </div>
        )}
        {!isLoading && data?.entries.length === 0 && (
          <p className="text-sm opacity-60">
            还没有卡点。{sessionToken ? '第一个分享你工作流里的卡点 ↑' : '登陆后第一个来分享你工作流里的卡点。'}
          </p>
        )}
        <div className="space-y-4">
          {(data?.entries || []).map(entry => (
            <article
              key={entry.id}
              className="rounded-[1.5rem] transition-all hover:shadow-lg hover:-translate-y-0.5"
              style={{ background: 'var(--surface-container-lowest)', border: '1px solid var(--outline-variant)' }}
            >
              <Link href={`/wall/detail?id=${entry.id}`} className="block p-6 pb-3">
                <div className="flex items-center gap-3 text-xs opacity-60 mb-2 font-bold uppercase tracking-widest">
                  <span>#{entry.id.slice(0, 6)}</span>
                  <span>·</span>
                  <span>{new Date(entry.created_at).toLocaleString('zh-CN')}</span>
                  {entry.role_slug && (
                    <>
                      <span>·</span>
                      <span className="px-2 py-0.5 rounded" style={{ background: 'var(--surface-container)' }}>
                        {ROLE_OPTIONS.find(o => o.id === entry.role_slug)?.label || entry.role_slug}
                      </span>
                    </>
                  )}
                  <span>·</span>
                  <span>匿名{user && entry.user_id && entry.user_id === user.id ? '（你发的）' : ''}</span>
                </div>
                <div className="text-sm space-y-2">
                  <div>
                    <span className="font-bold opacity-70">Before：</span>
                    {entry.before_state.slice(0, 200)}{entry.before_state.length > 200 ? '...' : ''}
                  </div>
                  <div>
                    <span className="font-bold opacity-70">After：</span>
                    {entry.after_method.slice(0, 200)}{entry.after_method.length > 200 ? '...' : ''}
                  </div>
                </div>
              </Link>
              <div className="flex items-center gap-6 px-6 pb-4 pt-1 text-xs font-bold">
                <button
                  type="button"
                  onClick={() => handleLike(entry.id)}
                  disabled={likePending[entry.id]}
                  aria-pressed={entry.liked === 1}
                  aria-label={entry.liked === 1 ? '取消点赞' : '点赞'}
                  className="inline-flex items-center gap-1.5 px-2 py-1 rounded-lg transition-all hover:bg-[var(--surface-container)] disabled:opacity-50"
                  style={{ color: entry.liked ? 'var(--primary)' : 'inherit', opacity: entry.liked ? 1 : 0.6 }}
                >
                  <span aria-hidden="true" className="material-symbols-outlined text-base" style={{ fontVariationSettings: entry.liked ? "'FILL' 1" : "'FILL' 0" }}>
                    favorite
                  </span>
                  <span>{entry.like_count || 0}</span>
                </button>
                <Link
                  href={`/wall/detail?id=${entry.id}`}
                  className="inline-flex items-center gap-1.5 opacity-60 hover:opacity-100"
                >
                  <span aria-hidden="true" className="material-symbols-outlined text-base">comment</span>
                  <span>{entry.comment_count} 条评论 →</span>
                </Link>
              </div>
            </article>
          ))}
        </div>
        {/* Cross-link to /breakthroughs — solved entries become public breakthroughs */}
        <p className="text-center text-sm opacity-70 pt-6">
          想看大家解决了什么？去{' '}
          <Link href="/breakthroughs" className="font-bold underline" style={{ color: 'var(--primary)' }}>
            蜕变墙
          </Link>
        </p>
      </section>
    </div>
  );
}
