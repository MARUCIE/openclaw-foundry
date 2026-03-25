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
  }, [preselected, providers, autoAdvanced]);

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
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold" style={{ fontFamily: 'Manrope, sans-serif' }}>{t('deploy.title')}</h2>
        <p className="text-sm mt-1" style={{ color: 'var(--on-surface-variant)' }}>{t('deploy.subtitle')}</p>
      </div>

      {/* Stepper */}
      <div className="flex gap-2 items-center px-2">
        {STEP_KEYS.map((key, i) => (
          <div key={key} className="flex items-center gap-2">
            <button
              onClick={() => { if (i < step && step < 3) setStep(i); }}
              className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all"
              style={{
                background: i < step ? 'var(--on-tertiary-container)' : i === step ? 'var(--surface-tint)' : 'var(--surface-container)',
                color: i <= step ? 'white' : 'var(--on-surface-variant)',
                cursor: i < step && step < 3 ? 'pointer' : 'default',
              }}
            >
              {i < step ? (
                <span className="material-symbols-outlined text-sm">check</span>
              ) : (
                <span className="material-symbols-outlined text-sm">{STEP_ICONS[i]}</span>
              )}
            </button>
            <span className="text-sm font-medium" style={{
              color: i === step ? 'var(--on-surface)' : 'var(--on-surface-variant)',
              fontFamily: 'Manrope, sans-serif',
            }}>
              {t(key)}
            </span>
            {i < STEP_KEYS.length - 1 && (
              <div className="w-8 md:w-12 h-0.5 rounded-full" style={{ background: i < step ? 'var(--on-tertiary-container)' : 'var(--outline-variant)' }} />
            )}
          </div>
        ))}
      </div>

      {/* Step 1: Select platform */}
      {step === 0 && (
        <Card>
          <CardHeader><CardTitle>{t('deploy.selectTarget')}</CardTitle></CardHeader>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            {providers.map(p => (
              <button
                key={p.id}
                onClick={() => handleSelectProvider(p.id)}
                className="p-4 rounded-xl text-left transition-all group hover:shadow-md"
                style={{
                  background: selectedProvider === p.id ? 'var(--primary-fixed)' : 'var(--surface-container-low)',
                  border: selectedProvider === p.id ? '2px solid var(--surface-tint)' : '2px solid transparent',
                  boxShadow: selectedProvider === p.id ? '0 4px 12px rgba(0, 62, 168, 0.15)' : undefined,
                }}
              >
                <div className="flex items-center gap-2 mb-1">
                  <p className="font-semibold text-sm" style={{ fontFamily: 'Manrope, sans-serif' }}>{p.name}</p>
                  {selectedProvider === p.id && (
                    <span className="material-symbols-outlined text-sm" style={{ color: 'var(--primary)', fontVariationSettings: "'FILL' 1" }}>check_circle</span>
                  )}
                </div>
                <p className="text-xs" style={{ color: 'var(--on-surface-variant)' }}>{p.vendor}</p>
                <p className="text-xs mt-1.5 line-clamp-2" style={{ color: 'var(--on-surface-variant)', opacity: 0.8 }}>
                  {p.description ? (p.description.length > 60 ? p.description.slice(0, 60) + '...' : p.description) : ''}
                </p>
                <div className="mt-2.5 flex gap-1">
                  <TypeBadge type={p.type} />
                  <StatusBadge status={p.status} />
                </div>
              </button>
            ))}
          </div>
          <div className="flex justify-end mt-6">
            <button
              onClick={() => selectedProvider && setStep(1)}
              disabled={!selectedProvider}
              className="flex items-center gap-2 px-6 py-2.5 rounded-lg text-sm font-bold text-white disabled:opacity-40 transition-opacity hover:opacity-90"
              style={{ background: 'linear-gradient(135deg, #497cff, #0053db)' }}
            >
              {t('deploy.next')}
              <span className="material-symbols-outlined text-sm">arrow_forward</span>
            </button>
          </div>
        </Card>
      )}

      {/* Step 2: Configure blueprint */}
      {step === 1 && (
        <Card>
          <CardHeader><CardTitle>{t('deploy.step2')}</CardTitle></CardHeader>

          {providerInfo && (
            <div className="mb-6 p-4 rounded-xl" style={{ background: 'var(--surface-container-low)' }}>
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 rounded-lg flex items-center justify-center text-white font-bold" style={{ background: 'var(--surface-tint)' }}>
                  {providerInfo.name.charAt(0)}
                </div>
                <div>
                  <h4 className="font-bold text-sm" style={{ fontFamily: 'Manrope, sans-serif' }}>{providerInfo.name}</h4>
                  <p className="text-xs" style={{ color: 'var(--on-surface-variant)' }}>{providerInfo.vendor}</p>
                </div>
                <div className="ml-auto flex gap-2">
                  <TypeBadge type={providerInfo.type} />
                  <StatusBadge status={providerInfo.status} />
                  {providerAvailable !== null && (
                    <span className="text-xs px-2 py-0.5 rounded-full font-medium" style={{
                      background: providerAvailable ? 'var(--tertiary-fixed)' : 'var(--error-container)',
                      color: providerAvailable ? '#005236' : 'var(--error)',
                    }}>
                      {providerAvailable ? t('deploy.available') : t('deploy.unavailable')}
                    </span>
                  )}
                </div>
              </div>
              <p className="text-xs" style={{ color: 'var(--on-surface-variant)' }}>{providerInfo.description}</p>
              {providerReqs.length > 0 && (
                <div className="mt-3 space-y-1">
                  <p className="text-xs font-medium" style={{ color: 'var(--on-surface-variant)' }}>{t('deploy.depCheck')}</p>
                  {providerReqs.map((r, i) => (
                    <div key={i} className="text-xs flex items-center gap-1.5">
                      <span className="material-symbols-outlined text-sm" style={{ color: r.required ? 'var(--surface-tint)' : 'var(--outline)' }}>
                        {r.required ? 'radio_button_checked' : 'radio_button_unchecked'}
                      </span>
                      <span>{r.name}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          <div className="grid grid-cols-2 gap-4 max-w-2xl">
            <FormField label={t('deploy.blueprintName')} value={blueprintName} onChange={setBlueprintName} />
            <FormField label={t('deploy.role')} value={role} onChange={setRole} />
            <div>
              <label className="text-xs font-medium block mb-1.5" style={{ color: 'var(--on-surface-variant)' }}>{t('deploy.autonomy')}</label>
              <select value={autonomy} onChange={e => setAutonomy(e.target.value)} className="w-full px-3 py-2.5 rounded-xl text-sm outline-none"
                style={{ background: 'var(--surface-container-low)', border: '1px solid var(--outline-variant)' }}>
                <option value="L1-guided">{t('deploy.autonomyL1')}</option>
                <option value="L2-semi">{t('deploy.autonomyL2')}</option>
                <option value="L3-full">{t('deploy.autonomyL3')}</option>
              </select>
            </div>
            <div>
              <label className="text-xs font-medium block mb-1.5" style={{ color: 'var(--on-surface-variant)' }}>{t('deploy.modelRouting')}</label>
              <select value={modelRouting} onChange={e => setModelRouting(e.target.value)} className="w-full px-3 py-2.5 rounded-xl text-sm outline-none"
                style={{ background: 'var(--surface-container-low)', border: '1px solid var(--outline-variant)' }}>
                <option value="premium">{t('deploy.premium')}</option>
                <option value="balanced">{t('deploy.balanced')}</option>
                <option value="fast">{t('deploy.fast')}</option>
              </select>
            </div>
          </div>

          <div className="flex justify-between mt-6">
            <button onClick={() => setStep(0)} className="flex items-center gap-2 px-6 py-2.5 rounded-lg text-sm font-medium" style={{ background: 'var(--surface-container)' }}>
              <span className="material-symbols-outlined text-sm">arrow_back</span>
              {t('deploy.prev')}
            </button>
            <button onClick={() => setStep(2)} className="flex items-center gap-2 px-6 py-2.5 rounded-lg text-sm font-bold text-white transition-opacity hover:opacity-90"
              style={{ background: 'linear-gradient(135deg, #497cff, #0053db)' }}>
              {t('deploy.next')}
              <span className="material-symbols-outlined text-sm">arrow_forward</span>
            </button>
          </div>
        </Card>
      )}

      {/* Step 3: Confirm */}
      {step === 2 && (
        <Card>
          <CardHeader><CardTitle>{t('deploy.confirm')}</CardTitle></CardHeader>
          <div className="space-y-3 text-sm">
            {providerInfo && (
              <div className="flex items-center gap-3 p-4 rounded-xl" style={{ background: 'var(--surface-container-low)' }}>
                <div className="w-10 h-10 rounded-lg flex items-center justify-center text-white font-bold" style={{ background: 'var(--surface-tint)' }}>
                  {providerInfo.name.charAt(0)}
                </div>
                <div>
                  <p className="font-semibold" style={{ fontFamily: 'Manrope, sans-serif' }}>{providerInfo.name}</p>
                  <p className="text-xs" style={{ color: 'var(--on-surface-variant)' }}>{providerInfo.vendor} / {providerInfo.type}</p>
                </div>
                <div className="ml-auto"><TypeBadge type={providerInfo.type} /></div>
              </div>
            )}
            <div className="grid grid-cols-2 gap-3 p-4 rounded-xl" style={{ background: 'var(--surface-container-low)' }}>
              <ConfirmRow label={t('deploy.blueprint')} value={blueprintName} />
              <ConfirmRow label={t('deploy.role')} value={role} />
              <ConfirmRow label={t('deploy.autonomy')} value={autonomy} />
              <ConfirmRow label={t('deploy.modelRouting')} value={modelRouting} />
            </div>
          </div>
          <div className="flex justify-between mt-6">
            <button onClick={() => setStep(1)} className="flex items-center gap-2 px-6 py-2.5 rounded-lg text-sm font-medium" style={{ background: 'var(--surface-container)' }}>
              <span className="material-symbols-outlined text-sm">arrow_back</span>
              {t('deploy.prev')}
            </button>
            <button onClick={handleDeploy} className="flex items-center gap-2 px-8 py-2.5 rounded-lg text-sm font-bold text-white transition-opacity hover:opacity-90"
              style={{ background: 'linear-gradient(135deg, #497cff, #0053db)' }}>
              <span className="material-symbols-outlined text-sm">rocket_launch</span>
              {t('deploy.startDeploy')}
            </button>
          </div>
        </Card>
      )}

      {/* Step 4: Deploy execution */}
      {step === 3 && (
        <Card>
          <CardHeader><CardTitle>{t('deploy.execution')}</CardTitle></CardHeader>
          {jobData ? (
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <StatusBadge status={jobData.status} />
                <span className="text-sm font-semibold" style={{ fontFamily: 'Manrope, sans-serif' }}>{providerInfo?.name || jobData.provider}</span>
                {jobData.completedAt && (
                  <span className="text-xs" style={{ color: 'var(--outline)' }}>
                    {t('deploy.elapsed')} {Math.round((new Date(jobData.completedAt).getTime() - new Date(jobData.createdAt).getTime()) / 1000)}s
                  </span>
                )}
              </div>

              {jobData.status === 'running' && (
                <div className="h-1.5 rounded-full overflow-hidden" style={{ background: 'var(--surface-container)' }}>
                  <div className="h-full rounded-full animate-pulse" style={{ background: 'var(--surface-tint)', width: `${Math.min(90, jobData.logs.length * 12)}%`, transition: 'width 0.5s' }} />
                </div>
              )}

              <div className="space-y-1">
                {jobData.logs.map((log, i) => (
                  <div key={i} className="flex items-center gap-2 text-sm py-2 px-3 rounded-lg" style={{ background: i % 2 === 0 ? 'transparent' : 'var(--surface-container-low)' }}>
                    <span className="material-symbols-outlined text-sm" style={{
                      color: log.status === 'ok' ? 'var(--on-tertiary-container)' : log.status === 'error' ? 'var(--error)' : '#f57f17',
                    }}>
                      {log.status === 'ok' ? 'check_circle' : log.status === 'error' ? 'cancel' : 'warning'}
                    </span>
                    <span className="font-medium min-w-[100px]">{log.name}</span>
                    <span style={{ color: 'var(--on-surface-variant)' }}>{log.message}</span>
                  </div>
                ))}
              </div>

              {jobData.status === 'success' && (
                <div className="p-4 rounded-xl flex items-center gap-2" style={{ background: 'var(--tertiary-fixed)' }}>
                  <span className="material-symbols-outlined" style={{ color: '#005236' }}>check_circle</span>
                  <span className="font-bold" style={{ color: '#005236' }}>{t('deploy.success')}</span>
                </div>
              )}

              {jobData.status === 'failed' && (
                <div className="p-4 rounded-xl flex items-center gap-2" style={{ background: 'var(--error-container)' }}>
                  <span className="material-symbols-outlined" style={{ color: 'var(--error)' }}>error</span>
                  <span className="font-bold" style={{ color: 'var(--error)' }}>{t('deploy.failed')}</span>
                  {providerInfo?.consoleUrl && (
                    <a href={providerInfo.consoleUrl} target="_blank" rel="noopener noreferrer" className="ml-auto text-xs underline" style={{ color: 'var(--surface-tint)' }}>
                      {t('deploy.goConsole')} →
                    </a>
                  )}
                </div>
              )}

              {(jobData.status === 'success' || jobData.status === 'failed') && (
                <div className="flex gap-3 mt-2">
                  <button onClick={() => { setStep(0); setJobId(null); setAutoAdvanced(false); setProviderInfo(null); }}
                    className="flex items-center gap-2 px-6 py-2.5 rounded-lg text-sm font-bold text-white transition-opacity hover:opacity-90"
                    style={{ background: 'linear-gradient(135deg, #497cff, #0053db)' }}>
                    <span className="material-symbols-outlined text-sm">add</span>
                    {t('deploy.newDeploy')}
                  </button>
                  <a href="/" className="flex items-center gap-2 px-6 py-2.5 rounded-lg text-sm font-medium" style={{ background: 'var(--surface-container)' }}>
                    <span className="material-symbols-outlined text-sm">dashboard</span>
                    {t('deploy.backDashboard')}
                  </a>
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-3">
              <div className="h-1.5 rounded-full overflow-hidden" style={{ background: 'var(--surface-container)' }}>
                <div className="h-full rounded-full animate-pulse" style={{ background: 'var(--surface-tint)', width: '30%' }} />
              </div>
              <p className="text-sm animate-pulse" style={{ color: 'var(--on-surface-variant)' }}>{t('deploy.starting')}</p>
            </div>
          )}
        </Card>
      )}
    </div>
  );
}

function FormField({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <div>
      <label className="text-xs font-medium block mb-1.5" style={{ color: 'var(--on-surface-variant)' }}>{label}</label>
      <input type="text" value={value} onChange={e => onChange(e.target.value)}
        className="w-full px-3 py-2.5 rounded-xl text-sm outline-none"
        style={{ background: 'var(--surface-container-low)', border: '1px solid var(--outline-variant)' }} />
    </div>
  );
}

function ConfirmRow({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <span style={{ color: 'var(--on-surface-variant)' }}>{label}:</span>{' '}
      <strong>{value}</strong>
    </div>
  );
}
