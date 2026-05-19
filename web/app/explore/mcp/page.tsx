'use client';

import { useState, useMemo, useCallback } from 'react';
import { useI18n } from '@/lib/i18n';
import { CATEGORY_KEYS, CATEGORY_I18N, FEATURED_MCP, MCP_SERVERS } from '@/lib/mcp-data';

export default function McpDirectoryPage() {
  const { t } = useI18n();
  const [activeCategory, setActiveCategory] = useState('all');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(0);
  const [copiedCmd, setCopiedCmd] = useState<string | null>(null);
  const LIMIT = 12;

  const copy = useCallback((cmd: string) => {
    navigator.clipboard.writeText(cmd);
    setCopiedCmd(cmd);
    setTimeout(() => setCopiedCmd(null), 2000);
  }, []);

  const filtered = useMemo(() => {
    return MCP_SERVERS.filter(s => {
      const q = search.toLowerCase();
      if (activeCategory !== 'all' && s.category !== activeCategory) return false;
      if (q && !s.name.toLowerCase().includes(q) && !s.desc.toLowerCase().includes(q)) return false;
      return true;
    });
  }, [activeCategory, search]);

  const total = filtered.length;
  const totalPages = Math.ceil(total / LIMIT);
  const displayItems = filtered.slice(page * LIMIT, (page + 1) * LIMIT);

  return (
    <div className="page-shell py-12 space-y-12">
      {/* Header */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-end gap-10">
        <div className="flex items-center gap-4">
          <div className="w-2 h-12 rounded-full shrink-0" style={{ background: 'var(--primary)' }} />
          <div className="space-y-1">
            <h1 className="text-4xl md:text-5xl font-black tracking-tight text-balance" style={{ color: 'var(--on-surface)' }}>
              {t('mcp.title')}
            </h1>
            <p className="text-lg font-medium opacity-60 max-w-2xl text-pretty">
              {t('mcp.subtitle')}
            </p>
          </div>
        </div>
        
        {/* Search */}
        <div className="relative group w-full lg:w-96">
          <div className="absolute -inset-1 bg-gradient-to-r from-[var(--primary)] to-[var(--secondary)] rounded-2xl blur opacity-10 group-focus-within:opacity-30 transition-opacity" />
          <div className="relative flex items-center bg-[var(--surface-container-low)] rounded-2xl border-2 border-[var(--outline-variant)] focus-within:border-[var(--primary)] transition-all overflow-hidden">
            <span className="material-symbols-outlined ml-4 text-2xl font-black opacity-40">search</span>
            <input
              type="text"
              placeholder={t('mcp.searchPlaceholder')}
              value={search}
              onChange={e => { setSearch(e.target.value); setPage(0); }}
              className="w-full py-4 pl-3 pr-4 text-sm font-bold bg-transparent outline-none"
            />
          </div>
        </div>
      </div>

      {/* Category Tabs */}
      <div className="flex gap-2 flex-wrap pb-4 border-b border-[var(--outline-variant)]" role="tablist">
        {CATEGORY_KEYS.map(cat => (
          <button
            key={cat}
            role="tab"
            aria-selected={activeCategory === cat}
            onClick={() => { setActiveCategory(cat); setPage(0); }}
            className="px-6 py-2.5 rounded-full text-xs font-black uppercase tracking-widest transition-all hover:scale-105 active:scale-95"
            style={{
              background: activeCategory === cat ? 'var(--primary)' : 'var(--surface-container-low)',
              color: activeCategory === cat ? 'white' : 'var(--on-surface-variant)',
              border: activeCategory === cat ? 'none' : '1px solid var(--outline-variant)',
            }}
          >
            {CATEGORY_I18N[cat] ? t(CATEGORY_I18N[cat]) : cat}
          </button>
        ))}
      </div>

      {/* Featured Section */}
      {activeCategory === 'all' && !search && (
        <section className="space-y-8">
          <div className="flex items-center gap-3">
            <span className="material-symbols-outlined font-black text-[var(--primary)]">stars</span>
            <h2 className="text-xl font-black uppercase tracking-widest text-balance" style={{ color: 'var(--on-surface)' }}>
              {t('mcp.featured')}
            </h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {FEATURED_MCP.map(mcp => (
              <div
                key={mcp.name}
                className="p-8 rounded-[2.5rem] transition-all hover:shadow-2xl hover:-translate-y-1 relative overflow-hidden flex flex-col border-2 border-[var(--outline-variant)]"
                style={{ background: 'var(--surface-container-lowest)' }}
              >
                <div className="absolute top-0 left-0 w-full h-1.5" style={{ background: mcp.iconColor }} />
                <div className="flex justify-between items-start mb-6">
                  <div
                    className="w-16 h-16 rounded-3xl flex items-center justify-center shrink-0 shadow-lg"
                    style={{ background: 'var(--surface-container)', color: mcp.iconColor }}
                  >
                    <span className="material-symbols-outlined text-3xl font-black">{mcp.icon}</span>
                  </div>
                  <span className="px-3 py-1 rounded-full text-[var(--af-fs-meta)] font-black tracking-widest uppercase shadow-sm" style={{ background: mcp.badgeBg, color: mcp.iconColor }}>
                    {mcp.badge}
                  </span>
                </div>
                <h3 className="text-2xl font-black mb-3 tracking-tight text-balance" style={{ color: 'var(--on-surface)' }}>{mcp.name}</h3>
                <p className="text-sm leading-relaxed opacity-70 mb-8 flex-1 text-pretty">{mcp.desc}</p>
                
                <div className="space-y-4">
                  <button
                    type="button"
                    onClick={() => copy(mcp.cmd)}
                    className="w-full p-4 rounded-2xl text-[var(--af-fs-meta)] font-bold font-mono truncate flex items-center justify-between group transition-all hover:bg-[var(--surface-container-high)]"
                    style={{ background: 'var(--surface-container)', color: 'var(--on-surface)' }}
                  >
                    <span className="truncate opacity-60 group-hover:opacity-100">{mcp.cmd}</span>
                    <span className="material-symbols-outlined text-lg font-black shrink-0 ml-2">
                      {copiedCmd === mcp.cmd ? 'check' : 'content_copy'}
                    </span>
                  </button>
                  <button
                    type="button"
                    onClick={() => copy(mcp.cmd)}
                    className="w-full py-4 rounded-2xl font-black text-sm uppercase tracking-widest transition-all hover:shadow-lg active:scale-95 flex items-center justify-center gap-3"
                    style={{ background: 'var(--primary)', color: 'white' }}
                  >
                    <span className="material-symbols-outlined font-black">{copiedCmd === mcp.cmd ? 'check' : 'content_copy'}</span>
                    {copiedCmd === mcp.cmd ? '已复制' : t('mcp.install')}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Grid */}
      <section className="space-y-8 pb-16">
        <div className="flex justify-between items-end border-b border-dashed border-[var(--outline-variant)] pb-6">
          <h2 className="text-xl font-black uppercase tracking-widest text-balance" style={{ color: 'var(--on-surface)' }}>
            {t('mcp.exploreAll')}
          </h2>
          <span className="text-[var(--af-fs-meta)] font-black uppercase tracking-[0.2em] opacity-40">
            {t('mcp.showingResults', { count: total > 0 ? page * LIMIT + 1 : 0, total })}
          </span>
        </div>
        
        {total === 0 ? (
          <div className="text-center py-24 bg-[var(--surface-container-low)] rounded-[3rem] border-2 border-dashed border-[var(--outline-variant)]">
            <span className="material-symbols-outlined text-6xl opacity-10 font-black">cloud_off</span>
            <p className="mt-4 text-sm font-black uppercase tracking-widest opacity-40 text-pretty">No servers found matching your criteria</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {displayItems.map((mcp, i) => (
              <div
                key={`${mcp.name}-${i}`}
                className="p-6 rounded-[2rem] transition-all hover:shadow-xl hover:-translate-y-1 group flex flex-col border border-[var(--outline-variant)] bg-[var(--surface-container-lowest)]"
              >
                <div className="flex items-center gap-4 mb-4">
                  <div
                    className="w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 shadow-sm"
                    style={{ background: 'var(--surface-container)', color: mcp.iconColor }}
                  >
                    <span className="material-symbols-outlined text-xl font-black">{mcp.icon}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-black text-sm truncate text-balance" style={{ color: 'var(--on-surface)' }}>{mcp.name}</h4>
                    <p className="text-[var(--af-fs-meta)] font-bold uppercase tracking-wider opacity-40 truncate text-pretty">{mcp.category}</p>
                  </div>
                  <span className="px-2 py-0.5 rounded-lg text-[var(--af-fs-micro)] font-black tracking-tighter shrink-0" style={{ 
                    background: mcp.protocol === 'HTTP' ? 'var(--secondary-container)' : 'var(--surface-container-high)', 
                    color: mcp.protocol === 'HTTP' ? 'var(--on-secondary-container)' : 'var(--on-surface-variant)' 
                  }}>
                    {mcp.protocol}
                  </span>
                </div>
                <p className="text-xs leading-relaxed opacity-70 line-clamp-2 mb-6 flex-1 text-pretty">{mcp.desc}</p>
                <div className="space-y-4 pt-4 border-t border-dashed border-[var(--outline-variant)]">
                  <div className="flex justify-between items-center">
                    {mcp.stars ? (
                      <div className="flex items-center gap-1.5 opacity-60">
                        <span className="material-symbols-outlined text-sm font-black text-amber-500 fill-1">star</span>
                        <span className="text-[var(--af-fs-meta)] font-black">{mcp.stars}</span>
                      </div>
                    ) : <div />}
                    <button
                      type="button"
                      onClick={() => copy(mcp.cmd)}
                      className="px-5 py-2 rounded-xl text-[var(--af-fs-meta)] font-black uppercase tracking-widest text-white transition-all hover:shadow-lg active:scale-95"
                      style={{ background: 'var(--primary)' }}
                    >
                      {copiedCmd === mcp.cmd ? '已复制' : t('mcp.install')}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <nav className="flex justify-center items-center gap-2 mt-12" aria-label="Pagination">
            <button 
              onClick={() => { setPage(Math.max(0, page - 1)); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
              disabled={page === 0}
              className="w-12 h-12 rounded-2xl flex items-center justify-center bg-[var(--surface-container-low)] border border-[var(--outline-variant)] disabled:opacity-20 transition-all hover:bg-[var(--surface-container-high)]"
            >
              <span className="material-symbols-outlined font-black">chevron_left</span>
            </button>
            <div className="flex gap-1.5">
              {Array.from({ length: totalPages }).map((_, p) => (
                <button
                  key={p}
                  onClick={() => { setPage(p); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                  className={`w-12 h-12 rounded-2xl text-sm font-black transition-all shadow-sm ${p === page ? 'scale-110' : ''}`}
                  style={{
                    background: p === page ? 'var(--primary)' : 'var(--surface-container-lowest)',
                    color: p === page ? 'white' : 'var(--on-surface)',
                    border: p === page ? 'none' : '1px solid var(--outline-variant)',
                  }}
                >
                  {p + 1}
                </button>
              ))}
            </div>
            <button 
              onClick={() => { setPage(Math.min(totalPages - 1, page + 1)); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
              disabled={page >= totalPages - 1}
              className="w-12 h-12 rounded-2xl flex items-center justify-center bg-[var(--surface-container-low)] border border-[var(--outline-variant)] disabled:opacity-20 transition-all hover:bg-[var(--surface-container-high)]"
            >
              <span className="material-symbols-outlined font-black">chevron_right</span>
            </button>
          </nav>
        )}
      </section>
    </div>
  );
}
