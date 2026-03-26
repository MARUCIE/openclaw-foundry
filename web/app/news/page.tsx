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
    <div className="max-w-7xl mx-auto px-6 py-12">
      {/* Header */}
      <div className="flex items-center gap-3 mb-10">
        <div className="w-1.5 h-10 rounded-full" style={{ background: 'var(--primary)' }} />
        <div>
          <h1
            className="text-3xl md:text-4xl font-extrabold"
            style={{ fontFamily: 'Manrope, sans-serif', color: 'var(--on-surface)' }}
          >
            {t('news.title')}
          </h1>
          <p className="text-sm mt-1" style={{ color: 'var(--on-surface-variant)' }}>
            {t('news.subtitle')}
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 flex-wrap mb-10" role="tablist">
        {TAB_KEYS.map(tabKey => (
          <button
            key={tabKey}
            role="tab"
            aria-selected={activeTab === tabKey}
            onClick={() => setActiveTab(tabKey)}
            className="px-4 py-2 rounded-full text-sm font-bold transition-all"
            style={{
              background: activeTab === tabKey ? 'var(--primary)' : 'var(--surface-container)',
              color: activeTab === tabKey ? 'var(--on-primary)' : 'var(--on-surface-variant)',
            }}
          >
            {t(tabKey)}
          </button>
        ))}
      </div>

      {/* Featured Article */}
      <section
        className="rounded-2xl overflow-hidden mb-12 flex flex-col md:flex-row"
        style={{ background: 'var(--surface-container-lowest)', border: '1px solid rgba(195, 198, 215, 0.3)' }}
      >
        <div className="md:w-3/5 p-8 md:p-12 flex flex-col justify-center space-y-5" style={{ borderLeft: '4px solid var(--primary-container)' }}>
          <div className="flex items-center gap-3">
            <span className={`px-3 py-1 text-[10px] font-bold rounded-full uppercase ${FEATURED.tagColor}`}>{FEATURED.tag}</span>
            <time className="text-xs" style={{ color: 'var(--on-surface-variant)' }}>{FEATURED.date}</time>
          </div>
          <h2
            className="text-3xl font-extrabold leading-tight"
            style={{ fontFamily: 'Manrope, sans-serif', color: 'var(--primary)' }}
          >
            {FEATURED.title}
          </h2>
          <p className="text-lg leading-relaxed" style={{ color: 'var(--on-surface-variant)' }}>{FEATURED.desc}</p>
          <span className="font-bold text-sm inline-flex items-center gap-2" style={{ color: 'var(--primary)' }}>
            {t('news.readMore')} <span className="material-symbols-outlined text-sm">arrow_forward</span>
          </span>
        </div>
        <div
          className="md:w-2/5 h-64 md:h-auto flex flex-col items-center justify-center relative overflow-hidden"
          style={{ background: 'linear-gradient(135deg, #003ea8, #1a1c2e)' }}
        >
          <div className="absolute inset-0 opacity-20" style={{ backgroundImage: 'repeating-linear-gradient(45deg, transparent, transparent 20px, rgba(255,255,255,0.1) 20px, rgba(255,255,255,0.1) 21px)' }} />
          <div className="relative z-10 text-center space-y-3 p-8">
            <div className="text-5xl font-black text-white/30 italic" style={{ fontFamily: 'Manrope, sans-serif' }}>NEWS</div>
            <div className="text-sm text-white/50 tracking-widest uppercase">OpenClaw Foundry</div>
          </div>
        </div>
      </section>

      {/* Two-column layout */}
      <div className="flex flex-col lg:flex-row gap-10">
        {/* Left: News feed */}
        <div className="flex-1 space-y-1" role="feed">
          {filtered.map((n, i) => (
            <article
              key={i}
              className="p-6 rounded-2xl transition-colors cursor-pointer hover:bg-[var(--surface-container-low)]"
              style={{ borderBottom: i < filtered.length - 1 ? '1px solid rgba(195, 198, 215, 0.2)' : 'none' }}
            >
              <div className="flex items-center gap-3 mb-3">
                <span className={`px-3 py-1 text-[10px] font-bold rounded-full uppercase ${n.tagColor}`}>{n.tag}</span>
                <time className="text-xs" style={{ color: 'var(--on-surface-variant)' }}>{n.date}</time>
              </div>
              <h3 className="font-bold text-lg mb-2 transition-colors" style={{ color: 'var(--on-surface)' }}>{n.title}</h3>
              <p className="text-sm line-clamp-2" style={{ color: 'var(--on-surface-variant)' }}>{n.desc}</p>
            </article>
          ))}
        </div>

        {/* Right: Sidebar widgets */}
        <aside className="w-full lg:w-80 shrink-0 space-y-8" aria-label="Sidebar">
          {/* Version Tracker */}
          <div className="p-6 rounded-2xl" style={{ background: 'var(--surface-container-lowest)', border: '1px solid rgba(195, 198, 215, 0.2)' }}>
            <h3 className="font-bold mb-4" style={{ fontFamily: 'Manrope, sans-serif', color: 'var(--on-surface)' }}>{t('news.versionTracker')}</h3>
            <div className="space-y-3">
              {VERSION_TRACKER.map(v => (
                <div key={v.name} className="flex justify-between items-center py-2" style={{ borderBottom: '1px solid rgba(195, 198, 215, 0.15)' }}>
                  <div>
                    <span className="text-sm font-bold" style={{ color: 'var(--on-surface)' }}>{v.name}</span>
                    <span className="ml-2 text-xs" style={{ color: 'var(--primary)' }}>{v.version}</span>
                  </div>
                  <time className="text-xs" style={{ color: 'var(--on-surface-variant)' }}>{v.date}</time>
                </div>
              ))}
            </div>
          </div>

          {/* Tags */}
          <div className="p-6 rounded-2xl" style={{ background: 'var(--surface-container-lowest)', border: '1px solid rgba(195, 198, 215, 0.2)' }}>
            <h3 className="font-bold mb-4" style={{ fontFamily: 'Manrope, sans-serif', color: 'var(--on-surface)' }}>{t('news.popularTags')}</h3>
            <div className="flex flex-wrap gap-2">
              {TAGS.map(tag => (
                <span
                  key={tag}
                  className="px-3 py-1.5 rounded-full text-xs font-bold"
                  style={{ background: 'var(--surface-container)', color: 'var(--on-surface-variant)' }}
                >
                  {tag}
                </span>
              ))}
            </div>
          </div>

          {/* Subscribe */}
          <div
            className="p-6 rounded-2xl text-center space-y-4"
            style={{ background: 'linear-gradient(135deg, #003ea8, #0053db)', color: 'white' }}
          >
            <span className="material-symbols-outlined text-3xl" style={{ fontVariationSettings: "'FILL' 1" }}>mail</span>
            <h3 className="font-bold" style={{ fontFamily: 'Manrope, sans-serif' }}>{t('news.subscribe')}</h3>
            <p className="text-xs" style={{ color: 'rgba(255,255,255,0.85)' }}>{t('news.newsletter')}</p>
            <a
              href="mailto:maurice_wen@proton.me?subject=OpenClaw%20Newsletter%20Subscribe"
              className="w-full py-2.5 rounded-lg text-sm font-bold transition-opacity hover:opacity-90 text-center block"
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
