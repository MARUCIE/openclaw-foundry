'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import useSWR from 'swr';
import { getProviders, type ProviderMeta, type ProviderTier, type ClawHubSkill } from '@/lib/api';
import { useI18n } from '@/lib/i18n';
import { TIER_CONFIG, TYPE_ICONS, RATING_BADGE_CLASSES, formatNum } from '@/lib/constants';
import { ConstellationDiagram } from '@/components/constellation-diagram';

/* ── Platform card ── */
function PlatformCard({ p, t }: { p: ProviderMeta; t: (key: string, vars?: Record<string, string | number>) => string }) {
  const cfg = TIER_CONFIG[p.tier] || TIER_CONFIG.guided;
  return (
    <div
      className="p-5 rounded-2xl transition-all group hover:bg-[var(--surface-container-lowest)]"
      style={{ background: 'var(--surface-container-low)', border: '1px solid transparent' }}
    >
      <div className="flex justify-between items-start mb-4">
        <div className="flex gap-4">
          <div className="w-12 h-12 rounded-xl shadow-sm flex items-center justify-center" style={{ background: 'white', color: cfg.color }}>
            <span className="material-symbols-outlined">{TYPE_ICONS[p.type] || 'devices'}</span>
          </div>
          <div className="flex flex-col">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full" style={{ background: cfg.dot }} />
              <h4 className="font-bold" style={{ color: 'var(--on-surface)' }}>{p.name}</h4>
            </div>
            <p className="text-xs" style={{ color: 'var(--on-surface-variant)' }}>{p.vendor}</p>
          </div>
        </div>
        <Link
          href={`/deploy?provider=${p.id}`}
          className="px-4 py-1.5 rounded-lg text-xs font-bold"
          style={{ background: 'var(--primary-container)', color: 'var(--on-primary)' }}
        >
          {t('landing.deploy')}
        </Link>
      </div>
      <p className="text-sm line-clamp-2" style={{ color: 'var(--on-surface-variant)' }}>{p.description}</p>
      {p.installCmd && (
        <div className="mt-3 px-2 py-1 rounded-lg text-[10px] font-mono truncate" style={{ background: 'var(--surface-container)', color: 'var(--on-surface-variant)' }}>
          {p.installCmd}
        </div>
      )}
    </div>
  );
}

/* ── Skill card (real data) ── */
function SkillCard({ s }: { s: ClawHubSkill }) {
  return (
    <Link
      href={`/skill?id=${encodeURIComponent(s.id)}`}
      className="p-6 rounded-2xl transition-all group hover:shadow-lg hover:border-[rgba(0,62,168,0.4)] block"
      style={{ background: 'var(--surface-container-low)', border: '1px solid rgba(195, 198, 215, 0.3)' }}
    >
      <div className="flex justify-between items-start mb-3">
        <h4 className="font-bold text-base leading-tight" style={{ color: 'var(--on-surface)' }}>{s.name}</h4>
        <span className={`px-2 py-0.5 text-[10px] font-bold rounded-full shrink-0 ml-2 ${RATING_BADGE_CLASSES[s.rating] || 'bg-gray-100 text-gray-500'}`}>
          {s.rating}
        </span>
      </div>
      <div className="flex items-center gap-2 mb-3">
        <span className="text-xs" style={{ color: 'var(--on-surface-variant)' }}>@{s.author}</span>
        <span className="text-[10px] px-2 py-0.5 rounded-full font-medium" style={{ background: 'var(--surface-container)', color: 'var(--on-surface-variant)' }}>
          {s.category}
        </span>
      </div>
      <p className="text-sm mb-4 line-clamp-2" style={{ color: 'var(--on-surface-variant)' }}>{s.description}</p>
      <div className="flex items-center gap-4 text-xs" style={{ color: 'var(--on-surface-variant)' }}>
        {s.downloads > 0 && (
          <span className="flex items-center gap-1">
            <span className="material-symbols-outlined text-sm">download</span> {s.downloadsDisplay || formatNum(s.downloads)}
          </span>
        )}
        {s.stars > 0 && (
          <span className="flex items-center gap-1">
            <span className="material-symbols-outlined text-sm" style={{ color: '#f59e0b', fontVariationSettings: "'FILL' 1" }}>star</span> {s.starsDisplay || formatNum(s.stars)}
          </span>
        )}
      </div>
    </Link>
  );
}

