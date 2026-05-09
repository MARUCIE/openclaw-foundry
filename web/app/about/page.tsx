'use client';

import Link from 'next/link';
import { type ProviderMeta, type ClawHubSkill, type ConfigPack } from '@/lib/api';
import { useI18n } from '@/lib/i18n';
import { TIER_CONFIG, TYPE_ICONS, RATING_BADGE_CLASSES, formatNum } from '@/lib/constants';
import { localizeSkillCategory } from '@/lib/skill-categories';
import { localizePackPreview } from '@/lib/pack-presenter';
import { useLandingPageData } from '@/lib/landing';

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
            <span aria-hidden="true" className="material-symbols-outlined">{TYPE_ICONS[p.type] || 'devices'}</span>
          </div>
          <div className="flex flex-col">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full" style={{ background: cfg.dot }} />
              <h4 className="font-bold text-balance" style={{ color: 'var(--on-surface)' }}>{p.name}</h4>
            </div>
            <p className="text-xs text-pretty" style={{ color: 'var(--on-surface-variant)' }}>{p.vendor}</p>
          </div>
        </div>
        <Link
          href={`/deploy?provider=${p.id}`}
          className="px-4 py-1.5 rounded-lg text-xs font-bold active:scale-95 transition-transform"
          style={{ background: 'var(--primary-container)', color: 'var(--on-primary)' }}
        >
          {t('landing.deploy')}
        </Link>
      </div>
      <p className="text-sm line-clamp-2 text-pretty" style={{ color: 'var(--on-surface-variant)' }}>{p.description}</p>
      {p.installCmd && (
        <div className="mt-3 px-2 py-1 rounded-lg text-[var(--af-fs-meta)] font-mono truncate" style={{ background: 'var(--surface-container)', color: 'var(--on-surface-variant)' }}>
          {p.installCmd}
        </div>
      )}
    </div>
  );
}

function SkillCard({ s }: { s: ClawHubSkill }) {
  const { t } = useI18n();

  return (
    <Link
      href={`/skill?id=${encodeURIComponent(s.id)}`}
      className="p-6 rounded-2xl transition-all group hover:shadow-xl hover:border-[rgba(0,62,168,0.4)] hover:-translate-y-1 active:scale-[0.99] block shadow-sm"
      style={{ background: 'var(--surface-container-low)', border: '1px solid rgba(195, 198, 215, 0.3)' }}
    >
      <div className="flex justify-between items-start mb-3">
        <h4 className="font-bold text-base leading-tight text-balance" style={{ color: 'var(--on-surface)' }}>{s.name}</h4>
        <span className={`px-2 py-0.5 text-[var(--af-fs-meta)] font-bold rounded-full shrink-0 ml-2 ${RATING_BADGE_CLASSES[s.rating] || 'bg-gray-100 text-gray-500'}`}>
          {s.rating}
        </span>
      </div>
      <div className="flex items-center gap-2 mb-3">
        <span className="text-xs" style={{ color: 'var(--on-surface-variant)' }}>@{s.author}</span>
        <span className="text-[var(--af-fs-meta)] px-2 py-0.5 rounded-full font-medium" style={{ background: 'var(--surface-container)', color: 'var(--on-surface-variant)' }}>
          {localizeSkillCategory(s.category, t)}
        </span>
      </div>
      <p className="text-sm mb-4 line-clamp-2 text-pretty" style={{ color: 'var(--on-surface-variant)' }}>{s.description}</p>
      <div className="flex items-center gap-4 text-xs" style={{ color: 'var(--on-surface-variant)' }}>
        {s.downloads > 0 && (
          <span className="flex items-center gap-1">
            <span aria-hidden="true" className="material-symbols-outlined text-sm">download</span>
            <span className="sr-only">{t('skills.downloads')} </span>
            {s.downloadsDisplay || formatNum(s.downloads)}
          </span>
        )}
        {s.stars > 0 && (
          <span className="flex items-center gap-1">
            <span aria-hidden="true" className="material-symbols-outlined text-sm" style={{ color: 'var(--af-orange-fg)', fontVariationSettings: "'FILL' 1" }}>star</span>
            <span className="sr-only">{t('skills.stars')} </span>
            {s.starsDisplay || formatNum(s.stars)}
          </span>
        )}
      </div>
    </Link>
  );
}

