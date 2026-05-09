
'use client';

import { useState } from 'react';
import { useI18n } from '@/lib/i18n';
import { TAB_KEYS, TAB_TO_CATEGORY, FEATURED, NEWS_FEED, VERSION_TRACKER, TAGS } from '@/lib/news-data';

export default function NewsPage() {
  const { t } = useI18n();
  const [activeTab, setActiveTab] = useState<string>('news.tab.all');

  const filtered = activeTab === 'news.tab.all'
    ? NEWS_FEED
    : NEWS_FEED.filter(n => n.category === TAB_TO_CATEGORY[activeTab]);

  return (
    <div className="page-shell py-12 space-y-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-2 h-10 rounded-full" style={{ background: 'var(--primary)' }} />
            <h1
              className="text-4xl md:text-5xl font-black tracking-tight text-balance"
              style={{ color: 'var(--on-surface)' }}
            >
              {t('news.title')}
            </h1>
          </div>
          <p className="text-lg font-medium opacity-60 text-pretty">
            {t('news.subtitle')}
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 flex-wrap p-1.5 rounded-2xl bg-[var(--surface-container-low)] border border-[var(--outline-variant)] w-fit" role="tablist">
        {TAB_KEYS.map(tabKey => (
          <button
            key={tabKey}
            role="tab"
            aria-selected={activeTab === tabKey}
            onClick={() => setActiveTab(tabKey)}
            className="px-6 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all"
            style={{
              background: activeTab === tabKey ? 'var(--primary)' : 'transparent',
              color: activeTab === tabKey ? 'white' : 'var(--on-surface-variant)',
            }}
          >
            {t(tabKey)}
          </button>
        ))}
      </div>

      {/* Featured Article */}
      <section
        className="rounded-[2.5rem] overflow-hidden flex flex-col lg:flex-row relative group transition-all hover:shadow-2xl hover:-translate-y-1"
        style={{ background: 'var(--surface-container-lowest)', border: '1px solid var(--outline-variant)' }}
      >
        <div className="lg:w-3/5 p-10 md:p-16 flex flex-col justify-center space-y-6 relative z-10">
          <div className="flex items-center gap-4">
            <span className={`px-3 py-1 text-[var(--af-fs-meta)] font-black uppercase tracking-widest rounded-full shadow-sm ${FEATURED.tagColor}`}>{FEATURED.tag}</span>
            <time className="text-[var(--af-fs-meta)] font-black uppercase tracking-[0.2em] opacity-40">{FEATURED.date}</time>
          </div>
          <h2
            className="text-3xl md:text-4xl font-black leading-tight tracking-tight text-balance"
            style={{ color: 'var(--primary)' }}
          >
            {FEATURED.title}
          </h2>
          <p className="text-lg font-medium leading-relaxed opacity-70 text-pretty">{FEATURED.desc}</p>
          <div className="pt-4">
            <span className="inline-flex items-center gap-2 px-6 py-2 rounded-full text-[var(--af-fs-meta)] font-black uppercase tracking-[0.2em] transition-all group-hover:gap-4" style={{ background: 'var(--primary)', color: 'white' }}>
              {t('news.readMore')} <span className="material-symbols-outlined text-sm font-black">arrow_forward</span>
            </span>
          </div>
        </div>
        <div
          className="lg:w-2/5 h-64 lg:h-auto flex flex-col items-center justify-center relative overflow-hidden"
          style={{ background: 'linear-gradient(135deg, var(--primary), var(--af-brand-deep-mix))' }}
        >
          <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'repeating-linear-gradient(45deg, transparent, transparent 20px, rgba(255,255,255,0.1) 20px, rgba(255,255,255,0.1) 21px)' }} />
          <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
          <div className="relative z-10 text-center space-y-4 p-8">
            <div className="text-7xl font-black text-white/10 tracking-tighter italic">NEWS</div>
            <div className="text-[var(--af-fs-meta)] text-white/40 font-black tracking-[0.5em] uppercase">Agent Foundry</div>
          </div>
        </div>
      </section>

      {/* Two-column layout */}
      <div className="flex flex-col lg:flex-row gap-12">
        {/* Left: News feed */}
        <div className="flex-1 space-y-4" role="feed">
          {filtered.length === 0 ? (
            <div className="py-20 text-center rounded-[3rem] border-2 border-dashed border-[var(--outline-variant)]">
              <span className="material-symbols-outlined text-5xl opacity-10 font-black">inbox</span>
              <p className="mt-4 text-[var(--af-fs-meta)] font-black uppercase tracking-[0.2em] opacity-40 text-pretty">No news in this category</p>
            </div>
          ) : (
            filtered.map((n, i) => (
              <article
                key={i}
                className="p-8 rounded-[2rem] transition-all cursor-pointer hover:bg-[var(--surface-container-low)] border border-transparent hover:border-[var(--outline-variant)] group"
              >
                <div className="flex items-center gap-4 mb-4">
                  <span className={`px-2.5 py-0.5 text-[var(--af-fs-micro)] font-black uppercase tracking-widest rounded-full ${n.tagColor}`}>{n.tag}</span>
                  <time className="text-[var(--af-fs-meta)] font-black uppercase tracking-[0.2em] opacity-40">{n.date}</time>
                </div>
                <h3 className="text-xl font-black mb-3 tracking-tight group-hover:text-[var(--primary)] transition-colors text-balance" style={{ color: 'var(--on-surface)' }}>{n.title}</h3>
                <p className="text-sm font-medium leading-relaxed opacity-60 line-clamp-2 text-pretty">{n.desc}</p>
              </article>
            ))
          )}
        </div>

        {/* Right: Sidebar widgets */}
        <aside className="w-full lg:w-80 shrink-0 space-y-10" aria-label="Sidebar">
          {/* Version Tracker */}
          <div className="p-8 rounded-[2rem] border border-[var(--outline-variant)] bg-[var(--surface-container-lowest)] shadow-sm space-y-6">
            <h3 className="text-[var(--af-fs-meta)] font-black uppercase tracking-[0.2em] opacity-50 text-balance">{t('news.versionTracker')}</h3>
            <div className="space-y-4">
              {VERSION_TRACKER.map(v => (
                <div key={v.name} className="flex justify-between items-center pb-4 border-b border-dashed border-[var(--outline-variant)] last:border-0 last:pb-0">
                  <div className="flex flex-col">
                    <span className="text-sm font-black" style={{ color: 'var(--on-surface)' }}>{v.name}</span>
                    <span className="text-[var(--af-fs-meta)] font-black uppercase tracking-widest text-[var(--primary)] mt-0.5">{v.version}</span>
                  </div>
                  <time className="text-[var(--af-fs-meta)] font-black opacity-40 uppercase">{v.date}</time>
                </div>
              ))}
            </div>
          </div>

          {/* Tags */}
          <div className="p-8 rounded-[2rem] border border-[var(--outline-variant)] bg-[var(--surface-container-lowest)] shadow-sm space-y-6">
            <h3 className="text-[var(--af-fs-meta)] font-black uppercase tracking-[0.2em] opacity-50 text-balance">{t('news.popularTags')}</h3>
            <div className="flex flex-wrap gap-2">
              {TAGS.map(tag => (
                <span
                  key={tag}
                  className="px-3 py-1.5 rounded-full text-[var(--af-fs-meta)] font-black uppercase tracking-widest transition-all hover:bg-[var(--primary-container)] hover:text-[var(--on-primary-container)] cursor-default"
                  style={{ background: 'var(--surface-container-high)', color: 'var(--on-surface-variant)' }}
                >
                  {tag}
                </span>
              ))}
            </div>
          </div>

          {/* Subscribe */}
          <div
            className="p-10 rounded-[2.5rem] text-center space-y-6 relative overflow-hidden group shadow-xl"
            style={{ background: 'linear-gradient(135deg, var(--primary), var(--surface-tint))', color: 'white' }}
          >
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -mr-16 -mt-16 transition-transform group-hover:scale-150" />
            <span className="material-symbols-outlined text-4xl font-black" style={{ fontVariationSettings: "'FILL' 1" }}>mail</span>
            <div className="space-y-2">
              <h3 className="text-xl font-black tracking-tight text-balance">{t('news.subscribe')}</h3>
              <p className="text-xs font-medium leading-relaxed opacity-80 text-pretty">{t('news.newsletter')}</p>
            </div>
            <a
              href="mailto:maurice_wen@proton.me?subject=OpenClaw%20Newsletter%20Subscribe"
              className="w-full py-4 rounded-2xl text-[var(--af-fs-meta)] font-black uppercase tracking-[0.2em] transition-all hover:shadow-2xl hover:-translate-y-1 active:scale-95 text-center block"
              style={{ background: 'white', color: 'var(--primary)' }}
            >
              {t('news.subscribe')}
            </a>
          </div>
        </aside>
      </div>
    </div>
  );
}
