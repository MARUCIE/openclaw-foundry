'use client';

// /wall/detail?id=<entryId> — Single workflow-stickwall entry + comments + like toggle.
// Uses query-param instead of [id] dynamic route because output: "export" forbids
// pre-rendering of paths created at runtime in D1.
//
// v9 sync: comment + like POSTs now use Bearer session (matching worker requireAuth);
// the legacy X-Anon-UID header is preserved on the anon_uid_hash display path only —
// it is no longer a write credential.

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import useSWR, { mutate } from 'swr';
import { ROLE_OPTIONS } from '@/components/wall-board';
import { API_BASE } from '@/lib/api-base';

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
  } catch { /* localStorage unavailable */ }
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

function loginReturnHref(): string {
  if (typeof window === 'undefined') return '/login';
  const ret = window.location.pathname + window.location.search;
  return `/login?return=${encodeURIComponent(ret)}`;
}

interface WallEntry {
  id: string;
  anon_uid_hash: string;
  role_slug: string | null;
  before_state: string;
  after_method: string;
  suggestion: string | null;
  created_at: string;
  user_id?: string | null;
  like_count: number;
  liked: 0 | 1;
}
interface WallComment {
  id: string;
  anon_uid_hash: string;
  body: string;
  created_at: string;
  user_id?: string | null;
}

function makeFetcher(token: string) {
  return async (url: string): Promise<{ entry: WallEntry; comments: WallComment[] }> => {
    const headers: Record<string, string> = {};
    if (token) headers.Authorization = `Bearer ${token}`;
    const r = await fetch(url, { headers });
    if (!r.ok) throw new Error(`HTTP ${r.status}`);
    return r.json();
  };
}

