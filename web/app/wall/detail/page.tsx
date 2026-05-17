'use client';

// /wall/detail?id=<entryId> — Single workflow-stickwall entry + anonymous comments.
// Uses query-param instead of [id] dynamic route because output: "export" forbids
// pre-rendering of paths created at runtime in D1.

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import useSWR, { mutate } from 'swr';

const API_BASE = process.env.NEXT_PUBLIC_API_BASE || process.env.NEXT_PUBLIC_API_URL || 'https://openclaw-foundry-api.maoyuan-wen-683.workers.dev';

function getAnonUid(): string {
  if (typeof window === 'undefined') return '';
  let id = window.localStorage.getItem('openclaw_wall_anon_uid');
  if (!id) {
    id = (crypto.randomUUID && crypto.randomUUID()) || `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
    window.localStorage.setItem('openclaw_wall_anon_uid', id);
  }
  return id;
}

interface WallEntry {
  id: string;
  anon_uid_hash: string;
  role_slug: string | null;
  before_state: string;
  after_method: string;
  suggestion: string | null;
  created_at: string;
}
interface WallComment {
  id: string;
  anon_uid_hash: string;
  body: string;
  created_at: string;
}

async function fetcher(url: string): Promise<{ entry: WallEntry; comments: WallComment[] }> {
  const r = await fetch(url);
  if (!r.ok) throw new Error(`HTTP ${r.status}`);
  return r.json();
}

function WallDetailInner() {
  const sp = useSearchParams();
  const router = useRouter();
  const id = sp?.get('id') || '';

  const [anonUid, setAnonUid] = useState('');
  // Track the entry point so back-navigation returns where the user came from
  // (/packs#wall when entered via the inline tab, /wall otherwise).
  const [backHref, setBackHref] = useState('/wall');
  useEffect(() => {
    setAnonUid(getAnonUid());
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
  const { data, error, isLoading } = useSWR<{ entry: WallEntry; comments: WallComment[] }>(apiUrl, fetcher, {
    refreshInterval: 30000,
  });

  const [body, setBody] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  async function handleComment(e: React.FormEvent) {
    e.preventDefault();
    if (!body.trim() || !id) return;
    setSubmitting(true);
    setSubmitError(null);
    try {
      const r = await fetch(`${API_BASE}/api/wall/${id}/comment`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-Anon-UID': anonUid },
        body: JSON.stringify({ body }),
      });
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
                <span className="px-2 py-0.5 rounded" style={{ background: 'var(--surface-container)' }}>{data.entry.role_slug}</span>
              </>
            )}
            <span>·</span>
            <span>匿名{data.entry.anon_uid_hash === anonUid ? '（你发的）' : ''}</span>
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
        </article>
      )}

      {data?.entry && (
        <section className="space-y-4">
          <h2 className="text-xl font-black tracking-tight">评论（{data.comments?.length || 0}）</h2>
          {(data.comments || []).map(c => (
            <div key={c.id} className="p-5 rounded-[1.2rem]" style={{ background: 'var(--surface-container-lowest)', border: '1px solid var(--outline-variant)' }}>
              <div className="flex items-center gap-3 text-xs font-bold opacity-50 mb-2">
                <span>匿名{c.anon_uid_hash === anonUid ? '（你）' : ''}</span>
                <span>·</span>
                <span>{new Date(c.created_at).toLocaleString('zh-CN')}</span>
              </div>
              <p className="text-sm leading-relaxed whitespace-pre-wrap">{c.body}</p>
            </div>
          ))}

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
              <span className="text-xs opacity-50">同一浏览器的 anon UID 评论会显示"（你）"</span>
            </div>
          </form>
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
