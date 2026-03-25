'use client';

import { useState } from 'react';
import useSWR from 'swr';
import { getProviders, type ProviderMeta } from '@/lib/api';
import Link from 'next/link';
import { useI18n } from '@/lib/i18n';
import { TIER_CONFIG, TYPE_ICONS } from '@/lib/constants';

const FILTER_TYPES = ['all', 'desktop', 'cloud', 'saas', 'mobile'];
const TYPE_LABEL_KEYS: Record<string, string> = { desktop: 'type.desktop', cloud: 'type.cloud', saas: 'type.saas', mobile: 'type.mobile', remote: 'type.remote' };

export default function PlatformsPage() {
  const { t } = useI18n();
  const [filterType, setFilterType] = useState('all');
  const { data, isLoading } = useSWR('providers', () => getProviders(), { refreshInterval: 30000 });

  const providers = data?.providers || [];
  const filtered = filterType === 'all' ? providers : providers.filter(p => p.type === filterType);

  // Group by tier
  const grouped = {
    'full-auto': filtered.filter(p => p.tier === 'full-auto'),
    'semi-auto': filtered.filter(p => p.tier === 'semi-auto'),
    'guided': filtered.filter(p => p.tier === 'guided'),
  };

  if (isLoading) {
    return (
      <div className="max-w-7xl mx-auto px-6 py-12">
        <div className="h-10 w-64 rounded-lg animate-pulse mb-8" style={{ background: 'var(--surface-container)' }} />
        <div className="grid grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map(i => (
            <div key={i} className="h-48 rounded-2xl animate-pulse" style={{ background: 'var(--surface-container)' }} />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-6 py-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 mb-12">
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-1.5 h-10 rounded-full" style={{ background: 'var(--primary)' }} />
            <h1
              className="text-3xl md:text-4xl font-extrabold"
              style={{ fontFamily: 'Manrope, sans-serif', color: 'var(--on-surface)' }}
            >
              {t('platforms.title')}
            </h1>
          </div>
          <p className="text-lg" style={{ color: 'var(--on-surface-variant)' }}>
            {t('platforms.subtitle', { count: providers.length })}
          </p>
        </div>
        <div className="flex gap-2 flex-wrap">
          {FILTER_TYPES.map(ft => (
            <button
              key={ft}
              onClick={() => setFilterType(ft)}
              className="px-4 py-2 rounded-full text-sm font-bold transition-all"
              style={{
                background: filterType === ft ? 'var(--primary)' : 'var(--surface-container)',
                color: filterType === ft ? 'var(--on-primary)' : 'var(--on-surface-variant)',
              }}
            >
              {ft === 'all' ? t('platforms.all') : (TYPE_LABEL_KEYS[ft] ? t(TYPE_LABEL_KEYS[ft]) : ft)}
            </button>
          ))}
        </div>
      </div>

      {/* Tier sections */}
      {(['full-auto', 'semi-auto', 'guided'] as const).map(tier => {
        const items = grouped[tier];
        if (items.length === 0) return null;
        const cfg = TIER_CONFIG[tier];
        return (
          <section key={tier} className="mb-16">
            <div className="flex items-center gap-3 p-4 rounded-2xl mb-6" style={{ background: cfg.bg }}>
              <span className="material-symbols-outlined" style={{ color: cfg.color, fontVariationSettings: "'FILL' 1" }}>{cfg.icon}</span>
              <h2 className="font-bold" style={{ fontFamily: 'Manrope, sans-serif', color: cfg.color }}>{t(cfg.labelKey)}</h2>
              <span className="ml-auto text-sm font-bold" style={{ color: cfg.color }}>{t('platforms.count', { count: items.length })}</span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {items.map((p: ProviderMeta) => (
                <div
                  key={p.id}
                  className="p-6 rounded-2xl transition-all card-hover flex flex-col"
                  style={{
                    background: 'var(--surface-container-lowest)',
                    border: '1px solid rgba(195, 198, 215, 0.3)',
                  }}
                >
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex gap-3 items-center">
                      <div
                        className="w-12 h-12 rounded-xl flex items-center justify-center"
                        style={{ background: 'var(--surface-container)', color: 'var(--primary)' }}
                      >
                        <span className="material-symbols-outlined">{TYPE_ICONS[p.type] || 'devices'}</span>
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="w-2 h-2 rounded-full" style={{ background: cfg.dot }} />
                          <h3 className="font-bold" style={{ color: 'var(--on-surface)' }}>{p.name}</h3>
                        </div>
                        <p className="text-xs" style={{ color: 'var(--on-surface-variant)' }}>{p.vendor}</p>
                      </div>
                    </div>
                    <span
                      className="px-2 py-0.5 rounded-full text-[10px] font-bold"
                      style={{ background: cfg.bg, color: cfg.color }}
                    >
                      {TYPE_LABEL_KEYS[p.type] ? t(TYPE_LABEL_KEYS[p.type]) : p.type}
                    </span>
                  </div>
                  <p className="text-sm mb-4 line-clamp-3" style={{ color: 'var(--on-surface-variant)' }}>{p.description}</p>
                  {p.price && (
                    <p className="text-xs font-bold mb-3" style={{ color: 'var(--primary)' }}>{p.price}</p>
                  )}
                  <div className="flex gap-2 mt-auto pt-4" style={{ borderTop: '1px solid rgba(195, 198, 215, 0.2)' }}>
                    <Link
                      href={`/deploy?provider=${p.id}`}
                      className="flex-1 text-center py-2.5 rounded-lg text-xs font-bold transition-opacity hover:opacity-90"
                      style={{ background: 'var(--primary-container)', color: 'var(--on-primary)' }}
                    >
                      {t('platforms.deploy')}
                    </Link>
                    {p.github && (
                      <a
                        href={p.github}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center justify-center gap-1 px-4 py-2.5 rounded-lg text-xs font-bold transition-colors hover:bg-[var(--surface-container)]"
                        style={{ background: 'var(--surface-container-low)', color: 'var(--on-surface-variant)' }}
                      >
                        GitHub
                      </a>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </section>
        );
      })}

      {/* Fallback for no tier data */}
      {filtered.length === 0 && (
        <div className="text-center py-20">
          <span className="material-symbols-outlined text-5xl" style={{ color: 'var(--outline-variant)' }}>search_off</span>
          <p className="mt-4 text-lg" style={{ color: 'var(--on-surface-variant)' }}>{t('platforms.noMatch')}</p>
        </div>
      )}
    </div>
  );
}
