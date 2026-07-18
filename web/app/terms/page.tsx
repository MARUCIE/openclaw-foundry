'use client';

import Link from 'next/link';
import { useI18n } from '@/lib/i18n';

type Section = { h: string; body: string[] };

const CONTENT: Record<'en' | 'zh', { title: string; updated: string; intro: string; sections: Section[] }> = {
  en: {
    title: 'Terms of Service',
    updated: 'Last updated: 2026-07-16',
    intro:
      'These terms govern your use of Agent Foundry, a marketplace of job-oriented agent skill packs. By using the site you agree to them.',
    sections: [
      {
        h: 'The service',
        body: [
          'Agent Foundry curates and lets you install agent skill packs. We aim for accuracy but provide the catalog "as is" without warranty that any pack fits your specific use.',
        ],
      },
      {
        h: 'Acceptable use',
        body: [
          'Do not abuse the API, attempt to break authentication, scrape at rates that degrade the service, or use installed packs for unlawful activity.',
          'Skill packs may execute on systems you control — review each pack’s permission manifest before you deploy it. You are responsible for what you run.',
        ],
      },
      {
        h: 'Accounts',
        body: [
          'Sign-in is passwordless. Keep access to your email secure; a valid sign-in link grants access to your account.',
          'We may suspend accounts that violate these terms or threaten the security of the service.',
        ],
      },
      {
        h: 'Content and IP',
        body: [
          'Curated pack metadata and the site design are ours or our licensors’. Third-party skill packs remain the property of their authors under their own licenses, shown on each pack.',
        ],
      },
      {
        h: 'Liability',
        body: [
          'To the extent permitted by law, Agent Foundry is not liable for indirect or consequential loss arising from use of the catalog or installed packs.',
        ],
      },
      {
        h: 'Changes and contact',
        body: [
          'We may update these terms; material changes will be dated at the top. Questions: maurice_wen@proton.me',
        ],
      },
    ],
  },
  zh: {
    title: '服务条款',
    updated: '最后更新：2026-07-16',
    intro:
      '本条款约束你对 Agent Foundry 的使用——一个面向岗位的 Agent 技能包市场。使用本站即表示你同意本条款。',
    sections: [
      {
        h: '服务内容',
        body: [
          'Agent Foundry 策展并支持你安装 Agent 技能包。我们力求准确，但目录按“现状”提供，不保证任何技能包适配你的特定用途。',
        ],
      },
      {
        h: '可接受使用',
        body: [
          '不得滥用 API、尝试破解身份验证、以损害服务的速率抓取，或将已安装的技能包用于违法活动。',
          '技能包可能在你所控制的系统上执行——部署前请审阅每个技能包的权限清单。你对所运行的内容负责。',
        ],
      },
      {
        h: '账号',
        body: [
          '登录为免密方式。请妥善保管你的邮箱访问权限；有效的登录链接即可访问你的账号。',
          '对违反本条款或威胁服务安全的账号，我们可予以暂停。',
        ],
      },
      {
        h: '内容与知识产权',
        body: [
          '策展的技能包元数据与站点设计归我们或我们的许可方所有。第三方技能包依其各自许可归其作者所有，许可信息展示于每个技能包页面。',
        ],
      },
      {
        h: '责任限制',
        body: [
          '在法律允许的范围内，Agent Foundry 不对因使用目录或已安装技能包而产生的间接或后果性损失负责。',
        ],
      },
      {
        h: '变更与联系',
        body: [
          '我们可能更新本条款；重大变更将在顶部标注日期。疑问请联系：maurice_wen@proton.me',
        ],
      },
    ],
  },
};

export default function TermsPage() {
  const { locale } = useI18n();
  const c = CONTENT[locale] ?? CONTENT.en;

  return (
    <main className="page-shell py-16" style={{ fontFamily: 'var(--font-inter), system-ui, sans-serif' }}>
      <div className="flex flex-col gap-3 mb-10">
        <Link
          href="/"
          className="text-sm transition-colors hover:text-[var(--surface-tint)]"
          style={{ color: 'var(--on-surface-variant)' }}
        >
          ← Agent Foundry
        </Link>
        <h1 className="text-3xl font-bold" style={{ color: 'var(--on-surface)' }}>
          {c.title}
        </h1>
        <span className="text-xs" style={{ color: 'var(--outline)' }}>
          {c.updated}
        </span>
      </div>

      <p className="text-base leading-relaxed mb-10" style={{ color: 'var(--on-surface-variant)', maxWidth: '70ch' }}>
        {c.intro}
      </p>

      <div className="flex flex-col gap-8" style={{ maxWidth: '70ch' }}>
        {c.sections.map(s => (
          <section key={s.h} className="flex flex-col gap-3">
            <h2 className="text-lg font-semibold" style={{ color: 'var(--on-surface)' }}>
              {s.h}
            </h2>
            {s.body.map((p, i) => (
              <p key={i} className="text-sm leading-relaxed" style={{ color: 'var(--on-surface-variant)' }}>
                {p}
              </p>
            ))}
          </section>
        ))}
      </div>
    </main>
  );
}
