
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
    <div className="page-shell py-12 space-y-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-2 h-10 rounded-full" style={{ background: 'var(--primary)' }} />
            <h1 className="text-4xl md:text-5xl font-black tracking-tight text-balance" style={{ color: 'var(--on-surface)' }}>{t('arena.title')}</h1>
          </div>
          <p className="text-lg font-medium opacity-60 max-w-2xl text-pretty">{t('arena.subtitle')}</p>
        </div>
      </div>

      {/* Setup */}
      {!matchId && (
        <section className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="p-10 rounded-[3rem] bg-[var(--surface-container-low)] border border-[var(--outline-variant)] space-y-8">
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="text-[var(--af-fs-meta)] font-black uppercase tracking-[0.2em] opacity-40 text-balance">{t('arena.selectPlatforms')}</h3>
                <span className="text-[var(--af-fs-meta)] font-black px-3 py-1 rounded-full bg-[var(--surface-container-high)]">
                  {selected.length} / 5 Selected
                </span>
              </div>
              <div className="flex flex-wrap gap-2">
                {providers.map(p => (
                  <button
                    key={p.id}
                    onClick={() => toggleProvider(p.id)}
                    className="flex items-center gap-2 px-6 py-2.5 rounded-full text-xs font-black uppercase tracking-widest transition-all hover:scale-105 active:scale-95"
                    style={{
                      background: selected.includes(p.id) ? 'var(--primary)' : 'var(--surface-container-lowest)',
                      color: selected.includes(p.id) ? 'white' : 'var(--on-surface-variant)',
                      border: selected.includes(p.id) ? 'none' : '1px solid var(--outline-variant)',
                      boxShadow: selected.includes(p.id) ? '0 8px 20px rgba(0, 62, 168, 0.2)' : 'none',
                    }}
                  >
                    {p.name}
                    {selected.includes(p.id) && (
                      <span className="material-symbols-outlined text-sm font-black">close</span>
                    )}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-4">
              <label className="text-[var(--af-fs-meta)] font-black uppercase tracking-[0.2em] opacity-40 block">{t('arena.testTask')}</label>
              <div className="relative group">
                <div className="absolute -inset-1 bg-gradient-to-r from-[var(--primary)] to-[var(--secondary)] rounded-3xl blur opacity-10 group-focus-within:opacity-20 transition-opacity" />
                <textarea
                  value={testPrompt}
                  onChange={e => setTestPrompt(e.target.value)}
                  placeholder={t('arena.taskPlaceholder')}
                  rows={4}
                  className="relative w-full p-6 rounded-[2rem] text-base font-bold bg-[var(--surface-container-lowest)] border-2 border-[var(--outline-variant)] focus:border-[var(--primary)] outline-none transition-all resize-none"
                />
              </div>
            </div>

            <div className="flex justify-center pt-4">
              <button
                onClick={handleStart}
                disabled={selected.length < 2 || !testPrompt}
                className="group flex items-center gap-3 px-16 py-5 rounded-2xl font-black uppercase tracking-[0.2em] text-sm text-white disabled:opacity-20 disabled:grayscale transition-all hover:shadow-2xl hover:-translate-y-1 active:scale-95 shadow-xl"
                style={{ background: 'var(--primary)' }}
              >
                <span className="material-symbols-outlined font-black">swords</span>
                {t('arena.startBattle')}
              </button>
            </div>
          </div>
        </section>
      )}

      {/* Battle lanes */}
      {matchData && (
        <div className="space-y-8 animate-in fade-in duration-700">
          <div className="flex gap-6 overflow-x-auto pb-6 no-scrollbar">
            {matchData.lanes.map(lane => (
              <div key={lane.provider} className="flex-1 min-w-[300px] flex flex-col p-8 rounded-[2.5rem] bg-[var(--surface-container-lowest)] border border-[var(--outline-variant)] shadow-sm transition-all hover:shadow-xl group">
                <div className="flex items-center justify-between mb-8">
                  <h3 className="text-xl font-black tracking-tight text-balance" style={{ color: 'var(--on-surface)' }}>{lane.provider}</h3>
                  <StatusBadge status={lane.status} />
                </div>

                <div className="space-y-3 flex-1">
                  {lane.logs.map((log, i) => (
                    <div key={i} className="flex items-center gap-3 text-xs font-bold py-2 px-3 rounded-xl transition-all" style={{ background: i === lane.logs.length - 1 ? 'var(--surface-container-low)' : 'transparent' }}>
                      <span className="material-symbols-outlined text-base font-black" style={{
                        color: log.status === 'ok' ? 'var(--tertiary)' : log.status === 'error' ? 'var(--error)' : 'var(--outline)',
                      }}>
                        {log.status === 'ok' ? 'check_circle' : log.status === 'error' ? 'cancel' : 'pending'}
                      </span>
                      <span className="opacity-70">{log.name}</span>
                    </div>
                  ))}
                  {(lane.status === 'deploying' || lane.status === 'testing') && (
                    <div className="pt-4 space-y-3">
                      <div className="h-1.5 rounded-full bg-[var(--surface-container-high)] overflow-hidden">
                        <div className="h-full bg-[var(--primary)] animate-pulse" style={{ width: '60%' }} />
                      </div>
                      <p className="text-[var(--af-fs-meta)] font-black uppercase tracking-[0.2em] text-center animate-pulse text-pretty" style={{ color: lane.status === 'deploying' ? 'var(--primary)' : 'var(--secondary)' }}>
                        {lane.status === 'deploying' ? t('arena.deploying') : t('arena.testing')}
                      </p>
                    </div>
                  )}
                </div>

                <div className="mt-8 pt-6 border-t border-dashed border-[var(--outline-variant)] space-y-4">
                  <div className="flex justify-between items-center text-[var(--af-fs-meta)] font-black uppercase tracking-widest opacity-40">
                    <span>Performance</span>
                    <div className="flex gap-4">
                      {lane.timing.deployMs != null && <span>D: {(lane.timing.deployMs / 1000).toFixed(1)}s</span>}
                      {lane.timing.testMs != null && <span>T: {(lane.timing.testMs / 1000).toFixed(1)}s</span>}
                    </div>
                  </div>
                  {lane.score != null && (
                    <div className="text-center">
                      <span className="text-[var(--af-fs-meta)] font-black uppercase tracking-[0.3em] opacity-40 block mb-1">{t('arena.score')}</span>
                      <span className="text-4xl font-black tracking-tighter" style={{ color: 'var(--primary)' }}>{lane.score}</span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Results */}
      {isCompleted && matchData?.scoring && (
        <section className="space-y-8 animate-in zoom-in-95 duration-500">
          <div className="rounded-[3rem] overflow-hidden border border-[var(--outline-variant)] bg-[var(--surface-container-lowest)] shadow-2xl">
            <div className="p-10 border-b border-[var(--outline-variant)] flex items-center justify-between bg-[var(--surface-container-low)]">
              <h2 className="text-2xl font-black tracking-tight text-balance">{t('arena.results')}</h2>
              <button
                onClick={() => { setMatchId(null); setSelected([]); setTestPrompt(''); }}
                className="flex items-center gap-2 px-6 py-2.5 rounded-full text-[var(--af-fs-meta)] font-black uppercase tracking-widest transition-all hover:bg-white active:scale-95 shadow-sm"
                style={{ background: 'rgba(255,255,255,0.8)', color: 'var(--on-surface)' }}
              >
                <span className="material-symbols-outlined text-sm font-black">replay</span>
                {t('arena.playAgain')}
              </button>
            </div>

            <div className="p-10 space-y-10">
              {matchData.winner && (
                <div className="flex flex-col items-center text-center p-10 rounded-[2.5rem] relative overflow-hidden group" style={{ background: 'var(--tertiary-container)' }}>
                  <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent pointer-events-none" />
                  <div className="w-20 h-20 rounded-full bg-[var(--tertiary)] text-white flex items-center justify-center shadow-2xl mb-6 relative z-10 transition-transform group-hover:scale-110 group-hover:rotate-12">
                    <span className="material-symbols-outlined text-4xl font-black">emoji_events</span>
                  </div>
                  <div className="relative z-10 space-y-2">
                    <h3 className="text-[var(--af-fs-meta)] font-black uppercase tracking-[0.4em] opacity-60 text-balance" style={{ color: 'var(--on-tertiary-container)' }}>{t('arena.champion')}</h3>
                    <p className="text-4xl font-black tracking-tight text-pretty" style={{ color: 'var(--on-tertiary-container)' }}>{matchData.winner}</p>
                    <div className="text-6xl font-black mt-4" style={{ color: 'var(--on-tertiary-container)' }}>{matchData.scoring.overall[matchData.winner]}</div>
                  </div>
                </div>
              )}

              <div className="overflow-x-auto rounded-3xl border border-[var(--outline-variant)] bg-[var(--surface-container-lowest)]">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-[var(--surface-container-low)]">
                      <th className="p-6 font-black uppercase tracking-widest text-[var(--af-fs-meta)] opacity-40">{t('arena.colPlatform')}</th>
                      <th className="p-6 text-right font-black uppercase tracking-widest text-[var(--af-fs-meta)] opacity-40">{t('arena.colDeploySpeed')}</th>
                      <th className="p-6 text-right font-black uppercase tracking-widest text-[var(--af-fs-meta)] opacity-40">{t('arena.colTestPass')}</th>
                      <th className="p-6 text-right font-black uppercase tracking-widest text-[var(--af-fs-meta)] opacity-40">{t('arena.colFeature')}</th>
                      <th className="p-6 text-right font-black uppercase tracking-widest text-[var(--af-fs-meta)] opacity-40">{t('arena.colCoverage')}</th>
                      <th className="p-6 text-right font-black uppercase tracking-widest text-[var(--af-fs-meta)]">{t('arena.colOverall')}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[var(--outline-variant)]">
                    {matchData.lanes.map(lane => (
                      <tr key={lane.provider} className={`transition-colors hover:bg-black/5 ${lane.provider === matchData.winner ? 'bg-[var(--tertiary-container)]/10' : ''}`}>
                        <td className="p-6 font-black text-sm">
                          <div className="flex items-center gap-2">
                            {lane.provider}
                            {lane.provider === matchData.winner && <span className="material-symbols-outlined text-sm font-black text-[var(--tertiary)]">verified</span>}
                          </div>
                        </td>
                        <td className="p-6 text-right font-bold text-sm opacity-60">{matchData.scoring!.dimensions.deploySpeed[lane.provider]}</td>
                        <td className="p-6 text-right font-bold text-sm opacity-60">{matchData.scoring!.dimensions.testPassRate[lane.provider]}</td>
                        <td className="p-6 text-right font-bold text-sm opacity-60">{matchData.scoring!.dimensions.featureSupport[lane.provider]}</td>
                        <td className="p-6 text-right font-bold text-sm opacity-60">{matchData.scoring!.dimensions.platformReach[lane.provider]}</td>
                        <td className="p-6 text-right font-black text-lg tracking-tight text-[var(--primary)]">{matchData.scoring!.overall[lane.provider]}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </section>
      )}
    </div>
  );
}
