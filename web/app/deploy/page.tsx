'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import useSWR from 'swr';
import { getProviders, getProvider as getProviderDetail, startDeploy, getDeployJob, type ProviderMeta } from '@/lib/api';
import { Card, CardHeader, CardTitle } from '@/components/ui/card';
import { TypeBadge, StatusBadge } from '@/components/ui/badge';
import { useI18n } from '@/lib/i18n';

const STEP_KEYS = ['deploy.step1', 'deploy.step2', 'deploy.step3', 'deploy.step4'];
const STEP_ICONS = ['subscriptions', 'tune', 'check_circle', 'rocket_launch'];

export default function DeployPage() {
  return (
    <Suspense fallback={<div className="animate-pulse h-96 rounded-xl" style={{ background: 'var(--surface-container)' }} />}>
      <DeployPageInner />
    </Suspense>
  );
}

function DeployPageInner() {
  const { t } = useI18n();
  const searchParams = useSearchParams();
  const preselected = searchParams.get('provider') || '';

  const [step, setStep] = useState(0);
  const [selectedProvider, setSelectedProvider] = useState(preselected);
  const [providerInfo, setProviderInfo] = useState<ProviderMeta | null>(null);
  const [providerAvailable, setProviderAvailable] = useState<boolean | null>(null);
  const [providerReqs, setProviderReqs] = useState<any[]>([]);
  const [blueprintName, setBlueprintName] = useState('my-agent');
  const [role, setRole] = useState(t('deploy.roleDefault'));
  const [autonomy, setAutonomy] = useState('L1-guided');
  const [modelRouting, setModelRouting] = useState('balanced');
  const [jobId, setJobId] = useState<string | null>(null);
  const [autoAdvanced, setAutoAdvanced] = useState(false);

  const { data: providerData } = useSWR('providers', () => getProviders());
  const providers = providerData?.providers || [];

  useEffect(() => {
    if (preselected && providers.length > 0 && !autoAdvanced) {
      const match = providers.find(p => p.id === preselected);
      if (match) {
        setSelectedProvider(preselected);
        setAutoAdvanced(true);
        getProviderDetail(preselected).then(detail => {
          setProviderInfo(detail.provider);
          setProviderAvailable(detail.available);
          setProviderReqs(detail.requirements);
          setBlueprintName(`${detail.provider.name.toLowerCase().replace(/\s+/g, '-')}-agent`);
          setStep(1);
        }).catch(() => {
          setProviderInfo(match);
          setBlueprintName(`${match.name.toLowerCase().replace(/\s+/g, '-')}-agent`);
          setStep(1);
        });
      }
    }
  }, [preselected, providers, autoAdvanced, t]);

  const handleSelectProvider = async (id: string) => {
    setSelectedProvider(id);
    try {
      const detail = await getProviderDetail(id);
      setProviderInfo(detail.provider);
      setProviderAvailable(detail.available);
      setProviderReqs(detail.requirements);
      setBlueprintName(`${detail.provider.name.toLowerCase().replace(/\s+/g, '-')}-agent`);
    } catch {
      const match = providers.find(p => p.id === id);
      if (match) setProviderInfo(match);
    }
  };

  const { data: jobData } = useSWR(
    jobId ? `deploy-${jobId}` : null,
    () => getDeployJob(jobId!),
    { refreshInterval: 1000, dedupingInterval: 0, revalidateOnFocus: true }
  );

  const handleDeploy = async () => {
    const blueprint = {
      version: '2.0',
      meta: { name: blueprintName, os: 'darwin', created: new Date().toISOString(), description: providerInfo?.description },
      target: { provider: selectedProvider, deployMode: providerInfo?.type === 'cloud' || providerInfo?.type === 'saas' ? 'cloud' : 'local' as string },
      identity: { role },
      skills: { fromAifleet: [], fromClawhub: [], custom: [] },
      agents: [],
      config: { autonomy, modelRouting, memoryChunks: 72 },
      cron: [],
      mcpServers: [],
      extensions: [],
      llm: { mode: 'skip' },
      openclaw: { version: 'latest', installMethod: 'npm' },
    };

    try {
      const result = await startDeploy(selectedProvider, blueprint);
      setJobId(result.jobId);
      setStep(3);
    } catch (err: any) {
      alert(`Deploy failed: ${err.message}`);
    }
  };

  return (
    <div className="page-shell py-12 space-y-10">
      <div className="flex items-center gap-4">
        <div className="w-2 h-12 rounded-full" style={{ background: 'var(--primary)' }} />
        <div>
          <h1 className="text-4xl font-black tracking-tight text-balance" style={{ fontFamily: 'var(--font-inter), system-ui, sans-serif', color: 'var(--on-surface)' }}>{t('deploy.title')}</h1>
          <p className="text-sm font-medium mt-1 text-pretty" style={{ color: 'var(--on-surface-variant)' }}>{t('deploy.subtitle')}</p>
        </div>
      </div>

      {/* Stepper */}
      <div className="flex gap-4 items-center justify-between max-w-4xl mx-auto bg-[var(--surface-container-low)] p-6 rounded-3xl border border-[var(--outline-variant)]">
        {STEP_KEYS.map((key, i) => (
          <div key={key} className="flex-1 flex flex-col items-center relative group">
            <div className="flex items-center w-full justify-center">
              <button
                onClick={() => { if (i < step && step < 3) setStep(i); }}
                className={`w-10 h-10 rounded-2xl flex items-center justify-center text-xs font-black transition-all shadow-sm ${i <= step ? 'scale-110' : ''}`}
                style={{
                  background: i < step ? 'var(--tertiary)' : i === step ? 'var(--primary)' : 'var(--surface-container-high)',
                  color: i <= step ? 'white' : 'var(--on-surface-variant)',
                  cursor: i < step && step < 3 ? 'pointer' : 'default',
                }}
              >
                {i < step ? (
                  <span className="material-symbols-outlined font-black">check</span>
                ) : (
                  <span className="material-symbols-outlined">{STEP_ICONS[i]}</span>
                )}
              </button>
              {i < STEP_KEYS.length - 1 && (
                <div className="absolute left-[calc(50%+24px)] w-[calc(100%-48px)] h-1 rounded-full overflow-hidden" style={{ background: 'var(--outline-variant)' }}>
                  <div className="h-full transition-all duration-500" style={{
                    width: i < step ? '100%' : i === step ? '0%' : '0%',
                    background: 'var(--tertiary)'
                  }} />
                </div>
              )}
            </div>
            <span className="text-[var(--af-fs-meta)] uppercase font-black tracking-widest mt-3 transition-colors" style={{
              color: i === step ? 'var(--primary)' : 'var(--on-surface-variant)',
            }}>
              {t(key)}
            </span>
          </div>
        ))}
      </div>

      {/* Step 1: Select platform */}
      {step === 0 && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {providers.map(p => (
              <button
                key={p.id}
                onClick={() => handleSelectProvider(p.id)}
                className="p-6 rounded-3xl text-left transition-all hover:shadow-xl hover:-translate-y-1 relative overflow-hidden flex flex-col"
                style={{
                  background: selectedProvider === p.id ? 'var(--primary-container)' : 'var(--surface-container-lowest)',
                  border: selectedProvider === p.id ? '2px solid var(--primary)' : '2px solid var(--outline-variant)',
                }}
              >
                <div className="flex justify-between items-start mb-4">
                  <div className="w-12 h-12 rounded-2xl flex items-center justify-center shadow-inner" style={{ background: 'var(--surface-container)', color: 'var(--primary)' }}>
                    <span className="material-symbols-outlined text-2xl">{p.name.charAt(0)}</span>
                  </div>
                  <div className="flex flex-col gap-1 items-end">
                    <TypeBadge type={p.type} />
                    <StatusBadge status={p.status} />
                  </div>
                </div>
                <h4 className="font-bold text-lg mb-1 text-balance" style={{ color: 'var(--on-surface)' }}>{p.name}</h4>
                <p className="text-xs font-bold uppercase tracking-wider mb-3 text-pretty" style={{ color: 'var(--on-surface-variant)' }}>{p.vendor}</p>
                <p className="text-sm line-clamp-2 leading-relaxed flex-1 text-pretty" style={{ color: 'var(--on-surface-variant)' }}>{p.description}</p>
                {selectedProvider === p.id && (
                  <div className="absolute top-0 right-0 w-12 h-12 bg-[var(--primary)] flex items-center justify-center rounded-bl-3xl shadow-lg">
                    <span className="material-symbols-outlined text-white font-black">check</span>
                  </div>
                )}
              </button>
            ))}
          </div>
          <div className="flex justify-center pt-4">
            <button
              onClick={() => selectedProvider && setStep(1)}
              disabled={!selectedProvider}
              className="group flex items-center gap-3 px-12 py-4 rounded-2xl font-black text-white disabled:opacity-40 transition-all hover:shadow-2xl hover:-translate-y-1 active:scale-95"
              style={{ background: 'var(--primary)' }}
            >
              {t('deploy.next')}
              <span className="material-symbols-outlined transition-transform group-hover:translate-x-1">arrow_forward</span>
            </button>
          </div>
        </div>
      )}

      {/* Step 2: Configure blueprint */}
      {step === 1 && (
        <Card className="border-none shadow-none bg-transparent">
          {providerInfo && (
            <div className="mb-10 p-8 rounded-[2.5rem] border-2 border-[var(--primary)] relative overflow-hidden" style={{ background: 'var(--surface-container-low)' }}>
              <div className="absolute top-0 right-0 px-6 py-2 rounded-bl-2xl text-[var(--af-fs-meta)] font-black uppercase tracking-[0.2em]" style={{ background: 'var(--primary)', color: 'var(--on-primary)' }}>Selected Platform</div>
              <div className="flex flex-col md:flex-row gap-8 items-start">
                <div className="w-20 h-20 rounded-3xl flex items-center justify-center text-3xl text-white font-black shadow-2xl shrink-0" style={{ background: 'var(--primary)' }}>
                  {providerInfo.name.charAt(0)}
                </div>
                <div className="space-y-4">
                  <div>
                    <h4 className="text-2xl font-black text-balance" style={{ fontFamily: 'var(--font-inter), system-ui, sans-serif' }}>{providerInfo.name}</h4>
                    <p className="text-sm font-bold uppercase tracking-widest opacity-60 text-pretty">{providerInfo.vendor}</p>
                  </div>
                  <p className="text-sm leading-relaxed max-w-2xl text-pretty">{providerInfo.description}</p>
                  <div className="flex flex-wrap gap-2">
                    <TypeBadge type={providerInfo.type} />
                    <StatusBadge status={providerInfo.status} />
                    {providerAvailable !== null && (
                      <span className="text-[var(--af-fs-meta)] px-3 py-1 rounded-full font-black uppercase tracking-wider" style={{
                        background: providerAvailable ? 'var(--tertiary-container)' : 'var(--error-container)',
                        color: providerAvailable ? 'var(--on-tertiary-container)' : 'var(--on-error-container)',
                      }}>
                        {providerAvailable ? t('deploy.available') : t('deploy.unavailable')}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 bg-[var(--surface-container-lowest)] p-10 rounded-[2.5rem] border border-[var(--outline-variant)]">
            <FormField label={t('deploy.blueprintName')} value={blueprintName} onChange={setBlueprintName} />
            <FormField label={t('deploy.role')} value={role} onChange={setRole} />
            <div>
              <label className="text-[var(--af-fs-meta)] font-black uppercase tracking-widest block mb-3 opacity-60">{t('deploy.autonomy')}</label>
              <select value={autonomy} onChange={e => setAutonomy(e.target.value)} className="w-full px-4 py-3.5 rounded-2xl text-sm font-bold outline-none appearance-none cursor-pointer hover:bg-[var(--surface-container-high)] transition-colors"
                style={{ background: 'var(--surface-container-low)', border: '2px solid var(--outline-variant)' }}>
                <option value="L1-guided">{t('deploy.autonomyL1')}</option>
                <option value="L2-semi">{t('deploy.autonomyL2')}</option>
                <option value="L3-full">{t('deploy.autonomyL3')}</option>
              </select>
            </div>
            <div>
              <label className="text-[var(--af-fs-meta)] font-black uppercase tracking-widest block mb-3 opacity-60">{t('deploy.modelRouting')}</label>
              <select value={modelRouting} onChange={e => setModelRouting(e.target.value)} className="w-full px-4 py-3.5 rounded-2xl text-sm font-bold outline-none appearance-none cursor-pointer hover:bg-[var(--surface-container-high)] transition-colors"
                style={{ background: 'var(--surface-container-low)', border: '2px solid var(--outline-variant)' }}>
                <option value="premium">{t('deploy.premium')}</option>
                <option value="balanced">{t('deploy.balanced')}</option>
                <option value="fast">{t('deploy.fast')}</option>
              </select>
            </div>
          </div>

          <div className="flex justify-between items-center mt-10">
            <button onClick={() => setStep(0)} className="flex items-center gap-2 px-8 py-3.5 rounded-2xl text-sm font-black uppercase tracking-wider transition-all hover:bg-[var(--surface-container-high)]" style={{ color: 'var(--on-surface-variant)' }}>
              <span className="material-symbols-outlined font-black">arrow_back</span>
              {t('deploy.prev')}
            </button>
            <button onClick={() => setStep(2)} className="flex items-center gap-3 px-12 py-4 rounded-2xl font-black text-white transition-all hover:shadow-2xl hover:-translate-y-1 active:scale-95 shadow-lg"
              style={{ background: 'var(--primary)' }}>
              {t('deploy.next')}
              <span className="material-symbols-outlined font-black">arrow_forward</span>
            </button>
          </div>
        </Card>
      )}

      {/* Step 3: Confirm */}
      {step === 2 && (
        <div className="max-w-3xl mx-auto space-y-8">
          <div className="text-center space-y-2">
            <h2 className="text-3xl font-black tracking-tight text-balance">{t('deploy.confirm')}</h2>
            <p className="text-sm opacity-60 text-pretty">Please review your deployment configuration</p>
          </div>
          <div className="space-y-4">
            {providerInfo && (
              <div className="flex items-center gap-6 p-8 rounded-[2.5rem] border-2 border-dashed border-[var(--outline-variant)]">
                <div className="w-16 h-16 rounded-2xl flex items-center justify-center text-white text-2xl font-black shadow-lg" style={{ background: 'var(--primary)' }}>
                  {providerInfo.name.charAt(0)}
                </div>
                <div>
                  <p className="text-lg font-black text-pretty">{providerInfo.name}</p>
                  <p className="text-xs font-bold uppercase tracking-widest opacity-60 text-pretty">{providerInfo.vendor} / {providerInfo.type}</p>
                </div>
                <div className="ml-auto"><TypeBadge type={providerInfo.type} /></div>
              </div>
            )}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-10 rounded-[2.5rem] bg-[var(--surface-container-low)]">
              <ConfirmRow label={t('deploy.blueprint')} value={blueprintName} />
              <ConfirmRow label={t('deploy.role')} value={role} />
              <ConfirmRow label={t('deploy.autonomy')} value={autonomy} />
              <ConfirmRow label={t('deploy.modelRouting')} value={modelRouting} />
            </div>
          </div>
          <div className="flex justify-between items-center">
            <button onClick={() => setStep(1)} className="flex items-center gap-2 px-8 py-3.5 rounded-2xl text-sm font-black uppercase tracking-wider transition-all hover:bg-[var(--surface-container-high)]" style={{ color: 'var(--on-surface-variant)' }}>
              <span className="material-symbols-outlined font-black">arrow_back</span>
              {t('deploy.prev')}
            </button>
            <button onClick={handleDeploy} className="flex items-center gap-3 px-16 py-5 rounded-[2rem] text-lg font-black text-white transition-all hover:shadow-2xl hover:-translate-y-1 active:scale-95 shadow-xl"
              style={{ background: 'var(--primary)' }}>
              <span className="material-symbols-outlined font-black">rocket_launch</span>
              {t('deploy.startDeploy')}
            </button>
          </div>
        </div>
      )}

      {/* Step 4: Deploy execution */}
      {step === 3 && (
        <Card className="border-none shadow-xl rounded-[2.5rem] overflow-hidden">
          <div className="p-10 space-y-8">
            {jobData ? (
              <div className="space-y-8">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <StatusBadge status={jobData.status} />
                    <span className="text-xl font-black tracking-tight">{providerInfo?.name || jobData.provider}</span>
                  </div>
                  {jobData.completedAt && (
                    <div className="px-4 py-1.5 rounded-full text-xs font-black bg-[var(--surface-container-high)]">
                      {t('deploy.elapsed')} {Math.round((new Date(jobData.completedAt).getTime() - new Date(jobData.createdAt).getTime()) / 1000)}s
                    </div>
                  )}
                </div>

                {jobData.status === 'running' && (
                  <div className="space-y-3">
                    <div className="h-3 rounded-full overflow-hidden bg-[var(--surface-container-high)]">
                      <div className="h-full rounded-full transition-all duration-1000 ease-in-out shadow-inner" style={{ 
                        background: 'linear-gradient(90deg, var(--af-brand-bright), var(--surface-tint))', 
                        width: `${Math.min(95, jobData.logs.length * 12)}%` 
                      }} />
                    </div>
                    <p className="text-center text-[var(--af-fs-meta)] font-black uppercase tracking-[0.3em] animate-pulse text-[var(--primary)] text-pretty">Deployment in progress...</p>
                  </div>
                )}

                <div className="bg-[var(--surface-container-low)] rounded-3xl p-6 space-y-2 border border-[var(--outline-variant)]">
                  {jobData.logs.map((log, i) => (
                    <div key={i} className="flex items-center gap-4 text-sm py-3 px-4 rounded-xl transition-all" style={{ background: i === jobData.logs.length - 1 ? 'var(--surface-container-lowest)' : 'transparent' }}>
                      <span className="material-symbols-outlined font-black text-lg" style={{
                        color: log.status === 'ok' ? 'var(--tertiary)' : log.status === 'error' ? 'var(--error)' : 'var(--af-cream-fg)',
                      }}>
                        {log.status === 'ok' ? 'check_circle' : log.status === 'error' ? 'cancel' : 'pending'}
                      </span>
                      <span className="font-black uppercase tracking-widest text-[var(--af-fs-meta)] min-w-[120px] opacity-60">{log.name}</span>
                      <span className="font-bold">{log.message}</span>
                    </div>
                  ))}
                </div>

                {jobData.status === 'success' && (
                  <div className="p-8 rounded-[2rem] flex flex-col items-center text-center gap-4 border-2 border-[var(--tertiary)]" style={{ background: 'var(--tertiary-container)' }}>
                    <div className="w-16 h-16 rounded-full bg-[var(--tertiary)] text-white flex items-center justify-center shadow-lg mb-2">
                      <span className="material-symbols-outlined text-3xl font-black">done_all</span>
                    </div>
                    <div>
                      <h3 className="text-2xl font-black text-balance" style={{ color: 'var(--on-tertiary-container)' }}>{t('deploy.success')}</h3>
                      <p className="text-sm font-medium opacity-80 text-pretty">Your universal AI agent has been successfully provisioned.</p>
                    </div>
                  </div>
                )}

                {jobData.status === 'failed' && (
                  <div className="p-8 rounded-[2rem] flex flex-col items-center text-center gap-4 border-2 border-[var(--error)]" style={{ background: 'var(--error-container)' }}>
                    <div className="w-16 h-16 rounded-full bg-[var(--error)] text-white flex items-center justify-center shadow-lg mb-2">
                      <span className="material-symbols-outlined text-3xl font-black">close</span>
                    </div>
                    <div>
                      <h3 className="text-2xl font-black text-balance" style={{ color: 'var(--on-error-container)' }}>{t('deploy.failed')}</h3>
                      <p className="text-sm font-medium opacity-80 text-pretty">Encountered an issue during the deployment pipeline.</p>
                    </div>
                    {providerInfo?.consoleUrl && (
                      <a href={providerInfo.consoleUrl} target="_blank" rel="noopener noreferrer" className="mt-2 px-6 py-2 rounded-full text-xs font-black uppercase tracking-widest border-2 border-[var(--error)] transition-colors hover:bg-[var(--error)] hover:text-white">
                        {t('deploy.goConsole')}
                      </a>
                    )}
                  </div>
                )}

                {(jobData.status === 'success' || jobData.status === 'failed') && (
                  <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
                    <button onClick={() => { setStep(0); setJobId(null); setAutoAdvanced(false); setProviderInfo(null); }}
                      className="flex items-center justify-center gap-3 px-10 py-4 rounded-2xl font-black text-white transition-all hover:shadow-2xl hover:-translate-y-1 shadow-lg"
                      style={{ background: 'var(--primary)' }}>
                      <span className="material-symbols-outlined font-black">add</span>
                      {t('deploy.newDeploy')}
                    </button>
                    <a href="/" className="flex items-center justify-center gap-3 px-10 py-4 rounded-2xl font-black transition-all hover:bg-[var(--surface-container-high)]" style={{ background: 'var(--surface-container-low)', color: 'var(--on-surface)' }}>
                      <span className="material-symbols-outlined font-black">dashboard</span>
                      {t('deploy.backDashboard')}
                    </a>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex flex-col items-center py-20 space-y-6">
                <div className="w-20 h-20 border-8 border-[var(--surface-container-high)] border-t-[var(--primary)] rounded-full animate-spin" />
                <p className="text-lg font-black uppercase tracking-[0.2em] animate-pulse text-pretty" style={{ color: 'var(--primary)' }}>{t('deploy.starting')}</p>
              </div>
            )}
          </div>
        </Card>
      )}
    </div>
  );
}

function FormField({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <div className="space-y-3">
      <label className="text-[var(--af-fs-meta)] font-black uppercase tracking-widest block opacity-60">{label}</label>
      <input 
        type="text" 
        value={value} 
        onChange={e => onChange(e.target.value)}
        className="w-full px-5 py-4 rounded-2xl text-sm font-bold outline-none transition-all focus:ring-4 focus:ring-[var(--primary-container)]"
        style={{ background: 'var(--surface-container-low)', border: '2px solid var(--outline-variant)' }} 
      />
    </div>
  );
}

function ConfirmRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="space-y-1">
      <span className="text-[var(--af-fs-meta)] font-black uppercase tracking-widest opacity-50 block">{label}</span>
      <span className="text-sm font-bold block">{value}</span>
    </div>
  );
}
