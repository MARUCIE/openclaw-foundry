'use client';

import Link from 'next/link';
import { useI18n } from '@/lib/i18n';

const FOOTER_LINKS = [
  { href: '/docs', key: 'footer.docs' },
  { href: 'https://github.com/mauricewen/openclaw-foundry', key: null, label: 'GitHub' },
  { href: 'mailto:maurice_wen@proton.me', key: 'footer.contact' },
];

type EcosystemSite = {
  number: string;
  stage: string;
  name: string;
  url: string;
  href: string;
  description: string;
  audience: string;
  current?: boolean;
};

const ECOSYSTEM_SITES: EcosystemSite[] = [
  {
    number: '01',
    stage: '入门',
    name: 'ClaudePedia',
    url: 'claudepedia.cc',
    href: 'https://claudepedia.cc',
    description: 'AI 知识百科起点：从概念到实践的索引地图',
    audience: '新手 / 想系统理解 AI 工作流的人',
  },
  {
    number: '02',
    stage: '体系',
    name: 'Lingque Academy',
    url: 'lingque-academy.pages.dev',
    href: 'https://lingque-academy.pages.dev',
    description: 'AI 训战体系：14 周训练营 + 实战节奏',
    audience: '学员 / 想跟着节奏成长的人',
  },
  {
    number: '03',
    stage: '工具',
    name: 'SOTA Agent Hub',
    url: 'sota-agent-hub.pages.dev',
    href: 'https://sota-agent-hub.pages.dev',
    description: 'AI Agent 工具策展：最新 SOTA 资源精选',
    audience: '探索者 / 想追前沿工具的人',
  },
  {
    number: '04',
    stage: '实战',
    name: 'Agent Foundry',
    url: 'agent-foundry.pages.dev',
    href: '/',
    description: '当前站点：岗位 Agent 工具包一键安装',
    audience: '实战派 / 想立刻装上跑起来的人',
    current: true,
  },
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
      <div className="page-shell flex flex-col items-center gap-12">
        <section
          className="w-full flex flex-col items-center gap-6 px-4 py-8 rounded-2xl"
          style={{
            background: 'var(--surface-container-highest, rgba(220, 220, 235, 0.35))',
            borderTop: '2px solid var(--surface-tint, #6750A4)',
            borderTopColor: 'rgba(103, 80, 164, 0.45)',
          }}
        >
          <div className="flex flex-col items-center gap-2">
            <span
              className="text-xs uppercase tracking-[0.2em] font-semibold"
              style={{ color: 'var(--outline)', fontFamily: 'Inter, system-ui, sans-serif' }}
            >
              苍蓝舰队 · 四站生态
            </span>
            <span
              className="text-sm"
              style={{ color: 'var(--on-surface-variant)', fontFamily: 'Inter, system-ui, sans-serif' }}
            >
              从入门到实战的完整路径 · Pick the entry point that matches where you are
            </span>
          </div>

          <div className="w-full grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {ECOSYSTEM_SITES.map(site => (
              <Link
                key={site.url}
                href={site.href}
                target={site.current ? undefined : '_blank'}
                rel={site.current ? undefined : 'noopener noreferrer'}
                className="group flex flex-col gap-3 p-5 rounded-xl transition-all hover:-translate-y-0.5"
                style={{
                  background: site.current ? 'var(--surface-tint-container, var(--surface))' : 'var(--surface)',
                  border: site.current
                    ? '1.5px solid var(--surface-tint, #6750A4)'
                    : '1px solid rgba(195, 198, 215, 0.25)',
                  boxShadow: site.current
                    ? '0 4px 16px -8px rgba(103, 80, 164, 0.35)'
                    : '0 1px 3px rgba(0,0,0,0.04)',
                  fontFamily: 'Inter, system-ui, sans-serif',
                }}
              >
                <div className="flex items-baseline justify-between gap-2">
                  <span
                    className="text-2xl font-bold tabular-nums"
                    style={{ color: site.current ? 'var(--surface-tint, #6750A4)' : 'var(--outline)' }}
                  >
                    {site.number}
                  </span>
                  <span
                    className="text-xs uppercase tracking-wider font-semibold px-2 py-0.5 rounded"
                    style={{
                      background: site.current ? 'var(--surface-tint, #6750A4)' : 'rgba(195, 198, 215, 0.2)',
                      color: site.current ? 'white' : 'var(--on-surface-variant)',
                    }}
                  >
                    {site.stage}
                    {site.current ? ' · 当前' : ''}
                  </span>
                </div>
                <div className="flex flex-col gap-1">
                  <span
                    className="text-base font-bold leading-tight"
                    style={{ color: 'var(--on-surface)' }}
                  >
                    {site.name}
                  </span>
                  <span
                    className="text-xs font-mono"
                    style={{ color: 'var(--outline)' }}
                  >
                    {site.url}
                  </span>
                </div>
                <p
                  className="text-sm leading-relaxed"
                  style={{ color: 'var(--on-surface-variant)' }}
                >
                  {site.description}
                </p>
                <div
                  className="mt-auto pt-2 text-xs"
                  style={{
                    color: 'var(--outline)',
                    borderTop: '1px dashed rgba(195, 198, 215, 0.4)',
                  }}
                >
                  <span className="font-semibold">适合：</span>
                  {site.audience}
                </div>
              </Link>
            ))}
          </div>
        </section>

        <div className="w-full h-px" style={{ background: 'rgba(195, 198, 215, 0.3)' }} />

        <div className="flex flex-col items-center space-y-4">
          <span
            className="font-bold text-2xl tracking-tighter"
            style={{ fontFamily: 'Inter, system-ui, sans-serif', color: 'var(--on-surface)' }}
          >
            Agent Foundry
          </span>
          <div className="flex gap-6 text-sm font-semibold" style={{ fontFamily: 'Inter, system-ui, sans-serif' }}>
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

        <div className="flex flex-col md:flex-row justify-between w-full items-center gap-4 text-xs" style={{ color: 'var(--outline)', fontFamily: 'Inter, system-ui, sans-serif' }}>
          <div className="font-medium">Agent Foundry v4.0</div>
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
