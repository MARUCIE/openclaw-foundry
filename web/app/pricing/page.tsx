
'use client';

import Link from 'next/link';
import useSWR from 'swr';
import { getProviders, type ProviderMeta, type ProviderTier } from '@/lib/api';
import { useI18n } from '@/lib/i18n';
import { TIER_CONFIG } from '@/lib/constants';
import { PRICING_META } from '@/lib/pricing-data';

const RECOMMENDATIONS = [
  {
    icon: 'person',
    bg: 'var(--primary-container)',
    color: 'var(--primary)',
    titleKey: 'pricing.individual',
    subtitle: 'OpenClaw + QClaw',
    descKey: 'pricing.individual.desc',
    ctaKey: 'pricing.startFree',
  },
  {
    icon: 'groups',
    bg: 'var(--secondary-container)',
    color: 'var(--secondary)',
    titleKey: 'pricing.team',
    subtitle: 'HiClaw + ArkClaw',
    descKey: 'pricing.team.desc',
    ctaKey: 'pricing.contactSales',
    popular: true,
  },
  {
    icon: 'apartment',
    bg: 'var(--tertiary-container)',
    color: 'var(--tertiary)',
    titleKey: 'pricing.enterprise',
    subtitle: 'Huawei Cloud + Alibaba Cloud',
    descKey: 'pricing.enterprise.desc',
    ctaKey: 'pricing.contactSales',
  },
];

interface PricingRow {
  id: string;
  name: string;
  tier: ProviderTier;
  type: string;
  price: string;
  model: string;
  skills: string;
  im: string;
  opensource: boolean;
  recommended: boolean;
}

function mergeData(providers: ProviderMeta[]): PricingRow[] {
  return providers.map(p => {
    const meta = PRICING_META[p.id] || { type: p.type, price: '--', model: '--', skills: '--', im: '--', opensource: false };
    return {
      id: p.id,
      name: p.name,
      tier: p.tier,
      type: meta.type,
      price: meta.price,
      model: meta.model,
      skills: meta.skills,
      im: meta.im,
      opensource: meta.opensource,
      recommended: meta.recommended || false,
    };
  });
}