/* ── Main Landing Page ── */
export default function LandingPage() {
  const { t } = useI18n();
  const { data: providerData } = useSWR('providers', () => getProviders());

  // Load real skills from static prebuild
  const { data: skillsData } = useSWR('landing-skills', async () => {
    const res = await fetch('/data/skills.json');
    return res.ok ? res.json() : null;
  });

  const providers = providerData?.providers || [];
  const grouped: Record<ProviderTier, ProviderMeta[]> = {
    'full-auto': providers.filter(p => p.tier === 'full-auto'),
    'semi-auto': providers.filter(p => p.tier === 'semi-auto'),
    'guided': providers.filter(p => p.tier === 'guided'),
  };

  const totalProviders = providers.length || 12;
  const topSkills: ClawHubSkill[] = (skillsData?.skills || [])
    .filter((s: ClawHubSkill) => (s.source || 'clawhub') !== 'mcp-registry' && s.downloads > 0)
    .slice(0, 6);
  const totalSkills = skillsData?.total || 37000;
  const mcpCount = (skillsData?.skills || []).filter((s: any) => s.source === 'mcp-registry').length;

  const STATS = [
    { icon: 'rocket_launch', value: String(totalProviders), label: t('stats.platforms') },
    { icon: 'widgets', value: formatNum(totalSkills), label: t('stats.skills') },
    { icon: 'hub', value: formatNum(mcpCount || 4200), label: t('stats.mcp') },
    { icon: 'auto_fix', value: 'L3', label: t('stats.automation') },
  ];

  return (
    <div className="-mt-20">
      {/* ═══ Hero Section ═══ */}
      <header className="relative pt-32 pb-28 md:pt-48 md:pb-40 overflow-hidden bg-gradient-to-br from-[#003ea8] to-[#712ae2]">
        <div className="absolute inset-0 mesh-overlay opacity-30" />
        <div className="max-w-7xl mx-auto px-6 relative z-10 flex flex-col md:flex-row items-center gap-16">
          <div className="md:flex-1 space-y-8 text-center md:text-left">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/10 text-white text-xs font-bold tracking-widest uppercase backdrop-blur-md">
              <span className="material-symbols-outlined text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
              {t('hero.badge')}
            </div>
            <h1
              className="text-5xl md:text-7xl font-extrabold text-white leading-[1.1] tracking-tight"
              style={{ fontFamily: 'Manrope, sans-serif' }}
            >
              {t('hero.title')} <br />
              <span className="opacity-90">{t('hero.subtitle', { count: totalProviders })}</span>
            </h1>
            <p className="text-xl md:text-2xl text-blue-50/80 max-w-2xl leading-relaxed">
              {t('hero.description')}
            </p>
            <div className="flex flex-col sm:flex-row items-center gap-4 pt-4 justify-center md:justify-start">
              <Link
                href="/explore/platforms"
                className="w-full sm:w-auto px-10 py-4 rounded-2xl font-bold text-lg shadow-2xl transition-all transform hover:-translate-y-1"
                style={{ background: 'white', color: 'var(--primary)', fontFamily: 'Manrope, sans-serif' }}
              >
                {t('hero.deployNow')}
              </Link>
              <Link
                href="/explore/skills"
                className="w-full sm:w-auto px-10 py-4 border-2 border-white/30 text-white rounded-2xl font-bold text-lg backdrop-blur-sm transition-all transform hover:-translate-y-1 hover:bg-white/10"
                style={{ fontFamily: 'Manrope, sans-serif' }}
              >
                {t('hero.browseSkills', { count: formatNum(totalSkills) })}
              </Link>
            </div>
          </div>
          <ConstellationDiagram />
        </div>
      </header>

      {/* ═══ Quick Stats Bar ═══ */}
      <section className="max-w-7xl mx-auto px-6 -mt-10 md:-mt-16 relative z-20">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
          {STATS.map(stat => (
            <div
              key={stat.label}
              className="stat-card p-5 md:p-8 rounded-2xl flex flex-col items-center justify-center text-center space-y-2 md:space-y-3"
              style={{
                background: 'var(--surface-container-lowest)',
                boxShadow: '0 25px 50px -12px rgba(0, 62, 168, 0.1)',
                border: '1px solid rgba(195, 198, 215, 0.3)',
              }}
            >
              <span className="stat-icon material-symbols-outlined text-2xl md:text-3xl transition-colors" style={{ color: 'var(--primary)' }}>{stat.icon}</span>
              <span className="stat-value text-2xl md:text-4xl font-extrabold transition-colors" style={{ fontFamily: 'Manrope, sans-serif', color: 'var(--on-surface)' }}>{stat.value}</span>
              <span className="stat-label text-[10px] md:text-xs font-bold tracking-widest uppercase transition-colors" style={{ color: 'var(--on-surface-variant)' }}>{stat.label}</span>
            </div>
          ))}
        </div>
      </section>

      {/* ═══ Platform Showcase (REAL DATA) ═══ */}
      <section className="py-24 max-w-7xl mx-auto px-6">
        <div className="flex flex-col md:flex-row justify-between items-end gap-6 mb-16">
          <div className="space-y-4">
            <h2 className="text-4xl font-extrabold" style={{ fontFamily: 'Manrope, sans-serif', color: 'var(--on-surface)' }}>
              {t('landing.platformsTitle', { count: totalProviders })}
            </h2>
            <p style={{ color: 'var(--on-surface-variant)' }} className="text-lg">{t('landing.platformsDesc')}</p>
          </div>
          <Link href="/explore/platforms" className="px-4 py-2 rounded-full text-sm font-bold" style={{ background: 'var(--primary)', color: 'var(--on-primary)' }}>
            {t('landing.viewAllPlatforms')}
          </Link>
        </div>

        {providers.length === 0 ? (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {[1, 2, 3].map(i => (
              <div key={i} className="space-y-4">
                <div className="h-12 rounded-2xl animate-pulse" style={{ background: 'var(--surface-container)' }} />
                <div className="h-36 rounded-2xl animate-pulse" style={{ background: 'var(--surface-container-low)' }} />
                <div className="h-36 rounded-2xl animate-pulse" style={{ background: 'var(--surface-container-low)' }} />
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {(['full-auto', 'semi-auto', 'guided'] as const).map(tier => {
              const items = grouped[tier];
              const cfg = TIER_CONFIG[tier];
              const displayItems = items.slice(0, 2);
              const remaining = items.length - 2;
              return (
                <div key={tier} className="space-y-6">
                  <div className="flex items-center gap-3 p-4 rounded-2xl" style={{ background: cfg.bg }}>
                    <span className="material-symbols-outlined" style={{ color: cfg.color, fontVariationSettings: "'FILL' 1" }}>{cfg.icon}</span>
                    <h3 className="font-bold" style={{ fontFamily: 'Manrope, sans-serif', color: cfg.color }}>{t(cfg.labelKey)}</h3>
                    <span className="ml-auto text-xs font-bold px-2.5 py-1 rounded-full" style={{ color: cfg.color, background: 'rgba(255,255,255,0.5)' }}>
                      {items.length} {t('stats.platforms').toLowerCase()}
                    </span>
                  </div>
                  <div className="space-y-4">
                    {displayItems.map(p => <PlatformCard key={p.id} p={p} t={t} />)}
                    {remaining > 0 && (
                      <div className="p-5 rounded-2xl opacity-60" style={{ background: 'var(--surface-container-low)' }}>
                        <p className="text-center text-xs font-medium" style={{ color: 'var(--on-surface-variant)' }}>
                          + {items.slice(2).map(p => p.name).join(', ')}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* ═══ Hot Skills (REAL DATA from prebuild) ═══ */}
      <section className="py-24 max-w-7xl mx-auto px-6">
        <div className="flex justify-between items-end mb-12">
          <div className="space-y-4">
            <h2 className="text-4xl font-extrabold" style={{ fontFamily: 'Manrope, sans-serif', color: 'var(--on-surface)' }}>
              {t('landing.hotSkills')}
            </h2>
            <p className="text-lg" style={{ color: 'var(--on-surface-variant)' }}>
              {t('landing.hotSkillsDesc', { count: formatNum(totalSkills) })}
            </p>
          </div>
          <Link href="/explore/skills" className="font-bold hover:underline underline-offset-8" style={{ color: 'var(--primary)' }}>
            {t('landing.browseAll')}
          </Link>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {topSkills.length > 0 ? (
            topSkills.map(s => <SkillCard key={s.id} s={s} />)
          ) : (
            Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-44 rounded-2xl skeleton-shimmer" />
            ))
          )}
        </div>
      </section>
    </div>
  );
}
