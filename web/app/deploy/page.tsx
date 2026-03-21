'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import useSWR from 'swr';
import { getProviders, getProvider as getProviderDetail, startDeploy, getDeployJob, type ProviderMeta } from '@/lib/api';
import { Card, CardHeader, CardTitle } from '@/components/ui/card';
import { TypeBadge, StatusBadge } from '@/components/ui/badge';

const STEPS = ['选择平台', '配置蓝图', '确认部署', '部署执行'];

export default function DeployPage() {
  return (
    <Suspense fallback={<div className="animate-pulse h-96 rounded-lg" style={{ background: 'var(--surface-container)' }} />}>
      <DeployPageInner />
    </Suspense>
  );
}

function DeployPageInner() {
  const searchParams = useSearchParams();
  const preselected = searchParams.get('provider') || '';

  const [step, setStep] = useState(0);
  const [selectedProvider, setSelectedProvider] = useState(preselected);
  const [providerInfo, setProviderInfo] = useState<ProviderMeta | null>(null);
  const [providerAvailable, setProviderAvailable] = useState<boolean | null>(null);
  const [providerReqs, setProviderReqs] = useState<any[]>([]);
  const [blueprintName, setBlueprintName] = useState('my-agent');
  const [role, setRole] = useState('全栈工程师');
  const [autonomy, setAutonomy] = useState('L1-guided');
  const [modelRouting, setModelRouting] = useState('balanced');
  const [jobId, setJobId] = useState<string | null>(null);
  const [autoAdvanced, setAutoAdvanced] = useState(false);

  const { data: providerData } = useSWR('providers', () => getProviders());
  const providers = providerData?.providers || [];

  // Auto-advance: when URL has ?provider=xxx, fetch details and jump to Step 2
  useEffect(() => {
    if (preselected && providers.length > 0 && !autoAdvanced) {
      const match = providers.find(p => p.id === preselected);
      if (match) {
        setSelectedProvider(preselected);
        setAutoAdvanced(true);
        // Fetch provider details
        getProviderDetail(preselected).then(detail => {
          setProviderInfo(detail.provider);
          setProviderAvailable(detail.available);
          setProviderReqs(detail.requirements);
          // Auto-fill blueprint name from provider
          setBlueprintName(`${detail.provider.name.toLowerCase().replace(/\s+/g, '-')}-agent`);
          // Jump to Step 2
          setStep(1);
        }).catch(() => {
          // Fallback: just set provider info from list and go to step 1
          setProviderInfo(match);
          setBlueprintName(`${match.name.toLowerCase().replace(/\s+/g, '-')}-agent`);
          setStep(1);
        });
      }
    }
  }, [preselected, providers, autoAdvanced]);

  // When user manually selects a provider, fetch its details
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

  // Poll deploy job when active — dedupingInterval:0 ensures fresh data every poll
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
      <h2 className="text-2xl font-bold">部署</h2>

      {/* Stepper */}
      <div className="flex gap-2 items-center">
        {STEPS.map((s, i) => (
          <div key={s} className="flex items-center gap-2">
            <button
              onClick={() => { if (i < step && step < 3) setStep(i); }}
              className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold"
              style={{
                background: i < step ? 'var(--tertiary)' : i === step ? 'var(--surface-tint)' : 'var(--surface-container)',
                color: i <= step ? 'white' : 'var(--on-surface-variant)',
                cursor: i < step && step < 3 ? 'pointer' : 'default',
              }}
            >
              {i < step ? '✓' : i + 1}
            </button>
            <span className="text-sm font-medium" style={{ color: i === step ? 'var(--on-surface)' : 'var(--on-surface-variant)' }}>
              {s}
            </span>
            {i < STEPS.length - 1 && <div className="w-8 h-px" style={{ background: 'var(--outline-variant)' }} />}
          </div>
        ))}
      </div>

      {/* Step 1: Select platform */}
      {step === 0 && (
        <Card>
          <CardHeader><CardTitle>选择目标平台</CardTitle></CardHeader>
          <div className="grid grid-cols-4 gap-3">
            {providers.map(p => (
              <button
                key={p.id}
                onClick={() => handleSelectProvider(p.id)}
                className="p-3 rounded-lg text-left transition-all"
                style={{
                  background: selectedProvider === p.id ? 'var(--primary-fixed)' : 'var(--surface-container)',
                  border: selectedProvider === p.id ? '2px solid var(--surface-tint)' : '2px solid transparent',
                }}
              >
                <p className="font-semibold text-sm">{p.name}</p>
                <p className="text-xs mt-0.5" style={{ color: 'var(--on-surface-variant)' }}>{p.vendor}</p>
                <div className="mt-2 flex gap-1">
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
              className="px-6 py-2 rounded-md text-sm font-medium text-white disabled:opacity-40"
              style={{ background: 'linear-gradient(135deg, #497cff, #0053db)' }}
            >
              下一步
            </button>
          </div>
        </Card>
      )}

      {/* Step 2: Configure blueprint — with auto-filled provider details */}
      {step === 1 && (
        <Card>
          <CardHeader><CardTitle>配置蓝图</CardTitle></CardHeader>

          {/* Provider detail panel */}
          {providerInfo && (
            <div className="mb-6 p-4 rounded-lg" style={{ background: 'var(--surface-container)' }}>
              <div className="flex items-center gap-3 mb-2">
                <div
                  className="w-10 h-10 rounded-lg flex items-center justify-center text-white font-bold"
                  style={{ background: 'var(--surface-tint)' }}
                >
                  {providerInfo.name.charAt(0)}
                </div>
                <div>
                  <h4 className="font-bold text-sm">{providerInfo.name}</h4>
                  <p className="text-xs" style={{ color: 'var(--on-surface-variant)' }}>{providerInfo.vendor}</p>
                </div>
                <div className="ml-auto flex gap-2">
                  <TypeBadge type={providerInfo.type} />
                  <StatusBadge status={providerInfo.status} />
                  {providerAvailable !== null && (
                    <span className="text-xs px-2 py-0.5 rounded-full" style={{
                      background: providerAvailable ? 'var(--tertiary-fixed)' : 'var(--error-container)',
                      color: providerAvailable ? '#005236' : 'var(--error)',
                    }}>
                      {providerAvailable ? '可用' : '不可用'}
                    </span>
                  )}
                </div>
              </div>
              <p className="text-xs" style={{ color: 'var(--on-surface-variant)' }}>{providerInfo.description}</p>
              <div className="flex gap-4 mt-2 text-xs" style={{ color: 'var(--outline)' }}>
                <span>OS: {providerInfo.platforms.join(', ')}</span>
                <span>IM: {providerInfo.imChannels.join(', ') || '—'}</span>
              </div>
              {providerReqs.length > 0 && (
                <div className="mt-3 space-y-1">
                  <p className="text-xs font-medium" style={{ color: 'var(--on-surface-variant)' }}>依赖检查:</p>
                  {providerReqs.map((r, i) => (
                    <div key={i} className="text-xs flex items-center gap-1.5">
                      <span style={{ color: r.required ? 'var(--surface-tint)' : 'var(--outline)' }}>
                        {r.required ? '●' : '○'}
                      </span>
                      <span>{r.name}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          <div className="grid grid-cols-2 gap-4 max-w-2xl">
            <div>
              <label className="text-xs font-medium block mb-1" style={{ color: 'var(--on-surface-variant)' }}>蓝图名称</label>
              <input
                type="text"
                value={blueprintName}
                onChange={e => setBlueprintName(e.target.value)}
                className="w-full px-3 py-2 rounded-lg text-sm"
                style={{ background: 'var(--surface-container-lowest)', border: '1px solid var(--outline-variant)' }}
              />
            </div>
            <div>
              <label className="text-xs font-medium block mb-1" style={{ color: 'var(--on-surface-variant)' }}>角色</label>
              <input
                type="text"
                value={role}
                onChange={e => setRole(e.target.value)}
                className="w-full px-3 py-2 rounded-lg text-sm"
                style={{ background: 'var(--surface-container-lowest)', border: '1px solid var(--outline-variant)' }}
              />
            </div>
            <div>
              <label className="text-xs font-medium block mb-1" style={{ color: 'var(--on-surface-variant)' }}>自治等级</label>
              <select
                value={autonomy}
                onChange={e => setAutonomy(e.target.value)}
                className="w-full px-3 py-2 rounded-lg text-sm"
                style={{ background: 'var(--surface-container-lowest)', border: '1px solid var(--outline-variant)' }}
              >
                <option value="L1-guided">L1 - 引导模式</option>
                <option value="L2-semi">L2 - 半自主</option>
                <option value="L3-full">L3 - 全自主</option>
              </select>
            </div>
            <div>
              <label className="text-xs font-medium block mb-1" style={{ color: 'var(--on-surface-variant)' }}>模型路由</label>
              <select
                value={modelRouting}
                onChange={e => setModelRouting(e.target.value)}
                className="w-full px-3 py-2 rounded-lg text-sm"
                style={{ background: 'var(--surface-container-lowest)', border: '1px solid var(--outline-variant)' }}
              >
                <option value="premium">Premium (最高质量)</option>
                <option value="balanced">Balanced (均衡)</option>
                <option value="fast">Fast (最快速度)</option>
              </select>
            </div>
          </div>
          <p className="text-xs mt-4" style={{ color: 'var(--outline)' }}>
            目标: {providerInfo?.name || selectedProvider} | 部署模式: {providerInfo?.type === 'cloud' || providerInfo?.type === 'saas' ? 'cloud' : 'local'}
          </p>
          <div className="flex justify-between mt-6">
            <button onClick={() => setStep(0)} className="px-6 py-2 rounded-md text-sm font-medium" style={{ background: 'var(--surface-container)' }}>
              上一步
            </button>
            <button
              onClick={() => setStep(2)}
              className="px-6 py-2 rounded-md text-sm font-medium text-white"
              style={{ background: 'linear-gradient(135deg, #497cff, #0053db)' }}
            >
              下一步
            </button>
          </div>
        </Card>
      )}

      {/* Step 3: Confirm */}
      {step === 2 && (
        <Card>
          <CardHeader><CardTitle>确认部署</CardTitle></CardHeader>
          <div className="space-y-3 text-sm">
            {providerInfo && (
              <div className="flex items-center gap-3 p-3 rounded-lg" style={{ background: 'var(--surface-container)' }}>
                <div className="w-8 h-8 rounded-lg flex items-center justify-center text-white font-bold text-sm" style={{ background: 'var(--surface-tint)' }}>
                  {providerInfo.name.charAt(0)}
                </div>
                <div>
                  <p className="font-semibold">{providerInfo.name}</p>
                  <p className="text-xs" style={{ color: 'var(--on-surface-variant)' }}>{providerInfo.vendor} / {providerInfo.type}</p>
                </div>
                <div className="ml-auto">
                  <TypeBadge type={providerInfo.type} />
                </div>
              </div>
            )}
            <div className="grid grid-cols-2 gap-3 p-3 rounded-lg" style={{ background: 'var(--surface-container)' }}>
              <div><span style={{ color: 'var(--on-surface-variant)' }}>蓝图:</span> <strong>{blueprintName}</strong></div>
              <div><span style={{ color: 'var(--on-surface-variant)' }}>角色:</span> <strong>{role}</strong></div>
              <div><span style={{ color: 'var(--on-surface-variant)' }}>自治等级:</span> <strong>{autonomy}</strong></div>
              <div><span style={{ color: 'var(--on-surface-variant)' }}>模型路由:</span> <strong>{modelRouting}</strong></div>
            </div>
          </div>
          <div className="flex justify-between mt-6">
            <button onClick={() => setStep(1)} className="px-6 py-2 rounded-md text-sm font-medium" style={{ background: 'var(--surface-container)' }}>
              上一步
            </button>
            <button
              onClick={handleDeploy}
              className="px-8 py-2 rounded-md text-sm font-bold text-white"
              style={{ background: 'linear-gradient(135deg, #497cff, #0053db)' }}
            >
              开始部署
            </button>
          </div>
        </Card>
      )}

      {/* Step 4: Deploy execution */}
      {step === 3 && (
        <Card>
          <CardHeader><CardTitle>部署执行</CardTitle></CardHeader>
          {jobData ? (
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <StatusBadge status={jobData.status} />
                <span className="text-sm font-medium">{providerInfo?.name || jobData.provider}</span>
                {jobData.completedAt && (
                  <span className="text-xs" style={{ color: 'var(--outline)' }}>
                    耗时 {Math.round((new Date(jobData.completedAt).getTime() - new Date(jobData.createdAt).getTime()) / 1000)}s
                  </span>
                )}
              </div>

              {/* Progress bar */}
              {jobData.status === 'running' && (
                <div className="h-1 rounded-full overflow-hidden" style={{ background: 'var(--surface-container)' }}>
                  <div className="h-full rounded-full animate-pulse" style={{ background: 'var(--surface-tint)', width: `${Math.min(90, jobData.logs.length * 12)}%`, transition: 'width 0.5s' }} />
                </div>
              )}

              <div className="space-y-1">
                {jobData.logs.map((log, i) => (
                  <div key={i} className="flex items-center gap-2 text-sm py-1.5 px-2 rounded" style={{ background: i % 2 === 0 ? 'transparent' : 'var(--surface-container-low)' }}>
                    <span style={{
                      color: log.status === 'ok' ? 'var(--tertiary)' : log.status === 'error' ? 'var(--error)' : '#f57f17',
                    }}>
                      {log.status === 'ok' ? '✓' : log.status === 'error' ? '✗' : '⚠'}
                    </span>
                    <span className="font-medium min-w-[100px]">{log.name}</span>
                    <span style={{ color: 'var(--on-surface-variant)' }}>{log.message}</span>
                  </div>
                ))}
              </div>

              {jobData.status === 'success' && (
                <div className="mt-4 p-3 rounded-lg flex items-center gap-2" style={{ background: 'var(--tertiary-fixed)' }}>
                  <span className="text-lg">✓</span>
                  <span className="font-medium" style={{ color: '#005236' }}>部署成功</span>
                </div>
              )}

              {jobData.status === 'failed' && (
                <div className="mt-4 p-3 rounded-lg flex items-center gap-2" style={{ background: 'var(--error-container)' }}>
                  <span className="text-lg">✗</span>
                  <span className="font-medium" style={{ color: 'var(--error)' }}>部署失败</span>
                  {providerInfo?.consoleUrl && (
                    <a href={providerInfo.consoleUrl} target="_blank" rel="noopener noreferrer" className="ml-auto text-xs underline" style={{ color: 'var(--surface-tint)' }}>
                      前往控制台手动配置 →
                    </a>
                  )}
                </div>
              )}

              {(jobData.status === 'success' || jobData.status === 'failed') && (
                <div className="flex gap-3 mt-4">
                  <button
                    onClick={() => { setStep(0); setJobId(null); setAutoAdvanced(false); setProviderInfo(null); }}
                    className="px-6 py-2 rounded-md text-sm font-medium text-white"
                    style={{ background: 'linear-gradient(135deg, #497cff, #0053db)' }}
                  >
                    新建部署
                  </button>
                  <a
                    href="/"
                    className="px-6 py-2 rounded-md text-sm font-medium"
                    style={{ background: 'var(--surface-container)' }}
                  >
                    返回仪表盘
                  </a>
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-3">
              <div className="h-1 rounded-full overflow-hidden" style={{ background: 'var(--surface-container)' }}>
                <div className="h-full rounded-full animate-pulse" style={{ background: 'var(--surface-tint)', width: '30%' }} />
              </div>
              <p className="text-sm animate-pulse">正在启动部署...</p>
            </div>
          )}
        </Card>
      )}
    </div>
  );
}