export default function PricingPage() {
  const { t } = useI18n();
  const { data, isLoading } = useSWR('providers', () => getProviders());
  const platforms = data ? mergeData(data.providers) : [];

  return (
    <div className="page-shell py-12 space-y-20">
      {/* Header */}
      <div className="text-center space-y-6">
        <h1 className="text-4xl md:text-6xl font-black tracking-tight text-balance" style={{ color: 'var(--on-surface)' }}>
          {t('pricing.title')}
        </h1>
        <p className="text-xl font-medium opacity-60 max-w-2xl mx-auto leading-relaxed text-pretty">
          {t('pricing.subtitle', { count: platforms.length || 12 })}
        </p>
      </div>

      {/* Comparison Table */}
      {isLoading ? (
        <div className="h-96 rounded-[3rem] animate-pulse bg-[var(--surface-container-low)]" />
      ) : (
        <section className="space-y-8">
          <div className="md:hidden flex items-center justify-center gap-2 text-[var(--af-fs-meta)] font-black uppercase tracking-[0.2em] opacity-40">
            <span className="material-symbols-outlined text-lg">swipe</span>
            {t('pricing.swipeHint')}
          </div>
          
          <div className="rounded-[2.5rem] border border-[var(--outline-variant)] bg-[var(--surface-container-lowest)] shadow-sm overflow-hidden">
            <div className="overflow-x-auto scrollbar-hide">
              <table className="w-full text-left border-collapse" style={{ minWidth: `${200 + platforms.length * 160}px` }}>
                <thead>
                  <tr>
                    <th className="p-8 sticky left-0 z-20 bg-[var(--surface-container-lowest)] border-b border-[var(--outline-variant)]">
                      <span className="text-[var(--af-fs-meta)] font-black uppercase tracking-[0.2em] opacity-40">{t('pricing.comparison')}</span>
                    </th>
                    {platforms.map(p => (
                      <th key={p.id} className={`p-8 border-b border-[var(--outline-variant)] relative ${p.recommended ? 'bg-[var(--primary-container)]/20' : ''}`}>
                        <div className="space-y-2">
                          <span className="block text-sm font-black tracking-tight">{p.name}</span>
                          {p.recommended && (
                            <span className="inline-block text-[var(--af-fs-micro)] font-black uppercase tracking-widest px-2 py-0.5 rounded bg-[var(--primary)] text-white">
                              {t('pricing.recommended')}
                            </span>
                          )}
                        </div>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--outline-variant)]">
                  <TableRow label={t('pricing.type')} data={platforms.map(p => p.type)} recommendedIndices={platforms.map(p => p.recommended)} />
                  <TableRow label={t('pricing.tier')} data={platforms.map(p => {
                    const tierInfo = TIER_CONFIG[p.tier] || TIER_CONFIG.guided;
                    return (
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full" style={{ background: tierInfo.dot }} />
                        <span className="font-bold">{t(tierInfo.labelKey)}</span>
                      </div>
                    );
                  })} recommendedIndices={platforms.map(p => p.recommended)} />
                  <TableRow label={t('pricing.price')} data={platforms.map(p => <span className="font-black text-[var(--primary)]">{p.price}</span>)} recommendedIndices={platforms.map(p => p.recommended)} />
                  <TableRow label={t('pricing.model')} data={platforms.map(p => p.model)} recommendedIndices={platforms.map(p => p.recommended)} />
                  <TableRow label={t('pricing.skills')} data={platforms.map(p => <span className="font-bold">{p.skills}</span>)} recommendedIndices={platforms.map(p => p.recommended)} />
                  <TableRow label={t('pricing.im')} data={platforms.map(p => p.im)} recommendedIndices={platforms.map(p => p.recommended)} />
                  <TableRow label={t('pricing.openSource')} data={platforms.map(p => (
                    <span className={`material-symbols-outlined font-black ${p.opensource ? 'text-[var(--tertiary)]' : 'opacity-20'}`}>
                      {p.opensource ? 'check_circle' : 'cancel'}
                    </span>
                  ))} recommendedIndices={platforms.map(p => p.recommended)} />
                  {/* Actions */}
                  <tr>
                    <td className="p-8 sticky left-0 z-10 bg-[var(--surface-container-lowest)]" />
                    {platforms.map(p => (
                      <td key={p.id} className={`p-8 ${p.recommended ? 'bg-[var(--primary-container)]/10' : ''}`}>
                        <Link
                          href={`/deploy?provider=${p.id}`}
                          className="inline-flex px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all hover:shadow-lg active:scale-95 whitespace-nowrap"
                          style={{
                            background: p.recommended ? 'var(--primary)' : 'var(--surface-container-high)',
                            color: p.recommended ? 'white' : 'var(--on-surface-variant)',
                          }}
                        >
                          {p.recommended ? t('pricing.useNow') : t('pricing.learnMore')}
                        </Link>
                      </td>
                    ))}
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </section>
      )}

      {/* Recommendation Cards */}
      <section className="space-y-12">
        <h2 className="text-3xl md:text-4xl font-black text-center tracking-tight text-balance" style={{ color: 'var(--on-surface)' }}>
          {t('pricing.notSure')}
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {RECOMMENDATIONS.map(rec => (
            <div
              key={rec.titleKey}
              className={`p-10 rounded-[3rem] relative transition-all border-2 group hover:shadow-2xl hover:-translate-y-1 ${rec.popular ? 'border-[var(--primary)] shadow-xl' : 'border-[var(--outline-variant)] bg-[var(--surface-container-lowest)]'}`}
            >
              {rec.popular && (
                <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 px-6 py-1.5 rounded-full text-[var(--af-fs-meta)] font-black uppercase tracking-[0.2em] shadow-lg" style={{ background: 'var(--primary)', color: 'white' }}>
                  Best Value
                </div>
              )}
              <div
                className="w-20 h-20 rounded-3xl flex items-center justify-center mb-8 shadow-inner transition-transform group-hover:scale-110 group-hover:rotate-3"
                style={{ background: rec.bg, color: rec.color }}
              >
                <span className="material-symbols-outlined text-4xl font-black">{rec.icon}</span>
              </div>
              <h3 className="text-2xl font-black mb-2 tracking-tight text-balance">{t(rec.titleKey)}</h3>
              <p className="text-sm font-black uppercase tracking-widest mb-4 opacity-40 text-pretty">{rec.subtitle}</p>
              <p className="text-base font-medium leading-relaxed mb-10 opacity-70 text-pretty">{t(rec.descKey)}</p>
              <Link
                href="/explore/platforms"
                className="block w-full text-center py-4 rounded-2xl font-black text-sm uppercase tracking-widest transition-all hover:shadow-xl active:scale-95 shadow-md"
                style={{ 
                  background: rec.popular ? 'var(--primary)' : 'var(--surface-container-high)',
                  color: rec.popular ? 'white' : 'var(--on-surface)'
                }}
              >
                {t(rec.ctaKey)}
              </Link>
            </div>
          ))}
        </div>
      </section>

      {/* Enterprise CTA */}
      <section
        className="rounded-[4rem] p-16 md:p-24 text-center space-y-8 relative overflow-hidden group shadow-2xl"
        style={{ background: 'linear-gradient(135deg, var(--primary), var(--secondary), var(--surface-tint))' }}
      >
        <div className="absolute -top-24 -left-24 w-96 h-96 bg-white opacity-5 rounded-full blur-3xl transition-transform group-hover:scale-150" />
        <div className="relative z-10 space-y-6">
          <h2 className="text-3xl md:text-5xl font-black text-white tracking-tight text-balance">{t('pricing.enterpriseCTA')}</h2>
          <p className="text-xl text-white/70 max-w-2xl mx-auto font-medium leading-relaxed text-pretty">{t('pricing.enterpriseDesc')}</p>
          <div className="pt-6">
            <a
              href="mailto:maurice_wen@proton.me?subject=OpenClaw%20Enterprise%20Inquiry"
              className="px-12 py-5 rounded-[2rem] font-black text-sm uppercase tracking-[0.2em] transition-all hover:bg-white hover:scale-105 active:scale-95 shadow-2xl inline-flex items-center gap-3"
              style={{ background: 'rgba(255,255,255,0.9)', color: 'var(--primary)' }}
            >
              <span className="material-symbols-outlined font-black">mail</span>
              {t('pricing.getSolution')}
            </a>
          </div>
        </div>
      </section>
    </div>
  );
}

function TableRow({ label, data, recommendedIndices }: { label: string; data: any[]; recommendedIndices: boolean[] }) {
  return (
    <tr>
      <td className="p-8 sticky left-0 z-10 bg-[var(--surface-container-lowest)] border-r border-[var(--outline-variant)]">
        <span className="text-[var(--af-fs-meta)] font-black uppercase tracking-[0.2em] opacity-40">{label}</span>
      </td>
      {data.map((val, i) => (
        <td key={i} className={`p-8 text-sm ${recommendedIndices[i] ? 'bg-[var(--primary-container)]/5' : ''}`}>
          {val}
        </td>
      ))}
    </tr>
  );
}
