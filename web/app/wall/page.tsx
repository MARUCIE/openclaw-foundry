'use client';

// Before/After 卡点墙 — anonymous workflow blocker board.
// Backend: Worker /api/wall (see worker/src/routes/wall.ts).
// Anonymity: UUID v4 in localStorage; sent as X-Anon-UID; Worker hashes with WALL_PEPPER.

import { useEffect, useState } from 'react';
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
  role_slug: string | null;
  before_state: string;
  after_method: string;
  suggestion: string | null;
  created_at: string;
  comment_count: number;
  anon_uid_hash: string;
}

const ROLE_OPTIONS = [
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

async function fetcher(url: string): Promise<{ entries: WallEntry[] }> {
  const r = await fetch(url);
  if (!r.ok) throw new Error(`HTTP ${r.status}`);
  return r.json();
}

export default function WallPage() {
  const [anonUid, setAnonUid] = useState('');
  useEffect(() => { setAnonUid(getAnonUid()); }, []);

  const { data, error, isLoading } = useSWR<{ entries: WallEntry[] }>(`${API_BASE}/api/wall?limit=50`, fetcher, {
    refreshInterval: 30000,
  });

  const [role, setRole] = useState('');
  const [before, setBefore] = useState('');
  const [after, setAfter] = useState('');
  const [suggestion, setSuggestion] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!before.trim() || !after.trim()) {
      setSubmitError('Before 和 After 都不能为空');
      return;
    }
    setSubmitting(true);
    setSubmitError(null);
    try {
      const r = await fetch(`${API_BASE}/api/wall`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-Anon-UID': anonUid },
        body: JSON.stringify({ role_slug: role || null, before_state: before, after_method: after, suggestion: suggestion || null }),
      });
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

  return (
    <div className="page-shell py-12 space-y-10">
      {/* Header */}
      <div className="flex items-center gap-4">
        <div className="w-2 h-12 rounded-full" style={{ background: 'var(--primary)' }} />
        <div>
          <h1 className="text-4xl md:text-5xl font-black tracking-tight text-balance" style={{ color: 'var(--on-surface)' }}>
            卡点墙
          </h1>
          <p className="text-sm font-bold uppercase tracking-widest opacity-50 mt-1">
            Workflow Stickwall · 匿名登记你工作流里的卡点，别人可以回复
          </p>
        </div>
      </div>

      {/* Submit form */}
      <section className="p-8 rounded-[2rem] space-y-5" style={{ background: 'var(--surface-container-low)', border: '1px solid var(--outline-variant)' }}>
        <h2 className="text-xl font-black tracking-tight">提交新卡点</h2>
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
            <span className="text-xs opacity-50">匿名 ID 仅哈希存储；本地 localStorage 保留以便你识别自己的条目。</span>
          </div>
        </form>
      </section>

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
          <p className="text-sm opacity-60">还没有卡点。第一个分享你工作流里的卡点 ↑</p>
        )}
        <div className="space-y-4">
          {(data?.entries || []).map(entry => (
            <Link
              key={entry.id}
              href={`/wall/detail?id=${entry.id}`}
              className="block p-6 rounded-[1.5rem] transition-all hover:shadow-lg hover:-translate-y-0.5"
              style={{ background: 'var(--surface-container-lowest)', border: '1px solid var(--outline-variant)' }}
            >
              <div className="flex items-center gap-3 text-xs opacity-60 mb-2 font-bold uppercase tracking-widest">
                <span>#{entry.id.slice(0, 6)}</span>
                <span>·</span>
                <span>{new Date(entry.created_at).toLocaleString('zh-CN')}</span>
                {entry.role_slug && (
                  <>
                    <span>·</span>
                    <span className="px-2 py-0.5 rounded" style={{ background: 'var(--surface-container)' }}>{entry.role_slug}</span>
                  </>
                )}
                <span>·</span>
                <span>匿名{entry.anon_uid_hash === anonUid ? '（你发的）' : ''}</span>
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
              <div className="mt-3 text-xs font-bold opacity-50">{entry.comment_count} 条评论 →</div>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