function WallDetailInner() {
  const sp = useSearchParams();
  const router = useRouter();
  const id = sp?.get('id') || '';

  const [sessionToken, setSessionToken] = useState('');
  const [user, setUser] = useState<SessionUser | null>(null);
  // Track the entry point so back-navigation returns where the user came from
  // (/packs#wall when entered via the inline tab, /wall otherwise).
  const [backHref, setBackHref] = useState('/wall');
  useEffect(() => {
    const { token, user: cached } = readSession();
    setSessionToken(token);
    setUser(cached);
    if (typeof document !== 'undefined' && document.referrer) {
      try {
        const ref = new URL(document.referrer);
        if (ref.origin === window.location.origin && (ref.pathname === '/packs' || ref.pathname.startsWith('/packs'))) {
          setBackHref('/packs#wall');
        }
      } catch {
        // referrer parse failure → keep default /wall
      }
    }
  }, []);

  const handleBack = (e: React.MouseEvent<HTMLAnchorElement>) => {
    if (typeof window !== 'undefined' && window.history.length > 1) {
      e.preventDefault();
      router.back();
    }
  };

  const apiUrl = id ? `${API_BASE}/api/wall/${id}` : null;
  const { data, error, isLoading } = useSWR<{ entry: WallEntry; comments: WallComment[] }>(
    apiUrl,
    makeFetcher(sessionToken),
    { refreshInterval: 30000 },
  );

  const [body, setBody] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [likePending, setLikePending] = useState(false);

  async function handleComment(e: React.FormEvent) {
    e.preventDefault();
    if (!body.trim() || !id) return;
    if (!sessionToken) {
      setSubmitError('请先登录后再评论');
      return;
    }
    setSubmitting(true);
    setSubmitError(null);
    try {
      const r = await fetch(`${API_BASE}/api/wall/${id}/comment`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${sessionToken}` },
        body: JSON.stringify({ body }),
      });
      if (r.status === 401) {
        clearSession();
        setSessionToken('');
        setUser(null);
        throw new Error('登录已失效，请重新登录');
      }
      if (!r.ok) {
        const t = await r.text();
        throw new Error(`HTTP ${r.status}: ${t.slice(0, 200)}`);
      }
      setBody('');
      if (apiUrl) mutate(apiUrl);
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : '提交失败');
    } finally {
      setSubmitting(false);
    }
  }

  async function handleLike() {
    if (!sessionToken) {
      window.location.href = loginReturnHref();
      return;
    }
    if (!id || likePending) return;
    setLikePending(true);
    // Optimistic flip
    mutate(apiUrl, (curr: { entry: WallEntry; comments: WallComment[] } | undefined) => {
      if (!curr) return curr;
      return {
        ...curr,
        entry: {
          ...curr.entry,
          liked: (curr.entry.liked ? 0 : 1) as 0 | 1,
          like_count: curr.entry.like_count + (curr.entry.liked ? -1 : 1),
        },
      };
    }, { revalidate: false });
    try {
      const r = await fetch(`${API_BASE}/api/wall/${id}/like`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${sessionToken}` },
      });
      if (r.status === 401) {
        clearSession();
        setSessionToken('');
        setUser(null);
      }
      if (apiUrl) mutate(apiUrl);
    } catch {
      if (apiUrl) mutate(apiUrl);
    } finally {
      setLikePending(false);
    }
  }

  if (!id) {
    return (
      <div className="page-shell py-12">
        <p className="text-sm opacity-60">缺少卡点 id。<Link href={backHref} onClick={handleBack} className="underline">回到墙</Link></p>
      </div>
    );
  }

  return (
    <div className="page-shell py-12 space-y-8">
      <Link href={backHref} onClick={handleBack} className="inline-flex items-center gap-2 text-sm font-bold opacity-60 hover:opacity-100">
        ← 回到墙
      </Link>

      {error && (
        <div className="p-4 rounded-xl" style={{ background: '#fee2e2', color: '#991b1b' }}>
          后端暂不可达：{(error as Error).message}
        </div>
      )}
      {isLoading && <div className="h-64 rounded-[1.5rem] animate-pulse bg-[var(--surface-container-low)]" />}

      {data?.entry && (
        <article className="p-8 rounded-[2rem] space-y-6" style={{ background: 'var(--surface-container-lowest)', border: '1px solid var(--outline-variant)' }}>
          <header className="flex items-center gap-3 text-xs font-bold opacity-60 uppercase tracking-widest">
            <span>#{data.entry.id.slice(0, 6)}</span>
            <span>·</span>
            <span>{new Date(data.entry.created_at).toLocaleString('zh-CN')}</span>
            {data.entry.role_slug && (
              <>
                <span>·</span>
                <span className="px-2 py-0.5 rounded" style={{ background: 'var(--surface-container)' }}>
                  {ROLE_OPTIONS.find(o => o.id === data.entry.role_slug)?.label || data.entry.role_slug}
                </span>
              </>
            )}
            <span>·</span>
            <span>匿名{user && data.entry.user_id && data.entry.user_id === user.id ? '（你发的）' : ''}</span>
          </header>
          <section>
            <h3 className="text-xs font-black uppercase tracking-widest opacity-60 mb-2">Before · 卡在哪</h3>
            <p className="text-base leading-relaxed whitespace-pre-wrap">{data.entry.before_state}</p>
          </section>
          <section>
            <h3 className="text-xs font-black uppercase tracking-widest opacity-60 mb-2">After · 试过的方法</h3>
            <p className="text-base leading-relaxed whitespace-pre-wrap">{data.entry.after_method}</p>
          </section>
          {data.entry.suggestion && (
            <section>
              <h3 className="text-xs font-black uppercase tracking-widest opacity-60 mb-2">建议 / 想问的</h3>
              <p className="text-base leading-relaxed whitespace-pre-wrap">{data.entry.suggestion}</p>
            </section>
          )}
          <footer className="flex items-center gap-3 pt-2 border-t" style={{ borderColor: 'var(--outline-variant)' }}>
            <button
              type="button"
              onClick={handleLike}
              disabled={likePending}
              aria-pressed={data.entry.liked === 1}
              aria-label={data.entry.liked === 1 ? '取消点赞' : '点赞'}
              className="inline-flex items-center gap-2 px-3 py-2 rounded-xl transition-all hover:bg-[var(--surface-container)] disabled:opacity-50 text-sm font-bold"
              style={{ color: data.entry.liked ? 'var(--primary)' : 'inherit', opacity: data.entry.liked ? 1 : 0.7 }}
            >
              <span aria-hidden="true" className="material-symbols-outlined text-base" style={{ fontVariationSettings: data.entry.liked ? "'FILL' 1" : "'FILL' 0" }}>
                favorite
              </span>
              <span>{data.entry.like_count || 0}</span>
              <span className="opacity-70">{data.entry.liked ? '已赞' : '点赞'}</span>
            </button>
            {!sessionToken && (
              <span className="text-xs opacity-50">登录后可点赞和评论</span>
            )}
          </footer>
        </article>
      )}

      {data?.entry && (
        <section className="space-y-4">
          <h2 className="text-xl font-black tracking-tight">评论（{data.comments?.length || 0}）</h2>
          {(data.comments || []).map(c => (
            <div key={c.id} className="p-5 rounded-[1.2rem]" style={{ background: 'var(--surface-container-lowest)', border: '1px solid var(--outline-variant)' }}>
              <div className="flex items-center gap-3 text-xs font-bold opacity-50 mb-2">
                <span>匿名{user && c.user_id && c.user_id === user.id ? '（你）' : ''}</span>
                <span>·</span>
                <span>{new Date(c.created_at).toLocaleString('zh-CN')}</span>
              </div>
              <p className="text-sm leading-relaxed whitespace-pre-wrap">{c.body}</p>
            </div>
          ))}

          {!sessionToken ? (
            <div className="p-6 rounded-[1.5rem] flex items-center gap-4" style={{ background: 'var(--surface-container-low)', border: '1px solid var(--outline-variant)' }}>
              <span aria-hidden="true" className="material-symbols-outlined" style={{ color: 'var(--primary)' }}>lock</span>
              <div className="flex-1 space-y-1">
                <p className="text-sm font-bold">登录后可评论</p>
                <p className="text-xs opacity-60">只有验证邮箱的成员可以评论——浏览无需登录。</p>
              </div>
              <Link
                href={loginReturnHref()}
                className="px-4 py-2 rounded-xl font-bold text-sm transition-all shadow-md hover:shadow-lg"
                style={{ background: 'var(--primary)', color: 'white' }}
              >
                邮箱登录
              </Link>
            </div>
          ) : (
            <form onSubmit={handleComment} className="p-6 rounded-[1.5rem] space-y-4" style={{ background: 'var(--surface-container-low)', border: '1px solid var(--outline-variant)' }}>
              <h3 className="text-sm font-black uppercase tracking-widest opacity-70">写一条评论</h3>
              <textarea
                value={body} onChange={(e) => setBody(e.target.value)}
                rows={3} maxLength={1500}
                className="w-full px-4 py-3 rounded-xl border bg-[var(--surface-container-lowest)] text-sm"
                style={{ borderColor: 'var(--outline-variant)' }}
                placeholder="例：我们上季度遇到同样问题，解法是 X，前提是 Y..."
              />
              {submitError && (
                <div className="text-sm px-3 py-2 rounded-xl" style={{ background: '#fee2e2', color: '#991b1b' }}>{submitError}</div>
              )}
              <div className="flex items-center gap-4">
                <button
                  type="submit" disabled={submitting || !body.trim()}
                  className="px-6 py-2.5 rounded-xl font-bold text-sm transition-all disabled:opacity-50"
                  style={{ background: 'var(--primary-container)', color: 'var(--on-primary)' }}
                >
                  {submitting ? '提交中...' : '匿名发布'}
                </button>
                <span className="text-xs opacity-50">已验证邮箱发布，匿名展示，仅你本人看到 "（你）" 标记。</span>
              </div>
            </form>
          )}
        </section>
      )}
    </div>
  );
}

export default function WallDetailPage() {
  return (
    <Suspense fallback={<div className="page-shell py-12 opacity-60 text-sm">加载中…</div>}>
      <WallDetailInner />
    </Suspense>
  );
}
