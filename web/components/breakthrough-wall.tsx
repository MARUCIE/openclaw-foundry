'use client';

// BreakthroughWall — cohort transformation arcs.
//
// Shares the WallEntry schema with wall-board.tsx but inverts visual hierarchy:
//   - after_method is the hero (large, bold, top-of-card)
//   - before_state recedes as italic context with "↳" arrow
//   - suggestion (if present) renders as a callout
//   - top 3 comments render inline below (when worker returns top_comments)
//
// v7: wired to live /api/wall with ?include_top_comments=3. SEED_BREAKTHROUGHS
// kept as fallback when live API returns 0 entries (so first cohort visitor
// does not face a blank page). Likes + comment-link delegate to existing
// /api/wall/<id>/like + /wall/detail?id=<id> endpoints — zero new server
// surface beyond the existing wall infrastructure.
//
// Design spec: Projects/22-openclaw-foundry/design/breakthroughs/spec.md

import { useEffect, useState } from 'react';
import Link from 'next/link';
import useSWR, { mutate } from 'swr';
import { ROLE_OPTIONS } from '@/components/wall-board';
import { readSession, clearSession, loginRedirect } from '@/lib/session';

const API_BASE = process.env.NEXT_PUBLIC_API_BASE || process.env.NEXT_PUBLIC_API_URL || 'https://openclaw-foundry-api.maoyuan-wen-683.workers.dev';

interface BreakthroughComment {
  id: string;
  anon_uid_hash: string;
  body: string;
  created_at: string;
  user_id?: string | null;
}

interface BreakthroughEntry {
  id: string;
  role_slug: string | null;
  before_state: string;
  after_method: string;
  suggestion: string | null;
  created_at: string;
  like_count: number;
  comment_count: number;
  liked?: 0 | 1;
  top_comments?: BreakthroughComment[];
  user_id?: string | null;
  _is_seed?: boolean;
}

// SEED_BREAKTHROUGHS — empty-state fallback only. Rendered with the `示例数据`
// badge when live /api/wall returns 0 entries (typically day-1 before any
// cohort post). Marked with _is_seed=true so the interactive bindings know to
// disable (mock IDs would 404 the like endpoint, so we redirect to /wall to
// post a real entry instead of pretending the interaction worked).
const SEED_BREAKTHROUGHS: BreakthroughEntry[] = [
  {
    id: 'seed-1',
    role_slug: 'product-manager',
    before_state: '我之前手动整理用户访谈记录，一份要 8 小时，做 3 份就是一周。每次老板问"用户为什么这样想"我都要现翻笔记，找不到证据。',
    after_method: '我现在每周用 GPT 跑 3 个用户访谈摘要，把原来 1 天的工作压到 1 小时。模板提取「金句 + 情绪标签 + 行为模式」三段式，可以直接贴到 PRD。',
    suggestion: 'Prompt 模板放在 ~/.claude/skills/interview-summarizer 里，自己改 3 行就能跑。访谈录音用 Whisper 转文字（本地 small 模型够用）。',
    created_at: '2026-05-17T14:23:00Z',
    like_count: 12,
    comment_count: 3,
    liked: 0,
    _is_seed: true,
  },
  {
    id: 'seed-2',
    role_slug: 'frontend-engineer',
    before_state: '每次新功能要写 4 套语言（中英日韩），来回切翻译软件 + 复制粘贴，平均一个 sprint 浪费 6 小时在体力活上，还经常漏 key。',
    after_method: '把 i18n key 提取 + 4 语言机翻 + diff review 接到 Claude，一个 commit pre-hook 自动跑完。漏 key 从每周 2-3 个降到 0。',
    suggestion: '关键是用 ast-grep 提取 key 而不是 regex，避免 template string 漏。机翻用 gemini-2.5-pro 比 GPT 准（中日韩有上下文）。',
    created_at: '2026-05-16T09:11:00Z',
    like_count: 8,
    comment_count: 5,
    liked: 0,
    _is_seed: true,
  },
  {
    id: 'seed-3',
    role_slug: 'compliance-expert',
    before_state: '客户问"这个交易要交多少税"我要翻 3 份政策文件 + 1 份省局答疑 + 1 份头部企业实操，平均 45 分钟才能给一个有依据的答案。',
    after_method: '把高频税务问题 + 政策依据建成本地知识库，用 Claude 做 RAG，30 秒出答案 + 引用条款编号。客户感知响应速度提升 90%。',
    suggestion: null,
    created_at: '2026-05-15T16:48:00Z',
    like_count: 15,
    comment_count: 2,
    liked: 0,
    _is_seed: true,
  },
];

