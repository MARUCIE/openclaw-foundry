'use client';

import Link from 'next/link';
import { useI18n } from '@/lib/i18n';

const FOOTER_LINKS = [
  { href: '/about', key: 'footer.about' },
  { href: '/docs', key: 'footer.docs' },
  { href: 'https://github.com/MARUCIE/openclaw-foundry', key: null, label: 'GitHub' },
  { href: '/explore/skills', key: null, label: 'ClawHub' },
  { href: 'mailto:maurice_wen@proton.me', key: 'footer.contact' },
];

export function Footer() {
  const { t } = useI18n();

  return (
    <footer
      className="w-full pt-16 pb-12"
      style={{
        background: 'var(--surface-container-high)',
        borderTop: '1px solid var(--outline-variant)',
        borderTopColor: 'rgba(195, 198, 215, 0.3)',
      }}
    >
      <div className="max-w-7xl mx-auto px-6 flex flex-col items-center gap-10">
        <div className="flex flex-col items-center space-y-4">
          <span
            className="font-bold text-2xl tracking-tighter"
            style={{ fontFamily: 'Manrope, sans-serif', color: 'var(--on-surface)' }}
          >
            OpenClaw Foundry
          </span>
          <div className="flex gap-6 text-sm font-semibold" style={{ fontFamily: 'Manrope, sans-serif' }}>
            {FOOTER_LINKS.map(link => (
              <Link
                key={link.href}
                href={link.href}
                className="transition-colors hover:text-[var(--surface-tint)] hover:underline underline-offset-4"
                style={{ color: 'var(--on-surface-variant)' }}
              >
                {link.key ? t(link.key) : link.label}
              </Link>
            ))}
          </div>
        </div>

        <div className="w-full h-px" style={{ background: 'rgba(195, 198, 215, 0.3)' }} />

        <div className="flex flex-col md:flex-row justify-between w-full items-center gap-4 text-xs" style={{ color: 'var(--outline)', fontFamily: 'Manrope, sans-serif' }}>
          <div className="font-medium">OpenClaw Foundry v4.0</div>
          <div className="flex items-center gap-4">
            <span>{t('footer.privacy')}</span>
            <span>{t('footer.terms')}</span>
            <span>&copy; 2026</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
