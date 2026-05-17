'use client';

import { useState, useEffect } from 'react';
import useSWR from 'swr';
import { getPacks, type ConfigPack, type PacksResponse } from '@/lib/api';
import { useI18n } from '@/lib/i18n';
import WallBoard from '@/components/wall-board';

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
  {
    id: 'strategy',
    icon: 'insights',
    labelKey: 'packs.q1Strategy',
    descKey: 'packs.q1StrategyDesc',
    options: [
      { labelKey: 'packs.q2Executive', packId: 'executive-strategist' },
    ],
  },
  {
    id: 'research',
    icon: 'science',
    labelKey: 'packs.q1Research',
    descKey: 'packs.q1ResearchDesc',
    options: [
      { labelKey: 'packs.q2ResearchAnalyst', packId: 'research-analyst' },
    ],
  },
  {
    id: 'scenario',
    icon: 'account_tree',
    labelKey: 'packs.q1Scenario',
    descKey: 'packs.q1ScenarioDesc',
    options: [
      { labelKey: 'packs.q2Scenario', packId: 'scenario-planner' },
    ],
  },
  {
    id: 'analyze',
    icon: 'monitoring',
    labelKey: 'packs.q1Analyze',
    descKey: 'packs.q1AnalyzeDesc',
    options: [
      { labelKey: 'packs.q2DataAnalyst', packId: 'data-analyst' },
    ],
  },
];

const LINE_TABS = [
  { id: 'all', labelKey: 'packs.tabAll' },
  { id: 'engineering', labelKey: 'packs.tabEngineering' },
  { id: 'data-ai', labelKey: 'packs.tabDataAI' },
  { id: 'product', labelKey: 'packs.tabProduct' },
  { id: 'business', labelKey: 'packs.tabBusiness' },
  { id: 'strategy', labelKey: 'packs.tabStrategy' },
  { id: 'research', labelKey: 'packs.tabResearch' },
  { id: 'analyze', labelKey: 'packs.tabAnalyze' },
];

