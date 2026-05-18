
'use client';

import { useState, useCallback, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import useSWR from 'swr';
import Link from 'next/link';
import { getEventStats, getRecommendations, type ClawHubSkill } from '@/lib/api';
import { useI18n } from '@/lib/i18n';
import { RATING_COLORS, INSTALL_TARGETS, formatNum, getInstallId, getRepoName } from '@/lib/constants';
import { TestimonialForm } from '@/components/testimonial-form';
import { parsePermissions, PermissionDisplay } from '@/components/permission-display';

const SCENARIO_ICONS = ['rocket_launch', 'build', 'psychology'];

// ── Main Content ──

function SkillDetailContent() {
  const { t } = useI18n();
  const params = useSearchParams();
  const skillId = params.get('id') || '';

  const [activeTab, setActiveTab] = useState('claude');
  const [copied, setCopied] = useState('');
  const [showForm, setShowForm] = useState(false);

  // Fetch all skills from static data, find by id
  const { data: skillsData, isLoading } = useSWR('all-skills', async () => {
    const res = await fetch('/data/skills.json');
    return res.ok ? res.json() : {};
  });

  const allSkills: ClawHubSkill[] = skillsData?.skills || [];
  const skill = allSkills.find((s: ClawHubSkill) => s.id === skillId) || null;

  // Event stats
  const { data: statsData } = useSWR(
    skillId ? `event-stats-${skillId}` : null,
    () => getEventStats(skillId),
  );

  // Recommendations
  const { data: recsData } = useSWR(
    skillId ? `recs-${skillId}` : null,
    () => getRecommendations(skillId),
  );

  const copy = useCallback((text: string, id: string) => {
    // @auth-surface-allowlist: Skill install command copy is public; only Job Pack payloads require registration
    navigator.clipboard.writeText(text);
    setCopied(id);
    setTimeout(() => setCopied(''), 2000);
  }, []);

  // ── Loading / Not Found ──

  if (!skillId) {
    return (
      <div className="max-w-3xl mx-auto px-6 py-20 text-center">
        <span className="material-symbols-outlined text-6xl mb-4 block opacity-20" style={{ color: 'var(--on-surface)' }}>error</span>
        <h2 className="text-2xl font-black mb-2 text-balance" style={{ color: 'var(--on-surface)' }}>{t('skill.noId')}</h2>
        <p className="text-sm mb-8 opacity-60 text-pretty" style={{ color: 'var(--on-surface-variant)' }}>{t('skill.noIdDesc')}</p>
        <Link href="/explore/skills" className="px-8 py-3 rounded-2xl text-sm font-black uppercase tracking-widest text-white transition-all hover:shadow-xl active:scale-95" style={{ background: 'var(--primary)' }}>
          {t('skill.browseAll')}
        </Link>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto px-6 py-12 space-y-8">
        <div className="h-10 w-64 rounded-2xl animate-pulse bg-[var(--surface-container-low)]" />
        <div className="h-6 w-96 rounded-xl animate-pulse bg-[var(--surface-container-low)]" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[0, 1, 2].map(i => <div key={i} className="h-40 rounded-[2rem] animate-pulse bg-[var(--surface-container-low)]" />)}
        </div>
        <div className="h-64 rounded-[2.5rem] animate-pulse bg-[var(--surface-container-low)]" />
      </div>
    );
  }

  if (!skill) {
    return (
      <div className="max-w-3xl mx-auto px-6 py-20 text-center">
        <span className="material-symbols-outlined text-6xl mb-4 block opacity-20" style={{ color: 'var(--on-surface)' }}>search_off</span>
        <h2 className="text-2xl font-black mb-2 text-balance" style={{ color: 'var(--on-surface)' }}>{t('skill.notFound')}</h2>
        <p className="text-sm mb-8 opacity-60 text-pretty" style={{ color: 'var(--on-surface-variant)' }}>{t('skill.notFoundDesc', { id: skillId })}</p>
        <Link href="/explore/skills" className="px-8 py-3 rounded-2xl text-sm font-black uppercase tracking-widest text-white transition-all hover:shadow-xl active:scale-95" style={{ background: 'var(--primary)' }}>
          {t('skill.browseAll')}
        </Link>
      </div>
    );
  }

  // ── Derived data ──

  const isSkillType = (skill.source || 'clawhub') !== 'mcp-registry';
  const installId = getInstallId(skill);
  const repoName = getRepoName(skill);
  const ratingStyle = RATING_COLORS[skill.rating] || RATING_COLORS.C;
  const pm = (skill as any).permissionManifest || {};
  const permItems = parsePermissions(pm, t);
  const rate = (skill as any).deploySuccessRate as number | undefined;
  const deployCount = (skill as any).deployCount as number | undefined;
  const stale = (skill as any).stale as boolean | undefined;
  const syncedAt = skillsData?.meta?.syncedAt;
  const reviewUp = statsData?.stats?.review_up?.count ?? (skill as any).reviewUp ?? 0;
  const reviewDown = statsData?.stats?.review_down?.count ?? (skill as any).reviewDown ?? 0;
  const compositeScore = (skill as any).compositeScore ?? skill.score ?? 0;

  // Scenarios
  const scenarios = [
    { icon: SCENARIO_ICONS[0], title: t('skill.scenarioIntegrate'), desc: t('skill.scenarioIntegrateDesc', { name: skill.name }) },
    { icon: SCENARIO_ICONS[1], title: t('skill.scenarioAutomate'), desc: t('skill.scenarioAutomateDesc', { name: skill.name }) },
    { icon: SCENARIO_ICONS[2], title: t('skill.scenarioDecision'), desc: t('skill.scenarioDecisionDesc', { name: skill.name }) },
  ];

  // Recommendations
  const recs = (recsData?.recommendations || [])
    .map(r => allSkills.find(s => s.id === r.partner_id))
    .filter(Boolean) as ClawHubSkill[];

  // Install command for active tab
  const activeTarget = INSTALL_TARGETS.find(t => t.id === activeTab) || INSTALL_TARGETS[0];
  const installCmd = isSkillType
    ? activeTarget.cmdSkill?.(installId)
    : activeTarget.cmdMcp?.(installId, repoName);
  const availableTargets = INSTALL_TARGETS.filter(t => isSkillType ? t.cmdSkill : t.cmdMcp);

  // Deploy success rate
  const hasDeployData = rate !== undefined && rate >= 0 && (deployCount ?? 0) > 0;
  const deployRate = rate ?? 0;

  return (
    <div className="max-w-4xl mx-auto px-6 pb-64">

      {/* ═══ Zone 1: Hero ═══ */}
      <section className="pt-12 pb-10">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 mb-8">
          <Link href="/explore/skills" className="text-[var(--af-fs-meta)] font-black uppercase tracking-[0.2em] opacity-40 hover:opacity-100 transition-opacity">
            {t('skill.breadcrumb')}
          </Link>
          <span className="material-symbols-outlined text-xs font-black opacity-20">chevron_right</span>
          <span className="text-[var(--af-fs-meta)] font-black uppercase tracking-[0.2em] opacity-80">{skill.name}</span>
        </div>

        <div className="flex flex-col md:flex-row md:items-start gap-10">
          <div className="flex-1 space-y-6">
            <div className="flex items-center gap-4 flex-wrap">
              <h1 className="text-4xl md:text-5xl font-black tracking-tight text-balance" style={{ color: 'var(--on-surface)' }}>
                {skill.name}
              </h1>
              <span
                className="px-4 py-1.5 text-xs font-black rounded-full shadow-sm"
                style={{ background: ratingStyle.bg, color: ratingStyle.text }}
              >
                {skill.rating} RATING
              </span>
            </div>

            <p className="text-lg md:text-xl font-medium leading-relaxed opacity-80 text-pretty" style={{ color: 'var(--on-surface-variant)' }}>
              {skill.editorialTagline || skill.description}
            </p>

            <div className="flex items-center gap-3 flex-wrap">
              <span className="text-sm font-bold opacity-60">by @{skill.author}</span>
              <span className="w-1 h-1 rounded-full bg-[var(--outline)] opacity-20" />
              <span
                className="px-3 py-1 text-[var(--af-fs-meta)] font-black uppercase tracking-widest rounded-full"
                style={{ background: 'var(--surface-container-high)', color: 'var(--on-surface-variant)' }}
              >
                {skill.category}
              </span>
              <span
                className="px-3 py-1 text-[var(--af-fs-meta)] font-black uppercase tracking-widest rounded-full"
                style={{ background: isSkillType ? 'var(--primary-container)' : 'var(--tertiary-container)', color: isSkillType ? 'var(--on-primary-container)' : 'var(--on-tertiary-container)' }}
              >
                {isSkillType ? 'Skill' : 'MCP Server'}
              </span>
            </div>

            {/* Stats row */}
            <div className="flex items-center gap-8 pt-2">
              {skill.downloads > 0 && (
                <div className="flex flex-col">
                  <span className="text-[var(--af-fs-meta)] font-black uppercase tracking-[0.2em] opacity-40 mb-1">Downloads</span>
                  <div className="flex items-center gap-1.5 font-black text-lg">
                    <span className="material-symbols-outlined text-xl font-black opacity-40">download</span>
                    {skill.downloadsDisplay || formatNum(skill.downloads)}
                  </div>
                </div>
              )}
              {skill.stars > 0 && (
                <div className="flex flex-col">
                  <span className="text-[var(--af-fs-meta)] font-black uppercase tracking-[0.2em] opacity-40 mb-1">Github Stars</span>
                  <div className="flex items-center gap-1.5 font-black text-lg">
                    <span className="material-symbols-outlined text-xl font-black text-amber-500 fill-1">star</span>
                    {skill.starsDisplay || formatNum(skill.stars)}
                  </div>
                </div>
              )}
              {skill.versions > 0 && (
                <div className="flex flex-col">
                  <span className="text-[var(--af-fs-meta)] font-black uppercase tracking-[0.2em] opacity-40 mb-1">Versions</span>
                  <div className="flex items-center gap-1.5 font-black text-lg">
                    <span className="material-symbols-outlined text-xl font-black opacity-40">history</span>
                    {skill.versions}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Source link */}
          {(skill.url || skill.sourceUrl) && (
            <a
              href={skill.url || skill.sourceUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="shrink-0 flex items-center justify-center gap-2 px-8 py-4 rounded-[1.5rem] text-sm font-black uppercase tracking-widest transition-all hover:shadow-xl hover:-translate-y-1 active:scale-95 shadow-md"
              style={{ background: 'var(--surface-container-high)', color: 'var(--primary)' }}
            >
              <span className="material-symbols-outlined font-black">open_in_new</span>
              {t('skill.viewSource')}
            </a>
          )}
        </div>
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-12 pt-10 border-t border-[var(--outline-variant)]">
        {/* Left: Main Content */}
        <div className="lg:col-span-2 space-y-16">
          {/* ═══ Zone 2: Scenarios ═══ */}
          <section className="space-y-8">
            <div className="flex items-center gap-3">
              <div className="w-1.5 h-6 rounded-full" style={{ background: 'var(--primary)' }} />
              <h2 className="text-xl font-black uppercase tracking-widest text-balance" style={{ color: 'var(--on-surface)' }}>
                {t('skill.scenarios')}
              </h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-1 gap-4">
              {scenarios.map((s, i) => (
                <div
                  key={i}
                  className="flex gap-6 p-8 rounded-[2rem] transition-all hover:bg-[var(--surface-container-low)] border border-[var(--outline-variant)]"
                  style={{ background: 'var(--surface-container-lowest)' }}
                >
                  <div className="w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 shadow-inner" style={{ background: 'var(--surface-container)', color: 'var(--primary)' }}>
                    <span className="material-symbols-outlined text-2xl font-black">{s.icon}</span>
                  </div>
                  <div>
                    <h3 className="font-black text-base mb-2 text-balance" style={{ color: 'var(--on-surface)' }}>{s.title}</h3>
                    <p className="text-sm leading-relaxed opacity-70 text-pretty">{s.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* ═══ Zone 6: Permissions ═══ */}
          <section className="space-y-8">
            <div className="flex items-center gap-3">
              <div className="w-1.5 h-6 rounded-full" style={{ background: 'var(--error)' }} />
              <h2 className="text-xl font-black uppercase tracking-widest text-balance" style={{ color: 'var(--on-surface)' }}>
                {t('skill.permissions')}
              </h2>
            </div>
            <div className="rounded-[2.5rem] overflow-hidden border border-[var(--outline-variant)]">
              <PermissionDisplay permItems={permItems} />
            </div>
          </section>

          {/* ═══ Zone 4: Testimonials ═══ */}
          <section className="space-y-8">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-1.5 h-6 rounded-full" style={{ background: 'var(--tertiary)' }} />
                <h2 className="text-xl font-black uppercase tracking-widest text-balance" style={{ color: 'var(--on-surface)' }}>
                  {t('skill.testimonials')}
                </h2>
              </div>
              <button
                onClick={() => setShowForm(!showForm)}
                className="flex items-center gap-2 px-6 py-2.5 rounded-full text-[var(--af-fs-meta)] font-black uppercase tracking-widest transition-all hover:shadow-lg active:scale-95"
                style={{ background: showForm ? 'var(--surface-container-high)' : 'var(--primary)', color: showForm ? 'var(--on-surface)' : 'white' }}
              >
                <span className="material-symbols-outlined text-sm font-black">{showForm ? 'close' : 'add'}</span>
                {showForm ? t('skill.collapse') : t('skill.submitRecord')}
              </button>
            </div>

            {showForm && (
              <div className="scale-in">
                <TestimonialForm
                  skillId={skillId}
                  onDone={() => setShowForm(false)}
                />
              </div>
            )}

            {(reviewUp > 0 || reviewDown > 0) ? (
              <div className="grid grid-cols-2 gap-4 p-8 rounded-[2.5rem] bg-[var(--surface-container-low)] border border-[var(--outline-variant)]">
                <div className="flex flex-col items-center justify-center p-6 rounded-2xl bg-[var(--surface-container-lowest)] shadow-sm">
                  <span className="material-symbols-outlined text-3xl font-black mb-3" style={{ color: 'var(--tertiary)', fontVariationSettings: "'FILL' 1" }}>thumb_up</span>
                  <span className="text-4xl font-black" style={{ color: 'var(--on-surface)' }}>{reviewUp}</span>
                  <span className="text-[var(--af-fs-meta)] font-black uppercase tracking-widest opacity-40 mt-1">{t('skill.recommend')}</span>
                </div>
                <div className="flex flex-col items-center justify-center p-6 rounded-2xl bg-[var(--surface-container-lowest)] shadow-sm">
                  <span className="material-symbols-outlined text-3xl font-black mb-3" style={{ color: 'var(--error)', fontVariationSettings: "'FILL' 1" }}>thumb_down</span>
                  <span className="text-4xl font-black" style={{ color: 'var(--on-surface)' }}>{reviewDown}</span>
                  <span className="text-[var(--af-fs-meta)] font-black uppercase tracking-widest opacity-40 mt-1">{t('skill.notRecommend')}</span>
                </div>
              </div>
            ) : (
              <div className="py-16 text-center rounded-[2.5rem] bg-[var(--surface-container-low)] border border-dashed border-[var(--outline-variant)]">
                <span className="material-symbols-outlined text-5xl mb-4 block opacity-20" style={{ color: 'var(--on-surface)' }}>military_tech</span>
                <p className="text-sm font-bold opacity-40 text-pretty">{t('skill.noRecords')}</p>
                {!showForm && (
                  <button onClick={() => setShowForm(true)} className="text-xs font-black uppercase tracking-widest mt-4 text-[var(--primary)] hover:underline">
                    {t('skill.beFirst')}
                  </button>
                )}
              </div>
            )}
          </section>
        </div>

        {/* Right: Sidebar */}
        <aside className="space-y-12">
          {/* ═══ Zone 7: Activity ═══ */}
          <section className="space-y-6">
            <h2 className="text-[var(--af-fs-meta)] font-black uppercase tracking-[0.2em] opacity-50 text-balance">Market Activity</h2>
            <div className="p-8 rounded-[2.5rem] bg-[var(--surface-container-lowest)] border border-[var(--outline-variant)] shadow-sm space-y-8">
              {/* Composite score */}
              <div className="text-center pb-6 border-b border-dashed border-[var(--outline-variant)]">
                <span className="text-[var(--af-fs-meta)] font-black uppercase tracking-[0.2em] opacity-40 block mb-2">{t('skill.compositeScore')}</span>
                <span className="text-6xl font-black tracking-tight" style={{ color: 'var(--on-surface)' }}>{compositeScore}</span>
              </div>

              {/* Deploy success rate */}
              {hasDeployData && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-[var(--af-fs-meta)] font-black uppercase tracking-widest opacity-60">{t('skill.deployRate')}</span>
                    <span className="text-xs font-black" style={{ color: deployRate >= 0.7 ? 'var(--tertiary)' : deployRate >= 0.4 ? 'var(--af-yellow-fg)' : 'var(--error)' }}>
                      {Math.round(deployRate * 100)}% ({deployCount})
                    </span>
                  </div>
                  <div className="h-3 rounded-full overflow-hidden bg-[var(--surface-container)] shadow-inner">
                    <div
                      className="h-full rounded-full transition-all duration-1000"
                      style={{
                        width: `{Math.round(deployRate * 100)}%`,
                        background: deployRate >= 0.7 ? 'var(--tertiary)' : deployRate >= 0.4 ? 'var(--af-yellow-fg)' : 'var(--error)',
                      }}
                    />
                  </div>
                </div>
              )}

              {/* Stale warning */}
              {stale && (
                <div className="flex items-center gap-3 p-4 rounded-2xl bg-[var(--error-container)] text-[var(--on-error-container)]">
                  <span className="material-symbols-outlined font-black">schedule</span>
                  <span className="text-xs font-black uppercase tracking-widest">{t('skill.staleWarning')}</span>
                </div>
              )}

              {/* Sync info */}
              {syncedAt && (
                <div className="flex items-center justify-between pt-4 opacity-40">
                  <span className="text-[var(--af-fs-meta)] font-black uppercase tracking-widest">{t('skill.lastSync')}</span>
                  <span className="text-[var(--af-fs-meta)] font-black">{new Date(syncedAt).toLocaleDateString('zh-CN')}</span>
                </div>
              )}
            </div>
          </section>

          {/* ═══ Zone 3: Combo Recommendations ═══ */}
          <section className="space-y-6">
            <h2 className="text-[var(--af-fs-meta)] font-black uppercase tracking-[0.2em] opacity-50 text-balance">{t('skill.combos')}</h2>
            {recs.length > 0 ? (
              <div className="space-y-4">
                {recs.slice(0, 3).map(r => {
                  const rs = RATING_COLORS[r.rating] || RATING_COLORS.C;
                  return (
                    <Link
                      key={r.id}
                      href={`/skill?id=${encodeURIComponent(r.id)}`}
                      className="group flex flex-col p-6 rounded-[2rem] transition-all hover:bg-[var(--surface-container-low)] border border-[var(--outline-variant)] bg-[var(--surface-container-lowest)]"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-black text-sm truncate flex-1 pr-2 text-balance" style={{ color: 'var(--on-surface)' }}>{r.name}</h4>
                        <span className="px-2 py-0.5 text-[var(--af-fs-micro)] font-black uppercase tracking-widest rounded-full shrink-0" style={{ background: rs.bg, color: rs.text }}>{r.rating}</span>
                      </div>
                      <p className="text-xs opacity-60 line-clamp-2 leading-relaxed mb-4 text-pretty">{r.description}</p>
                      <span className="text-[var(--af-fs-meta)] font-black uppercase tracking-widest flex items-center gap-1.5 text-[var(--primary)] group-hover:underline">
                        <span className="material-symbols-outlined text-sm font-black">add_circle</span>
                        {t('skill.installTogether')}
                      </span>
                    </Link>
                  );
                })}
              </div>
            ) : (
              <div className="p-10 text-center rounded-[2rem] bg-[var(--surface-container-low)] border border-dashed border-[var(--outline-variant)] opacity-40">
                <span className="material-symbols-outlined text-3xl mb-2 block font-black">group</span>
                <p className="text-[var(--af-fs-meta)] font-black uppercase tracking-widest text-pretty">{t('skill.combosEmpty')}</p>
              </div>
            )}
          </section>
        </aside>
      </div>

      {/* ═══ Zone 5: Install Command (STICKY) ═══ */}
      <div
        className="fixed bottom-0 left-0 right-0 z-40 border-t-2"
        style={{
          background: 'var(--surface-container-lowest)',
          borderColor: 'var(--outline-variant)',
          boxShadow: '0 -10px 40px rgba(0,0,0,0.1)',
        }}
      >
        <div className="max-w-4xl mx-auto px-6 py-6 space-y-4">
          {/* Platform tabs */}
          <div className="flex gap-1.5 overflow-x-auto pb-1 no-scrollbar">
            {availableTargets.map(tgt => (
              <button
                key={tgt.id}
                onClick={() => setActiveTab(tgt.id)}
                className="flex items-center gap-2 px-5 py-2 rounded-xl text-[var(--af-fs-meta)] font-black uppercase tracking-widest transition-all whitespace-nowrap shrink-0"
                style={{
                  background: activeTab === tgt.id ? 'var(--primary)' : 'var(--surface-container)',
                  color: activeTab === tgt.id ? 'white' : 'var(--on-surface-variant)',
                  transform: activeTab === tgt.id ? 'scale(1.05)' : 'scale(1)',
                }}
              >
                <span className="material-symbols-outlined text-sm font-black">{tgt.icon}</span>
                {tgt.name}
              </button>
            ))}
          </div>

          {/* Command + copy */}
          {installCmd ? (
            <div className="flex items-stretch gap-3">
              <div className="flex-1 relative group">
                <pre
                  className="w-full text-xs font-bold overflow-x-auto rounded-2xl p-5 scrollbar-hide shadow-inner transition-all group-hover:shadow-md text-pretty"
                  style={{
                    background: 'var(--af-code-bg-dark)',
                    color: 'var(--af-code-text)',
                    fontFamily: 'monospace',
                    whiteSpace: installCmd.includes('\n') ? 'pre' : 'nowrap',
                    maxHeight: '150px',
                  }}
                >
                  {installCmd}
                </pre>
                <div className="absolute top-3 right-3 px-2 py-0.5 rounded bg-white/5 text-[var(--af-fs-micro)] font-black uppercase tracking-widest text-white/40">Bash</div>
              </div>
              <button
                onClick={() => copy(installCmd, 'install')}
                className="shrink-0 flex flex-col items-center justify-center gap-1 px-8 rounded-2xl font-black uppercase tracking-widest text-white transition-all hover:shadow-2xl active:scale-95 shadow-lg"
                style={{
                  background: copied === 'install' ? 'var(--tertiary)' : 'var(--primary)',
                }}
              >
                <span className="material-symbols-outlined text-xl font-black">
                  {copied === 'install' ? 'check' : 'content_copy'}
                </span>
                <span className="text-[var(--af-fs-micro)]">{copied === 'install' ? t('skill.copied') : t('skill.copy')}</span>
              </button>
            </div>
          ) : (
            <div className="p-6 rounded-2xl bg-[var(--surface-container-low)] text-center border-2 border-dashed border-[var(--outline-variant)]">
              <p className="text-xs font-black uppercase tracking-[0.2em] opacity-40 text-pretty">
                {t('skill.platformUnsupported')}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Page export with Suspense ──

export default function SkillDetailPage() {
  return (
    <Suspense fallback={
      <div className="max-w-4xl mx-auto px-6 py-12 space-y-8">
        <div className="h-10 w-64 rounded-2xl animate-pulse bg-[var(--surface-container-low)]" />
        <div className="h-6 w-96 rounded-xl animate-pulse bg-[var(--surface-container-low)]" />
        <div className="h-64 rounded-[2.5rem] animate-pulse bg-[var(--surface-container-low)]" />
      </div>
    }>
      <SkillDetailContent />
    </Suspense>
  );
}