function SurfaceLinkCard({
  eyebrow,
  title,
  description,
  metric,
  metricLabel,
  href,
  accent,
  wide = false,
}: {
  eyebrow: string;
  title: string;
  description: string;
  metric: string;
  metricLabel?: string;
  href: string;
  accent: string;
  wide?: boolean;
}) {
  return (
    <Link
      href={href}
      className={`group rounded-[2rem] p-6 active:scale-[0.99] transition-all hover:-translate-y-1 ${
        wide ? 'sm:col-span-2' : ''
      }`}
      style={{
        background: wide ? 'var(--surface-container-lowest)' : 'var(--surface-container-low)',
        border: '1px solid rgba(195, 198, 215, 0.32)',
        boxShadow: wide ? '0 18px 40px rgba(15, 23, 42, 0.08)' : '0 10px 24px rgba(15, 23, 42, 0.05)',
      }}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-3">
          <div className="inline-flex items-center gap-2 text-[var(--af-fs-meta)] font-black uppercase tracking-[0.2em]" style={{ color: accent }}>
            <span className="w-2 h-2 rounded-full" style={{ background: accent }} />
            {eyebrow}
          </div>
          <div>
            <h3 className="text-xl font-black tracking-tight text-balance" style={{ color: 'var(--on-surface)' }}>
              {title}
            </h3>
            <p className="mt-2 text-sm leading-6 text-pretty" style={{ color: 'var(--on-surface-variant)' }}>
              {description}
            </p>
          </div>
        </div>
        <div
          className="shrink-0 rounded-2xl px-4 py-3 text-right"
          style={{ background: 'rgba(0, 62, 168, 0.06)', color: accent, minWidth: '92px' }}
        >
          <div className="text-[var(--af-fs-meta)] font-bold uppercase tracking-[0.18em] opacity-70">{metricLabel}</div>
          <div className="text-2xl font-black tracking-tight" style={{ fontVariantNumeric: 'tabular-nums' }}>{metric}</div>
        </div>
      </div>
    </Link>
  );
}

function PackPreviewCard({ pack, locale, t }: { pack: ConfigPack; locale: 'en' | 'zh'; t: (key: string, vars?: Record<string, string | number>) => string }) {
  const preview = localizePackPreview(pack, locale);

  return (
    <Link
      href="/packs"
      className="rounded-[2rem] p-5 transition-all hover:-translate-y-1 active:scale-[0.99]"
      style={{
        background: 'var(--surface-container-low)',
        border: '1px solid rgba(195, 198, 215, 0.3)',
        boxShadow: '0 12px 28px rgba(15, 23, 42, 0.06)',
      }}
    >
      <div className="flex items-start justify-between gap-4">
        <div
          className="w-12 h-12 rounded-2xl flex items-center justify-center text-2xl"
          style={{ background: `${pack.color}15`, color: pack.color }}
        >
          <span aria-hidden="true">{pack.icon}</span>
        </div>
        <span
          className="rounded-full px-3 py-1 text-[var(--af-fs-meta)] font-black uppercase tracking-[0.18em]"
          style={{ background: 'rgba(15, 23, 42, 0.06)', color: 'var(--on-surface-variant)' }}
        >
          {preview.line}
        </span>
      </div>
      <div className="mt-5">
        <h3 className="text-lg font-black tracking-tight text-balance" style={{ color: 'var(--on-surface)' }}>
          {preview.name}
        </h3>
        <p className="mt-2 text-sm leading-6 line-clamp-3 text-pretty" style={{ color: 'var(--on-surface-variant)' }}>
          {preview.description}
        </p>
      </div>
      <div className="mt-5 flex items-center justify-between text-xs" style={{ color: 'var(--on-surface-variant)' }}>
        <span style={{ fontVariantNumeric: 'tabular-nums' }}>{preview.fileCount} {t('landing.fileUnit')}</span>
        <span className="font-bold" style={{ color: pack.color }}>v{pack.version}</span>
      </div>
    </Link>
  );
}

function SignalRow({ label, value, tone = 'var(--on-surface)' }: { label: string; value: string; tone?: string }) {
  return (
    <div className="flex items-baseline justify-between gap-6 py-3 border-b last:border-b-0" style={{ borderColor: 'rgba(195, 198, 215, 0.22)' }}>
      <span className="text-sm font-medium" style={{ color: 'var(--on-surface-variant)' }}>{label}</span>
      <span className="text-2xl font-black tracking-tight" style={{ color: tone, fontVariantNumeric: 'tabular-nums' }}>{value}</span>
    </div>
  );
}

