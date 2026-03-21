'use client';

import { useState } from 'react';
import useSWR from 'swr';
import { getProviders, type ProviderMeta } from '@/lib/api';
import { Card } from '@/components/ui/card';
import { TypeBadge, StatusBadge } from '@/components/ui/badge';
import Link from 'next/link';

const fetcher = () => getProviders();

const TYPE_FILTERS = ['all', 'desktop', 'saas', 'cloud', 'mobile', 'remote'] as const;
const STATUS_FILTERS = ['all', 'stable', 'beta', 'preview'] as const;

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
      <h2 className="text-2xl font-bold">平台目录</h2>

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
        <input
          type="text"
          placeholder="搜索平台..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="ml-auto px-3 py-1.5 rounded-lg text-sm outline-none"
          style={{ background: 'var(--surface-container-lowest)', border: '1px solid var(--outline-variant)' }}
        />
      </div>

      {/* Results count */}
      <p className="text-sm" style={{ color: 'var(--on-surface-variant)' }}>
        {filtered.length} / {providers.length} 平台
      </p>

      {/* Card grid */}
      {isLoading ? (
        <div className="grid grid-cols-3 gap-4">
          {[1,2,3,4,5,6].map(i => <div key={i} className="h-48 rounded-lg animate-pulse" style={{ background: 'var(--surface-container)' }} />)}
        </div>
      ) : (
        <div className="grid grid-cols-3 gap-4">
          {filtered.map(p => (
            <PlatformCard key={p.id} provider={p} />
          ))}
        </div>
      )}
    </div>
  );
}

function PlatformCard({ provider: p }: { provider: ProviderMeta }) {
  const initial = p.name.charAt(0).toUpperCase();
  const typeColor: Record<string, string> = {
    desktop: 'var(--surface-tint)', saas: 'var(--secondary)', cloud: '#e65100',
    mobile: 'var(--tertiary)', remote: '#616161',
  };

  return (
    <Card className="flex flex-col gap-3 hover:shadow-md transition-shadow">
      <div className="flex items-start gap-3">
        <div
          className="w-10 h-10 rounded-lg flex items-center justify-center text-white font-bold text-sm shrink-0"
          style={{ background: typeColor[p.type] || '#616161' }}
        >
          {initial}
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-sm truncate">{p.name}</h3>
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

      <div className="text-xs" style={{ color: 'var(--outline)' }}>
        OS: {p.platforms.join(', ')} | IM: {p.imChannels.join(', ') || '—'}
      </div>

      <div className="flex gap-2 mt-auto pt-2">
        <Link
          href={`/deploy?provider=${p.id}`}
          className="flex-1 text-center py-1.5 rounded-md text-xs font-medium text-white"
          style={{ background: 'linear-gradient(135deg, #497cff, #0053db)' }}
        >
          部署
        </Link>
        <a
          href={p.consoleUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flex-1 text-center py-1.5 rounded-md text-xs font-medium"
          style={{ background: 'var(--surface-container-high)', color: 'var(--on-surface)' }}
        >
          详情
        </a>
      </div>
    </Card>
  );
}
