'use client';

import { useState } from 'react';
import useSWR from 'swr';
import { getPacks, getCollections, installCollection, type ConfigPack, type Collection } from '@/lib/api';
import { useI18n } from '@/lib/i18n';

export default function PacksPage() {
  const { t } = useI18n();
  const { data, isLoading } = useSWR('packs', getPacks);
  const { data: comboData } = useSWR('collections', getCollections);
  const packs = data?.packs || [];
  const combos = comboData?.collections || [];

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
            { icon: 'terminal', step: '1', titleKey: 'packs.step1', descKey: 'packs.step1Desc' },
            { icon: 'settings', step: '2', titleKey: 'packs.step2', descKey: 'packs.step2Desc' },
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

      {/* Skill Combos (merged from /combos) */}
      {combos.length > 0 && (
        <section className="py-8">
          <h2 className="text-xl font-bold mb-6" style={{ fontFamily: 'Manrope, sans-serif', color: 'var(--on-surface)' }}>
            {t('packs.combosTitle')}
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 stagger-grid">
            {combos.map((c, i) => (
              <ComboCard key={c.id} combo={c} index={i} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

function PackCard({ pack }: { pack: ConfigPack }) {
  const { t } = useI18n();
  const [downloaded, setDownloaded] = useState(false);

  const handleDownload = (filename: string) => {
    const a = document.createElement('a');
    a.href = `/packs/${pack.id}/${filename}`;
    a.download = filename;
    a.click();
    if (!downloaded) {
      setDownloaded(true);
      // Track download via API (fire-and-forget)
      fetch(`/api/packs/${pack.id}/download`).catch(() => {});
      setTimeout(() => setDownloaded(false), 3000);
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

      {/* Pack contents */}
      <div className="space-y-2 mb-4">
        {[
          { file: 'CLAUDE.md', icon: 'description', label: t('packs.fileClaude'), bg: 'var(--primary-fixed)' },
          { file: 'AGENTS.md', icon: 'groups', label: t('packs.fileAgents'), bg: 'var(--secondary-fixed)' },
          { file: 'settings.json', icon: 'hub', label: `${pack.mcpServers.length} MCP ${t('packs.fileSettings')}`, bg: 'var(--tertiary-fixed)' },
          { file: 'prompts.md', icon: 'chat', label: `${pack.prompts.length} ${t('packs.filePrompts')}`, bg: 'var(--surface-container)' },
        ].map(item => (
          <button
            key={item.file}
            onClick={() => handleDownload(item.file)}
            className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-xs transition-colors hover:bg-[var(--surface-container-low)] text-left"
          >
            <span className="w-7 h-7 rounded-md flex items-center justify-center shrink-0" style={{ background: item.bg }}>
              <span className="material-symbols-outlined text-sm" style={{ color: 'var(--on-surface)' }}>{item.icon}</span>
            </span>
            <span className="font-medium" style={{ color: 'var(--on-surface)' }}>{item.file}</span>
            <span className="ml-auto text-[10px]" style={{ color: 'var(--on-surface-variant)' }}>{item.label}</span>
          </button>
        ))}
      </div>

      {/* One-click install */}
      <div className="space-y-2 pt-4" style={{ borderTop: '1px solid rgba(195,198,215,0.2)' }}>
        <div
          className="px-3 py-2 rounded-lg text-xs font-mono truncate flex items-center gap-2"
          style={{ background: 'var(--surface-container-high)', color: 'var(--on-surface)' }}
        >
          <span className="shrink-0" style={{ color: 'var(--on-surface-variant)' }}>$</span>
          <span className="truncate">curl -sL openclaw-foundry.pages.dev/packs/{pack.id}/install.sh | bash</span>
        </div>
        <button
          onClick={() => {
            navigator.clipboard.writeText(`curl -sL https://openclaw-foundry.pages.dev/packs/${pack.id}/install.sh | bash`);
            setDownloaded(true);
            setTimeout(() => setDownloaded(false), 2000);
          }}
          className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-bold text-white transition-opacity hover:opacity-90"
          style={{ background: `linear-gradient(135deg, ${pack.color}, ${pack.color}cc)` }}
        >
          <span className="material-symbols-outlined text-sm">{downloaded ? 'check_circle' : 'content_copy'}</span>
          {downloaded ? t('packs.copied') : t('packs.copyInstall')}
        </button>
      </div>
    </div>
  );
}

const COMBO_COLORS = ['var(--primary)', 'var(--secondary)', 'var(--tertiary)', 'var(--surface-tint)', '#f59e0b', '#ec4899'];

function ComboCard({ combo, index = 0 }: { combo: Collection; index?: number }) {
  const { t } = useI18n();
  const [status, setStatus] = useState<'idle' | 'loading' | 'done'>('idle');

  const handleInstall = async () => {
    if (status !== 'idle') return;
    setStatus('loading');
    try {
      await installCollection(combo.id);
      setStatus('done');
      setTimeout(() => setStatus('idle'), 2000);
    } catch {
      setStatus('idle');
    }
  };

  return (
    <div
      className="rounded-2xl p-5 flex flex-col gap-3 transition-all hover:shadow-md"
      style={{
        background: 'var(--surface-container-lowest)',
        border: '1px solid rgba(195, 198, 215, 0.3)',
        borderTopWidth: '3px',
        borderTopColor: COMBO_COLORS[index % COMBO_COLORS.length],
      }}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <h3 className="font-bold text-sm truncate" style={{ fontFamily: 'Manrope, sans-serif', color: 'var(--on-surface)' }}>
            {combo.name}
          </h3>
          <p className="text-xs truncate mt-0.5" style={{ color: 'var(--on-surface-variant)' }}>
            {combo.tagline}
          </p>
        </div>
        <span className="px-2 py-0.5 rounded-full text-xs font-medium shrink-0" style={{ background: 'var(--surface-container)', color: 'var(--on-surface-variant)' }}>
          {combo.skillIds.length} skills
        </span>
      </div>

      <div className="flex flex-wrap gap-1.5">
        {combo.skillIds.slice(0, 5).map(id => (
          <span key={id} className="px-2 py-0.5 rounded-full text-xs" style={{ background: 'var(--surface-container)', color: 'var(--on-surface-variant)' }}>
            {id}
          </span>
        ))}
        {combo.skillIds.length > 5 && (
          <span className="px-2 py-0.5 rounded-full text-xs" style={{ background: 'var(--surface-container)', color: 'var(--outline)' }}>
            +{combo.skillIds.length - 5}
          </span>
        )}
      </div>

      <div className="flex gap-2 mt-auto pt-3" style={{ borderTop: '1px solid rgba(195,198,215,0.2)' }}>
        <button
          onClick={handleInstall}
          disabled={status === 'loading'}
          className="flex-1 py-2 rounded-lg text-xs font-bold text-white transition-opacity hover:opacity-90 disabled:opacity-60"
          style={{ background: 'linear-gradient(135deg, #497cff, #0053db)' }}
        >
          {status === 'done' ? t('packs.installed') : status === 'loading' ? t('packs.installing') : t('packs.installSkills')}
        </button>
        {combo.installCount > 0 && (
          <span className="flex items-center gap-1 text-xs px-2" style={{ color: 'var(--outline)' }}>
            <span className="material-symbols-outlined text-sm">download</span>
            {combo.installCount}
          </span>
        )}
      </div>
    </div>
  );
}
