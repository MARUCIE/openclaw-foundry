'use client';

import Link from 'next/link';
import { useI18n } from '@/lib/i18n';

type Section = { h: string; body: string[] };

const CONTENT: Record<'en' | 'zh', { title: string; updated: string; intro: string; sections: Section[] }> = {
  en: {
    title: 'Privacy Policy',
    updated: 'Last updated: 2026-07-16',
    intro:
      'Agent Foundry curates job-oriented agent skill packs. This policy explains what we collect, why, and the choices you have. We collect the minimum needed to run the marketplace and never sell personal data.',
    sections: [
      {
        h: 'What we collect',
        body: [
          'Account: the email address you use to request a magic sign-in link. We store a one-way hash of the sign-in token, never the plaintext link.',
          'Usage: which skill packs you view, install, or deploy, kept to operate and improve the catalog.',
          'Technical: standard request metadata (IP, user agent, timestamps) retained briefly for security and abuse prevention.',
        ],
      },
      {
        h: 'What we do NOT collect',
        body: [
          'No passwords — sign-in is passwordless (magic link or WeChat QR).',
          'No payment card data is stored by us; payments, if any, run through the provider you choose.',
          'No third-party ad-tracking pixels.',
        ],
      },
      {
        h: 'How we use it',
        body: [
          'To authenticate you, deliver purchased or installed packs, and keep the marketplace secure.',
          'To measure aggregate demand so the catalog surfaces the packs that matter. Aggregates are not tied back to your identity.',
        ],
      },
      {
        h: 'Your choices',
        body: [
          'Access or deletion: email maurice_wen@proton.me and we will remove your account data.',
          'Sign-in links expire in 15 minutes and are single-use.',
        ],
      },
      {
        h: 'Contact',
        body: ['Questions about this policy: maurice_wen@proton.me'],
      },
    ],
  },
  zh: {
    title: '隐私政策',
    updated: '最后更新：2026-07-16',
    intro:
      'Agent Foundry 策展面向岗位的 Agent 技能包。本政策说明我们收集什么、为何收集，以及你拥有的选择。我们只收集运行市场所必需的最少信息，绝不出售个人数据。',
    sections: [
      {
        h: '我们收集什么',
        body: [
          '账号：你用于获取免密登录链接的邮箱地址。我们仅存储登录令牌的单向哈希，绝不存储明文链接。',
          '使用记录：你浏览、安装或部署了哪些技能包，用于运营与改进目录。',
          '技术信息：标准请求元数据（IP、User Agent、时间戳），仅短期保留用于安全与防滥用。',
        ],
      },
      {
        h: '我们不收集什么',
        body: [
          '不收集密码——登录为免密方式（魔法链接或微信扫码）。',
          '我们不存储任何支付卡信息；如涉及支付，均通过你选择的服务商完成。',
          '不使用第三方广告追踪像素。',
        ],
      },
      {
        h: '我们如何使用',
        body: [
          '用于身份验证、交付你购买或安装的技能包、维护市场安全。',
          '用于统计聚合需求，让目录呈现真正重要的技能包。聚合数据不与你的身份关联。',
        ],
      },
      {
        h: '你的选择',
        body: [
          '访问或删除：发送邮件至 maurice_wen@proton.me，我们将删除你的账号数据。',
          '登录链接 15 分钟内失效，且一次性使用。',
        ],
      },
      {
        h: '联系',
        body: ['有关本政策的疑问：maurice_wen@proton.me'],
      },
    ],
  },
};

export default function PrivacyPage() {
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