function timeAgo(iso: string): string {
  const t = new Date(iso).getTime();
  const diff = Date.now() - t;
  const day = 86400000;
  const hour = 3600000;
  if (diff > 7 * day) return new Date(iso).toLocaleDateString('zh-CN');
  if (diff > day) return `${Math.floor(diff / day)} 天前`;
  if (diff > hour) return `${Math.floor(diff / hour)} 小时前`;
  if (diff > 60000) return `${Math.floor(diff / 60000)} 分钟前`;
  return '刚刚';
}

function makeFetcher(token: string) {
  return async (url: string): Promise<{ entries: BreakthroughEntry[] }> => {
    const headers: Record<string, string> = {};
    if (token) headers.Authorization = `Bearer ${token}`;
    const r = await fetch(url, { headers });
    if (!r.ok) throw new Error(`HTTP ${r.status}`);
    return r.json();
  };
}

interface BreakthroughCardProps {
  entry: BreakthroughEntry;
  sessionToken: string;
  isOwn: boolean;
  onLike: (entryId: string) => void;
  likePending: boolean;
}

function BreakthroughCard({ entry, sessionToken, isOwn, onLike, likePending }: BreakthroughCardProps) {
  const roleLabel = ROLE_OPTIONS.find((o) => o.id === entry.role_slug)?.label || entry.role_slug;
  const isSeed = entry._is_seed === true;
  const detailHref = isSeed ? '/wall' : `/wall/detail?id=${entry.id}`;
  const topComments = entry.top_comments || [];

  return (
    <article
      aria-label={`蜕变案例 ${roleLabel || '匿名'}`}
      className="rounded-2xl p-6 space-y-4 transition-all hover:-translate-y-0.5 hover:shadow-lg"
      style={{
        background: 'var(--surface-container-lowest, white)',
        border: '1px solid var(--surface-tint, #E5E7EB)',
      }}
    >
      {/* Meta row */}
      <div className="flex items-center gap-2 text-xs opacity-60 flex-wrap">
        {entry.role_slug && (
          <>
            <span className="px-2 py-0.5 rounded font-bold" style={{ background: 'var(--surface-container)' }}>
              {roleLabel}
            </span>
            <span aria-hidden="true">·</span>
          </>
        )}
        <span>匿名{isOwn ? '（你发的）' : ''}</span>
        <span aria-hidden="true">·</span>
        <span>{timeAgo(entry.created_at)}</span>
        {isSeed && (
          <>
            <span aria-hidden="true">·</span>
            <span className="px-2 py-0.5 rounded font-bold" style={{ background: 'var(--surface-container)', color: 'var(--primary)' }}>
              示例
            </span>
          </>
        )}
      </div>

      {/* AFTER — hero hierarchy */}
      <div className="space-y-2">
        <div className="text-[11px] font-bold uppercase tracking-widest" style={{ color: 'var(--primary)' }}>
          AFTER · 蜕变后
        </div>
        <p className="text-lg leading-relaxed font-bold" style={{ color: 'var(--on-surface)' }}>
          {entry.after_method}
        </p>
      </div>

      {/* BEFORE — recede as context */}
      <div
        className="text-sm italic leading-relaxed pl-4 border-l-2"
        style={{
          color: 'var(--on-surface)',
          opacity: 0.6,
          borderColor: 'var(--surface-tint, #E5E7EB)',
        }}
      >
        <span aria-hidden="true" className="mr-1 not-italic font-bold opacity-70">↳</span>
        before · {entry.before_state}
      </div>

      {/* Optional SUGGESTION callout */}
      {entry.suggestion && (
        <div
          className="text-sm rounded-lg p-3 leading-relaxed"
          style={{ background: 'var(--surface-container)', color: 'var(--on-surface)' }}
        >
          <span className="font-bold mr-1" aria-hidden="true">💡</span>
          {entry.suggestion}
        </div>
      )}

      {/* Inline top-3 comments — only when worker returns top_comments */}
      {topComments.length > 0 && (
        <div className="space-y-2 pt-1">
          <div className="text-[11px] font-bold uppercase tracking-widest opacity-50">
            评论 · 前 {topComments.length} 条
          </div>
          <ul className="space-y-2">
            {topComments.map((c) => (
              <li
                key={c.id}
                className="text-sm rounded-lg p-2.5 leading-relaxed"
                style={{ background: 'var(--surface-container)', opacity: 0.92 }}
              >
                <div className="flex items-center gap-2 text-[11px] font-bold opacity-50 mb-1">
                  <span>匿名</span>
                  <span aria-hidden="true">·</span>
                  <span>{timeAgo(c.created_at)}</span>
                </div>
                <p className="whitespace-pre-wrap">{c.body}</p>
              </li>
            ))}
          </ul>
          {entry.comment_count > topComments.length && (
            <Link
              href={detailHref}
              className="text-xs font-bold inline-flex items-center gap-1 opacity-70 hover:opacity-100"
              style={{ color: 'var(--primary)' }}
            >
              查看全部 {entry.comment_count} 条评论 →
            </Link>
          )}
        </div>
      )}

      {/* Footer row — reactions */}
      <div className="flex items-center gap-6 pt-2 text-xs font-bold">
        <button
          type="button"
          onClick={() => onLike(entry.id)}
          disabled={likePending || isSeed}
          aria-pressed={entry.liked === 1}
          aria-label={
            isSeed
              ? '示例数据，去卡点墙提一个真实卡点'
              : !sessionToken
              ? '登录后点赞'
              : entry.liked === 1
              ? '取消点赞'
              : '点赞'
          }
          title={isSeed ? '示例数据 — 真实蜕变才能点赞' : undefined}
          className="inline-flex items-center gap-1.5 px-2 py-1 rounded-lg transition-all hover:bg-[var(--surface-container)] disabled:cursor-not-allowed"
          style={{
            color: entry.liked ? 'var(--primary)' : 'inherit',
            opacity: isSeed ? 0.4 : entry.liked ? 1 : 0.6,
          }}
        >
          <span
            aria-hidden="true"
            className="material-symbols-outlined text-base"
            style={{ fontVariationSettings: entry.liked ? "'FILL' 1" : "'FILL' 0" }}
          >
            favorite
          </span>
          <span>{entry.like_count || 0}</span>
        </button>
        {isSeed ? (
          <span
            className="inline-flex items-center gap-1.5 opacity-40 cursor-not-allowed"
            title="示例数据 — 真实蜕变才能评论"
          >
            <span aria-hidden="true" className="material-symbols-outlined text-base">comment</span>
            <span>{entry.comment_count} 条评论</span>
          </span>
        ) : (
          <Link
            href={detailHref}
            className="inline-flex items-center gap-1.5 opacity-60 hover:opacity-100 transition-opacity"
          >
            <span aria-hidden="true" className="material-symbols-outlined text-base">comment</span>
            <span>{entry.comment_count} 条评论 →</span>
          </Link>
        )}
      </div>
    </article>
  );
}

