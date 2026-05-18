'use client';

// BreakthroughWall — read-only view of cohort transformation arcs.
//
// Shares the WallEntry schema with wall-board.tsx but inverts visual hierarchy:
//   - after_method is the hero (large, bold, top-of-card)
//   - before_state recedes as italic context with "↳" arrow
//   - suggestion (if present) renders as a callout footer
//
// This-cycle scope: MOCK_BREAKTHROUGHS sample data only (page-first per
// Maurice "设计个页面再实现"). Next-cycle scope: wire to live /api/wall with
// a filter param (?view=breakthroughs) on the existing GET endpoint.
// The schema does NOT need a new D1 table — before_state + after_method
// already capture the transformation arc.
//
// Design spec: Projects/22-openclaw-foundry/design/breakthroughs/spec.md

import Link from 'next/link';
import { ROLE_OPTIONS } from '@/components/wall-board';

interface BreakthroughEntry {
  id: string;
  role_slug: string | null;
  before_state: string;
  after_method: string;
  suggestion: string | null;
  created_at: string;
  like_count: number;
  comment_count: number;
}

// MOCK_BREAKTHROUGHS — 3 sample entries representative of cohort transformation
// patterns. These are illustrative examples (not real cohort posts) intended to
// validate the visual hierarchy + responsive layout this cycle. Will be
// replaced by live /api/wall data in the next cycle.
const MOCK_BREAKTHROUGHS: BreakthroughEntry[] = [
  {
    id: 'mock-1',
    role_slug: 'product-manager',
    before_state:
      '我之前手动整理用户访谈记录，一份要 8 小时，做 3 份就是一周。每次老板问"用户为什么这样想"我都要现翻笔记，找不到证据。',
    after_method:
      '我现在每周用 GPT 跑 3 个用户访谈摘要，把原来 1 天的工作压到 1 小时。模板提取「金句 + 情绪标签 + 行为模式」三段式，可以直接贴到 PRD。',
    suggestion:
      'Prompt 模板放在 ~/.claude/skills/interview-summarizer 里，自己改 3 行就能跑。访谈录音用 Whisper 转文字（本地 small 模型够用）。',
    created_at: '2026-05-17T14:23:00Z',
    like_count: 12,
    comment_count: 3,
  },
  {
    id: 'mock-2',
    role_slug: 'frontend-engineer',
    before_state:
      '每次新功能要写 4 套语言（中英日韩），来回切翻译软件 + 复制粘贴，平均一个 sprint 浪费 6 小时在体力活上，还经常漏 key。',
    after_method:
      '把 i18n key 提取 + 4 语言机翻 + diff review 接到 Claude，一个 commit pre-hook 自动跑完。漏 key 从每周 2-3 个降到 0。',
    suggestion:
      '关键是用 ast-grep 提取 key 而不是 regex，避免 template string 漏。机翻用 gemini-2.5-pro 比 GPT 准（中日韩有上下文）。',
    created_at: '2026-05-16T09:11:00Z',
    like_count: 8,
    comment_count: 5,
  },
  {
    id: 'mock-3',
    role_slug: 'compliance-expert',
    before_state:
      '客户问"这个交易要交多少税"我要翻 3 份政策文件 + 1 份省局答疑 + 1 份头部企业实操，平均 45 分钟才能给一个有依据的答案。',
    after_method:
      '把高频税务问题 + 政策依据建成本地知识库，用 Claude 做 RAG，30 秒出答案 + 引用条款编号。客户感知响应速度提升 90%。',
    suggestion: null,
    created_at: '2026-05-15T16:48:00Z',
    like_count: 15,
    comment_count: 2,
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
  return '刚刚';
}

interface BreakthroughCardProps {
  entry: BreakthroughEntry;
}

function BreakthroughCard({ entry }: BreakthroughCardProps) {
  const roleLabel = ROLE_OPTIONS.find((o) => o.id === entry.role_slug)?.label || entry.role_slug;
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
      <div className="flex items-center gap-2 text-xs opacity-60">
        {entry.role_slug && (
          <>
            <span
              className="px-2 py-0.5 rounded font-bold"
              style={{ background: 'var(--surface-container)' }}
            >
              {roleLabel}
            </span>
            <span aria-hidden="true">·</span>
          </>
        )}
        <span>匿名</span>
        <span aria-hidden="true">·</span>
        <span>{timeAgo(entry.created_at)}</span>
      </div>

      {/* AFTER — hero hierarchy */}
      <div className="space-y-2">
        <div
          className="text-[11px] font-bold uppercase tracking-widest"
          style={{ color: 'var(--primary)' }}
        >
          AFTER · 蜕变后
        </div>
        <p
          className="text-lg leading-relaxed font-bold"
          style={{ color: 'var(--on-surface)' }}
        >
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
        <span aria-hidden="true" className="mr-1 not-italic font-bold opacity-70">
          ↳
        </span>
        before · {entry.before_state}
      </div>

      {/* Optional SUGGESTION callout */}
      {entry.suggestion && (
        <div
          className="text-sm rounded-lg p-3 leading-relaxed"
          style={{
            background: 'var(--surface-container)',
            color: 'var(--on-surface)',
          }}
        >
          <span className="font-bold mr-1" aria-hidden="true">
            💡
          </span>
          {entry.suggestion}
        </div>
      )}

      {/* Footer row — reactions */}
      <div className="flex items-center gap-6 pt-2 text-xs font-bold opacity-60">
        <span className="inline-flex items-center gap-1.5">
          <span aria-hidden="true" className="material-symbols-outlined text-base">
            favorite
          </span>
          <span>{entry.like_count}</span>
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span aria-hidden="true" className="material-symbols-outlined text-base">
            comment
          </span>
          <span>{entry.comment_count} 条评论</span>
        </span>
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
  const entries = MOCK_BREAKTHROUGHS;

  return (
    <section
      className="space-y-6 rounded-2xl p-6"
      style={{ background: 'var(--surface-container-highest, #F3F4F6)' }}
    >
      {/* Section header */}
      <div className="flex items-baseline justify-between">
        <h2 className="text-xl font-black tracking-tight" style={{ color: 'var(--on-surface)' }}>
          最新蜕变
        </h2>
        <span className="text-xs font-bold uppercase tracking-widest opacity-50">
          {entries.length} 案例 · 示例数据
        </span>
      </div>

      {entries.length === 0 ? (
        <EmptyState />
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {entries.map((entry) => (
            <BreakthroughCard key={entry.id} entry={entry} />
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
