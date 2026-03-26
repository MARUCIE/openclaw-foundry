'use client';

import { useState } from 'react';
import useSWR from 'swr';
import { getPacks, type ConfigPack, type PacksResponse } from '@/lib/api';
import { useI18n } from '@/lib/i18n';

// Question tree answers map to lines + sub-options
const QUESTION_TREE: { id: string; icon: string; labelKey: string; descKey: string; options: { labelKey: string; packId: string }[] }[] = [
  {
    id: 'code',
    icon: 'code',
    labelKey: 'packs.q1Code',
    descKey: 'packs.q1CodeDesc',
    options: [
      { labelKey: 'packs.q2Frontend', packId: 'frontend-engineer' },
      { labelKey: 'packs.q2Backend', packId: 'backend-engineer' },
      { labelKey: 'packs.q2Test', packId: 'test-engineer' },
      { labelKey: 'packs.q2Infra', packId: 'infra-engineer' },
      { labelKey: 'packs.q2Ops', packId: 'ops-engineer' },
    ],
  },
  {
    id: 'data',
    icon: 'analytics',
    labelKey: 'packs.q1Data',
    descKey: 'packs.q1DataDesc',
    options: [
      { labelKey: 'packs.q2Algorithm', packId: 'algorithm-engineer' },
      { labelKey: 'packs.q2Bigdata', packId: 'bigdata-engineer' },
    ],
  },
  {
    id: 'product',
    icon: 'lightbulb',
    labelKey: 'packs.q1Product',
    descKey: 'packs.q1ProductDesc',
    options: [
      { labelKey: 'packs.q2PM', packId: 'product-manager' },
      { labelKey: 'packs.q2Scenario', packId: 'scenario-planner' },
    ],
  },
  {
    id: 'business',
    icon: 'verified_user',
    labelKey: 'packs.q1Business',
    descKey: 'packs.q1BusinessDesc',
    options: [
      { labelKey: 'packs.q2Compliance', packId: 'compliance-expert' },
    ],
  },
];

const LINE_TABS = [
  { id: 'all', labelKey: 'packs.tabAll' },
  { id: 'engineering', labelKey: 'packs.tabEngineering' },
  { id: 'data-ai', labelKey: 'packs.tabDataAI' },
  { id: 'product', labelKey: 'packs.tabProduct' },
  { id: 'business', labelKey: 'packs.tabBusiness' },
];

