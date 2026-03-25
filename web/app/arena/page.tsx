'use client';

import { useState } from 'react';
import useSWR from 'swr';
import { getProviders, startArena, getArenaMatch, type ProviderMeta } from '@/lib/api';
import { Card, CardHeader, CardTitle } from '@/components/ui/card';
import { StatusBadge } from '@/components/ui/badge';
import { useI18n } from '@/lib/i18n';

export default function ArenaPage() {
  const { t } = useI18n();
  const { data: providerData } = useSWR('providers', () => getProviders());
  const providers = providerData?.providers || [];

  const [selected, setSelected] = useState<string[]>([]);
  const [testPrompt, setTestPrompt] = useState('');
  const [matchId, setMatchId] = useState<string | null>(null);

  const { data: matchData } = useSWR(
    matchId ? `arena-${matchId}` : null,
    () => getArenaMatch(matchId!),
    { refreshInterval: 1000, dedupingInterval: 0, revalidateOnFocus: true }
  );

  const toggleProvider = (id: string) => {
    setSelected(prev =>
      prev.includes(id) ? prev.filter(p => p !== id) : prev.length < 5 ? [...prev, id] : prev
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

  const isCompleted = matchData && (matchData.status === 'completed' || matchData.status === 'failed');

  return (
    <div className="max-w-7xl mx-auto px-6 py-12 space-y-8">
      <div className="flex items-center gap-3">
        <div className="w-1.5 h-10 rounded-full" style={{ background: 'var(--primary)' }} />
        <div>
          <h1 className="text-3xl font-extrabold" style={{ fontFamily: 'Manrope, sans-serif', color: 'var(--on-surface)' }}>{t('arena.title')}</h1>
          <p className="text-sm mt-1" style={{ color: 'var(--on-surface-variant)' }}>{t('arena.subtitle')}</p>
        </div>
      </div>

      {/* Setup */}
      {!matchId && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>{t('arena.selectPlatforms')}</CardTitle>
              {selected.length > 0 && (
                <span className="text-xs font-bold px-2.5 py-1 rounded-full" style={{ background: 'var(--primary-fixed)', color: 'var(--primary)' }}>
                  {selected.length} / 5
                </span>
              )}
            </div>
          </CardHeader>
          <div className="flex flex-wrap gap-2 mb-6">
            {providers.map(p => (
              <button
                key={p.id}
                onClick={() => toggleProvider(p.id)}
                className="flex items-center gap-2 px-4 py-2 rounded-full text-xs font-medium transition-all"
                style={{
                  background: selected.includes(p.id) ? 'var(--surface-tint)' : 'var(--surface-container-low)',
                  color: selected.includes(p.id) ? 'white' : 'var(--on-surface-variant)',
                  border: selected.includes(p.id) ? '2px solid var(--surface-tint)' : '2px solid transparent',
                }}
              >
                {p.name}
                {selected.includes(p.id) && (
                  <span className="material-symbols-outlined text-sm">close</span>
                )}
              </button>
            ))}
          </div>

          <div className="mb-6">
            <label className="text-xs font-medium block mb-1.5" style={{ color: 'var(--on-surface-variant)' }}>{t('arena.testTask')}</label>
            <div className="relative">
              <span className="material-symbols-outlined absolute left-3 top-3 text-lg" style={{ color: 'var(--outline)' }}>edit_note</span>
              <textarea
                value={testPrompt}
                onChange={e => setTestPrompt(e.target.value)}
                placeholder={t('arena.taskPlaceholder')}
                rows={5}
                className="w-full pl-10 pr-4 py-3 rounded-xl text-sm outline-none resize-none"
                style={{ background: 'var(--surface-container-low)', border: '1px solid var(--outline-variant)' }}
              />
            </div>
          </div>

          <button
            onClick={handleStart}
            disabled={selected.length < 2 || !testPrompt}
            className="flex items-center gap-2 px-8 py-2.5 rounded-lg text-sm font-bold text-white disabled:opacity-40 transition-opacity hover:opacity-90"
            style={{ background: 'linear-gradient(135deg, #497cff, #0053db)' }}
          >
            <span className="material-symbols-outlined text-sm">swords</span>
            {t('arena.startBattle')}
          </button>
        </Card>
      )}

      {/* Battle lanes */}
      {matchData && (
        <div className="grid gap-5" style={{ gridTemplateColumns: `repeat(${matchData.lanes.length}, 1fr)` }}>
          {matchData.lanes.map(lane => (
            <Card key={lane.provider} className="flex flex-col">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-sm" style={{ fontFamily: 'Manrope, sans-serif' }}>{lane.provider}</h3>
                <StatusBadge status={lane.status} />
              </div>

              <div className="space-y-1 flex-1">
                {lane.logs.map((log, i) => (
                  <div key={i} className="flex items-center gap-1.5 text-xs py-1">
                    <span className="material-symbols-outlined text-sm" style={{
                      color: log.status === 'ok' ? 'var(--on-tertiary-container)' : log.status === 'error' ? 'var(--error)' : 'var(--outline)',
                    }}>
                      {log.status === 'ok' ? 'check_circle' : log.status === 'error' ? 'cancel' : 'pending'}
                    </span>
                    <span>{log.name}: {log.message}</span>
                  </div>
                ))}
                {lane.status === 'deploying' && <p className="text-xs animate-pulse" style={{ color: 'var(--surface-tint)' }}>{t('arena.deploying')}</p>}
                {lane.status === 'testing' && <p className="text-xs animate-pulse" style={{ color: 'var(--secondary)' }}>{t('arena.testing')}</p>}
              </div>

              <div className="mt-3 pt-3 text-xs space-y-1" style={{ borderTop: '1px solid var(--outline-variant)', color: 'var(--on-surface-variant)' }}>
                {lane.timing.deployMs != null && <p>{t('arena.deployTime')} {(lane.timing.deployMs / 1000).toFixed(1)}s</p>}
                {lane.timing.testMs != null && <p>{t('arena.testTime')} {(lane.timing.testMs / 1000).toFixed(1)}s</p>}
                {lane.score != null && (
                  <p className="font-bold text-sm" style={{ color: 'var(--on-surface)', fontFamily: 'Manrope, sans-serif' }}>
                    {t('arena.score')} {lane.score}
                  </p>
                )}
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Results */}
      {isCompleted && matchData?.scoring && (
        <Card className="!p-0 overflow-hidden">
          <div className="px-6 py-5" style={{ borderBottom: '1px solid var(--surface-container-low)' }}>
            <h2 className="text-lg font-bold tracking-tight" style={{ fontFamily: 'Manrope, sans-serif' }}>{t('arena.results')}</h2>
          </div>

          {matchData.winner && (
            <div className="mx-6 mt-5 flex items-center gap-3 p-4 rounded-xl" style={{ background: 'var(--tertiary-fixed)' }}>
              <span className="material-symbols-outlined text-2xl" style={{ color: '#005236' }}>emoji_events</span>
              <span className="font-bold" style={{ color: '#005236', fontFamily: 'Manrope, sans-serif' }}>
                {t('arena.champion')} {matchData.winner} ({matchData.scoring.overall[matchData.winner]})
              </span>
            </div>
          )}

          <div className="p-6">
            <table className="w-full text-sm">
              <thead>
                <tr style={{ background: 'var(--surface-container)' }}>
                  <th className="text-left p-3 font-bold text-xs uppercase tracking-wider" style={{ color: 'var(--on-surface-variant)' }}>{t('arena.colPlatform')}</th>
                  <th className="text-right p-3 font-bold text-xs uppercase tracking-wider" style={{ color: 'var(--on-surface-variant)' }}>{t('arena.colDeploySpeed')}</th>
                  <th className="text-right p-3 font-bold text-xs uppercase tracking-wider" style={{ color: 'var(--on-surface-variant)' }}>{t('arena.colTestPass')}</th>
                  <th className="text-right p-3 font-bold text-xs uppercase tracking-wider" style={{ color: 'var(--on-surface-variant)' }}>{t('arena.colFeature')}</th>
                  <th className="text-right p-3 font-bold text-xs uppercase tracking-wider" style={{ color: 'var(--on-surface-variant)' }}>{t('arena.colCoverage')}</th>
                  <th className="text-right p-3 font-extrabold text-xs uppercase tracking-wider">{t('arena.colOverall')}</th>
                </tr>
              </thead>
              <tbody>
                {matchData.lanes.map(lane => (
                  <tr key={lane.provider} className="transition-colors hover:bg-[var(--surface-container-low)]" style={{ borderBottom: '1px solid var(--surface-container-low)' }}>
                    <td className="p-3 font-semibold" style={{ fontFamily: 'Manrope, sans-serif' }}>
                      {lane.provider}
                      {lane.provider === matchData.winner && (
                        <span className="material-symbols-outlined text-sm ml-1" style={{ color: '#005236' }}>emoji_events</span>
                      )}
                    </td>
                    <td className="p-3 text-right">{matchData.scoring!.dimensions.deploySpeed[lane.provider]}</td>
                    <td className="p-3 text-right">{matchData.scoring!.dimensions.testPassRate[lane.provider]}</td>
                    <td className="p-3 text-right">{matchData.scoring!.dimensions.featureSupport[lane.provider]}</td>
                    <td className="p-3 text-right">{matchData.scoring!.dimensions.platformReach[lane.provider]}</td>
                    <td className="p-3 text-right font-extrabold" style={{ fontFamily: 'Manrope, sans-serif' }}>{matchData.scoring!.overall[lane.provider]}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="px-6 pb-6">
            <button
              onClick={() => { setMatchId(null); setSelected([]); setTestPrompt(''); }}
              className="flex items-center gap-2 px-6 py-2.5 rounded-lg text-sm font-bold text-white transition-opacity hover:opacity-90"
              style={{ background: 'linear-gradient(135deg, #497cff, #0053db)' }}
            >
              <span className="material-symbols-outlined text-sm">replay</span>
              {t('arena.playAgain')}
            </button>
          </div>
        </Card>
      )}
    </div>
  );
}
