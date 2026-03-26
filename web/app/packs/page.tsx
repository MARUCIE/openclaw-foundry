'use client';

import { useState } from 'react';
import useSWR from 'swr';
import { getPacks, downloadPack, type ConfigPack } from '@/lib/api';
import { useI18n } from '@/lib/i18n';

export default function PacksPage() {
  const { t } = useI18n();
  const { data, isLoading } = useSWR('packs', getPacks);
  const packs = data?.packs || [];

  return (
    <div className="max-w-7xl mx-auto px-6 py-12 space-y-10">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-1.5 h-10 rounded-full" style={{ background: 'var(--primary)' }} />
        <div>
          <h1 className="text-3xl md:text-4xl font-extrabold" style={{ fontFamily: 'Manrope, sans-serif', color: 'var(--on-surface)' }}>
            {t('packs.title')}
          </h1>
          <p className="text-sm mt-1" style={{ color: 'var(--on-surface-variant)' }}>
            {t('packs.subtitle')}
          </p>
        </div>
      </div>

      {/* Value proposition */}
      <div
        className="p-8 rounded-2xl flex flex-col md:flex-row items-center gap-8"
        style={{ background: 'linear-gradient(135deg, rgba(0,62,168,0.04), rgba(113,42,226,0.04))', border: '1px solid rgba(195,198,215,0.3)' }}
      >
        <div className="flex-1 space-y-3">
          <h2 className="text-xl font-bold" style={{ fontFamily: 'Manrope, sans-serif', color: 'var(--on-surface)' }}>
            {t('packs.hero')}
          </h2>
          <p className="text-sm leading-relaxed" style={{ color: 'var(--on-surface-variant)' }}>
            {t('packs.heroDesc')}
          </p>
        </div>
        <div className="flex gap-6 text-center shrink-0">
          <div>
            <div className="text-3xl font-extrabold" style={{ fontFamily: 'Manrope, sans-serif', color: 'var(--primary)' }}>30s</div>
            <div className="text-xs mt-1" style={{ color: 'var(--on-surface-variant)' }}>{t('packs.setupTime')}</div>
          </div>
          <div className="w-px" style={{ background: 'var(--outline-variant)' }} />
          <div>
            <div className="text-3xl font-extrabold" style={{ fontFamily: 'Manrope, sans-serif', color: 'var(--secondary)' }}>0</div>
            <div className="text-xs mt-1" style={{ color: 'var(--on-surface-variant)' }}>{t('packs.configNeeded')}</div>
          </div>
        </div>
      </div>

      {/* Pack cards */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-80 rounded-2xl skeleton-shimmer" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 stagger-grid">
          {packs.map(pack => (
            <PackCard key={pack.id} pack={pack} />
          ))}
        </div>
      )}

      {/* How it works */}
      <section className="py-8">
        <h2 className="text-xl font-bold text-center mb-8" style={{ fontFamily: 'Manrope, sans-serif', color: 'var(--on-surface)' }}>
          {t('packs.howItWorks')}
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[
            { icon: 'download', step: '1', titleKey: 'packs.step1', descKey: 'packs.step1Desc' },
            { icon: 'folder_copy', step: '2', titleKey: 'packs.step2', descKey: 'packs.step2Desc' },
            { icon: 'rocket_launch', step: '3', titleKey: 'packs.step3', descKey: 'packs.step3Desc' },
          ].map(s => (
            <div key={s.step} className="text-center space-y-3 p-6">
              <div
                className="w-12 h-12 rounded-full mx-auto flex items-center justify-center text-white font-bold"
                style={{ background: 'var(--primary)' }}
              >
                {s.step}
              </div>
              <h3 className="font-bold" style={{ fontFamily: 'Manrope, sans-serif', color: 'var(--on-surface)' }}>{t(s.titleKey)}</h3>
              <p className="text-sm" style={{ color: 'var(--on-surface-variant)' }}>{t(s.descKey)}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

function PackCard({ pack }: { pack: ConfigPack }) {
  const { t } = useI18n();
  const [downloading, setDownloading] = useState(false);
  const [downloaded, setDownloaded] = useState(false);

  const handleDownload = async () => {
    setDownloading(true);
    try {
      const data = await downloadPack(pack.id);
      // Generate downloadable JSON
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${pack.id}-config-pack.json`;
      a.click();
      URL.revokeObjectURL(url);
      setDownloaded(true);
      setTimeout(() => setDownloaded(false), 3000);
    } catch {
      // silent fail
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div
      className="rounded-2xl p-6 flex flex-col transition-all hover:shadow-lg"
      style={{
        background: 'var(--surface-container-lowest)',
        border: '1px solid rgba(195, 198, 215, 0.3)',
        borderTopWidth: '4px',
        borderTopColor: pack.color,
      }}
    >
      {/* Icon + role */}
      <div className="flex items-center gap-3 mb-4">
        <div
          className="w-12 h-12 rounded-xl flex items-center justify-center"
          style={{ background: `${pack.color}15`, color: pack.color }}
        >
          <span className="material-symbols-outlined text-2xl">{pack.icon}</span>
        </div>
        <div>
          <h3 className="font-bold" style={{ fontFamily: 'Manrope, sans-serif', color: 'var(--on-surface)' }}>
            {pack.roleZh}
          </h3>
          <p className="text-xs" style={{ color: 'var(--on-surface-variant)' }}>{pack.role}</p>
        </div>
      </div>

      {/* Description */}
      <p className="text-sm leading-relaxed mb-4 flex-1" style={{ color: 'var(--on-surface-variant)' }}>
        {pack.descriptionZh}
      </p>

      {/* Included items */}
      <div className="flex flex-wrap gap-2 mb-4">
        <span className="flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium" style={{ background: 'var(--primary-fixed)', color: 'var(--on-primary-fixed-variant)' }}>
          <span className="material-symbols-outlined text-sm">description</span>
          CLAUDE.md
        </span>
        <span className="flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium" style={{ background: 'var(--secondary-fixed)', color: 'var(--on-secondary-fixed-variant)' }}>
          <span className="material-symbols-outlined text-sm">hub</span>
          {pack.mcpServers.length} MCP
        </span>
        <span className="flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium" style={{ background: 'var(--tertiary-fixed)', color: 'var(--on-tertiary-fixed-variant)' }}>
          <span className="material-symbols-outlined text-sm">widgets</span>
          {pack.skillIds.length} Skills
        </span>
        <span className="flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium" style={{ background: 'var(--surface-container)', color: 'var(--on-surface-variant)' }}>
          <span className="material-symbols-outlined text-sm">chat</span>
          {pack.prompts.length} Prompts
        </span>
      </div>

      {/* Download stats + button */}
      <div className="flex items-center justify-between pt-4" style={{ borderTop: '1px solid rgba(195,198,215,0.2)' }}>
        {pack.downloadCount > 0 && (
          <span className="text-xs flex items-center gap-1" style={{ color: 'var(--on-surface-variant)' }}>
            <span className="material-symbols-outlined text-sm">download</span>
            {pack.downloadCount}
          </span>
        )}
        <button
          onClick={handleDownload}
          disabled={downloading}
          className="ml-auto flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold text-white transition-opacity hover:opacity-90 disabled:opacity-60"
          style={{ background: `linear-gradient(135deg, ${pack.color}, ${pack.color}cc)` }}
        >
          <span className="material-symbols-outlined text-sm">
            {downloaded ? 'check_circle' : downloading ? 'hourglass_empty' : 'download'}
          </span>
          {downloaded ? t('packs.downloaded') : downloading ? t('packs.downloading') : t('packs.download')}
        </button>
      </div>
    </div>
  );
}
