'use client';

import { useState } from 'react';
import { useI18n } from '@/lib/i18n';
import { CATEGORY_KEYS, CATEGORY_I18N, FEATURED_MCP, MCP_SERVERS } from '@/lib/mcp-data';

export default function McpDirectoryPage() {
  const { t } = useI18n();
  const [activeCategory, setActiveCategory] = useState('all');
  const [search, setSearch] = useState('');

  const filtered = MCP_SERVERS.filter(s => {
    if (activeCategory !== 'all' && s.category !== activeCategory) return false;
    if (search && !s.name.toLowerCase().includes(search.toLowerCase()) && !s.desc.includes(search)) return false;
    return true;
  });

  return (
    <div className="max-w-7xl mx-auto px-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-end gap-6 py-12 pb-10">
        <div className="flex items-center gap-3">
          <div className="w-1.5 h-10 rounded-full shrink-0" style={{ background: 'var(--primary)' }} />
          <div className="space-y-1">
            <h1
              className="text-3xl md:text-4xl font-extrabold"
              style={{ fontFamily: 'Manrope, sans-serif', color: 'var(--on-surface)' }}
            >
              {t('mcp.title')}
            </h1>
            <p className="text-lg max-w-2xl" style={{ color: 'var(--on-surface-variant)' }}>
              {t('mcp.subtitle')}
            </p>
          </div>
        </div>
        <div className="relative w-full lg:w-80">
          <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--outline)' }}>search</span>
          <input
            type="text"
            placeholder={t('mcp.searchPlaceholder')}
            value={search}
            onChange={e => setSearch(e.target.value)}
            aria-label={t('mcp.searchPlaceholder')}
            className="w-full rounded-xl py-3 pl-10 pr-4 text-sm"
            style={{ background: 'var(--surface-container-low)', border: 'none' }}
          />
        </div>
      </div>

      {/* Category Tabs */}
      <div className="flex gap-2 flex-wrap mb-12" role="tablist">
        {CATEGORY_KEYS.map(cat => (
          <button
            key={cat}
            role="tab"
            aria-selected={activeCategory === cat}
            onClick={() => setActiveCategory(cat)}
            className="px-4 py-2 rounded-full text-sm font-bold transition-all"
            style={{
              background: activeCategory === cat ? 'var(--primary)' : 'var(--surface-container)',
              color: activeCategory === cat ? 'var(--on-primary)' : 'var(--on-surface-variant)',
            }}
          >
            {CATEGORY_I18N[cat] ? t(CATEGORY_I18N[cat]) : cat}
          </button>
        ))}
      </div>

      {/* Featured Section */}
      <section className="mb-16">
        <h2 className="text-xl font-bold mb-6" style={{ fontFamily: 'Manrope, sans-serif', color: 'var(--on-surface-variant)' }}>
          {t('mcp.featured')}
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-stretch">
          {FEATURED_MCP.map(mcp => (
            <div
              key={mcp.name}
              className="p-8 rounded-2xl transition-all card-hover flex flex-col"
              style={{
                background: 'var(--surface-container-lowest)',
                border: '1px solid rgba(195, 198, 215, 0.3)',
              }}
            >
              <div className="flex items-start gap-4 mb-5">
                <div
                  className="w-14 h-14 rounded-2xl flex items-center justify-center shrink-0"
                  style={{ background: mcp.iconBg, color: mcp.iconColor }}
                >
                  <span className="material-symbols-outlined text-3xl">{mcp.icon}</span>
                </div>
                <span className="px-2.5 py-1 rounded-full text-[9px] font-bold tracking-wider uppercase" style={{ background: mcp.badgeBg, color: mcp.iconColor }}>
                  {mcp.badge}
                </span>
              </div>
              <h3 className="text-xl font-bold mb-2" style={{ fontFamily: 'Manrope, sans-serif', color: 'var(--on-surface)' }}>{mcp.name}</h3>
              <p className="text-sm mb-6 leading-relaxed flex-1" style={{ color: 'var(--on-surface-variant)' }}>{mcp.desc}</p>
              <div
                className="p-3.5 rounded-xl mb-4 text-xs font-mono truncate flex items-center justify-between gap-3"
                style={{ background: 'var(--surface-container)', color: 'var(--on-surface)' }}
              >
                <span className="truncate">{mcp.cmd}</span>
                <span className="material-symbols-outlined text-sm shrink-0 ml-2 cursor-pointer" style={{ color: 'var(--outline)' }}>content_copy</span>
              </div>
              <button
                className="w-full py-3 rounded-xl font-bold text-sm transition-opacity hover:opacity-90 flex items-center justify-center gap-2"
                style={{ background: 'var(--primary-container)', color: 'var(--on-primary)' }}
              >
                <span className="material-symbols-outlined text-sm">download</span>
                {t('mcp.install')}
              </button>
            </div>
          ))}
        </div>
      </section>

      {/* Grid */}
      <section className="pb-16">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold" style={{ fontFamily: 'Manrope, sans-serif', color: 'var(--on-surface-variant)' }}>
            {t('mcp.exploreAll')}
          </h2>
          <span className="text-sm" style={{ color: 'var(--on-surface-variant)' }}>
            {t('mcp.showingResults', { count: filtered.length, total: MCP_SERVERS.length })}
          </span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filtered.map((mcp, i) => (
            <div
              key={`${mcp.name}-${i}`}
              className="p-5 rounded-2xl transition-all card-hover"
              style={{
                background: 'var(--surface-container-lowest)',
                border: '1px solid rgba(195, 198, 215, 0.3)',
              }}
            >
              <div className="flex items-center gap-3 mb-3">
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                  style={{ background: mcp.iconBg, color: mcp.iconColor }}
                >
                  <span className="material-symbols-outlined text-lg">{mcp.icon}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="font-bold text-sm truncate" style={{ color: 'var(--on-surface)' }}>{mcp.name}</h4>
                  <p className="text-xs truncate" style={{ color: 'var(--on-surface-variant)' }}>{mcp.desc}</p>
                </div>
                <span className="px-2 py-0.5 rounded text-[9px] font-bold shrink-0" style={{ background: mcp.protocol === 'HTTP' ? 'var(--secondary-fixed)' : 'var(--surface-container)', color: mcp.protocol === 'HTTP' ? 'var(--on-secondary-fixed-variant)' : 'var(--on-surface-variant)' }}>
                  {mcp.protocol}
                </span>
              </div>
              <div
                className="px-2 py-1.5 rounded-lg text-[10px] font-mono truncate mb-3"
                style={{ background: 'var(--surface-container)', color: 'var(--on-surface-variant)' }}
              >
                {mcp.cmd}
              </div>
              <div className="flex justify-between items-center">
                {mcp.stars ? (
                  <span className="text-xs flex items-center gap-1" style={{ color: 'var(--on-surface-variant)' }}>
                    <span className="material-symbols-outlined text-sm" style={{ fontVariationSettings: "'FILL' 1", color: '#f59e0b' }}>star</span>
                    {mcp.stars}
                  </span>
                ) : <span />}
                <button
                  className="px-3 py-1.5 rounded-lg text-xs font-bold transition-opacity hover:opacity-90"
                  style={{ background: 'var(--primary)', color: 'white' }}
                >
                  {t('mcp.install')}
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Pagination */}
        <nav className="flex justify-center items-center gap-1 mt-10" aria-label="Pagination">
          <button aria-label="Previous page" className="w-9 h-9 rounded-lg flex items-center justify-center" style={{ background: 'var(--surface-container)', color: 'var(--on-surface-variant)' }}>
            <span className="material-symbols-outlined text-sm">chevron_left</span>
          </button>
          {[1, 2, 3].map(p => (
            <button
              key={p}
              aria-current={p === 1 ? 'page' : undefined}
              className="w-9 h-9 rounded-lg text-sm font-bold"
              style={{
                background: p === 1 ? 'var(--primary)' : 'var(--surface-container)',
                color: p === 1 ? 'var(--on-primary)' : 'var(--on-surface-variant)',
              }}
            >
              {p}
            </button>
          ))}
          <span className="px-2 text-sm" style={{ color: 'var(--outline)' }}>...</span>
          <button className="w-9 h-9 rounded-lg text-sm font-bold" style={{ background: 'var(--surface-container)', color: 'var(--on-surface-variant)' }}>11</button>
          <button aria-label="Next page" className="w-9 h-9 rounded-lg flex items-center justify-center" style={{ background: 'var(--surface-container)', color: 'var(--on-surface-variant)' }}>
            <span className="material-symbols-outlined text-sm">chevron_right</span>
          </button>
        </nav>
      </section>
    </div>
  );
}