export default function PacksPage() {
  const { t } = useI18n();
  const { data, isLoading } = useSWR<PacksResponse>('packs', getPacks);
  const allPacks = data?.packs || [];

  type Step = 'q1' | 'q2' | 'result' | 'browse';
  const [step, setStep] = useState<Step>('q1');
  const [selectedLine, setSelectedLine] = useState<string | null>(null);
  const [recommendedPack, setRecommendedPack] = useState<string | null>(null);
  const [browseTab, setBrowseTab] = useState('all');

  const filteredPacks = browseTab === 'all' ? allPacks : allPacks.filter(p => p.line === browseTab);
  const recommended = allPacks.find(p => p.id === recommendedPack);

  const handleQ1 = (lineId: string) => {
    setSelectedLine(lineId);
    const lineOptions = QUESTION_TREE.find(q => q.id === lineId)?.options || [];
    if (lineOptions.length === 1) {
      // Only one option, skip to result
      setRecommendedPack(lineOptions[0].packId);
      setStep('result');
    } else {
      setStep('q2');
    }
  };

  const handleQ2 = (packId: string) => {
    setRecommendedPack(packId);
    setStep('result');
  };

  const resetTree = () => {
    setStep('q1');
    setSelectedLine(null);
    setRecommendedPack(null);
  };

  return (
    <div className="max-w-7xl mx-auto px-6 py-12 space-y-10">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-1.5 h-10 rounded-full" style={{ background: 'var(--primary)' }} />
        <div>
          <h1 className="text-3xl md:text-4xl font-extrabold" style={{ fontFamily: 'Manrope, sans-serif', color: 'var(--on-surface)' }}>
            {t('packs.title')}
          </h1>
          <p className="text-sm mt-1" style={{ color: 'var(--on-surface-variant)' }}>
            {t('packs.subtitle')}
          </p>
        </div>
      </div>

      {/* Value proposition */}
      <div
        className="p-8 rounded-2xl flex flex-col md:flex-row items-center gap-8"
        style={{ background: 'linear-gradient(135deg, rgba(0,62,168,0.04), rgba(113,42,226,0.04))', border: '1px solid rgba(195,198,215,0.3)' }}
      >
        <div className="flex-1 space-y-3">
          <h2 className="text-xl font-bold" style={{ fontFamily: 'Manrope, sans-serif', color: 'var(--on-surface)' }}>
            {t('packs.hero')}
          </h2>
          <p className="text-sm leading-relaxed" style={{ color: 'var(--on-surface-variant)' }}>
            {t('packs.heroDesc')}
          </p>
        </div>
        <div className="flex gap-6 text-center shrink-0">
          <div>
            <div className="text-3xl font-extrabold" style={{ fontFamily: 'Manrope, sans-serif', color: 'var(--primary)' }}>10</div>
            <div className="text-xs mt-1" style={{ color: 'var(--on-surface-variant)' }}>{t('packs.totalPacks')}</div>
          </div>
          <div className="w-px" style={{ background: 'var(--outline-variant)' }} />
          <div>
            <div className="text-3xl font-extrabold" style={{ fontFamily: 'Manrope, sans-serif', color: 'var(--secondary)' }}>4</div>
            <div className="text-xs mt-1" style={{ color: 'var(--on-surface-variant)' }}>{t('packs.totalLines')}</div>
          </div>
          <div className="w-px" style={{ background: 'var(--outline-variant)' }} />
          <div>
            <div className="text-3xl font-extrabold" style={{ fontFamily: 'Manrope, sans-serif', color: 'var(--tertiary)' }}>30s</div>
            <div className="text-xs mt-1" style={{ color: 'var(--on-surface-variant)' }}>{t('packs.setupTime')}</div>
          </div>
        </div>
      </div>

      {/* Question Tree */}
      {step !== 'browse' && (
        <section
          className="p-8 rounded-2xl space-y-6"
          style={{ background: 'var(--surface-container-lowest)', border: '1px solid rgba(195,198,215,0.3)' }}
        >
          {step === 'q1' && (
            <>
              <h2 className="text-xl font-bold text-center" style={{ fontFamily: 'Manrope, sans-serif', color: 'var(--on-surface)' }}>
                {t('packs.questionMain')}
              </h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {QUESTION_TREE.map(q => (
                  <button
                    key={q.id}
                    onClick={() => handleQ1(q.id)}
                    className="p-6 rounded-xl text-center space-y-3 transition-all hover:shadow-md"
                    style={{ border: '2px solid rgba(195,198,215,0.3)', background: 'var(--surface-container-lowest)' }}
                    onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--primary)'; }}
                    onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(195,198,215,0.3)'; }}
                  >
                    <span className="material-symbols-outlined text-3xl" style={{ color: 'var(--primary)' }}>{q.icon}</span>
                    <div className="font-bold" style={{ fontFamily: 'Manrope, sans-serif', color: 'var(--on-surface)' }}>{t(q.labelKey)}</div>
                    <div className="text-xs" style={{ color: 'var(--on-surface-variant)' }}>{t(q.descKey)}</div>
                  </button>
                ))}
              </div>
            </>
          )}

          {step === 'q2' && selectedLine && (
            <>
              <div className="flex items-center gap-3">
                <button onClick={resetTree} className="p-2 rounded-lg hover:bg-[var(--surface-container)]">
                  <span className="material-symbols-outlined text-xl" style={{ color: 'var(--on-surface-variant)' }}>arrow_back</span>
                </button>
                <h2 className="text-xl font-bold" style={{ fontFamily: 'Manrope, sans-serif', color: 'var(--on-surface)' }}>
                  {t('packs.questionSub')}
                </h2>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {QUESTION_TREE.find(q => q.id === selectedLine)?.options.map(opt => (
                  <button
                    key={opt.packId}
                    onClick={() => handleQ2(opt.packId)}
                    className="p-5 rounded-xl text-center space-y-2 transition-all hover:shadow-md"
                    style={{ border: '2px solid rgba(195,198,215,0.3)', background: 'var(--surface-container-lowest)' }}
                    onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--primary)'; }}
                    onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(195,198,215,0.3)'; }}
                  >
                    <div className="font-bold" style={{ fontFamily: 'Manrope, sans-serif', color: 'var(--on-surface)' }}>{t(opt.labelKey)}</div>
                  </button>
                ))}
              </div>
            </>
          )}

          {step === 'result' && recommended && (
            <>
              <div className="flex items-center gap-3">
                <button onClick={resetTree} className="p-2 rounded-lg hover:bg-[var(--surface-container)]">
                  <span className="material-symbols-outlined text-xl" style={{ color: 'var(--on-surface-variant)' }}>arrow_back</span>
                </button>
                <h2 className="text-xl font-bold" style={{ fontFamily: 'Manrope, sans-serif', color: 'var(--on-surface)' }}>
                  {t('packs.recommendation')}
                </h2>
              </div>
              <div className="max-w-lg mx-auto">
                <PackCard pack={recommended} featured />
              </div>
            </>
          )}

          {/* Browse All toggle */}
          <div className="text-center pt-2">
            <button
              onClick={() => setStep('browse')}
              className="text-sm font-medium transition-colors hover:underline"
              style={{ color: 'var(--primary)' }}
            >
              {t('packs.browseAll')} ({allPacks.length})
            </button>
          </div>
        </section>
      )}

      {/* Browse All with Tab-by-line */}
      {step === 'browse' && (
        <section className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold" style={{ fontFamily: 'Manrope, sans-serif', color: 'var(--on-surface)' }}>
              {t('packs.allPacks')}
            </h2>
            <button
              onClick={resetTree}
              className="text-sm font-medium flex items-center gap-1"
              style={{ color: 'var(--primary)' }}
            >
              <span className="material-symbols-outlined text-sm">arrow_back</span>
              {t('packs.backToGuide')}
            </button>
          </div>

          {/* Tab bar */}
          <div className="flex gap-2 overflow-x-auto pb-2">
            {LINE_TABS.map(tab => (
              <button
                key={tab.id}
                onClick={() => setBrowseTab(tab.id)}
                className="px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all"
                style={{
                  background: browseTab === tab.id ? 'var(--primary)' : 'var(--surface-container)',
                  color: browseTab === tab.id ? 'var(--on-primary)' : 'var(--on-surface-variant)',
                }}
              >
                {t(tab.labelKey)}
              </button>
            ))}
          </div>

          {/* Pack cards grid */}
          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3].map(i => <div key={i} className="h-80 rounded-2xl skeleton-shimmer" />)}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 stagger-grid">
              {filteredPacks.map(pack => (
                <PackCard key={pack.id} pack={pack} />
              ))}
            </div>
          )}
        </section>
      )}

      {/* How it works */}
      <section className="py-8">
        <h2 className="text-xl font-bold text-center mb-8" style={{ fontFamily: 'Manrope, sans-serif', color: 'var(--on-surface)' }}>
          {t('packs.howItWorks')}
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[
            { step: '1', titleKey: 'packs.step1', descKey: 'packs.step1Desc' },
            { step: '2', titleKey: 'packs.step2', descKey: 'packs.step2Desc' },
            { step: '3', titleKey: 'packs.step3', descKey: 'packs.step3Desc' },
          ].map(s => (
            <div key={s.step} className="text-center space-y-3 p-6">
              <div
                className="w-12 h-12 rounded-full mx-auto flex items-center justify-center text-white font-bold"
                style={{ background: 'var(--primary)' }}
              >
                {s.step}
              </div>
              <h3 className="font-bold" style={{ fontFamily: 'Manrope, sans-serif', color: 'var(--on-surface)' }}>{t(s.titleKey)}</h3>
              <p className="text-sm" style={{ color: 'var(--on-surface-variant)' }}>{t(s.descKey)}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

function PackCard({ pack, featured = false }: { pack: ConfigPack; featured?: boolean }) {
  const { t } = useI18n();
  const [copied, setCopied] = useState(false);

  const handleDownload = (filename: string) => {
    const a = document.createElement('a');
    a.href = `/packs/${pack.id}/${filename}`;
    a.download = filename;
    a.click();
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(`curl -sL https://openclaw-foundry.pages.dev/packs/${pack.id}/install.sh | bash`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div
      className={`rounded-2xl p-6 flex flex-col transition-all hover:shadow-lg ${featured ? 'ring-2 ring-[var(--primary)]' : ''}`}
      style={{
        background: 'var(--surface-container-lowest)',
        border: '1px solid rgba(195, 198, 215, 0.3)',
        borderTopWidth: '4px',
        borderTopColor: pack.color,
      }}
    >
      {/* Icon + name + line badge */}
      <div className="flex items-center gap-3 mb-4">
        <div
          className="w-12 h-12 rounded-xl flex items-center justify-center"
          style={{ background: `${pack.color}15`, color: pack.color }}
        >
          <span className="material-symbols-outlined text-2xl">{pack.icon}</span>
        </div>
        <div className="min-w-0 flex-1">
          <h3 className="font-bold" style={{ fontFamily: 'Manrope, sans-serif', color: 'var(--on-surface)' }}>
            {pack.nameZh}
          </h3>
          <div className="flex items-center gap-2 mt-0.5">
            <span className="text-xs" style={{ color: 'var(--on-surface-variant)' }}>{pack.name}</span>
            <span
              className="px-1.5 py-0.5 rounded text-[10px] font-medium"
              style={{ background: `${pack.color}15`, color: pack.color }}
            >
              {pack.lineZh}
            </span>
          </div>
        </div>
      </div>

      {/* Description */}
      <p className="text-sm leading-relaxed mb-4 flex-1" style={{ color: 'var(--on-surface-variant)' }}>
        {pack.descriptionZh}
      </p>

      {/* Layer inheritance badge */}
      <div className="flex gap-1 mb-4 flex-wrap">
        {pack.layerIds.map((lid, i) => (
          <span
            key={lid}
            className="px-2 py-0.5 rounded-full text-[10px] font-medium"
            style={{
              background: i === 0 ? 'rgba(0,29,61,0.1)' : i === 1 ? 'rgba(0,58,112,0.1)' : 'rgba(0,83,164,0.1)',
              color: i === 0 ? '#001D3D' : i === 1 ? '#003A70' : '#0053A4',
            }}
          >
            {lid === 'universal' ? 'L0 财税基础' : lid.startsWith('line-') ? `L1 ${lid.replace('line-', '')}` : `L2 ${lid.replace('role-', '')}`}
          </span>
        ))}
      </div>

      {/* Pack files */}
      <div className="space-y-1.5 mb-4">
        {['CLAUDE.md', 'AGENTS.md', 'settings.json', 'prompts.md'].map(file => (
          <button
            key={file}
            onClick={() => handleDownload(file)}
            className="w-full flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs transition-colors hover:bg-[var(--surface-container-low)] text-left"
          >
            <span className="material-symbols-outlined text-sm" style={{ color: 'var(--on-surface-variant)' }}>
              {file === 'CLAUDE.md' ? 'description' : file === 'AGENTS.md' ? 'groups' : file === 'settings.json' ? 'hub' : 'chat'}
            </span>
            <span className="font-medium" style={{ color: 'var(--on-surface)' }}>{file}</span>
            <span className="material-symbols-outlined text-sm ml-auto" style={{ color: 'var(--outline)' }}>download</span>
          </button>
        ))}
      </div>

      {/* Install command */}
      <div className="space-y-2 pt-4" style={{ borderTop: '1px solid rgba(195,198,215,0.2)' }}>
        <div
          className="px-3 py-2 rounded-lg text-xs font-mono truncate flex items-center gap-2"
          style={{ background: 'var(--surface-container-high)', color: 'var(--on-surface)' }}
        >
          <span className="shrink-0" style={{ color: 'var(--on-surface-variant)' }}>$</span>
          <span className="truncate">curl -sL .../packs/{pack.id}/install.sh | bash</span>
        </div>
        <button
          onClick={handleCopy}
          className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-bold text-white transition-opacity hover:opacity-90"
          style={{ background: `linear-gradient(135deg, ${pack.color}, ${pack.color}cc)` }}
        >
          <span className="material-symbols-outlined text-sm">{copied ? 'check_circle' : 'content_copy'}</span>
          {copied ? t('packs.copied') : t('packs.copyInstall')}
        </button>
      </div>
    </div>
  );
}
