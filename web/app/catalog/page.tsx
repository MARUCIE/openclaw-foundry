'use client';

import { useState, useCallback, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import useSWR from 'swr';
import { getProviders, type ProviderMeta } from '@/lib/api';
import { TypeBadge, StatusBadge } from '@/components/ui/badge';
import Link from 'next/link';
import { useI18n } from '@/lib/i18n';
import { TYPE_ICONS, TYPE_COLORS } from '@/lib/constants';
import { ErrorState, EmptyState } from '@/components/ui/states';

const fetcher = () => getProviders();

const TYPE_FILTERS = ['all', 'desktop', 'saas', 'cloud', 'mobile', 'remote'] as const;
const STATUS_FILTERS = ['all', 'stable', 'beta', 'preview'] as const;

export default function CatalogPage() {
  return (
    <Suspense fallback={
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {[1, 2, 3, 4, 5, 6].map(i => (
          <div key={i} className="h-52 rounded-xl animate-pulse" style={{ background: 'var(--surface-container)' }} />
        ))}
      </div>
    }>
      <CatalogContent />
    </Suspense>
  );
}

function CatalogContent() {
  const { t } = useI18n();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { data, isLoading, error, mutate } = useSWR('providers', fetcher);

  const [typeFilter, setTypeFilter] = useState<string>(searchParams.get('type') || 'all');
  const [statusFilter, setStatusFilter] = useState<string>(searchParams.get('status') || 'all');
  const [search, setSearch] = useState(searchParams.get('q') || '');

  const updateURL = useCallback((type: string, status: string, q: string) => {
    const params = new URLSearchParams();
    if (type !== 'all') params.set('type', type);
    if (status !== 'all') params.set('status', status);
    if (q) params.set('q', q);
    const qs = params.toString();
    router.replace(qs ? `?${qs}` : '/catalog', { scroll: false });
  }, [router]);

  const handleType = (v: string) => { setTypeFilter(v); updateURL(v, statusFilter, search); };
  const handleStatus = (v: string) => { setStatusFilter(v); updateURL(typeFilter, v, search); };
  const handleSearch = (v: string) => { setSearch(v); updateURL(typeFilter, statusFilter, v); };

  const providers = data?.providers || [];
  const filtered = providers.filter(p => {
    if (typeFilter !== 'all' && p.type !== typeFilter) return false;
    if (statusFilter !== 'all' && p.status !== statusFilter) return false;
    if (search && !p.name.toLowerCase().includes(search.toLowerCase()) &&
        !p.vendor.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const typeLabels: Record<string, string> = { all: t('catalog.all'), desktop: t('type.desktop'), saas: 'SaaS', cloud: t('type.cloud'), mobile: t('type.mobile'), remote: t('type.remote') };
  const statusLabels: Record<string, string> = { all: t('catalog.all'), stable: t('catalog.stable'), beta: t('catalog.beta'), preview: t('catalog.preview') };

  return (
    <div className="max-w-7xl mx-auto px-6 py-12 space-y-8">
      <div className="flex items-center gap-3">
        <div className="w-1.5 h-10 rounded-full" style={{ background: 'var(--primary)' }} />
        <div>
          <h1 className="text-3xl font-extrabold" style={{ fontFamily: 'Manrope, sans-serif', color: 'var(--on-surface)' }}>{t('catalog.title')}</h1>
          <p className="text-sm mt-1" style={{ color: 'var(--on-surface-variant)' }}>{t('catalog.subtitle', { count: providers.length })}</p>
        </div>
      </div>

      {/* Filter bar */}
      <div className="flex flex-wrap gap-3 items-center">
        <div className="flex gap-1">
          {TYPE_FILTERS.map(t => (
            <button
              key={t}
              onClick={() => handleType(t)}
              className="px-3 py-1.5 rounded-full text-xs font-medium transition-colors"
              style={{
                background: typeFilter === t ? 'var(--surface-tint)' : 'var(--surface-container)',
                color: typeFilter === t ? 'white' : 'var(--on-surface-variant)',
              }}
            >
              {typeLabels[t]}
            </button>
          ))}
        </div>
        <div className="h-6 w-px" style={{ background: 'var(--outline-variant)' }} />
        <div className="flex gap-1">
          {STATUS_FILTERS.map(s => (
            <button
              key={s}
              onClick={() => handleStatus(s)}
              className="px-3 py-1.5 rounded-full text-xs font-medium transition-colors"
              style={{
                background: statusFilter === s ? 'var(--secondary)' : 'var(--surface-container)',
                color: statusFilter === s ? 'white' : 'var(--on-surface-variant)',
              }}
            >
              {statusLabels[s]}
            </button>
          ))}
        </div>
        <div className="relative ml-auto">
          <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-lg" style={{ color: 'var(--outline)' }}>search</span>
          <input
            type="text"
            placeholder={t('catalog.searchPlaceholder')}
            value={search}
            onChange={e => handleSearch(e.target.value)}
            className="pl-10 pr-4 py-1.5 rounded-xl text-sm outline-none"
            style={{ background: 'var(--surface-container-low)', border: '1px solid var(--outline-variant)' }}
          />
        </div>
      </div>

      {/* Results count */}
      <p className="text-sm" style={{ color: 'var(--on-surface-variant)' }}>
        {filtered.length} / {t('catalog.count', { count: providers.length })}
      </p>

      {/* Card grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {[1, 2, 3, 4, 5, 6].map(i => (
            <div key={i} className="h-52 rounded-xl animate-pulse" style={{ background: 'var(--surface-container)' }} />
          ))}
        </div>
      ) : error || (!data?.providers?.length && !isLoading) ? (
        <ErrorState
          icon="cloud_off"
          title={t('error.loadFailed')}
          description={t('error.loadFailedDesc')}
          action={{ label: t('error.retry'), onClick: () => mutate() }}
        />
      ) : filtered.length === 0 ? (
        <EmptyState icon="filter_alt_off" title={t('error.noResults')} description={t('error.noResultsDesc')} />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filtered.map(p => (
            <PlatformCard key={p.id} provider={p} />
          ))}
        </div>
      )}
    </div>
  );
}

function PlatformCard({ provider: p }: { provider: ProviderMeta }) {
  const { t } = useI18n();
  const icon = TYPE_ICONS[p.type] || 'devices';
  const color = TYPE_COLORS[p.type] || '#616161';

  return (
    <div
      className="flex flex-col gap-3 rounded-2xl p-5 transition-all hover:shadow-md group"
      style={{
        background: 'var(--surface-container-lowest)',
        boxShadow: '0 1px 3px rgba(0, 0, 0, 0.04)',
        border: '1px solid rgba(195, 198, 215, 0.3)',
      }}
    >
      <div className="flex items-start gap-3">
        <div
          className="w-10 h-10 rounded-lg flex items-center justify-center text-white shrink-0"
          style={{ background: color }}
        >
          <span className="material-symbols-outlined text-xl">{icon}</span>
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-sm truncate" style={{ fontFamily: 'Manrope, sans-serif' }}>{p.name}</h3>
          <p className="text-xs truncate" style={{ color: 'var(--on-surface-variant)' }}>{p.vendor}</p>
        </div>
      </div>

      <div className="flex gap-2">
        <TypeBadge type={p.type} />
        <StatusBadge status={p.status} />
      </div>

      <p className="text-xs line-clamp-2" style={{ color: 'var(--on-surface-variant)' }}>
        {p.description}
      </p>

      <div className="flex items-center gap-3 text-xs" style={{ color: 'var(--outline)' }}>
        <span className="flex items-center gap-1">
          <span className="material-symbols-outlined text-sm">computer</span>
          {p.platforms.join(', ')}
        </span>
        {p.imChannels.length > 0 && (
          <span className="flex items-center gap-1">
            <span className="material-symbols-outlined text-sm">chat</span>
            {p.imChannels.join(', ')}
          </span>
        )}
      </div>

      <div className="flex gap-2 mt-auto pt-3" style={{ borderTop: '1px solid var(--surface-container-low)' }}>
        <Link
          href={`/deploy?provider=${p.id}`}
          className="flex-1 text-center py-2 rounded-lg text-xs font-bold text-white transition-opacity hover:opacity-90"
          style={{ background: 'linear-gradient(135deg, #497cff, #0053db)' }}
        >
          {t('catalog.deploy')}
        </Link>
        <a
          href={p.consoleUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flex-1 text-center py-2 rounded-lg text-xs font-medium transition-colors hover:bg-[var(--surface-container)]"
          style={{ background: 'var(--surface-container-low)', color: 'var(--on-surface)' }}
        >
          {t('catalog.details')}
        </a>
      </div>
    </div>
  );
}
