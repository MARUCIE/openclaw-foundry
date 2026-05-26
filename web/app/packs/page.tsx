'use client';

import { useState, useEffect } from 'react';
import useSWR from 'swr';
import { getPacks, type ConfigPack, type PacksResponse } from '@/lib/api';
import { useI18n } from '@/lib/i18n';
import { readSession, loginRedirect, type SessionUser } from '@/lib/session';
import { copyProtectedPackInstallCommand, downloadProtectedPackFile } from '@/lib/protected-downloads';
import WallBoard from '@/components/wall-board';

type QuestionOption = { labelKey?: string; packId: string };
type QuestionTreeItem = {
  id: string;
  browseTabId: string;
  icon: string;
  labelKey: string;
  descKey: string;
  options: QuestionOption[];
  includeLinePacks?: boolean;
};

// Question tree answers map to lines + sub-options
const QUESTION_TREE: QuestionTreeItem[] = [
  {
    id: 'code',
    browseTabId: 'engineering',
    icon: 'code',
    labelKey: 'packs.q1Code',
    descKey: 'packs.q1CodeDesc',
    includeLinePacks: true,
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
    browseTabId: 'data-ai',
    icon: 'analytics',
    labelKey: 'packs.q1Data',
    descKey: 'packs.q1DataDesc',
    includeLinePacks: true,
    options: [
      { labelKey: 'packs.q2Algorithm', packId: 'algorithm-engineer' },
      { labelKey: 'packs.q2Bigdata', packId: 'bigdata-engineer' },
      { labelKey: 'packs.q2DataAnalyst', packId: 'data-analyst' },
      { labelKey: 'packs.q2AbTestAnalyst', packId: 'ab-test-analyst' },
    ],
  },
  {
    id: 'product',
    browseTabId: 'product',
    icon: 'lightbulb',
    labelKey: 'packs.q1Product',
    descKey: 'packs.q1ProductDesc',
    includeLinePacks: true,
    options: [
      { labelKey: 'packs.q2PM', packId: 'product-manager' },
      { labelKey: 'packs.q2Designer', packId: 'designer' },
    ],
  },
  {
    id: 'business',
    browseTabId: 'business',
    icon: 'verified_user',
    labelKey: 'packs.q1Business',
    descKey: 'packs.q1BusinessDesc',
    includeLinePacks: true,
    options: [
      { labelKey: 'packs.q2Compliance', packId: 'compliance-expert' },
    ],
  },
  {
    id: 'strategy',
    browseTabId: 'strategy',
    icon: 'insights',
    labelKey: 'packs.q1Strategy',
    descKey: 'packs.q1StrategyDesc',
    includeLinePacks: true,
    options: [
      { labelKey: 'packs.q2StrategyRoundtable', packId: 'strategy-roundtable-advisor' },
      { labelKey: 'packs.q2Executive', packId: 'executive-strategist' },
    ],
  },
  {
    id: 'research',
    browseTabId: 'research',
    icon: 'science',
    labelKey: 'packs.q1Research',
    descKey: 'packs.q1ResearchDesc',
    includeLinePacks: true,
    options: [
      { labelKey: 'packs.q2ResearchAnalyst', packId: 'research-analyst' },
    ],
  },
  {
    id: 'scenario',
    browseTabId: 'product',
    icon: 'account_tree',
    labelKey: 'packs.q1Scenario',
    descKey: 'packs.q1ScenarioDesc',
    options: [
      { labelKey: 'packs.q2Scenario', packId: 'scenario-planner' },
    ],
  },
];

const isReleasedPack = (pack?: ConfigPack | null) => Boolean(pack && pack.tier !== 'stub');
const STANDALONE_QUESTION_PACK_IDS = new Set(['scenario-planner']);

function packSortScore(pack: ConfigPack): number {
  if (pack.tier === 'certified') return 0;
  if (pack.tier === 'enriched') return 1;
  return 2;
}

function sortPacksForDisplay(packs: ConfigPack[]): ConfigPack[] {
  return [...packs].sort((a, b) => {
    const tierDelta = packSortScore(a) - packSortScore(b);
    if (tierDelta !== 0) return tierDelta;
    return (a.nameZh || a.name).localeCompare(b.nameZh || b.name, 'zh-Hans-CN');
  });
}

