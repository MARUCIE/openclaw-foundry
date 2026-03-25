'use client';

import { useState } from 'react';
import useSWR from 'swr';
import { getCollections, installCollection, type Collection } from '@/lib/api';
import { useI18n } from '@/lib/i18n';

const fetcher = () => getCollections();

export default function CombosPage() {
  const { t } = useI18n();
  const { data, isLoading } = useSWR('collections', fetcher);
  const collections = data?.collections || [];
  const featured = collections.find(c => c.featured);
  const rest = collections.filter(c => !c.featured);

  const totalSkills = collections.reduce((sum, c) => sum + c.skillIds.length, 0);
  const totalInstalls = collections.reduce((sum, c) => sum + c.installCount, 0);

  return (
    <div className="max-w-7xl mx-auto px-6 py-12 space-y-10">
      {/* Hero */}
      <div>
        <div className="flex items-center gap-3">
          <div className="w-1.5 h-10 rounded-full" style={{ background: 'var(--primary)' }} />
          <div>
            <h1 className="text-3xl font-extrabold" style={{ fontFamily: 'Manrope, sans-serif', color: 'var(--on-surface)' }}>
              {t('combos.title')}
            </h1>
            <p className="text-sm mt-1" style={{ color: 'var(--on-surface-variant)' }}>
              {t('combos.subtitle')}
            </p>
          </div>
        </div>
        {!isLoading && collections.length > 0 && (
          <div className="flex gap-3 mt-4 ml-5">
            <StatPill icon="collections_bookmark" value={collections.length} label={t('combos.recipes')} />
            <StatPill icon="extension" value={totalSkills} label={t('combos.skills')} />
            <StatPill icon="download" value={totalInstalls} label={t('combos.installs')} />
          </div>
        )}
      </div>

      {/* Loading */}
      {isLoading && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="h-52 rounded-xl animate-pulse" style={{ background: 'var(--surface-container)' }} />
          ))}
        </div>
      )}

      {/* Empty state */}
      {!isLoading && collections.length === 0 && (
        <div
          className="flex flex-col items-center justify-center py-20 rounded-xl"
          style={{ background: 'var(--surface-container-lowest)' }}
        >
          <span
            className="material-symbols-outlined text-5xl mb-4"
            style={{ color: 'var(--outline)' }}
          >
            auto_awesome
          </span>
          <p className="text-sm" style={{ color: 'var(--on-surface-variant)' }}>
            {t('combos.empty')}
          </p>
        </div>
      )}

      {/* Featured collection */}
      {!isLoading && featured && <FeaturedCard collection={featured} />}

      {/* Collections grid */}
      {!isLoading && rest.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 stagger-grid">
          {rest.map((c, i) => (
            <CollectionCard key={c.id} collection={c} index={i} />
          ))}
        </div>
      )}
    </div>
  );
}

/* ---- Sub-components ---- */

function StatPill({ icon, value, label }: { icon: string; value: number; label: string }) {
  return (
    <div
      className="flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium"
      style={{ background: 'var(--surface-container)', color: 'var(--on-surface-variant)' }}
    >
      <span className="material-symbols-outlined text-sm">{icon}</span>
      <span style={{ color: 'var(--on-surface)', fontWeight: 600 }}>{value}</span>
      {label}
    </div>
  );
}

function SkillPills({ skillIds, max = 5 }: { skillIds: string[]; max?: number }) {
  const { t } = useI18n();
  const visible = skillIds.slice(0, max);
  const remaining = skillIds.length - max;
  return (
    <div className="flex flex-wrap gap-1.5">
      {visible.map(id => (
        <span
          key={id}
          className="px-2 py-0.5 rounded-full text-xs"
          style={{ background: 'var(--surface-container)', color: 'var(--on-surface-variant)' }}
        >
          {id}
        </span>
      ))}
      {remaining > 0 && (
        <span
          className="px-2 py-0.5 rounded-full text-xs"
          style={{ background: 'var(--surface-container)', color: 'var(--outline)' }}
        >
          {t('combos.more', { count: remaining })}
        </span>
      )}
    </div>
  );
}