export default function PacksPage() {
  const { t } = useI18n();
  const { data, isLoading } = useSWR<PacksResponse>('packs', getPacks);
  const allPacks = data?.packs || [];

  type PageTab = 'packs' | 'wall';
  type Step = 'q1' | 'q2' | 'result' | 'browse';
  const [pageTab, setPageTab] = useState<PageTab>('packs');
  const [step, setStep] = useState<Step>('q1');
  const [selectedLine, setSelectedLine] = useState<string | null>(null);
  const [recommendedPack, setRecommendedPack] = useState<string | null>(null);
  const [browseTab, setBrowseTab] = useState('all');

  // Hash-sync the top-level tab so /packs#wall opens directly on the stickwall.
  // Honors Maurice's "岗位配置包后面做单独的一个页签" — wall is a sibling tab, not a separate route.
  useEffect(() => {
    const apply = () => {
      const h = (typeof window !== 'undefined' ? window.location.hash : '').replace(/^#/, '');
      if (h === 'wall') setPageTab('wall');
      else if (h === 'packs') setPageTab('packs');
    };
    apply();
    window.addEventListener('hashchange', apply);
    return () => window.removeEventListener('hashchange', apply);
  }, []);

  const switchTab = (next: PageTab) => {
    setPageTab(next);
    if (typeof window !== 'undefined') {
      const newHash = `#${next}`;
      if (window.location.hash !== newHash) {
        history.replaceState(null, '', `${window.location.pathname}${window.location.search}${newHash}`);
      }
    }
  };

  return (
    <div className="page-shell py-12 space-y-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-center gap-8">
        <div className="flex items-center gap-4">
          <div className="w-2 h-12 rounded-full" style={{ background: 'var(--primary)' }} />
          <div>
            <h1 className="text-4xl md:text-5xl font-black tracking-tight text-balance" style={{ color: 'var(--on-surface)' }}>
              {t('packs.title')}
            </h1>
            <p className="text-sm font-bold uppercase tracking-widest opacity-40 mt-1 text-pretty">
              {t('packs.subtitle')}
            </p>
          </div>
        </div>
        
        {/* Value Prop Badges — counts derived from packs.json so they stay accurate */}
        <div className="flex gap-4 p-4 rounded-3xl bg-[var(--surface-container-low)] border border-[var(--outline-variant)]">
          <div className="px-4 py-2 text-center border-r border-[var(--outline-variant)] pr-6">
            <div className="text-2xl font-black" style={{ color: 'var(--primary)' }}>{allPacks.length || '—'}</div>
            <div className="text-[var(--af-fs-meta)] font-black uppercase tracking-widest opacity-40">Packs</div>
          </div>
          <div className="px-4 py-2 text-center border-r border-[var(--outline-variant)] pr-6">
            <div className="text-2xl font-black" style={{ color: 'var(--secondary)' }}>{new Set(allPacks.map(p => p.line).filter(Boolean)).size || '—'}</div>
            <div className="text-[var(--af-fs-meta)] font-black uppercase tracking-widest opacity-40">Lines</div>
          </div>
          <div className="px-4 py-2 text-center">
            <div className="text-2xl font-black" style={{ color: 'var(--tertiary)' }}>30s</div>
            <div className="text-[var(--af-fs-meta)] font-black uppercase tracking-widest opacity-40">Setup</div>
          </div>
        </div>
      </div>

      {/* Top-level tab bar — packs ⇄ stickwall. Two sibling tabs as per "岗位配置包后面做单独的一个页签". */}
      <div
        role="tablist"
        aria-label="页面页签"
        className="flex gap-2 p-2 rounded-2xl w-fit"
        style={{ background: 'var(--surface-container-low)', border: '1px solid var(--outline-variant)' }}
      >
        {([
          { id: 'packs' as const, label: '岗位配置包', icon: 'inventory_2' },
          { id: 'wall' as const, label: '卡点墙', icon: 'forum' },
        ]).map(tab => (
          <button
            key={tab.id}
            role="tab"
            aria-selected={pageTab === tab.id}
            onClick={() => switchTab(tab.id)}
            className="px-6 py-3 rounded-xl text-sm font-black tracking-tight transition-all flex items-center gap-2"
            style={{
              background: pageTab === tab.id ? 'var(--primary)' : 'transparent',
              color: pageTab === tab.id ? 'white' : 'var(--on-surface-variant)',
            }}
          >
            <span aria-hidden="true" className="material-symbols-outlined text-base">{tab.icon}</span>
            {tab.label}
          </button>
        ))}
      </div>

      {pageTab === 'wall' ? (
        // Stickwall tab — inline render of the shared WallBoard component.
        // /wall route still exists for direct links + sharing; this is the embedded mount.
        <section className="space-y-6">
          <div>
            <h2 className="text-2xl md:text-3xl font-black tracking-tight text-balance">配置包装上之后，工作流卡在哪里？</h2>
            <p className="text-sm md:text-base leading-relaxed opacity-70 mt-2 max-w-3xl">
              匿名写下你的 Before（卡在哪）/ After（试过的方法）/ 想问的，别人可以评论。同一浏览器认得自己——
              下载岗位包之后真实工作流的卡点，是我们更新方法论的唯一一手来源。
            </p>
          </div>
          <WallBoard />
        </section>
      ) : (
        <PacksTabBody
          t={t}
          allPacks={allPacks}
          isLoading={isLoading}
          step={step}
          setStep={setStep}
          selectedLine={selectedLine}
          setSelectedLine={setSelectedLine}
          recommendedPack={recommendedPack}
          setRecommendedPack={setRecommendedPack}
          browseTab={browseTab}
          setBrowseTab={setBrowseTab}
        />
      )}
    </div>
  );
}

interface PacksTabBodyProps {
  t: (key: string) => string;
  allPacks: ConfigPack[];
  isLoading: boolean;
  step: 'q1' | 'q2' | 'result' | 'browse';
  setStep: (s: 'q1' | 'q2' | 'result' | 'browse') => void;
  selectedLine: string | null;
  setSelectedLine: (s: string | null) => void;
  recommendedPack: string | null;
  setRecommendedPack: (s: string | null) => void;
  browseTab: string;
  setBrowseTab: (s: string) => void;
}

function PacksTabBody({
  t,
  allPacks,
  isLoading,
  step,
  setStep,
  selectedLine,
  setSelectedLine,
  recommendedPack,
  setRecommendedPack,
  browseTab,
  setBrowseTab,
}: PacksTabBodyProps) {
  const filteredPacks = browseTab === 'all' ? allPacks : allPacks.filter(p => p.line === browseTab);
  const recommended = allPacks.find(p => p.id === recommendedPack);

  const handleQ1 = (lineId: string) => {
    setSelectedLine(lineId);
    const lineOptions = QUESTION_TREE.find(q => q.id === lineId)?.options || [];
    if (lineOptions.length === 1) {
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
    <div className="space-y-12">
      {/* Hero Section */}
      <div
        className="p-10 rounded-[3rem] flex flex-col md:flex-row items-center gap-10 relative overflow-hidden group"
        style={{ background: 'var(--surface-container-lowest)', border: '2px solid var(--outline-variant)' }}
      >
        <div className="absolute -top-24 -right-24 w-64 h-64 bg-[var(--primary)] opacity-[0.03] rounded-full blur-3xl transition-all group-hover:scale-150" />
        <div className="flex-1 space-y-4">
          <h2 className="text-2xl font-black tracking-tight text-balance" style={{ color: 'var(--on-surface)' }}>
            {t('packs.hero')}
          </h2>
          <p className="text-lg font-medium opacity-70 leading-relaxed max-w-3xl text-pretty">
            {t('packs.heroDesc')}
          </p>
        </div>
      </div>

      {/* Decision Engine */}
      {step !== 'browse' && (
        <section
          className="p-10 rounded-[3rem] space-y-10 relative"
          style={{ background: 'var(--surface-container-low)', border: '1px solid var(--outline-variant)' }}
        >
          {step === 'q1' && (
            <div className="space-y-8">
              <h2 className="text-2xl font-black text-center tracking-tight text-balance" style={{ color: 'var(--on-surface)' }}>
                {t('packs.questionMain')}
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {QUESTION_TREE.map(q => (
                  <button
                    key={q.id}
                    onClick={() => handleQ1(q.id)}
                    className="p-8 rounded-[2.5rem] text-center space-y-4 transition-all hover:shadow-2xl hover:-translate-y-1.5 active:scale-95 border-2 bg-[var(--surface-container-lowest)]"
                    style={{ borderColor: 'var(--outline-variant)' }}
                  >
                    <div className="w-16 h-16 rounded-3xl mx-auto flex items-center justify-center shadow-lg" style={{ background: 'var(--surface-container)', color: 'var(--primary)' }}>
                      <span aria-hidden="true" className="material-symbols-outlined text-3xl font-black">{q.icon}</span>
                    </div>
                    <div className="font-black text-lg tracking-tight" style={{ color: 'var(--on-surface)' }}>{t(q.labelKey)}</div>
                    <div className="text-xs font-bold opacity-40 uppercase tracking-widest leading-relaxed">{t(q.descKey)}</div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {step === 'q2' && selectedLine && (
            <div className="space-y-8">
              <div className="flex items-center gap-4">
                <button aria-label="Go back" onClick={resetTree} className="w-12 h-12 rounded-2xl flex items-center justify-center transition-all hover:bg-black/5">
                  <span aria-hidden="true" className="material-symbols-outlined font-black">arrow_back</span>
                </button>
                <h2 className="text-2xl font-black tracking-tight text-balance">{t('packs.questionSub')}</h2>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {QUESTION_TREE.find(q => q.id === selectedLine)?.options.map(opt => (
                  <button
                    key={opt.packId}
                    onClick={() => handleQ2(opt.packId)}
                    className="p-10 rounded-[2.5rem] text-center transition-all hover:shadow-2xl hover:-translate-y-1.5 active:scale-95 border-2 bg-[var(--surface-container-lowest)]"
                    style={{ borderColor: 'var(--outline-variant)' }}
                  >
                    <div className="font-black text-xl tracking-tight" style={{ color: 'var(--on-surface)' }}>{t(opt.labelKey)}</div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {step === 'result' && recommended && (
            <div className="space-y-8">
              <div className="flex items-center gap-4">
                <button aria-label="Go back" onClick={resetTree} className="w-12 h-12 rounded-2xl flex items-center justify-center transition-all hover:bg-black/5">
                  <span aria-hidden="true" className="material-symbols-outlined font-black">arrow_back</span>
                </button>
                <h2 className="text-2xl font-black tracking-tight text-balance">{t('packs.recommendation')}</h2>
              </div>
              <div className="max-w-xl mx-auto">
                <PackCard pack={recommended} featured />
              </div>
            </div>
          )}

          <div className="text-center pt-4">
            <button
              onClick={() => setStep('browse')}
              className="text-[var(--af-fs-meta)] font-black uppercase tracking-[0.3em] opacity-40 hover:opacity-100 hover:text-[var(--primary)] transition-all"
            >
              {t('packs.browseAll')} ({allPacks.length})
            </button>
          </div>
        </section>
      )}

      {/* Browsing Section */}
      {step === 'browse' && (
        <section className="space-y-10">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-6 pb-6 border-b border-[var(--outline-variant)]">
            <h2 className="text-3xl font-black tracking-tight text-balance">{t('packs.allPacks')}</h2>
            <button
              onClick={resetTree}
              className="flex items-center gap-2 px-6 py-2.5 rounded-full text-xs font-black uppercase tracking-widest transition-all hover:bg-[var(--surface-container-low)]"
              style={{ color: 'var(--primary)' }}
            >
              <span aria-hidden="true" className="material-symbols-outlined text-sm font-black">arrow_back</span>
              {t('packs.backToGuide')}
            </button>
          </div>

          <div className="flex gap-2 overflow-x-auto pb-4 no-scrollbar">
            {LINE_TABS.map(tab => (
              <button
                key={tab.id}
                onClick={() => setBrowseTab(tab.id)}
                className="px-6 py-2.5 rounded-full text-xs font-black uppercase tracking-widest whitespace-nowrap transition-all shadow-sm"
                style={{
                  background: browseTab === tab.id ? 'var(--primary)' : 'var(--surface-container-low)',
                  color: browseTab === tab.id ? 'white' : 'var(--on-surface-variant)',
                  border: browseTab === tab.id ? 'none' : '1px solid var(--outline-variant)',
                }}
              >
                {t(tab.labelKey)}
              </button>
            ))}
          </div>

          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {[1, 2, 3].map(i => <div key={i} className="h-96 rounded-[3rem] animate-pulse bg-[var(--surface-container-low)]" />)}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {filteredPacks.map(pack => (
                <PackCard key={pack.id} pack={pack} />
              ))}
            </div>
          )}
        </section>
      )}

      {/* Process Section */}
      <section className="space-y-12 py-12">
        <h2 className="text-3xl font-black text-center tracking-tight text-balance">{t('packs.howItWorks')}</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
          {[
            { step: '1', titleKey: 'packs.step1', descKey: 'packs.step1Desc', icon: 'ads_click' },
            { step: '2', titleKey: 'packs.step2', descKey: 'packs.step2Desc', icon: 'tune' },
            { step: '3', titleKey: 'packs.step3', descKey: 'packs.step3Desc', icon: 'rocket_launch' },
          ].map(s => (
            <div key={s.step} className="text-center space-y-6 group">
              <div
                className="w-20 h-20 rounded-[2rem] mx-auto flex items-center justify-center text-white shadow-xl transition-all group-hover:scale-110 group-hover:rotate-3"
                style={{ background: 'var(--primary)' }}
              >
                <span aria-hidden="true" className="material-symbols-outlined text-3xl font-black">{s.icon}</span>
              </div>
              <div className="space-y-2">
                <h3 className="font-black text-xl tracking-tight text-balance">{t(s.titleKey)}</h3>
                <p className="text-sm font-medium opacity-60 leading-relaxed max-w-xs mx-auto text-pretty">{t(s.descKey)}</p>
              </div>
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
      className={`rounded-[2.5rem] p-8 flex flex-col transition-all hover:shadow-2xl hover:-translate-y-1 ${featured ? 'ring-4 ring-[var(--primary)] ring-offset-4' : ''}`}
      style={{
        background: 'var(--surface-container-lowest)',
        border: '1px solid var(--outline-variant)',
        borderTop: `8px solid ${pack.color}`,
      }}
    >
      <div className="flex items-center gap-4 mb-6">
        <div
          className="w-14 h-14 rounded-2xl flex items-center justify-center shadow-lg shrink-0"
          style={{ background: `${pack.color}15`, color: pack.color }}
        >
          <span aria-hidden="true" className="material-symbols-outlined text-3xl font-black">{pack.icon}</span>
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <h3 className="font-black text-xl tracking-tight truncate text-balance">
              {pack.nameZh}
            </h3>
            <TierBadge tier={pack.tier} />
          </div>
          <div className="flex items-center gap-2 mt-1">
            <span className="text-[var(--af-fs-meta)] font-black uppercase tracking-widest opacity-40 truncate">{pack.name}</span>
            <span
              className="px-2 py-0.5 rounded-lg text-[var(--af-fs-micro)] font-black uppercase tracking-widest"
              style={{ background: `${pack.color}15`, color: pack.color }}
            >
              {pack.lineZh}
            </span>
          </div>
        </div>
      </div>

      <p className="text-sm font-medium leading-relaxed mb-6 flex-1 opacity-70 text-pretty">
        {pack.descriptionZh}
      </p>

      {/* Layer inheritance badge */}
      <div className="flex gap-1.5 mb-6 flex-wrap">
        {pack.layerIds.map((lid, i) => (
          <span
            key={lid}
            className="px-3 py-1 rounded-full text-[var(--af-fs-micro)] font-black uppercase tracking-widest border"
            style={{
              background: i === 0 ? 'var(--surface-container-low)' : i === 1 ? 'var(--surface-container)' : 'var(--surface-container-high)',
              borderColor: 'var(--outline-variant)',
              color: 'var(--on-surface-variant)',
            }}
          >
            {lid === 'universal' ? 'L0 Core' : lid.startsWith('line-') ? `L1 ${lid.replace('line-', '')}` : `L2 ${lid.replace('role-', '')}`}
          </span>
        ))}
      </div>

      {/* Bundled artifacts (skills + advisors + references) — only when pack ships them */}
      {pack.artifacts && (pack.artifacts.skills + pack.artifacts.agents + pack.artifacts.references) > 0 && (
        <div
          className="mb-6 p-4 rounded-2xl border-2 border-dashed"
          style={{ borderColor: `${pack.color}40`, background: `${pack.color}08` }}
        >
          <div className="flex items-center justify-between mb-3">
            <span className="text-[var(--af-fs-meta)] font-black uppercase tracking-widest opacity-60">
              本包附带 · BUNDLED
            </span>
            {pack.design_augmented && (
              <span
                className="px-2 py-0.5 rounded-full text-[var(--af-fs-micro)] font-black uppercase tracking-widest"
                style={{ background: `${pack.color}20`, color: pack.color }}
              >
                Design Aug
              </span>
            )}
          </div>
          <div className="flex gap-5 flex-wrap text-sm">
            {pack.artifacts.skills > 0 && (
              <div className="flex items-center gap-1.5">
                <span aria-hidden="true" className="material-symbols-outlined text-base" style={{ color: pack.color }}>extension</span>
                <span className="font-black" style={{ color: pack.color }}>+{pack.artifacts.skills}</span>
                <span className="font-bold opacity-60 uppercase tracking-widest text-[var(--af-fs-micro)]">skill</span>
              </div>
            )}
            {pack.artifacts.agents > 0 && (
              <div className="flex items-center gap-1.5">
                <span aria-hidden="true" className="material-symbols-outlined text-base" style={{ color: pack.color }}>groups</span>
                <span className="font-black" style={{ color: pack.color }}>+{pack.artifacts.agents}</span>
                <span className="font-bold opacity-60 uppercase tracking-widest text-[var(--af-fs-micro)]">advisor</span>
              </div>
            )}
            {pack.artifacts.references > 0 && (
              <div className="flex items-center gap-1.5">
                <span aria-hidden="true" className="material-symbols-outlined text-base" style={{ color: pack.color }}>menu_book</span>
                <span className="font-black" style={{ color: pack.color }}>+{pack.artifacts.references}</span>
                <span className="font-bold opacity-60 uppercase tracking-widest text-[var(--af-fs-micro)]">reference</span>
              </div>
            )}
          </div>
          <p className="text-[var(--af-fs-micro)] mt-3 opacity-50 leading-relaxed">
            install.sh 通过 manifest.json 自动拉取全部资源到 ~/.claude/{'{'}skills,agents{'}'}/
          </p>
        </div>
      )}

      {/* Pack files */}
      <div className="grid grid-cols-2 gap-2 mb-8">
        {['CLAUDE.md', 'AGENTS.md', 'settings.json', 'prompts.md'].map(file => (
          <button
            key={file}
            onClick={() => handleDownload(file)}
            className="flex flex-col items-center gap-2 p-4 rounded-2xl border border-[var(--outline-variant)] transition-all hover:bg-[var(--surface-container-low)] hover:shadow-md group text-center"
          >
              <span aria-hidden="true" className="material-symbols-outlined text-lg opacity-40 group-hover:opacity-100 group-hover:scale-110 transition-all">
              {file === 'CLAUDE.md' ? 'description' : file === 'AGENTS.md' ? 'groups' : file === 'settings.json' ? 'hub' : 'chat'}
            </span>
            <span className="text-[var(--af-fs-micro)] font-black uppercase tracking-widest opacity-60 group-hover:opacity-100 truncate w-full">{file}</span>
          </button>
        ))}
      </div>

      {/* Install command */}
      <div className="space-y-4 pt-6 border-t border-dashed border-[var(--outline-variant)]">
        <button
          onClick={handleCopy}
          className="w-full flex items-center justify-center gap-3 py-4 rounded-2xl font-black uppercase tracking-[0.2em] text-[var(--af-fs-meta)] text-white transition-all hover:shadow-2xl active:scale-95 shadow-lg"
          style={{ background: pack.color }}
        >
          <span aria-hidden="true" className="material-symbols-outlined text-base font-black">{copied ? 'done_all' : 'content_copy'}</span>
          {copied ? t('packs.copied') : t('packs.copyInstall')}
        </button>
        <a
          href={`/packs/${pack.id}/guide.html`}
          target="_blank"
          rel="noopener noreferrer"
          className="w-full flex items-center justify-center gap-2 py-2.5 rounded-2xl text-[var(--af-fs-meta)] font-black uppercase tracking-widest border transition-all hover:bg-[var(--surface-container-low)]"
          style={{ borderColor: 'var(--outline-variant)', color: 'var(--on-surface-variant)' }}
        >
          <span aria-hidden="true" className="material-symbols-outlined text-base">menu_book</span>
          指导手册
        </a>
        <p className="text-[var(--af-fs-micro)] font-black uppercase tracking-widest text-center opacity-30 text-pretty">One-line terminal setup</p>
      </div>
    </div>
  );
}

function TierBadge({ tier }: { tier?: 'stub' | 'enriched' | 'certified' }) {
  if (!tier || tier === 'stub') return null;
  const isCertified = tier === 'certified';
  const bg = isCertified ? '#fbbf24' : '#3b82f6';
  const fg = isCertified ? '#78350f' : '#1e3a8a';
  const label = isCertified ? '已验证' : '已富化';
  const titleText = isCertified ? 'Certified — 通过 PACK_SPEC v1.0 四支柱 + 生产 install.sh E2E 验证' : 'Enriched — 申明 spec_version 1.0 且声明 first_use_demo';
  return (
    <span
      title={titleText}
      className="shrink-0 px-2 py-0.5 rounded-full text-[var(--af-fs-micro)] font-black uppercase tracking-widest"
      style={{ background: bg, color: fg }}
    >
      {label}
    </span>
  );
}
