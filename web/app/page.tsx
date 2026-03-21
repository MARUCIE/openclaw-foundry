'use client';

import useSWR from 'swr';
import { getStats } from '@/lib/api';
import { Card, CardHeader, CardTitle, CardValue } from '@/components/ui/card';
import { StatusBadge } from '@/components/ui/badge';
import Link from 'next/link';

const fetcher = () => getStats();

export default function DashboardPage() {
  const { data, isLoading } = useSWR('stats', fetcher, { refreshInterval: 10000 });

  if (isLoading || !data) {
    return <div className="animate-pulse space-y-6">
      <div className="h-8 w-48 rounded" style={{ background: 'var(--surface-container)' }} />
      <div className="grid grid-cols-4 gap-4">
        {[1,2,3,4].map(i => <div key={i} className="h-28 rounded-lg" style={{ background: 'var(--surface-container)' }} />)}
      </div>
    </div>;
  }

  const stats = [
    { label: '平台总数', value: data.providers.total, color: 'var(--on-surface)' },
    { label: '桌面端', value: data.providers.byType.desktop || 0, color: 'var(--surface-tint)' },
    { label: 'SaaS 云端', value: (data.providers.byType.saas || 0) + (data.providers.byType.cloud || 0), color: 'var(--secondary)' },
    { label: '移动/远程', value: (data.providers.byType.mobile || 0) + (data.providers.byType.remote || 0), color: 'var(--tertiary)' },
  ];

  return (
    <div className="space-y-8">
      <h2 className="text-2xl font-bold">仪表盘</h2>

      {/* Stat cards */}
      <div className="grid grid-cols-4 gap-4">
        {stats.map(s => (
          <Card key={s.label}>
            <CardHeader><CardTitle>{s.label}</CardTitle></CardHeader>
            <CardValue color={s.color}>{s.value}</CardValue>
          </Card>
        ))}
      </div>

      {/* Two columns: recent deploys + arena */}
      <div className="grid grid-cols-2 gap-6">
        {/* Recent deploys */}
        <Card>
          <CardHeader><CardTitle>最近部署</CardTitle></CardHeader>
          {data.deploys.jobs.length === 0 ? (
            <p className="text-sm" style={{ color: 'var(--on-surface-variant)' }}>暂无部署记录</p>
          ) : (
            <div className="space-y-2">
              {data.deploys.jobs.map(job => (
                <div key={job.id} className="flex items-center justify-between py-2">
                  <span className="text-sm font-medium">{job.provider}</span>
                  <StatusBadge status={job.status} />
                </div>
              ))}
            </div>
          )}
          <Link href="/deploy" className="inline-block mt-4 text-sm font-medium" style={{ color: 'var(--surface-tint)' }}>
            前往部署 →
          </Link>
        </Card>

        {/* Recent arena */}
        <Card>
          <CardHeader><CardTitle>竞技场比武</CardTitle></CardHeader>
          {data.arena.matches.length === 0 ? (
            <p className="text-sm" style={{ color: 'var(--on-surface-variant)' }}>暂无比武记录</p>
          ) : (
            <div className="space-y-2">
              {data.arena.matches.map(match => (
                <div key={match.id} className="flex items-center justify-between py-2">
                  <span className="text-sm">{match.lanes.map(l => l.provider).join(' vs ')}</span>
                  <StatusBadge status={match.status === 'completed' ? 'success' : match.status} />
                </div>
              ))}
            </div>
          )}
          <Link href="/arena" className="inline-block mt-4 text-sm font-medium" style={{ color: 'var(--surface-tint)' }}>
            前往竞技场 →
          </Link>
        </Card>
      </div>

      {/* System health */}
      <Card>
        <CardHeader><CardTitle>系统健康</CardTitle></CardHeader>
        <div className="flex gap-8 text-sm">
          <span>服务器运行时间: <strong>{Math.round(data.uptime / 60)}分钟</strong></span>
          <span>总平台数: <strong>{data.providers.total}</strong></span>
          <span>近期部署: <strong>{data.deploys.recent}</strong></span>
          <span>近期比武: <strong>{data.arena.recent}</strong></span>
        </div>
      </Card>
    </div>
  );
}