const LINE_TABS = [
  { id: 'all', labelKey: 'packs.tabAll' },
  { id: 'engineering', labelKey: 'packs.tabEngineering' },
  { id: 'data-ai', labelKey: 'packs.tabDataAI' },
  { id: 'product', labelKey: 'packs.tabProduct' },
  { id: 'business', labelKey: 'packs.tabBusiness' },
  { id: 'strategy', labelKey: 'packs.tabStrategy' },
  { id: 'research', labelKey: 'packs.tabResearch' },
];

export default function PacksPage() {
  const { t } = useI18n();
  const { data, isLoading } = useSWR<PacksResponse>('packs', getPacks);
  const allPacks = data?.packs || [];
  const releasedPacks = allPacks.filter(isReleasedPack);

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
  const lineFiltered = browseTab === 'all' ? allPacks : allPacks.filter(p => p.line === browseTab);
  const filteredPacks = sortPacksForDisplay(lineFiltered);
  const stubCount = lineFiltered.filter(p => !isReleasedPack(p)).length;
  const releasedPackCount = allPacks.filter(isReleasedPack).length;
  const totalPackCount = allPacks.length;
  const packsById = new Map(allPacks.map(p => [p.id, p]));
  const releasedPackIds = new Set(allPacks.filter(isReleasedPack).map(p => p.id));
  const buildQuestionOptions = (q: QuestionTreeItem) => {
    const explicitOptions = q.options.filter(opt => packsById.has(opt.packId));
    const explicitIds = new Set(explicitOptions.map(opt => opt.packId));
    if (!q.includeLinePacks) return explicitOptions;
    const lineOptions: QuestionOption[] = sortPacksForDisplay(allPacks)
      .filter(p => p.line === q.browseTabId)
      .filter(p => !explicitIds.has(p.id))
      .filter(p => q.id === 'scenario' || !STANDALONE_QUESTION_PACK_IDS.has(p.id))
      .map(p => ({ packId: p.id }));
    return [...explicitOptions, ...lineOptions];
  };
  const questionTree = QUESTION_TREE.map(q => {
    const options = buildQuestionOptions(q);
    const availableOptions = options.filter(opt => releasedPackIds.has(opt.packId));
    return {
      ...q,
      options,
      availableOptions,
      hasAnyPack: options.length > 0,
      hasReleasedPack: availableOptions.length > 0,
    };
  });
  const selectedQuestion = questionTree.find(q => q.id === selectedLine);
  const recommendedCandidate = allPacks.find(p => p.id === recommendedPack);
  const recommended = isReleasedPack(recommendedCandidate) ? recommendedCandidate : null;
  const hasUnavailableRecommendation = step === 'result' && Boolean(recommendedPack) && !recommended;

  const handleQ1 = (lineId: string) => {
    const line = questionTree.find(q => q.id === lineId);
    if (!line?.hasAnyPack) {
      setSelectedLine(lineId);
      setBrowseTab(line?.browseTabId || 'all');
      setStep('browse');
      return;
    }
    setSelectedLine(lineId);
    const lineOptions = line.availableOptions;
    if (line.options.length === 1 && lineOptions.length === 1) {
      setRecommendedPack(lineOptions[0].packId);
      setStep('result');
    } else {
      setStep('q2');
    }
  };

  const handleQ2 = (packId: string) => {
    if (!releasedPackIds.has(packId)) return;
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
                {questionTree.map(q => {
                  const isUnavailable = !q.hasAnyPack;
                  return (
                    <button
                      key={q.id}
                      disabled={isUnavailable}
                      aria-disabled={isUnavailable}
                      onClick={() => handleQ1(q.id)}
                      className={`p-8 rounded-[2.5rem] text-center space-y-4 transition-all border-2 bg-[var(--surface-container-lowest)] ${
                        isUnavailable
                          ? 'cursor-not-allowed opacity-55'
                          : 'hover:shadow-2xl hover:-translate-y-1.5 active:scale-95'
                      }`}
                      style={{ borderColor: 'var(--outline-variant)' }}
                    >
                      <div className="w-16 h-16 rounded-3xl mx-auto flex items-center justify-center shadow-lg" style={{ background: 'var(--surface-container)', color: 'var(--primary)' }}>
                        <span aria-hidden="true" className="material-symbols-outlined text-3xl font-black">{q.icon}</span>
                      </div>
                      <div className="font-black text-lg tracking-tight" style={{ color: 'var(--on-surface)' }}>{t(q.labelKey)}</div>
                      <div className="text-xs font-bold opacity-40 uppercase tracking-widest leading-relaxed">{t(q.descKey)}</div>
                      {isUnavailable && (
                        <div className="inline-flex px-3 py-1 rounded-full text-[var(--af-fs-micro)] font-black uppercase tracking-widest bg-[var(--surface-container)] text-[var(--on-surface-variant)]">
                          {t('packs.directionComingSoon')}
                        </div>
                      )}
                    </button>
                  );
                })}
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
                {selectedQuestion?.options.map(opt => {
                  const pack = packsById.get(opt.packId);
                  const isUnavailable = !releasedPackIds.has(opt.packId);
                  const label = opt.labelKey ? t(opt.labelKey) : pack?.nameZh || pack?.name || opt.packId;
                  return (
                    <button
                      key={opt.packId}
                      disabled={isUnavailable}
                      aria-disabled={isUnavailable}
                      onClick={() => handleQ2(opt.packId)}
                      className={`p-10 rounded-[2.5rem] text-center transition-all border-2 bg-[var(--surface-container-lowest)] ${
                        isUnavailable
                          ? 'cursor-not-allowed opacity-55'
                          : 'hover:shadow-2xl hover:-translate-y-1.5 active:scale-95'
                      }`}
                      style={{ borderColor: 'var(--outline-variant)' }}
                    >
                      <div className="font-black text-xl tracking-tight" style={{ color: 'var(--on-surface)' }}>{label}</div>
                      {pack?.descriptionZh && (
                        <p className="mt-3 text-xs font-bold opacity-50 leading-relaxed text-pretty">{pack.descriptionZh}</p>
                      )}
                      {isUnavailable && (
                        <div className="mt-3 inline-flex px-3 py-1 rounded-full text-[var(--af-fs-micro)] font-black uppercase tracking-widest bg-[var(--surface-container)] text-[var(--on-surface-variant)]">
                          {t('packs.directionComingSoon')}
                        </div>
                      )}
                    </button>
                  );
                })}
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

          {hasUnavailableRecommendation && (
            <div className="space-y-8">
              <div className="flex items-center gap-4">
                <button aria-label="Go back" onClick={resetTree} className="w-12 h-12 rounded-2xl flex items-center justify-center transition-all hover:bg-black/5">
                  <span aria-hidden="true" className="material-symbols-outlined font-black">arrow_back</span>
                </button>
                <h2 className="text-2xl font-black tracking-tight text-balance">{t('packs.unavailableRecommendation')}</h2>
              </div>
              <div
                className="max-w-xl mx-auto p-10 rounded-[2.5rem] text-center space-y-5"
                style={{ background: 'var(--surface-container-lowest)', border: '1px solid var(--outline-variant)' }}
                role="note"
              >
                <div className="w-16 h-16 rounded-3xl mx-auto flex items-center justify-center shadow-lg" style={{ background: 'var(--surface-container)', color: 'var(--primary)' }}>
                  <span aria-hidden="true" className="material-symbols-outlined text-3xl font-black">pending_actions</span>
                </div>
                <p className="text-sm font-bold leading-relaxed opacity-60">{t('packs.noReleasedOptions')}</p>
                <button
                  onClick={() => {
                    setBrowseTab('all');
                    setStep('browse');
                  }}
                  className="px-6 py-3 rounded-full text-xs font-black uppercase tracking-widest text-white transition-all hover:shadow-lg"
                  style={{ background: 'var(--primary)' }}
                >
                  {t('packs.viewReleasedPacks')}
                </button>
              </div>
            </div>
          )}

          <div className="text-center pt-4">
            <button
              onClick={() => setStep('browse')}
              className="text-[var(--af-fs-meta)] font-black uppercase tracking-[0.3em] opacity-40 hover:opacity-100 hover:text-[var(--primary)] transition-all"
            >
              {t('packs.browseAll')} ({totalPackCount || '—'})
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
            <>
              {filteredPacks.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                  {filteredPacks.map(pack => (
                    <PackCard key={pack.id} pack={pack} />
                  ))}
                </div>
              ) : (
                <div
                  className="rounded-[2.5rem] p-10 text-center space-y-4"
                  style={{ background: 'var(--surface-container-lowest)', border: '1px solid var(--outline-variant)' }}
                  role="note"
                >
                  <span aria-hidden="true" className="material-symbols-outlined text-4xl font-black" style={{ color: 'var(--primary)' }}>pending_actions</span>
                  <p className="text-sm font-bold leading-relaxed opacity-60">{t('packs.noReleasedOptions')}</p>
                </div>
              )}
              {stubCount > 0 && (
                <p className="mt-8 text-center text-sm text-[var(--on-surface-variant)] opacity-70" role="note">
                  {t('packs.upcomingNotice')
                    .replace('{count}', String(stubCount))
                    .replace('{released}', String(releasedPackCount))
                    .replace('{total}', String(totalPackCount))}
                </p>
              )}
            </>
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
  const [busyFile, setBusyFile] = useState('');
  const [actionError, setActionError] = useState('');
  const released = isReleasedPack(pack);
  // Browse stays public; install/download requires login (v6 auth gate).
  // Reads session on mount + listens for cross-tab login/logout so the
  // install button label updates without page reload.
  const [user, setUser] = useState<SessionUser | null>(null);
  const [authReady, setAuthReady] = useState(false);
  useEffect(() => {
    setUser(readSession().user);
    setAuthReady(true);
    const onStorage = (e: StorageEvent) => {
      if (e.key === 'openclaw_session_token' || e.key === 'openclaw_session_user') {
        setUser(readSession().user);
      }
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, []);
  const isLoggedIn = authReady && user !== null;

  const handleDownload = async (filename: string) => {
    setActionError('');
    if (!released) return;
    if (!isLoggedIn) {
      window.location.assign(loginRedirect(`/packs#install-${pack.id}`));
      return;
    }
    setBusyFile(filename);
    try {
      await downloadProtectedPackFile(pack.id, filename, `/packs#install-${pack.id}`);
    } catch (err) {
      setActionError(err instanceof Error ? err.message : '下载失败，请稍后重试');
    } finally {
      setBusyFile('');
    }
  };

  const handleCopy = async () => {
    setActionError('');
    if (!released) return;
    if (!isLoggedIn) {
      window.location.assign(loginRedirect(`/packs#install-${pack.id}`));
      return;
    }
    try {
      await copyProtectedPackInstallCommand(pack.id, `/packs#install-${pack.id}`);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      setActionError(err instanceof Error ? err.message : '复制失败，请稍后重试');
    }
  };

  return (
    <article
      className={`rounded-[1.75rem] p-7 flex flex-col transition-all hover:shadow-2xl hover:-translate-y-1 ${featured ? 'ring-4 ring-[var(--primary)] ring-offset-4' : ''}`}
      style={{
        background: 'var(--surface-container-lowest)',
        border: released ? '1px solid var(--outline-variant)' : '1px dashed var(--outline-variant)',
        boxShadow: `inset 0 6px 0 ${released ? pack.color : 'var(--outline-variant)'}`,
        opacity: released ? 1 : 0.72,
      }}
    >
      <div className="flex items-start gap-4 mb-6">
        <div
          className="w-14 h-14 rounded-xl flex items-center justify-center shadow-sm shrink-0"
          style={{ background: `${pack.color}15`, color: pack.color }}
        >
          <span aria-hidden="true" className="material-symbols-outlined text-3xl font-black">{pack.icon}</span>
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-start gap-2">
            <h3 className="font-black text-xl tracking-tight leading-tight text-balance min-w-0">
              {pack.nameZh}
            </h3>
            <TierBadge tier={pack.tier} />
          </div>
          <div className="flex items-center gap-2 mt-2 flex-wrap">
            <span className="text-[var(--af-fs-meta)] font-black uppercase tracking-widest opacity-45 break-words">{pack.name}</span>
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
      {!released && (
        <div
          className="mb-6 rounded-2xl px-4 py-3 text-xs font-bold leading-relaxed"
          style={{ background: 'var(--surface-container-low)', color: 'var(--on-surface-variant)' }}
          role="note"
        >
          {t('packs.pendingPackNotice')}
        </div>
      )}

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
        <div className="mb-6 py-4 border-y border-dashed border-[var(--outline-variant)]">
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
            GitHub tag 安装脚本通过 manifest.json 拉取全部资源，避免依赖本机路径。
          </p>
        </div>
      )}

      {/* Pack files */}
      <div className="grid grid-cols-2 gap-2 mb-8">
        {['CLAUDE.md', 'AGENTS.md', 'settings.json', 'prompts.md'].map(file => (
          <button
            key={file}
            onClick={() => handleDownload(file)}
            disabled={!released || busyFile === file}
            className={`flex flex-col items-center gap-2 p-4 rounded-xl border border-[var(--outline-variant)] transition-all group text-center ${
              released ? 'hover:bg-[var(--surface-container-low)] hover:shadow-md' : 'cursor-not-allowed'
            }`}
          >
              <span aria-hidden="true" className="material-symbols-outlined text-lg opacity-40 group-hover:opacity-100 group-hover:scale-110 transition-all">
              {!released ? 'lock' : busyFile === file ? 'hourglass_empty' : file === 'CLAUDE.md' ? 'description' : file === 'AGENTS.md' ? 'groups' : file === 'settings.json' ? 'hub' : 'chat'}
            </span>
            <span className="text-[var(--af-fs-micro)] font-black uppercase tracking-widest opacity-60 group-hover:opacity-100 truncate w-full">{file}</span>
          </button>
        ))}
      </div>

      {/* Install command — auth-gated (browse public, install login-required) */}
      <div id={`install-${pack.id}`} className="space-y-4 pt-6 border-t border-dashed border-[var(--outline-variant)]">
        <button
          onClick={handleCopy}
          disabled={!released}
          aria-label={!released ? '配置包验证中' : isLoggedIn ? '复制一键安装命令' : '登录后获取安装命令'}
          className="w-full flex items-center justify-center gap-3 py-4 rounded-xl font-black uppercase tracking-[0.18em] text-[var(--af-fs-meta)] text-white transition-all hover:shadow-2xl active:scale-95 shadow-lg"
          style={{ background: released ? pack.color : 'var(--outline)', opacity: released && authReady ? 1 : 0.6 }}
        >
          <span aria-hidden="true" className="material-symbols-outlined text-base font-black">
            {!released ? 'pending_actions' : !authReady ? 'hourglass_empty' : !isLoggedIn ? 'lock' : copied ? 'done_all' : 'content_copy'}
          </span>
          {!released ? t('packs.directionComingSoon') : !authReady ? '...' : !isLoggedIn ? '登录后获取安装命令' : copied ? t('packs.copied') : t('packs.copyInstall')}
        </button>
        {actionError && (
          <p className="text-xs font-bold text-center leading-relaxed" style={{ color: 'var(--error)' }}>
            {actionError}
          </p>
        )}
        {released ? (
          <a
            href={`/packs/${pack.id}/guide.html`}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-[var(--af-fs-meta)] font-black uppercase tracking-widest border transition-all hover:bg-[var(--surface-container-low)]"
            style={{ borderColor: 'var(--outline-variant)', color: 'var(--on-surface-variant)' }}
          >
            <span aria-hidden="true" className="material-symbols-outlined text-base">menu_book</span>
            指导手册
          </a>
        ) : (
          <div
            className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-[var(--af-fs-meta)] font-black uppercase tracking-widest border cursor-not-allowed opacity-60"
            style={{ borderColor: 'var(--outline-variant)', color: 'var(--on-surface-variant)' }}
            aria-disabled="true"
          >
            <span aria-hidden="true" className="material-symbols-outlined text-base">lock</span>
            指导手册
          </div>
        )}
        <p className="text-[var(--af-fs-micro)] font-black uppercase tracking-widest text-center opacity-30 text-pretty">One-line terminal setup</p>
      </div>
    </article>
  );
}

function TierBadge({ tier }: { tier?: 'stub' | 'enriched' | 'certified' }) {
  const { t } = useI18n();
  if (!tier) return null;
  if (tier === 'stub') {
    return (
      <span
        title="Pending — 配置包已入目录，仍在验证中，暂不开放安装"
        className="shrink-0 px-2 py-0.5 rounded-full text-[var(--af-fs-micro)] font-black uppercase tracking-widest"
        style={{ background: 'var(--surface-container-high)', color: 'var(--on-surface-variant)' }}
      >
        {t('packs.directionComingSoon')}
      </span>
    );
  }
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
