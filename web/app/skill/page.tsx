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
    navigator.clipboard.writeText(text);
    setCopied(id);
    setTimeout(() => setCopied(''), 2000);
  }, []);

  // ── Loading / Not Found ──

  if (!skillId) {
    return (
      <div className="max-w-3xl mx-auto px-6 py-20 text-center">
        <span className="material-symbols-outlined text-6xl mb-4 block" style={{ color: 'var(--outline)' }}>error</span>
        <h2 className="text-xl font-bold mb-2" style={{ color: 'var(--on-surface)' }}>{t('skill.noId')}</h2>
        <p className="text-sm mb-6" style={{ color: 'var(--on-surface-variant)' }}>{t('skill.noIdDesc')}</p>
        <Link href="/explore/skills" className="px-5 py-2.5 rounded-xl text-sm font-bold" style={{ background: 'var(--primary)', color: 'white' }}>
          {t('skill.browseAll')}
        </Link>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto px-6 py-12 space-y-6">
        <div className="h-10 w-64 rounded-xl skeleton-shimmer" />
        <div className="h-6 w-96 rounded-lg skeleton-shimmer" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[0, 1, 2].map(i => <div key={i} className="h-32 rounded-2xl skeleton-shimmer" />)}
        </div>
        <div className="h-48 rounded-2xl skeleton-shimmer" />
      </div>
    );
  }

  if (!skill) {
    return (
      <div className="max-w-3xl mx-auto px-6 py-20 text-center">
        <span className="material-symbols-outlined text-6xl mb-4 block" style={{ color: 'var(--outline)' }}>search_off</span>
        <h2 className="text-xl font-bold mb-2" style={{ color: 'var(--on-surface)' }}>{t('skill.notFound')}</h2>
        <p className="text-sm mb-6" style={{ color: 'var(--on-surface-variant)' }}>{t('skill.notFoundDesc', { id: skillId })}</p>
        <Link href="/explore/skills" className="px-5 py-2.5 rounded-xl text-sm font-bold" style={{ background: 'var(--primary)', color: 'white' }}>
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

  // Scenarios (placeholder until payload populates)
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
    <div className="max-w-4xl mx-auto px-6 pb-40">

      {/* ═══ Zone 1: Hero ═══ */}
      <section className="pt-8 pb-6">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-sm mb-6" style={{ color: 'var(--on-surface-variant)' }}>
          <Link href="/explore/skills" className="hover:underline">{t('skill.breadcrumb')}</Link>
          <span className="material-symbols-outlined text-sm">chevron_right</span>
          <span style={{ color: 'var(--on-surface)' }}>{skill.name}</span>
        </div>

        <div className="flex flex-col md:flex-row md:items-start gap-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-3 flex-wrap mb-3">
              <h1 className="text-3xl md:text-4xl font-extrabold" style={{ fontFamily: 'Manrope, sans-serif', color: 'var(--on-surface)' }}>
                {skill.name}
              </h1>
              <span
                className="px-3 py-1 text-sm font-bold rounded-full"
                style={{ background: ratingStyle.bg, color: ratingStyle.text }}
              >
                {skill.rating}
              </span>
            </div>

            <p className="text-base mb-4 max-w-2xl" style={{ color: 'var(--on-surface-variant)' }}>
              {skill.editorialTagline || (skill.description && skill.description.length > 80 ? skill.description.slice(0, 80) + '...' : skill.description)}
            </p>

            <div className="flex items-center gap-3 flex-wrap mb-4">
              <span className="text-sm font-medium" style={{ color: 'var(--on-surface-variant)' }}>@{skill.author}</span>
              <span
                className="px-3 py-1 text-xs font-bold rounded-full"
                style={{ background: 'var(--surface-container)', color: 'var(--on-surface-variant)' }}
              >
                {skill.category}
              </span>
              <span
                className="px-2 py-0.5 text-[10px] font-bold rounded-full"
                style={{ background: isSkillType ? '#dbeafe' : '#d1fae5', color: isSkillType ? '#1e40af' : '#065f46' }}
              >
                {isSkillType ? 'Skill' : 'MCP Server'}
              </span>
            </div>

            {/* Stats row */}
            <div className="flex items-center gap-5 text-sm" style={{ color: 'var(--on-surface-variant)' }}>
              {skill.downloads > 0 && (
                <span className="flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-base">download</span>
                  {skill.downloadsDisplay || formatNum(skill.downloads)}
                </span>
              )}
              {skill.stars > 0 && (
                <span className="flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-base" style={{ color: '#f59e0b', fontVariationSettings: "'FILL' 1" }}>star</span>
                  {skill.starsDisplay || formatNum(skill.stars)}
                </span>
              )}
              {skill.versions > 0 && (
                <span className="flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-base">history</span>
                  {t('skill.versions', { count: skill.versions })}
                </span>
              )}
            </div>
          </div>

          {/* Source link */}
          {(skill.url || skill.sourceUrl) && (
            <a
              href={skill.url || skill.sourceUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="shrink-0 flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-bold transition-all hover:opacity-80"
              style={{ background: 'var(--surface-container)', color: 'var(--primary)' }}
            >
              <span className="material-symbols-outlined text-base">open_in_new</span>
              {t('skill.viewSource')}
            </a>
          )}
        </div>
      </section>

      {/* ═══ Zone 2: Scenarios ═══ */}
      <section className="py-6">
        <h2 className="text-lg font-bold mb-4" style={{ fontFamily: 'Manrope, sans-serif', color: 'var(--on-surface)' }}>
          {t('skill.scenarios')}
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {scenarios.map((s, i) => (
            <div
              key={i}
              className="p-5 rounded-2xl"
              style={{ background: 'var(--surface-container-low)' }}
            >
              <span className="material-symbols-outlined text-2xl mb-3 block" style={{ color: 'var(--primary)' }}>{s.icon}</span>
              <h3 className="font-bold text-sm mb-1.5" style={{ color: 'var(--on-surface)' }}>{s.title}</h3>
              <p className="text-xs leading-relaxed" style={{ color: 'var(--on-surface-variant)' }}>{s.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ═══ Zone 3: Combo Recommendations ═══ */}
      <section className="py-6">
        <h2 className="text-lg font-bold mb-4" style={{ fontFamily: 'Manrope, sans-serif', color: 'var(--on-surface)' }}>
          {t('skill.combos')}
        </h2>
        {recs.length > 0 ? (
          <div className="flex gap-4 overflow-x-auto pb-2" style={{ scrollbarWidth: 'thin' }}>
            {recs.map(r => {
              const rs = RATING_COLORS[r.rating] || RATING_COLORS.C;
              return (
                <Link
                  key={r.id}
                  href={`/skill?id=${encodeURIComponent(r.id)}`}
                  className="shrink-0 w-52 p-4 rounded-2xl transition-all card-hover"
                  style={{ background: 'var(--surface-container-lowest)', border: '1px solid var(--outline-variant)' }}
                >
                  <div className="flex items-center gap-2 mb-2">
                    <h4 className="font-bold text-sm truncate flex-1" style={{ color: 'var(--on-surface)' }}>{r.name}</h4>
                    <span className="px-2 py-0.5 text-[10px] font-bold rounded-full shrink-0" style={{ background: rs.bg, color: rs.text }}>{r.rating}</span>
                  </div>
                  <p className="text-xs line-clamp-2 mb-3" style={{ color: 'var(--on-surface-variant)' }}>
                    {r.description ? (r.description.length > 60 ? r.description.slice(0, 60) + '...' : r.description) : ''}
                  </p>
                  <span className="text-xs font-bold flex items-center gap-1" style={{ color: 'var(--primary)' }}>
                    <span className="material-symbols-outlined text-sm">add_circle</span>
                    {t('skill.installTogether')}
                  </span>
                </Link>
              );
            })}
          </div>
        ) : (
          <div className="py-8 text-center rounded-2xl" style={{ background: 'var(--surface-container-low)' }}>
            <span className="material-symbols-outlined text-3xl mb-2 block" style={{ color: 'var(--outline)' }}>group</span>
            <p className="text-sm" style={{ color: 'var(--on-surface-variant)' }}>{t('skill.combosEmpty')}</p>
          </div>
        )}
      </section>

      {/* ═══ Zone 4: Battle Record Testimonials ═══ */}
      <section className="py-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold" style={{ fontFamily: 'Manrope, sans-serif', color: 'var(--on-surface)' }}>
            {t('skill.testimonials')}
          </h2>
          <button
            onClick={() => setShowForm(!showForm)}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-bold transition-all hover:opacity-80"
            style={{ background: 'var(--primary)', color: 'white' }}
          >
            <span className="material-symbols-outlined text-base">{showForm ? 'close' : 'add'}</span>
            {showForm ? t('skill.collapse') : t('skill.submitRecord')}
          </button>
        </div>

        {showForm && (
          <div className="mb-4">
            <TestimonialForm
              skillId={skillId}
              onDone={() => setShowForm(false)}
            />
          </div>
        )}

        {(reviewUp > 0 || reviewDown > 0) ? (
          <div className="flex items-center gap-4 py-6 px-5 rounded-2xl" style={{ background: 'var(--surface-container-low)' }}>
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-xl" style={{ color: '#16a34a', fontVariationSettings: "'FILL' 1" }}>thumb_up</span>
              <span className="text-2xl font-bold" style={{ color: 'var(--on-surface)' }}>{reviewUp}</span>
              <span className="text-sm" style={{ color: 'var(--on-surface-variant)' }}>{t('skill.recommend')}</span>
            </div>
            <div className="w-px h-8" style={{ background: 'var(--outline-variant)' }} />
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-xl" style={{ color: '#dc2626', fontVariationSettings: "'FILL' 1" }}>thumb_down</span>
              <span className="text-2xl font-bold" style={{ color: 'var(--on-surface)' }}>{reviewDown}</span>
              <span className="text-sm" style={{ color: 'var(--on-surface-variant)' }}>{t('skill.notRecommend')}</span>
            </div>
          </div>
        ) : (
          <div className="py-8 text-center rounded-2xl" style={{ background: 'var(--surface-container-low)' }}>
            <span className="material-symbols-outlined text-3xl mb-2 block" style={{ color: 'var(--outline)' }}>military_tech</span>
            <p className="text-sm mb-1" style={{ color: 'var(--on-surface-variant)' }}>{t('skill.noRecords')}</p>
            {!showForm && (
              <button
                onClick={() => setShowForm(true)}
                className="text-sm font-bold mt-2"
                style={{ color: 'var(--primary)' }}
              >
                {t('skill.beFirst')}
              </button>
            )}
          </div>
        )}
      </section>

      {/* ═══ Zone 6: Permissions ═══ */}
      <section className="py-6">
        <h2 className="text-lg font-bold mb-4" style={{ fontFamily: 'Manrope, sans-serif', color: 'var(--on-surface)' }}>
          {t('skill.permissions')}
        </h2>
        <PermissionDisplay permItems={permItems} />
      </section>

      {/* ═══ Zone 7: Activity ═══ */}
      <section className="py-6">
        <h2 className="text-lg font-bold mb-4" style={{ fontFamily: 'Manrope, sans-serif', color: 'var(--on-surface)' }}>
          {t('skill.activity')}
        </h2>
        <div className="p-5 rounded-2xl space-y-4" style={{ background: 'var(--surface-container-lowest)', border: '1px solid var(--outline-variant)' }}>
          {/* Deploy success rate */}
          {hasDeployData && (
            <div>
              <div className="flex items-center justify-between text-sm mb-2">
                <span style={{ color: 'var(--on-surface-variant)' }}>{t('skill.deployRate')}</span>
                <span className="font-bold" style={{ color: deployRate >= 0.7 ? '#16a34a' : deployRate >= 0.4 ? '#ca8a04' : '#dc2626' }}>
                  {Math.round(deployRate * 100)}% ({deployCount} 次)
                </span>
              </div>
              <div className="h-2 rounded-full overflow-hidden" style={{ background: 'var(--surface-container)' }}>
                <div
                  className="h-full rounded-full transition-all"
                  style={{
                    width: `${Math.round(deployRate * 100)}%`,
                    background: deployRate >= 0.7 ? '#16a34a' : deployRate >= 0.4 ? '#ca8a04' : '#dc2626',
                  }}
                />
              </div>
            </div>
          )}

          {/* Composite score */}
          <div className="flex items-center justify-between">
            <span className="text-sm" style={{ color: 'var(--on-surface-variant)' }}>{t('skill.compositeScore')}</span>
            <span className="text-lg font-bold" style={{ color: 'var(--on-surface)' }}>{compositeScore}</span>
          </div>

          {/* Review summary */}
          <div className="flex items-center justify-between">
            <span className="text-sm" style={{ color: 'var(--on-surface-variant)' }}>{t('skill.userReviews')}</span>
            <div className="flex items-center gap-3 text-sm">
              <span className="flex items-center gap-1" style={{ color: '#16a34a' }}>
                <span className="material-symbols-outlined text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>thumb_up</span>
                {reviewUp}
              </span>
              <span className="flex items-center gap-1" style={{ color: '#dc2626' }}>
                <span className="material-symbols-outlined text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>thumb_down</span>
                {reviewDown}
              </span>
            </div>
          </div>

          {/* Stale warning */}
          {stale && (
            <div className="flex items-center gap-2 px-3 py-2 rounded-lg" style={{ background: '#fee2e2', color: '#991b1b' }}>
              <span className="material-symbols-outlined text-base">schedule</span>
              <span className="text-sm font-bold">{t('skill.staleWarning')}</span>
            </div>
          )}

          {/* Last sync */}
          {syncedAt && (
            <div className="flex items-center justify-between pt-2 border-t" style={{ borderColor: 'var(--outline-variant)' }}>
              <span className="text-xs" style={{ color: 'var(--on-surface-variant)' }}>{t('skill.lastSync')}</span>
              <span className="text-xs" style={{ color: 'var(--on-surface-variant)' }}>
                {new Date(syncedAt).toLocaleDateString('zh-CN')}
              </span>
            </div>
          )}
        </div>
      </section>

      {/* ═══ Zone 5: Install Command (STICKY) ═══ */}
      <div
        className="fixed bottom-0 left-0 right-0 z-40 border-t"
        style={{
          background: 'var(--surface-container-lowest)',
          borderColor: 'var(--outline-variant)',
          boxShadow: '0 -4px 24px rgba(0,0,0,0.08)',
        }}
      >
        <div className="max-w-4xl mx-auto px-6 py-4">
          {/* Platform tabs */}
          <div className="flex gap-1 mb-3 overflow-x-auto pb-1" style={{ scrollbarWidth: 'thin' }}>
            {availableTargets.map(tgt => (
              <button
                key={tgt.id}
                onClick={() => setActiveTab(tgt.id)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap shrink-0"
                style={{
                  background: activeTab === tgt.id ? 'var(--primary)' : 'var(--surface-container)',
                  color: activeTab === tgt.id ? 'white' : 'var(--on-surface-variant)',
                }}
              >
                <span className="material-symbols-outlined" style={{ fontSize: '14px' }}>{tgt.icon}</span>
                {tgt.name}
              </button>
            ))}
          </div>

          {/* Command + copy */}
          {installCmd && (
            <div className="flex items-start gap-3">
              <pre
                className="flex-1 text-xs overflow-x-auto rounded-xl p-3"
                style={{
                  background: '#1e1e2e',
                  color: '#cdd6f4',
                  fontFamily: 'monospace',
                  whiteSpace: installCmd.includes('\n') ? 'pre' : 'nowrap',
                  maxHeight: '120px',
                }}
              >
                {installCmd}
              </pre>
              <button
                onClick={() => copy(installCmd, 'install')}
                className="shrink-0 flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-sm font-bold transition-all"
                style={{
                  background: copied === 'install' ? '#22c55e' : 'var(--primary)',
                  color: 'white',
                }}
              >
                <span className="material-symbols-outlined text-base">
                  {copied === 'install' ? 'check' : 'content_copy'}
                </span>
                {copied === 'install' ? t('skill.copied') : t('skill.copy')}
              </button>
            </div>
          )}
          {!installCmd && (
            <p className="text-xs py-2" style={{ color: 'var(--on-surface-variant)' }}>
              {t('skill.platformUnsupported')}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Page export with Suspense (required for useSearchParams in static export) ──

export default function SkillDetailPage() {
  return (
    <Suspense fallback={
      <div className="max-w-4xl mx-auto px-6 py-12 space-y-6">
        <div className="h-10 w-64 rounded-xl skeleton-shimmer" />
        <div className="h-6 w-96 rounded-lg skeleton-shimmer" />
        <div className="h-48 rounded-2xl skeleton-shimmer" />
      </div>
    }>
      <SkillDetailContent />
    </Suspense>
  );
}