function InstallButton({ collection, size = 'normal' }: { collection: Collection; size?: 'normal' | 'large' }) {
  const { t } = useI18n();
  const [status, setStatus] = useState<'idle' | 'loading' | 'done'>('idle');

  const handleInstall = async () => {
    if (status !== 'idle') return;
    setStatus('loading');
    try {
      await installCollection(collection.id);
      setStatus('done');
      setTimeout(() => setStatus('idle'), 2000);
    } catch {
      setStatus('idle');
    }
  };

  const label =
    status === 'loading' ? t('combos.installing') :
    status === 'done' ? t('combos.installed') :
    size === 'large'
      ? t('combos.installAll', { count: collection.skillIds.length })
      : t('combos.install');

  return (
    <button
      onClick={handleInstall}
      disabled={status === 'loading'}
      className={`${size === 'large' ? 'px-6 py-2.5' : 'flex-1 py-2'} rounded-lg text-xs font-bold text-white transition-opacity hover:opacity-90 disabled:opacity-60`}
      style={{ background: 'linear-gradient(135deg, #497cff, #0053db)' }}
    >
      {label}
    </button>
  );
}

function FeaturedCard({ collection: c }: { collection: Collection }) {
  return (
    <div
      className="rounded-2xl p-6 transition-all hover:shadow-lg"
      style={{
        background: 'linear-gradient(135deg, rgba(0,62,168,0.03), rgba(113,42,226,0.03))',
        boxShadow: '0 4px 16px rgba(0, 62, 168, 0.08)',
        border: '1px solid rgba(0, 62, 168, 0.15)',
        borderTopWidth: '3px',
        borderTopColor: 'var(--surface-tint)',
      }}
    >
      <div className="flex items-start justify-between gap-4 mb-3">
        <div>
          <h3 className="text-lg font-bold" style={{ fontFamily: 'Manrope, sans-serif' }}>{c.name}</h3>
          <p className="text-sm mt-0.5" style={{ color: 'var(--on-surface-variant)' }}>{c.tagline}</p>
        </div>
        <span
          className="px-2 py-0.5 rounded-full text-xs font-medium shrink-0"
          style={{ background: 'var(--primary-fixed)', color: 'var(--on-primary-fixed)' }}
        >
          Featured
        </span>
      </div>

      <p className="text-xs mb-1" style={{ color: 'var(--outline)' }}>
        Curator: {c.curator}
      </p>

      <div className="my-3">
        <SkillPills skillIds={c.skillIds} max={8} />
      </div>

      <div className="flex items-center gap-4 mt-4">
        <InstallButton collection={c} size="large" />
        <span className="flex items-center gap-1 text-xs" style={{ color: 'var(--outline)' }}>
          <span className="material-symbols-outlined text-sm">download</span>
          {c.installCount}
        </span>
      </div>
    </div>
  );
}

const BORDER_COLORS = ['var(--primary)', 'var(--secondary)', 'var(--tertiary)', 'var(--surface-tint)', '#f59e0b', '#ec4899'];

function CollectionCard({ collection: c, index = 0 }: { collection: Collection; index?: number }) {
  const { t } = useI18n();
  return (
    <div
      className="flex flex-col gap-3 rounded-2xl p-5 transition-all hover:shadow-md"
      style={{
        background: 'var(--surface-container-lowest)',
        boxShadow: '0 1px 3px rgba(0, 0, 0, 0.04)',
        border: '1px solid rgba(195, 198, 215, 0.3)',
        borderTopWidth: '3px',
        borderTopColor: BORDER_COLORS[index % BORDER_COLORS.length],
      }}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <h3 className="font-semibold text-sm truncate" style={{ fontFamily: 'Manrope, sans-serif' }}>
            {c.name}
          </h3>
          <p className="text-xs truncate mt-0.5" style={{ color: 'var(--on-surface-variant)' }}>
            {c.tagline}
          </p>
        </div>
        <span
          className="px-2 py-0.5 rounded-full text-xs font-medium shrink-0"
          style={{ background: 'var(--surface-container)', color: 'var(--on-surface-variant)' }}
        >
          {c.skillIds.length} skills
        </span>
      </div>

      <SkillPills skillIds={c.skillIds} />

      <div className="flex items-center gap-3 text-xs" style={{ color: 'var(--outline)' }}>
        <span>{c.curator}</span>
        {c.installCount > 0 && (
          <span className="flex items-center gap-1">
            <span className="material-symbols-outlined text-sm">download</span>
            {c.installCount}
          </span>
        )}
      </div>

      <div className="flex gap-2 mt-auto pt-3" style={{ borderTop: '1px solid var(--surface-container-low)' }}>
        <InstallButton collection={c} />
        <button
          className="flex-1 py-2 rounded-lg text-xs font-medium transition-colors hover:bg-[var(--surface-container)]"
          style={{ background: 'var(--surface-container-low)', color: 'var(--on-surface)' }}
        >
          {t('combos.details')}
        </button>
      </div>
    </div>
  );
}
