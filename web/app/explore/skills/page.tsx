'use client';

import { useState } from 'react';
import useSWR from 'swr';
import Link from 'next/link';
import { getSkills, getSkillCategories, type ClawHubSkill } from '@/lib/api';

const RATINGS = ['全部', 'S', 'A', 'B', 'C'];
const RATING_COLORS: Record<string, string> = {
  S: 'bg-amber-100 text-amber-700',
  A: 'bg-blue-100 text-blue-700',
  B: 'bg-slate-100 text-slate-600',
  C: 'bg-gray-100 text-gray-500',
};

function formatNum(n: number): string {
  if (n >= 100000) return (n / 1000).toFixed(0) + 'k';
  if (n >= 1000) return (n / 1000).toFixed(1) + 'k';
  return String(n);
}

export default function SkillsMarketplacePage() {
  const [search, setSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState('全部');
  const [activeRating, setActiveRating] = useState('全部');
  const [page, setPage] = useState(0);
  const LIMIT = 18;

  // Fetch ALL skills once (works for both API and static fallback)
  const { data, isLoading } = useSWR('all-skills', () => getSkills('limit=999'));
  const { data: catData } = useSWR('skill-categories', () => getSkillCategories());

  const allSkills = data?.skills || [];
  const categories = catData?.categories || data?.meta?.byCategory || {};
  const allCategories = ['全部', ...Object.keys(categories)];
  const syncedAt = data?.meta?.syncedAt ? new Date(data.meta.syncedAt).toLocaleDateString('zh-CN') : '';

  // Client-side filtering
  const filtered = allSkills.filter((s: ClawHubSkill) => {
    if (activeCategory !== '全部' && s.category !== activeCategory) return false;
    if (activeRating !== '全部' && s.rating !== activeRating) return false;
    if (search) {
      const q = search.toLowerCase();
      if (!s.name.toLowerCase().includes(q) && !s.description.toLowerCase().includes(q) && !s.author.toLowerCase().includes(q)) return false;
    }
    return true;
  });

  // Client-side pagination
  const total = filtered.length;
  const totalPages = Math.ceil(total / LIMIT);
  const skills = filtered.slice(page * LIMIT, (page + 1) * LIMIT);

  return (
    <div className="max-w-[1440px] mx-auto px-6 md:px-8">
      {/* ═══ Hero ═══ */}
      <div className="text-center pt-8 pb-10 space-y-5">
        <h1
          className="text-4xl md:text-5xl font-extrabold"
          style={{ fontFamily: 'Manrope, sans-serif', color: 'var(--on-surface)' }}
        >
          ClawHub Skill 市场
        </h1>
        <p className="text-lg" style={{ color: 'var(--on-surface-variant)' }}>
          {data?.meta?.totalProcessed || '...'} 精选 AI Agent 技能，质量评级，一键安装
          {syncedAt && <span className="text-xs ml-2 opacity-60">({syncedAt} 同步)</span>}
        </p>
        <div className="relative max-w-lg mx-auto">
          <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-xl" style={{ color: 'var(--outline)' }}>search</span>
          <input
            type="text"
            placeholder="搜索 Skills..."
            value={search}
            onChange={e => { setSearch(e.target.value); setPage(0); }}
            className="w-full rounded-2xl py-4 pl-12 pr-4 text-sm"
            style={{ background: 'var(--surface-container-low)', border: 'none' }}
          />
        </div>
      </div>

      {/* ═══ Main layout ═══ */}
      <div className="flex gap-8 pb-16">
        {/* Sidebar */}
        <aside className="hidden lg:block w-52 shrink-0 sticky top-28 self-start space-y-8">
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider mb-4" style={{ color: 'var(--on-surface-variant)' }}>分类</h3>
            <div className="space-y-1">
              {allCategories.map(cat => (
                <button
                  key={cat}
                  onClick={() => { setActiveCategory(cat); setPage(0); }}
                  className="block w-full text-left text-sm px-3 py-2 rounded-lg transition-colors"
                  style={{
                    background: activeCategory === cat ? 'var(--primary-fixed)' : 'transparent',
                    color: activeCategory === cat ? 'var(--on-primary-fixed-variant)' : 'var(--on-surface)',
                    fontWeight: activeCategory === cat ? 600 : 400,
                  }}
                >
                  {cat}
                  {cat !== '全部' && categories[cat] && (
                    <span className="float-right text-xs opacity-50">{categories[cat]}</span>
                  )}
                </button>
              ))}
            </div>
          </div>
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider mb-4" style={{ color: 'var(--on-surface-variant)' }}>质量评级</h3>
            <div className="space-y-1">
              {RATINGS.map(r => (
                <button
                  key={r}
                  onClick={() => { setActiveRating(r); setPage(0); }}
                  className="block w-full text-left text-sm px-3 py-2 rounded-lg transition-colors"
                  style={{
                    background: activeRating === r ? 'var(--primary-fixed)' : 'transparent',
                    color: activeRating === r ? 'var(--on-primary-fixed-variant)' : 'var(--on-surface)',
                    fontWeight: activeRating === r ? 600 : 400,
                  }}
                >
                  {r === '全部' ? '全部评级' : `${r} 级`}
                  {r !== '全部' && data?.meta?.byRating?.[r] && (
                    <span className="float-right text-xs opacity-50">{data.meta.byRating[r]}</span>
                  )}
                </button>
              ))}
            </div>
          </div>
        </aside>

        {/* Grid */}
        <div className="flex-1">
          {/* Mobile filters */}
          <div className="lg:hidden flex gap-2 flex-wrap mb-6 overflow-x-auto pb-1">
            {allCategories.slice(0, 8).map(cat => (
              <button
                key={cat}
                onClick={() => { setActiveCategory(cat); setPage(0); }}
                className="px-3 py-1.5 rounded-full text-xs font-bold transition-all whitespace-nowrap shrink-0"
                style={{
                  background: activeCategory === cat ? 'var(--primary)' : 'var(--surface-container)',
                  color: activeCategory === cat ? 'var(--on-primary)' : 'var(--on-surface-variant)',
                }}
              >
                {cat}
              </button>
            ))}
          </div>

          <div className="mb-4 text-sm" style={{ color: 'var(--on-surface-variant)' }}>
            显示 {page * LIMIT + 1}-{Math.min((page + 1) * LIMIT, total)} / {total} Skills
          </div>

          {isLoading && skills.length === 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
              {Array.from({ length: 9 }).map((_, i) => (
                <div key={i} className="h-52 rounded-2xl skeleton-shimmer" />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
              {skills.map((skill: ClawHubSkill) => (
                <a
                  key={skill.id}
                  href={skill.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-6 rounded-2xl transition-all card-hover block"
                  style={{
                    background: 'var(--surface-container-lowest)',
                    border: '1px solid rgba(195, 198, 215, 0.3)',
                  }}
                >
                  {/* Header: name + rating badge */}
                  <div className="flex justify-between items-start mb-1">
                    <h4 className="font-bold text-base leading-tight" style={{ color: 'var(--on-surface)' }}>{skill.name}</h4>
                    <span className={`px-2 py-0.5 text-[10px] font-bold rounded-full shrink-0 ml-2 ${RATING_COLORS[skill.rating] || 'bg-gray-100 text-gray-500'}`}>
                      {skill.rating}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 mb-3">
                    <span className="text-xs" style={{ color: 'var(--on-surface-variant)' }}>@{skill.author}</span>
                    {skill.official && (
                      <span className="text-[9px] px-1.5 py-0.5 rounded font-bold" style={{ background: 'var(--primary-fixed)', color: 'var(--on-primary-fixed-variant)' }}>Official</span>
                    )}
                    <span className="text-[10px] px-2 py-0.5 rounded-full font-medium" style={{ background: 'var(--surface-container)', color: 'var(--on-surface-variant)' }}>
                      {skill.category}
                    </span>
                  </div>

                  {/* Description */}
                  <p className="text-sm mb-4 line-clamp-2" style={{ color: 'var(--on-surface-variant)' }}>{skill.description}</p>

                  {/* Metrics */}
                  <div className="flex items-center gap-4 mb-3 text-xs" style={{ color: 'var(--on-surface-variant)' }}>
                    <span className="flex items-center gap-1">
                      <span className="material-symbols-outlined text-sm">download</span> {skill.downloadsDisplay}
                    </span>
                    <span className="flex items-center gap-1">
                      <span className="material-symbols-outlined text-sm" style={{ color: '#f59e0b', fontVariationSettings: "'FILL' 1" }}>star</span> {skill.starsDisplay}
                    </span>
                    <span>{skill.versions} 版本</span>
                  </div>

                  {/* Platforms + action */}
                  <div className="flex justify-between items-center">
                    <div className="flex gap-1">
                      {skill.platforms.map(p => (
                        <span key={p} className="text-[9px] px-1.5 py-0.5 rounded font-medium" style={{ background: 'var(--surface-container)', color: 'var(--on-surface-variant)' }}>
                          {p}
                        </span>
                      ))}
                    </div>
                    <span
                      className="px-4 py-1.5 rounded-lg text-xs font-bold"
                      style={{ background: 'var(--primary)', color: 'white' }}
                    >
                      安装
                    </span>
                  </div>
                </a>
              ))}
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex justify-between items-center mt-10">
              <span className="text-sm" style={{ color: 'var(--on-surface-variant)' }}>
                显示 {page * LIMIT + 1}-{Math.min((page + 1) * LIMIT, total)} / {total}
              </span>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setPage(Math.max(0, page - 1))}
                  disabled={page === 0}
                  className="w-9 h-9 rounded-lg flex items-center justify-center disabled:opacity-30"
                  style={{ background: 'var(--surface-container)', color: 'var(--on-surface-variant)' }}
                >
                  <span className="material-symbols-outlined text-sm">chevron_left</span>
                </button>
                {Array.from({ length: Math.min(totalPages, 5) }).map((_, i) => {
                  const p = page < 3 ? i : page - 2 + i;
                  if (p >= totalPages) return null;
                  return (
                    <button
                      key={p}
                      onClick={() => setPage(p)}
                      className="w-9 h-9 rounded-lg text-sm font-bold"
                      style={{
                        background: p === page ? 'var(--primary)' : 'var(--surface-container)',
                        color: p === page ? 'var(--on-primary)' : 'var(--on-surface-variant)',
                      }}
                    >
                      {p + 1}
                    </button>
                  );
                })}
                {totalPages > 5 && page < totalPages - 3 && (
                  <>
                    <span className="px-2 text-sm" style={{ color: 'var(--outline)' }}>...</span>
                    <button
                      onClick={() => setPage(totalPages - 1)}
                      className="w-9 h-9 rounded-lg text-sm font-bold"
                      style={{ background: 'var(--surface-container)', color: 'var(--on-surface-variant)' }}
                    >
                      {totalPages}
                    </button>
                  </>
                )}
                <button
                  onClick={() => setPage(Math.min(totalPages - 1, page + 1))}
                  disabled={page >= totalPages - 1}
                  className="w-9 h-9 rounded-lg flex items-center justify-center disabled:opacity-30"
                  style={{ background: 'var(--surface-container)', color: 'var(--on-surface-variant)' }}
                >
                  <span className="material-symbols-outlined text-sm">chevron_right</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