function EmptyState() {
  return (
    <div
      className="rounded-2xl p-12 text-center"
      style={{
        background: 'var(--surface-container)',
        border: '1px dashed var(--surface-tint, #E5E7EB)',
      }}
    >
      <p className="text-lg font-bold mb-2" style={{ color: 'var(--on-surface)' }}>
        还没有蜕变记录
      </p>
      <p className="text-sm opacity-70">
        去{' '}
        <Link href="/wall" className="underline font-bold" style={{ color: 'var(--primary)' }}>
          卡点墙
        </Link>{' '}
        提一个卡点，解决之后就会在这里出现你的蜕变。
      </p>
    </div>
  );
}

export default function BreakthroughWall() {
  const [sessionToken, setSessionToken] = useState('');
  const [userId, setUserId] = useState<string | null>(null);
  const [likePending, setLikePending] = useState<Record<string, boolean>>({});

  useEffect(() => {
    const { token, user } = readSession();
    setSessionToken(token);
    setUserId(user?.id || null);
    const onStorage = (e: StorageEvent) => {
      if (e.key === 'openclaw_session_token' || e.key === 'openclaw_session_user') {
        const next = readSession();
        setSessionToken(next.token);
        setUserId(next.user?.id || null);
      }
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, []);

  const swrKey = `${API_BASE}/api/wall?limit=20&include_top_comments=3`;
  const { data, error, isLoading } = useSWR<{ entries: BreakthroughEntry[] }>(
    swrKey,
    makeFetcher(sessionToken),
    { refreshInterval: 30000 },
  );

  // Like — optimistic flip + revalidate. Anonymous users get bounced to /login.
  async function handleLike(entryId: string) {
    if (!sessionToken) {
      window.location.href = loginRedirect('/breakthroughs');
      return;
    }
    if (likePending[entryId]) return;
    setLikePending((prev) => ({ ...prev, [entryId]: true }));
    mutate(swrKey, (curr: { entries: BreakthroughEntry[] } | undefined) => {
      if (!curr) return curr;
      return {
        entries: curr.entries.map((e) =>
          e.id !== entryId
            ? e
            : {
                ...e,
                liked: (e.liked ? 0 : 1) as 0 | 1,
                like_count: e.like_count + (e.liked ? -1 : 1),
              },
        ),
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
        setUserId(null);
      }
      mutate(swrKey);
    } catch {
      mutate(swrKey);
    } finally {
      setLikePending((prev) => {
        const n = { ...prev };
        delete n[entryId];
        return n;
      });
    }
  }

  const liveEntries = data?.entries || [];
  const hasLive = liveEntries.length > 0;
  const entries = hasLive ? liveEntries : SEED_BREAKTHROUGHS;
  const isSeedMode = !hasLive;

  return (
    <section
      className="space-y-6 rounded-2xl p-6"
      style={{ background: 'var(--surface-container-highest, #F3F4F6)' }}
    >
      {/* Section header */}
      <div className="flex items-baseline justify-between flex-wrap gap-2">
        <h2 className="text-xl font-black tracking-tight" style={{ color: 'var(--on-surface)' }}>
          最新蜕变
        </h2>
        <span className="text-xs font-bold uppercase tracking-widest opacity-50">
          {entries.length} 案例{isSeedMode ? ' · 示例数据' : ''}
        </span>
      </div>

      {error && !isLoading && (
        <div className="text-sm rounded-xl p-4" style={{ background: '#fee2e2', color: '#991b1b' }}>
          后端暂不可达：{(error as Error).message}（先显示示例数据）
        </div>
      )}

      {isLoading ? (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-64 rounded-2xl animate-pulse bg-[var(--surface-container)]" />
          ))}
        </div>
      ) : entries.length === 0 ? (
        <EmptyState />
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {entries.map((entry) => (
            <BreakthroughCard
              key={entry.id}
              entry={entry}
              sessionToken={sessionToken}
              isOwn={!!(userId && entry.user_id && entry.user_id === userId)}
              onLike={handleLike}
              likePending={!!likePending[entry.id]}
            />
          ))}
        </div>
      )}

      {/* Cross-link to /wall */}
      <div className="text-center text-sm opacity-70 pt-2">
        想看大家正在解决什么？去{' '}
        <Link href="/wall" className="underline font-bold" style={{ color: 'var(--primary)' }}>
          卡点墙
        </Link>
      </div>
    </section>
  );
}