export default function LandingPage() {
  const { t, locale } = useI18n();
  const {
    grouped,
    hasProviders,
    totalProviders,
    totalSkills,
    totalPacks,
    mcpCount,
    topSkills,
    topCategories,
    ratingMix,
    categoryMax,
    packs,
    topPacks,
    packLines,
    recentDeploys,
    recentArena,
    uptimeDisplay,
    recentOps,
    recentJobs,
  } = useLandingPageData();
  const signalMetric = formatNum(recentOps);

  const STATS = [
    { icon: 'rocket_launch', value: String(totalProviders), label: t('stats.platforms') },
    { icon: 'widgets', value: formatNum(totalSkills), label: t('stats.skills') },
    { icon: 'hub', value: formatNum(mcpCount || 4200), label: t('stats.mcp') },
    { icon: 'auto_fix', value: 'L3', label: t('stats.automation') },
  ];

  const SURFACE_LINKS = [
    {
      eyebrow: t('landing.surfaceEyebrowCore'),
      title: t('skills.title'),
      description: t('landing.routeSkillsDesc'),
      metric: formatNum(totalSkills),
      metricLabel: t('landing.metricSkillsLabel'),
      href: '#skills-ledger',
      accent: 'var(--primary)',
      wide: true,
    },
    {
      eyebrow: t('landing.surfaceEyebrowPacks'),
      title: t('packs.title'),
      description: t('landing.routePacksDesc'),
      metric: formatNum(totalPacks),
      metricLabel: t('landing.metricPacksLabel'),
      href: '#pack-workflows',
      accent: 'var(--secondary)',
    },
    {
      eyebrow: t('landing.surfaceEyebrowSignals'),
      title: t('landing.routeSignalsTitle'),
      description: t('landing.routeSignalsDesc'),
      metric: signalMetric,
      metricLabel: t('landing.signalMetricLabel'),
      href: '#ops-signals',
      accent: 'var(--tertiary)',
    },
    {
      eyebrow: t('landing.surfaceEyebrowArena'),
      title: t('arena.title'),
      description: t('landing.routeArenaDesc'),
      metric: formatNum(recentArena),
      metricLabel: t('landing.metricArenaLabel'),
      href: '/arena',
      accent: 'var(--secondary)',
    },
    {
      eyebrow: t('landing.surfaceEyebrowApi'),
      title: t('nav.api'),
      description: t('landing.routeApiDesc'),
      metric: t('landing.apiMetricValue'),
      metricLabel: t('landing.metricApiLabel'),
      href: '/api-docs',
      accent: 'var(--primary)',
    },
    {
      eyebrow: t('landing.surfaceEyebrowDeploy'),
      title: t('deploy.title'),
      description: t('landing.routeDeployDesc'),
      metric: String(totalProviders),
      metricLabel: t('landing.metricPlatformsLabel'),
      href: '#deploy-later',
      accent: 'var(--af-emerald-fg)',
      wide: true,
    },
  ];

  const RAIL_LINKS = [
    { href: '#skills-ledger', label: t('skills.title'), value: formatNum(totalSkills) },
    { href: '#pack-workflows', label: t('packs.title'), value: formatNum(totalPacks) },
    { href: '#ops-signals', label: t('landing.routeSignalsTitle'), value: `${signalMetric} ${t('landing.signalMetricUnit')}` },
    { href: '/arena', label: t('arena.title'), value: formatNum(recentArena) },
    { href: '/api-docs', label: t('nav.api'), value: 'REST' },
    { href: '#deploy-later', label: t('deploy.title'), value: String(totalProviders) },
  ];

  return (
    <div className="-mt-20">
      <header className="pt-32 pb-14 md:pt-40 md:pb-20" style={{ background: 'linear-gradient(180deg, rgba(235,243,255,0.88) 0%, rgba(248,250,252,0.98) 64%, rgba(248,250,252,1) 100%)' }}>
        <div className="page-shell grid items-start gap-8 lg:grid-cols-[1.08fr_0.92fr]">
          <div className="space-y-8">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-black tracking-[0.2em] uppercase" style={{ background: 'rgba(0, 62, 168, 0.08)', color: 'var(--primary)' }}>
              <span className="w-2 h-2 rounded-full" style={{ background: 'var(--primary)' }} />
              {t('hero.badge')}
            </div>

            <div className="space-y-5">
              <h1 className="max-w-4xl text-5xl md:text-7xl font-black leading-[0.98] tracking-[-0.04em] text-balance" style={{ color: 'var(--on-surface)' }}>
                {t('hero.title')}
                <br />
                <span style={{ color: 'var(--primary)' }}>{t('hero.subtitle', { count: totalProviders })}</span>
              </h1>
              <p className="max-w-2xl text-lg md:text-xl leading-8 text-pretty" style={{ color: 'var(--on-surface-variant)' }}>
                {t('landing.homeBody')}
              </p>
            </div>

            <div className="flex flex-col items-start gap-4 sm:flex-row sm:items-center">
              <Link
                href="#skills-ledger"
                className="rounded-full px-7 py-3.5 text-sm font-black uppercase tracking-[0.18em] active:scale-95 transition-transform"
                style={{ background: 'var(--primary)', color: 'var(--on-primary)' }}
              >
                {t('hero.browseSkills', { count: formatNum(totalSkills) })}
              </Link>
              <div className="flex flex-wrap items-center gap-3 text-sm" style={{ color: 'var(--on-surface-variant)' }}>
                <Link href="#pack-workflows" className="font-bold hover:underline underline-offset-8">{t('packs.title')}</Link>
                <span aria-hidden="true">•</span>
                <Link href="#ops-signals" className="font-bold hover:underline underline-offset-8">{t('landing.routeSignalsTitle')}</Link>
                <span aria-hidden="true">•</span>
                <Link href="/api-docs" className="font-bold hover:underline underline-offset-8">{t('nav.api')}</Link>
                <span aria-hidden="true">•</span>
                <Link href="#deploy-later" className="font-bold hover:underline underline-offset-8">{t('deploy.title')}</Link>
              </div>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            {SURFACE_LINKS.map(item => (
              <SurfaceLinkCard key={item.title} {...item} />
            ))}
          </div>
        </div>
      </header>

      <section className="page-shell -mt-4 md:-mt-10 relative z-20">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
          {STATS.map(stat => (
            <div
              key={stat.label}
              className="stat-card p-5 md:p-8 rounded-2xl flex flex-col items-center justify-center text-center space-y-2 md:space-y-3"
              style={{
                background: 'var(--surface-container-lowest)',
                boxShadow: '0 25px 50px -12px rgba(0, 62, 168, 0.08)',
                border: '1px solid rgba(195, 198, 215, 0.3)',
              }}
            >
              <span aria-hidden="true" className="stat-icon material-symbols-outlined text-2xl md:text-3xl transition-colors" style={{ color: 'var(--primary)' }}>{stat.icon}</span>
              <span className="stat-value text-2xl md:text-4xl font-extrabold transition-colors" style={{ color: 'var(--on-surface)', fontVariantNumeric: 'tabular-nums' }}>{stat.value}</span>
              <span className="stat-label text-[var(--af-fs-meta)] md:text-xs font-bold tracking-widest uppercase transition-colors" style={{ color: 'var(--on-surface-variant)' }}>{stat.label}</span>
            </div>
          ))}
        </div>
      </section>

      <div className="page-shell py-24 lg:grid lg:grid-cols-[300px_minmax(0,1fr)] lg:gap-10">
        <aside className="hidden lg:block">
          <div className="sticky top-28 space-y-6">
            <div
              className="rounded-[2rem] p-6"
              style={{
                background: 'var(--surface-container-lowest)',
                border: '1px solid rgba(195, 198, 215, 0.32)',
                boxShadow: '0 16px 36px rgba(15, 23, 42, 0.06)',
              }}
            >
              <div className="text-[var(--af-fs-meta)] font-black uppercase tracking-[0.2em]" style={{ color: 'var(--primary)' }}>
                {t('landing.railEyebrow')}
              </div>
              <div className="mt-5 space-y-3">
                <div className="rounded-2xl px-4 py-3" style={{ background: 'rgba(0, 62, 168, 0.05)' }}>
                  <div className="text-[var(--af-fs-meta)] font-black uppercase tracking-[0.18em]" style={{ color: 'var(--primary)' }}>
                    {t('landing.railMetrics')}
                  </div>
                  <div className="mt-3 grid grid-cols-2 gap-3">
                    <div>
                      <div className="text-[var(--af-fs-meta)] font-medium" style={{ color: 'var(--on-surface-variant)' }}>{t('stats.skills')}</div>
                      <div className="text-xl font-black tracking-tight" style={{ color: 'var(--on-surface)', fontVariantNumeric: 'tabular-nums' }}>{formatNum(totalSkills)}</div>
                    </div>
                    <div>
                      <div className="text-[var(--af-fs-meta)] font-medium" style={{ color: 'var(--on-surface-variant)' }}>{t('stats.mcp')}</div>
                      <div className="text-xl font-black tracking-tight" style={{ color: 'var(--on-surface)', fontVariantNumeric: 'tabular-nums' }}>{formatNum(mcpCount || 4200)}</div>
                    </div>
                    <div>
                      <div className="text-[var(--af-fs-meta)] font-medium" style={{ color: 'var(--on-surface-variant)' }}>{t('packs.title')}</div>
                      <div className="text-xl font-black tracking-tight" style={{ color: 'var(--on-surface)', fontVariantNumeric: 'tabular-nums' }}>{formatNum(totalPacks)}</div>
                    </div>
                    <div>
                      <div className="text-[var(--af-fs-meta)] font-medium" style={{ color: 'var(--on-surface-variant)' }}>{t('stats.platforms')}</div>
                      <div className="text-xl font-black tracking-tight" style={{ color: 'var(--on-surface)', fontVariantNumeric: 'tabular-nums' }}>{totalProviders}</div>
                    </div>
                  </div>
                </div>

                <div className="rounded-2xl px-4 py-4" style={{ background: 'var(--surface-container-low)' }}>
                  <div className="text-[var(--af-fs-meta)] font-black uppercase tracking-[0.18em]" style={{ color: 'var(--secondary)' }}>
                    {t('landing.railSections')}
                  </div>
                  <div className="mt-3 space-y-2">
                    {RAIL_LINKS.map(link => (
                      <Link
                        key={link.href}
                        href={link.href}
                        className="flex items-center justify-between gap-3 rounded-xl px-3 py-2.5 transition-colors hover:bg-white/60"
                        style={{ color: 'var(--on-surface)' }}
                      >
                          <span className="text-sm font-semibold text-pretty">{link.label}</span>
                        <span className="text-xs font-black tracking-tight" style={{ color: 'var(--on-surface-variant)', fontVariantNumeric: 'tabular-nums' }}>
                          {link.value}
                        </span>
                      </Link>
                    ))}
                  </div>
                </div>

                <div className="rounded-2xl px-4 py-4" style={{ background: 'var(--surface-container-low)' }}>
                  <div className="text-[var(--af-fs-meta)] font-black uppercase tracking-[0.18em]" style={{ color: 'var(--tertiary)' }}>
                    {t('landing.railCategories')}
                  </div>
                  <div className="mt-3 space-y-2">
                    {topCategories.map(([category, count]) => (
                      <Link
                        key={category}
                        href={`/explore/skills?category=${encodeURIComponent(category)}`}
                        className="flex items-center justify-between gap-3 rounded-xl px-3 py-2.5 transition-colors hover:bg-white/60"
                        style={{ color: 'var(--on-surface)' }}
                      >
                          <span className="text-sm font-semibold text-pretty">{localizeSkillCategory(category, t)}</span>
                        <span className="text-xs font-black tracking-tight" style={{ color: 'var(--on-surface-variant)', fontVariantNumeric: 'tabular-nums' }}>
                          {formatNum(count)}
                        </span>
                      </Link>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </aside>

        <div className="space-y-24">
        <section id="skills-ledger">
        <div className="grid gap-8 lg:grid-cols-[1.15fr_0.85fr]">
          <div
            className="rounded-[2.5rem] p-8 md:p-10"
            style={{
              background: 'var(--surface-container-lowest)',
              border: '1px solid rgba(195, 198, 215, 0.32)',
              boxShadow: '0 18px 40px rgba(15, 23, 42, 0.06)',
            }}
          >
            <div className="max-w-2xl space-y-4">
              <div className="text-[var(--af-fs-meta)] font-black uppercase tracking-[0.2em]" style={{ color: 'var(--primary)' }}>{t('landing.catalogEyebrow')}</div>
              <h2 className="text-4xl font-black tracking-tight text-balance" style={{ color: 'var(--on-surface)' }}>
                {t('landing.catalogTitle')}
              </h2>
              <p className="text-lg leading-8 text-pretty" style={{ color: 'var(--on-surface-variant)' }}>
                {t('landing.catalogDesc')}
              </p>
            </div>

            <div className="mt-10 space-y-4 lg:hidden">
              {topCategories.map(([category, count]) => (
                <Link key={category} href={`/explore/skills?category=${encodeURIComponent(category)}`} className="block group">
                  <div className="flex items-center justify-between gap-6 mb-2">
                    <span className="text-sm md:text-base font-semibold text-pretty transition-colors group-hover:text-[var(--primary)]" style={{ color: 'var(--on-surface)' }}>
                      {localizeSkillCategory(category, t)}
                    </span>
                    <span className="text-sm font-black tracking-tight" style={{ color: 'var(--on-surface-variant)', fontVariantNumeric: 'tabular-nums' }}>
                      {formatNum(count)}
                    </span>
                  </div>
                  <div className="h-2 rounded-full overflow-hidden" style={{ background: 'rgba(15, 23, 42, 0.08)' }}>
                    <div
                      className="h-full rounded-full"
                      style={{
                        width: `${Math.max(16, (count / categoryMax) * 100)}%`,
                        background: 'linear-gradient(90deg, rgba(0,62,168,0.92) 0%, rgba(79,70,229,0.72) 100%)',
                      }}
                    />
                  </div>
                </Link>
              ))}
            </div>
          </div>

          <div className="grid gap-6">
            <div
              className="rounded-[2rem] p-6"
              style={{
                background: 'var(--surface-container-low)',
                border: '1px solid rgba(195, 198, 215, 0.28)',
              }}
            >
              <div className="space-y-2">
                <div className="text-[var(--af-fs-meta)] font-black uppercase tracking-[0.18em]" style={{ color: 'var(--secondary)' }}>
                  {t('landing.ratingMixTitle')}
                </div>
                <p className="text-sm leading-6 text-pretty" style={{ color: 'var(--on-surface-variant)' }}>
                  {t('landing.ratingMixDesc')}
                </p>
              </div>
              <div className="mt-6 space-y-3">
                {ratingMix.map(([rating, count]) => (
                  <Link
                    key={rating}
                    href={`/explore/skills?rating=${encodeURIComponent(rating)}`}
                    className="flex items-center justify-between gap-4 rounded-xl px-3 py-2 transition-colors hover:bg-white/60"
                  >
                    <div className="flex items-center gap-3">
                      <span className={`px-2 py-0.5 text-[var(--af-fs-meta)] font-bold rounded-full ${RATING_BADGE_CLASSES[rating as keyof typeof RATING_BADGE_CLASSES] || 'bg-gray-100 text-gray-500'}`}>
                        {rating}
                      </span>
                      <span className="text-sm font-medium" style={{ color: 'var(--on-surface)' }}>
                        {t('skills.qualityRating')}
                      </span>
                    </div>
                    <span className="text-sm font-black" style={{ color: 'var(--on-surface-variant)', fontVariantNumeric: 'tabular-nums' }}>
                      {formatNum(count)}
                    </span>
                  </Link>
                ))}
              </div>
            </div>

            <div
              className="rounded-[2rem] p-6"
              style={{
                background: 'rgba(0, 62, 168, 0.05)',
                border: '1px solid rgba(0, 62, 168, 0.12)',
              }}
            >
              <div className="text-[var(--af-fs-meta)] font-black uppercase tracking-[0.18em]" style={{ color: 'var(--primary)' }}>
                    {t('landing.inventoryTitle')}
              </div>
              <div className="mt-4 grid grid-cols-2 gap-4">
                <div>
                  <div className="text-sm font-medium" style={{ color: 'var(--on-surface-variant)' }}>{t('stats.skills')}</div>
                  <div className="text-3xl font-black tracking-tight" style={{ color: 'var(--on-surface)', fontVariantNumeric: 'tabular-nums' }}>{formatNum(totalSkills)}</div>
                </div>
                <div>
                  <div className="text-sm font-medium" style={{ color: 'var(--on-surface-variant)' }}>{t('stats.mcp')}</div>
                  <div className="text-3xl font-black tracking-tight" style={{ color: 'var(--on-surface)', fontVariantNumeric: 'tabular-nums' }}>{formatNum(mcpCount || 4200)}</div>
                </div>
                <div>
                  <div className="text-sm font-medium" style={{ color: 'var(--on-surface-variant)' }}>{t('packs.title')}</div>
                  <div className="text-3xl font-black tracking-tight" style={{ color: 'var(--on-surface)', fontVariantNumeric: 'tabular-nums' }}>{formatNum(totalPacks)}</div>
                </div>
                <div>
                  <div className="text-sm font-medium" style={{ color: 'var(--on-surface-variant)' }}>{t('stats.platforms')}</div>
                  <div className="text-3xl font-black tracking-tight" style={{ color: 'var(--on-surface)', fontVariantNumeric: 'tabular-nums' }}>{totalProviders}</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="space-y-12">
        <div className="flex justify-between items-end mb-12">
          <div className="space-y-4">
            <h2 className="text-4xl font-extrabold text-balance" style={{ color: 'var(--on-surface)' }}>
              {t('landing.hotSkills')}
            </h2>
            <p className="text-lg text-pretty" style={{ color: 'var(--on-surface-variant)' }}>
              {t('landing.hotSkillsDesc', { count: formatNum(totalSkills) })}
            </p>
          </div>
          <Link href="/explore/skills" className="font-bold hover:underline underline-offset-8" style={{ color: 'var(--primary)' }}>
            {t('landing.browseAll')}
          </Link>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 stagger-grid">
          {topSkills.length > 0 ? (
            topSkills.map(s => <SkillCard key={s.id} s={s} />)
          ) : (
            Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-44 rounded-2xl skeleton-shimmer" />
            ))
          )}
        </div>
      </section>

      <section id="pack-workflows">
        <div className="grid gap-8 lg:grid-cols-[0.9fr_1.1fr]">
          <div
            className="rounded-[2.5rem] p-8 md:p-10"
            style={{
              background: 'var(--surface-container-lowest)',
              border: '1px solid rgba(195, 198, 215, 0.28)',
              boxShadow: '0 16px 36px rgba(15, 23, 42, 0.06)',
            }}
          >
            <div className="space-y-4">
              <div className="text-[var(--af-fs-meta)] font-black uppercase tracking-[0.2em]" style={{ color: 'var(--secondary)' }}>{t('landing.packEyebrow')}</div>
              <h2 className="text-4xl font-black tracking-tight text-balance" style={{ color: 'var(--on-surface)' }}>
                {t('landing.packTitle')}
              </h2>
              <p className="text-lg leading-8 text-pretty" style={{ color: 'var(--on-surface-variant)' }}>
                {t('landing.packDesc')}
              </p>
            </div>

            <div className="mt-8 space-y-3">
              {packLines.map(line => (
                <div key={line.id} className="flex items-center justify-between gap-4 rounded-2xl px-4 py-3" style={{ background: 'var(--surface-container-low)' }}>
                  <span className="text-sm font-semibold" style={{ color: 'var(--on-surface)' }}>{line.name}</span>
                  <span className="text-sm font-black" style={{ color: 'var(--secondary)', fontVariantNumeric: 'tabular-nums' }}>{line.packs.length}</span>
                </div>
              ))}
            </div>

            <Link
              href="/packs"
              className="mt-8 inline-flex rounded-full px-6 py-3 text-sm font-black uppercase tracking-[0.18em] active:scale-95 transition-transform"
              style={{ background: 'var(--secondary)', color: 'white' }}
            >
              {t('packs.title')}
            </Link>
          </div>

            <div className="grid gap-5 md:grid-cols-3">
              {topPacks.length > 0 ? (
              topPacks.map(pack => <PackPreviewCard key={pack.id} pack={pack} locale={locale} t={t} />)
              ) : (
                Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="h-64 rounded-[2rem] skeleton-shimmer" />
              ))
            )}
          </div>
        </div>
      </section>

      <section id="ops-signals">
        <div className="grid gap-8 lg:grid-cols-[0.85fr_1.15fr]">
          <div
            className="rounded-[2.5rem] p-8 md:p-10"
            style={{
              background: 'rgba(0, 62, 168, 0.05)',
              border: '1px solid rgba(0, 62, 168, 0.12)',
            }}
          >
            <div className="space-y-4">
              <div className="text-[var(--af-fs-meta)] font-black uppercase tracking-[0.2em]" style={{ color: 'var(--tertiary)' }}>{t('landing.signalEyebrow')}</div>
              <h2 className="text-4xl font-black tracking-tight text-balance" style={{ color: 'var(--on-surface)' }}>
                {t('landing.signalTitle')}
              </h2>
              <p className="text-lg leading-8 text-pretty" style={{ color: 'var(--on-surface-variant)' }}>
                {t('landing.signalDesc')}
              </p>
            </div>

            <div className="mt-8">
              <SignalRow label={t('landing.signalUptime')} value={uptimeDisplay} tone="var(--primary)" />
              <SignalRow label={t('landing.signalDeploys')} value={formatNum(recentDeploys)} tone="var(--secondary)" />
              <SignalRow label={t('landing.signalArena')} value={formatNum(recentArena)} tone="var(--tertiary)" />
            </div>

            <div className="mt-8 flex flex-wrap gap-3">
              <Link href="/arena" className="rounded-full px-5 py-3 text-xs font-black uppercase tracking-[0.18em] active:scale-95 transition-transform" style={{ background: 'var(--primary)', color: 'var(--on-primary)' }}>
                {t('landing.signalViewArena')}
              </Link>
              <Link href="/explore/platforms" className="rounded-full px-5 py-3 text-xs font-black uppercase tracking-[0.18em] active:scale-95 transition-transform" style={{ background: 'var(--surface-container-low)', color: 'var(--on-surface)' }}>
                {t('landing.viewAllPlatforms')}
              </Link>
            </div>
          </div>

          <div
            className="rounded-[2.5rem] p-8 md:p-10"
            style={{
              background: 'var(--surface-container-lowest)',
              border: '1px solid rgba(195, 198, 215, 0.28)',
            }}
          >
            <div className="flex items-end justify-between gap-6">
              <div>
                <div className="text-[var(--af-fs-meta)] font-black uppercase tracking-[0.18em]" style={{ color: 'var(--primary)' }}>{t('landing.signalRecentJobs')}</div>
                <p className="mt-2 text-sm leading-6 text-pretty" style={{ color: 'var(--on-surface-variant)' }}>
                  {t('landing.signalRecentJobsDesc')}
                </p>
              </div>
              <div className="text-3xl font-black tracking-tight" style={{ color: 'var(--on-surface)', fontVariantNumeric: 'tabular-nums' }}>
                {formatNum(recentJobs.length)}
              </div>
            </div>

            <div className="mt-8 space-y-4">
              {recentJobs.length > 0 ? (
                recentJobs.map(job => (
                  <div
                    key={job.id}
                    className="rounded-[1.5rem] px-5 py-4"
                    style={{ background: 'var(--surface-container-low)', border: '1px solid rgba(195, 198, 215, 0.2)' }}
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="space-y-1">
                        <div className="text-base font-black tracking-tight text-balance" style={{ color: 'var(--on-surface)' }}>
                          {job.provider}
                        </div>
                        <div className="text-xs text-pretty" style={{ color: 'var(--on-surface-variant)' }}>
                          {job.id}
                        </div>
                      </div>
                      <span
                        className="rounded-full px-3 py-1 text-[var(--af-fs-meta)] font-black uppercase tracking-[0.18em]"
                        style={{
                          background:
                            job.status === 'success'
                              ? 'rgba(5, 150, 105, 0.12)'
                              : job.status === 'failed'
                                ? 'rgba(220, 38, 38, 0.12)'
                                : 'rgba(0, 62, 168, 0.08)',
                          color:
                            job.status === 'success'
                              ? 'var(--af-emerald-fg)'
                              : job.status === 'failed'
                                ? 'var(--af-red-fg)'
                                : 'var(--primary)',
                        }}
                      >
                        {job.status}
                      </span>
                    </div>
                  </div>
                ))
              ) : (
                <div
                  className="rounded-[1.5rem] px-5 py-6 text-sm leading-6 text-pretty"
                  style={{ background: 'var(--surface-container-low)', color: 'var(--on-surface-variant)' }}
                >
                  {t('landing.signalNoJobs')}
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      <section id="deploy-later">
        <div className="flex flex-col md:flex-row justify-between items-end gap-6 mb-16">
          <div className="space-y-4">
            <div className="text-[var(--af-fs-meta)] font-black uppercase tracking-[0.2em]" style={{ color: 'var(--af-emerald-fg)' }}>{t('landing.deployEyebrow')}</div>
            <h2 className="text-4xl font-extrabold text-balance" style={{ color: 'var(--on-surface)' }}>
              {t('landing.platformsTitle', { count: totalProviders })}
            </h2>
            <p style={{ color: 'var(--on-surface-variant)' }} className="text-lg text-pretty">{t('landing.platformsDesc')}</p>
          </div>
          <Link href="/explore/platforms" className="px-4 py-2 rounded-full text-sm font-bold" style={{ background: 'var(--primary)', color: 'var(--on-primary)' }}>
            {t('landing.viewAllPlatforms')}
          </Link>
        </div>

        {!hasProviders ? (
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
                    <span aria-hidden="true" className="material-symbols-outlined" style={{ color: cfg.color, fontVariationSettings: "'FILL' 1" }}>{cfg.icon}</span>
                    <h3 className="font-bold text-balance" style={{ color: cfg.color }}>{t(cfg.labelKey)}</h3>
                    <span className="ml-auto text-xs font-bold px-2.5 py-1 rounded-full" style={{ color: cfg.color, background: 'rgba(255,255,255,0.5)' }}>
                      {items.length} {t('stats.platforms').toLowerCase()}
                    </span>
                  </div>
                  <div className="space-y-4">
                    {displayItems.map(p => <PlatformCard key={p.id} p={p} t={t} />)}
                    {remaining > 0 && (
                      <div className="p-5 rounded-2xl opacity-60" style={{ background: 'var(--surface-container-low)' }}>
                        <p className="text-center text-xs font-medium text-pretty" style={{ color: 'var(--on-surface-variant)' }}>
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
      </div>
      </div>
    </div>
  );
}
