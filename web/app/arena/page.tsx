'use client';

import { useState } from 'react';
import useSWR from 'swr';
import { getProviders, startArena, getArenaMatch, type ProviderMeta } from '@/lib/api';
import { Card, CardHeader, CardTitle } from '@/components/ui/card';
import { TypeBadge, StatusBadge } from '@/components/ui/badge';

export default function ArenaPage() {
  const { data: providerData } = useSWR('providers', () => getProviders());
  const providers = providerData?.providers || [];

  const [selected, setSelected] = useState<string[]>([]);
  const [testPrompt, setTestPrompt] = useState('');
  const [matchId, setMatchId] = useState<string | null>(null);

  // Poll match when active — dedupingInterval:0 ensures fresh data every poll
  const { data: matchData } = useSWR(
    matchId ? `arena-${matchId}` : null,
    () => getArenaMatch(matchId!),
    { refreshInterval: 1000, dedupingInterval: 0, revalidateOnFocus: true }
  );

  const toggleProvider = (id: string) => {
    setSelected(prev =>
      prev.includes(id)
        ? prev.filter(p => p !== id)
        : prev.length < 5 ? [...prev, id] : prev
    );
  };

  const handleStart = async () => {
    const blueprint = {
      version: '2.0',
      meta: { name: 'arena-test', os: 'darwin', created: new Date().toISOString() },
      target: { provider: 'openclaw', deployMode: 'local' },
      identity: { role: 'Arena Tester' },
      skills: { fromAifleet: [], fromClawhub: [], custom: [] },
      agents: [],
      config: { autonomy: 'L1-guided', modelRouting: 'balanced', memoryChunks: 72 },
      cron: [],
      mcpServers: [],
      extensions: [],
      llm: { mode: 'skip' },
      openclaw: { version: 'latest', installMethod: 'npm' },
    };

    try {
      const result = await startArena(selected, blueprint, testPrompt);
      setMatchId(result.matchId);
    } catch (err: any) {
      alert(`Arena failed: ${err.message}`);
    }
  };

  const isRunning = matchData && matchData.status === 'running';
  const isCompleted = matchData && (matchData.status === 'completed' || matchData.status === 'failed');

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">竞技场</h2>
        <p className="text-sm mt-1" style={{ color: 'var(--on-surface-variant)' }}>同一任务，多龙虾比武</p>
      </div>

      {/* Setup */}
      {!matchId && (
        <Card>
          <CardHeader><CardTitle>选择参赛平台 (2-5)</CardTitle></CardHeader>
          <div className="flex flex-wrap gap-2 mb-4">
            {providers.map(p => (
              <button
                key={p.id}
                onClick={() => toggleProvider(p.id)}
                className="flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium transition-colors"
                style={{
                  background: selected.includes(p.id) ? 'var(--surface-tint)' : 'var(--surface-container)',
                  color: selected.includes(p.id) ? 'white' : 'var(--on-surface-variant)',
                }}
              >
                {p.name}
                {selected.includes(p.id) && <span>×</span>}
              </button>
            ))}
          </div>
          <div className="mb-4">
            <label className="text-xs font-medium block mb-1" style={{ color: 'var(--on-surface-variant)' }}>测试任务</label>
            <input
              type="text"
              value={testPrompt}
              onChange={e => setTestPrompt(e.target.value)}
              placeholder="描述你的 Agent 任务..."
              className="w-full px-3 py-2 rounded-lg text-sm"
              style={{ background: 'var(--surface-container-lowest)', border: '1px solid var(--outline-variant)' }}
            />
          </div>
          <button
            onClick={handleStart}
            disabled={selected.length < 2 || !testPrompt}
            className="px-8 py-2.5 rounded-md text-sm font-bold text-white disabled:opacity-40"
            style={{ background: 'linear-gradient(135deg, #497cff, #0053db)' }}
          >
            开始比武
          </button>
        </Card>
      )}

      {/* Battle lanes */}
      {matchData && (
        <div className="grid gap-4" style={{ gridTemplateColumns: `repeat(${matchData.lanes.length}, 1fr)` }}>
          {matchData.lanes.map(lane => (
            <Card key={lane.provider} className="flex flex-col">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-bold text-sm">{lane.provider}</h3>
                <StatusBadge status={lane.status} />
              </div>

              {/* Logs */}
              <div className="space-y-1 flex-1">
                {lane.logs.map((log, i) => (
                  <div key={i} className="flex items-center gap-1.5 text-xs py-0.5">
                    <span style={{ color: log.status === 'ok' ? 'var(--tertiary)' : log.status === 'error' ? 'var(--error)' : 'var(--outline)' }}>
                      {log.status === 'ok' ? '✓' : log.status === 'error' ? '✗' : '●'}
                    </span>
                    <span>{log.name}: {log.message}</span>
                  </div>
                ))}
                {lane.status === 'deploying' && <p className="text-xs animate-pulse" style={{ color: 'var(--surface-tint)' }}>部署中...</p>}
                {lane.status === 'testing' && <p className="text-xs animate-pulse" style={{ color: 'var(--secondary)' }}>测试中...</p>}
              </div>

              {/* Timing */}
              <div className="mt-3 pt-3 text-xs space-y-1" style={{ borderTop: '1px solid var(--outline-variant)', color: 'var(--on-surface-variant)' }}>
                {lane.timing.deployMs != null && <p>部署耗时: {(lane.timing.deployMs / 1000).toFixed(1)}s</p>}
                {lane.timing.testMs != null && <p>测试耗时: {(lane.timing.testMs / 1000).toFixed(1)}s</p>}
                {lane.score != null && <p className="font-bold text-sm" style={{ color: 'var(--on-surface)' }}>得分: {lane.score}</p>}
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Results */}
      {isCompleted && matchData?.scoring && (
        <Card>
          <CardHeader><CardTitle>比武结果</CardTitle></CardHeader>

          {matchData.winner && (
            <div className="flex items-center gap-3 mb-4 p-3 rounded-lg" style={{ background: 'var(--tertiary-fixed)' }}>
              <span className="text-2xl">🏆</span>
              <span className="font-bold">冠军: {matchData.winner} ({matchData.scoring.overall[matchData.winner]}分)</span>
            </div>
          )}

          {/* Score table */}
          <table className="w-full text-sm">
            <thead>
              <tr style={{ background: 'var(--surface-container)' }}>
                <th className="text-left p-2 font-medium">平台</th>
                <th className="text-right p-2 font-medium">部署速度</th>
                <th className="text-right p-2 font-medium">测试通过率</th>
                <th className="text-right p-2 font-medium">功能覆盖</th>
                <th className="text-right p-2 font-medium">平台覆盖</th>
                <th className="text-right p-2 font-bold">综合得分</th>
              </tr>
            </thead>
            <tbody>
              {matchData.lanes.map(lane => (
                <tr key={lane.provider} className="hover:bg-[var(--surface-container-low)]">
                  <td className="p-2 font-medium">{lane.provider}</td>
                  <td className="p-2 text-right">{matchData.scoring!.dimensions.deploySpeed[lane.provider]}</td>
                  <td className="p-2 text-right">{matchData.scoring!.dimensions.testPassRate[lane.provider]}</td>
                  <td className="p-2 text-right">{matchData.scoring!.dimensions.featureSupport[lane.provider]}</td>
                  <td className="p-2 text-right">{matchData.scoring!.dimensions.platformReach[lane.provider]}</td>
                  <td className="p-2 text-right font-bold">{matchData.scoring!.overall[lane.provider]}</td>
                </tr>
              ))}
            </tbody>
          </table>

          <div className="flex gap-3 mt-4">
            <button
              onClick={() => { setMatchId(null); setSelected([]); setTestPrompt(''); }}
              className="px-6 py-2 rounded-md text-sm font-medium text-white"
              style={{ background: 'linear-gradient(135deg, #497cff, #0053db)' }}
            >
              再来一局
            </button>
          </div>
        </Card>
      )}
    </div>
  );
}
