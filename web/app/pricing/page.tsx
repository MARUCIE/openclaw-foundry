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
    bg: 'var(--primary-fixed)',
    titleKey: 'pricing.individual',
    subtitle: 'OpenClaw + QClaw',
    descKey: 'pricing.individual.desc',
    ctaKey: 'pricing.startFree',
  },
  {
    icon: 'groups',
    bg: 'var(--secondary-fixed)',
    titleKey: 'pricing.team',
    subtitle: 'HiClaw + ArkClaw',
    descKey: 'pricing.team.desc',
    ctaKey: 'pricing.contactSales',
    popular: true,
  },
  {
    icon: 'apartment',
    bg: 'var(--tertiary-fixed)',
    titleKey: 'pricing.enterprise',
    subtitle: 'Huawei Cloud + Alibaba Cloud',
    descKey: 'pricing.enterprise.desc',
    ctaKey: 'pricing.contactSales',
  },
];

/* ── Merged type for table rendering ── */
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
    <div className="max-w-7xl mx-auto px-6 py-12">
      {/* Header */}
      <div className="text-center mb-16 space-y-4">
        <h1
          className="text-3xl md:text-4xl font-extrabold"
          style={{ fontFamily: 'Manrope, sans-serif', color: 'var(--on-surface)' }}
        >
          {t('pricing.title')}
        </h1>
        <p className="text-lg max-w-2xl mx-auto" style={{ color: 'var(--on-surface-variant)' }}>
          {t('pricing.subtitle', { count: platforms.length || 12 })}
        </p>
      </div>

      {/* Comparison Table */}
      {isLoading ? (
        <div className="h-64 rounded-2xl animate-pulse mb-20" style={{ background: 'var(--surface-container)' }} />
      ) : (
        <section className="mb-20">
          <div className="md:hidden text-center mb-3 text-xs font-medium flex items-center justify-center gap-1" style={{ color: 'var(--on-surface-variant)' }}>
            <span className="material-symbols-outlined text-sm">swipe</span>
            {t('pricing.swipeHint')}
          </div>
          <div className="overflow-x-auto rounded-2xl" style={{ border: '1px solid rgba(195, 198, 215, 0.3)' }}>
          <table className="w-full text-sm" style={{ minWidth: `${100 + platforms.length * 120}px` }}>
            <thead>
              <tr style={{ background: 'var(--surface-container)' }}>
                <th className="text-left p-4 font-bold sticky left-0 z-10 text-xs uppercase tracking-wider" style={{ background: 'var(--surface-container)', color: 'var(--on-surface-variant)', minWidth: '100px' }}>
                  {t('pricing.comparison')}
                </th>
                {platforms.map(p => (
                  <th key={p.id} className="p-4 text-center font-bold relative" style={{ color: 'var(--on-surface)', minWidth: '110px', background: p.recommended ? 'rgba(0, 62, 168, 0.1)' : undefined }}>
                    {p.name}
                    {p.recommended && (
                      <span className="block text-[9px] font-bold mt-1 px-2 py-0.5 rounded-full mx-auto w-fit" style={{ background: 'var(--primary)', color: 'var(--on-primary)' }}>
                        {t('pricing.recommended')}
                      </span>
                    )}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {/* Type */}
              <tr style={{ borderTop: '1px solid rgba(195, 198, 215, 0.2)' }}>
                <td className="p-4 font-bold text-xs uppercase tracking-wider sticky left-0" style={{ background: 'var(--surface-container-lowest)', color: 'var(--on-surface-variant)' }}>{t('pricing.type')}</td>
                {platforms.map(p => (
                  <td key={p.id} className="p-4 text-center text-xs" style={{ background: p.recommended ? 'rgba(0, 62, 168, 0.07)' : 'var(--surface-container-lowest)', color: 'var(--on-surface)' }}>{p.type}</td>
                ))}
              </tr>
              {/* Tier */}
              <tr style={{ borderTop: '1px solid rgba(195, 198, 215, 0.2)' }}>
                <td className="p-4 font-bold text-xs uppercase tracking-wider sticky left-0" style={{ background: 'var(--surface-container-lowest)', color: 'var(--on-surface-variant)' }}>{t('pricing.tier')}</td>
                {platforms.map(p => {
                  const tierInfo = TIER_CONFIG[p.tier] || TIER_CONFIG.guided;
                  return (
                    <td key={p.id} className="p-4 text-center" style={{ background: p.recommended ? 'rgba(0, 62, 168, 0.07)' : 'var(--surface-container-lowest)' }}>
                      <span className="inline-flex items-center gap-1.5 text-xs">
                        <span className="w-2 h-2 rounded-full" style={{ background: tierInfo.dot }} />
                        {t(tierInfo.labelKey)}
                      </span>
                    </td>
                  );
                })}
              </tr>
              {/* Price */}
              <tr style={{ borderTop: '1px solid rgba(195, 198, 215, 0.2)' }}>
                <td className="p-4 font-bold text-xs uppercase tracking-wider sticky left-0" style={{ background: 'var(--surface-container-lowest)', color: 'var(--on-surface-variant)' }}>{t('pricing.price')}</td>
                {platforms.map(p => (
                  <td key={p.id} className="p-4 text-center text-xs font-bold" style={{ background: p.recommended ? 'rgba(0, 62, 168, 0.07)' : 'var(--surface-container-lowest)', color: 'var(--primary)' }}>{p.price}</td>
                ))}
              </tr>
              {/* Model */}
              <tr style={{ borderTop: '1px solid rgba(195, 198, 215, 0.2)' }}>
                <td className="p-4 font-bold text-xs uppercase tracking-wider sticky left-0" style={{ background: 'var(--surface-container-lowest)', color: 'var(--on-surface-variant)' }}>{t('pricing.model')}</td>
                {platforms.map(p => (
                  <td key={p.id} className="p-4 text-center text-xs" style={{ background: p.recommended ? 'rgba(0, 62, 168, 0.07)' : 'var(--surface-container-lowest)', color: 'var(--on-surface)' }}>{p.model}</td>
                ))}
              </tr>
              {/* Skills */}
              <tr style={{ borderTop: '1px solid rgba(195, 198, 215, 0.2)' }}>
                <td className="p-4 font-bold text-xs uppercase tracking-wider sticky left-0" style={{ background: 'var(--surface-container-lowest)', color: 'var(--on-surface-variant)' }}>{t('pricing.skills')}</td>
                {platforms.map(p => (
                  <td key={p.id} className="p-4 text-center text-xs font-bold" style={{ background: p.recommended ? 'rgba(0, 62, 168, 0.07)' : 'var(--surface-container-lowest)', color: 'var(--on-surface)' }}>{p.skills}</td>
                ))}
              </tr>
              {/* IM */}
              <tr style={{ borderTop: '1px solid rgba(195, 198, 215, 0.2)' }}>
                <td className="p-4 font-bold text-xs uppercase tracking-wider sticky left-0" style={{ background: 'var(--surface-container-lowest)', color: 'var(--on-surface-variant)' }}>{t('pricing.im')}</td>
                {platforms.map(p => (
                  <td key={p.id} className="p-4 text-center text-xs" style={{ background: p.recommended ? 'rgba(0, 62, 168, 0.07)' : 'var(--surface-container-lowest)', color: 'var(--on-surface)' }}>{p.im}</td>
                ))}
              </tr>
              {/* Open Source */}
              <tr style={{ borderTop: '1px solid rgba(195, 198, 215, 0.2)' }}>
                <td className="p-4 font-bold text-xs uppercase tracking-wider sticky left-0" style={{ background: 'var(--surface-container-lowest)', color: 'var(--on-surface-variant)' }}>{t('pricing.openSource')}</td>
                {platforms.map(p => (
                  <td key={p.id} className="p-4 text-center" style={{ background: p.recommended ? 'rgba(0, 62, 168, 0.07)' : 'var(--surface-container-lowest)' }}>
                    <span className="material-symbols-outlined text-lg" style={{ color: p.opensource ? 'var(--on-tertiary-container)' : 'var(--outline-variant)', fontVariationSettings: "'FILL' 1" }}>
                      {p.opensource ? 'check_circle' : 'cancel'}
                    </span>
                  </td>
                ))}
              </tr>
              {/* Actions */}
              <tr style={{ borderTop: '1px solid rgba(195, 198, 215, 0.2)' }}>
                <td className="p-4 sticky left-0" style={{ background: 'var(--surface-container-lowest)' }} />
                {platforms.map(p => (
                  <td key={p.id} className="p-4 text-center" style={{ background: p.recommended ? 'rgba(0, 62, 168, 0.07)' : 'var(--surface-container-lowest)' }}>
                    <Link
                      href={`/deploy?provider=${p.id}`}
                      className="inline-block px-3 py-1.5 rounded-lg text-xs font-bold transition-opacity hover:opacity-90"
                      style={{
                        background: p.recommended ? 'var(--primary-container)' : 'var(--surface-container)',
                        color: p.recommended ? 'var(--on-primary)' : 'var(--on-surface-variant)',
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
        </section>
      )}

      {/* Recommendation Cards */}
      <section className="mb-20">
        <h2
          className="text-3xl font-extrabold text-center mb-12"
          style={{ fontFamily: 'Manrope, sans-serif', color: 'var(--on-surface)' }}
        >
          {t('pricing.notSure')}
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {RECOMMENDATIONS.map(rec => (
            <div
              key={rec.titleKey}
              className="p-8 rounded-2xl relative transition-all card-hover"
              style={{
                background: 'var(--surface-container-lowest)',
                border: '1px solid rgba(195, 198, 215, 0.3)',
              }}
            >
              {rec.popular && (
                <span
                  className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider"
                  style={{ background: 'var(--secondary)', color: 'var(--on-secondary)' }}
                >
                  Popular
                </span>
              )}
              <div
                className="w-16 h-16 rounded-2xl flex items-center justify-center mb-6"
                style={{ background: rec.bg }}
              >
                <span className="material-symbols-outlined text-3xl" style={{ color: 'var(--on-surface)' }}>{rec.icon}</span>
              </div>
              <h3
                className="text-xl font-bold mb-2"
                style={{ fontFamily: 'Manrope, sans-serif', color: 'var(--on-surface)' }}
              >
                {t(rec.titleKey)}
              </h3>
              <p className="text-sm font-bold mb-3" style={{ color: 'var(--primary)' }}>{rec.subtitle}</p>
              <p className="text-sm mb-6 leading-relaxed" style={{ color: 'var(--on-surface-variant)' }}>{t(rec.descKey)}</p>
              <Link
                href="/deploy"
                className="block w-full text-center py-3 rounded-xl font-bold text-sm transition-opacity hover:opacity-90"
                style={{ background: 'var(--primary-container)', color: 'var(--on-primary)' }}
              >
                {t(rec.ctaKey)}
              </Link>
            </div>
          ))}
        </div>
      </section>

      {/* Enterprise CTA */}
      <section
        className="rounded-2xl p-12 md:p-20 text-center space-y-6"
        style={{ background: 'linear-gradient(135deg, var(--primary), var(--secondary), var(--primary-container))' }}
      >
        <h2
          className="text-2xl md:text-3xl font-extrabold text-white"
          style={{ fontFamily: 'Manrope, sans-serif' }}
        >
          {t('pricing.enterpriseCTA')}
        </h2>
        <p className="text-lg text-white/80 max-w-2xl mx-auto">
          {t('pricing.enterpriseDesc')}
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center pt-4">
          <a
            href="mailto:maurice_wen@proton.me?subject=OpenClaw%20Enterprise%20Inquiry"
            className="px-10 py-3 rounded-xl font-bold text-sm transition-all hover:bg-blue-50 inline-flex items-center gap-2"
            style={{ background: 'white', color: 'var(--primary)', fontFamily: 'Manrope, sans-serif' }}
          >
            <span className="material-symbols-outlined text-sm">mail</span>
            {t('pricing.getSolution')}
          </a>
        </div>
      </section>
    </div>
  );
}
