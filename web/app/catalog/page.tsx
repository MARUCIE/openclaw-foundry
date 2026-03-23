'use client';

import { useState } from 'react';
import useSWR from 'swr';
import { getProviders, type ProviderMeta } from '@/lib/api';
import { TypeBadge, StatusBadge } from '@/components/ui/badge';
import Link from 'next/link';

const fetcher = () => getProviders();

const TYPE_FILTERS = ['all', 'desktop', 'saas', 'cloud', 'mobile', 'remote'] as const;
const STATUS_FILTERS = ['all', 'stable', 'beta', 'preview'] as const;

const TYPE_ICONS: Record<string, string> = {
  desktop: 'desktop_windows',
  saas: 'cloud',
  cloud: 'cloud_queue',
  mobile: 'smartphone',
  remote: 'lan',
};

const TYPE_COLORS: Record<string, string> = {
  desktop: 'var(--surface-tint)',
  saas: 'var(--secondary)',
  cloud: '#e65100',
  mobile: 'var(--on-tertiary-container)',
  remote: '#616161',
};

export default function CatalogPage() {
  const { data, isLoading } = useSWR('providers', fetcher);
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [search, setSearch] = useState('');

  const providers = data?.providers || [];
  const filtered = providers.filter(p => {
    if (typeFilter !== 'all' && p.type !== typeFilter) return false;
    if (statusFilter !== 'all' && p.status !== statusFilter) return false;
    if (search && !p.name.toLowerCase().includes(search.toLowerCase()) &&
        !p.vendor.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const typeLabels: Record<string, string> = { all: '全部', desktop: '桌面端', saas: 'SaaS', cloud: '云端', mobile: '移动', remote: '远程' };
  const statusLabels: Record<string, string> = { all: '全部', stable: '稳定', beta: '测试', preview: '预览' };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold" style={{ fontFamily: 'Manrope, sans-serif' }}>平台目录</h2>
        <p className="text-sm mt-1" style={{ color: 'var(--on-surface-variant)' }}>浏览和管理 {providers.length} 个 AI Agent 部署平台</p>
      </div>

      {/* Filter bar */}
      <div className="flex flex-wrap gap-3 items-center">
        <div className="flex gap-1">
          {TYPE_FILTERS.map(t => (
            <button
              key={t}
              onClick={() => setTypeFilter(t)}
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
              onClick={() => setStatusFilter(s)}
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
            placeholder="搜索平台..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="pl-10 pr-4 py-1.5 rounded-xl text-sm outline-none"
            style={{ background: 'var(--surface-container-low)', border: '1px solid var(--outline-variant)' }}
          />
        </div>
      </div>

      {/* Results count */}
      <p className="text-sm" style={{ color: 'var(--on-surface-variant)' }}>
        {filtered.length} / {providers.length} 平台
      </p>

      {/* Card grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {[1, 2, 3, 4, 5, 6].map(i => (
            <div key={i} className="h-52 rounded-xl animate-pulse" style={{ background: 'var(--surface-container)' }} />
          ))}
        </div>
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
  const icon = TYPE_ICONS[p.type] || 'devices';
  const color = TYPE_COLORS[p.type] || '#616161';

  return (
    <div
      className="flex flex-col gap-3 rounded-xl p-5 transition-all hover:shadow-md group"
      style={{
        background: 'var(--surface-container-lowest)',
        boxShadow: '0 1px 3px rgba(0, 0, 0, 0.04)',
        border: '1px solid rgba(198, 198, 205, 0.1)',
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
          部署
        </Link>
        <a
          href={p.consoleUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flex-1 text-center py-2 rounded-lg text-xs font-medium transition-colors hover:bg-[var(--surface-container)]"
          style={{ background: 'var(--surface-container-low)', color: 'var(--on-surface)' }}
        >
          详情
        </a>
      </div>
    </div>
  );
}
