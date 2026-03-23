'use client';

import { useState } from 'react';
import { useI18n } from '@/lib/i18n';

const TAB_KEYS = ['news.tab.all', 'news.tab.releases', 'news.tab.industry', 'news.tab.tutorials', 'news.tab.community'] as const;
const TAB_CATEGORIES: Record<string, string> = {
  'news.tab.releases': '版本更新',
  'news.tab.industry': '行业动态',
  'news.tab.tutorials': '教程',
  'news.tab.community': '社区精选',
};

const FEATURED = {
  tag: 'GITHUB RELEASE', tagColor: 'bg-blue-100 text-blue-700',
  date: '2026-03-20',
  title: 'OpenClaw 2.0 正式发布：全面支持 MCP 协议',
  desc: '全新架构支持插件化扩展！OpenClaw v2.0 正式引入 Model Context Protocol (MCP)，实现 Agent 与工具链的无缝对接，大幅提升开发效率与生态兼容性。',
};

const NEWS_FEED = [
  { tag: 'IT之家', tagColor: 'bg-red-100 text-red-600', date: '2026-03-21', title: '火山引擎 ArkClaw 推出飞书深度集成，企业用户免费试用', desc: '飞书飞工作台配件，企业开发者可以直接出 ArkClaw 直接 IM 界面中调度所有 AI Agent 任务。', category: '行业动态' },
  { tag: '36KR', tagColor: 'bg-orange-100 text-orange-600', date: '2026-03-20', title: '百度 DuClaw 上线千机平台，接入文心/DeepSeek/Qwen 三大模型', desc: 'DuClaw 完成多模型通道无缝衔接，开发者可以一套代码对接三大模型厂商入大规模推理产力。', category: '行业动态' },
  { tag: 'GITHUB', tagColor: 'bg-slate-100 text-slate-600', date: '2026-03-20', title: 'HiClaw v1.2 发布：新增 Matrix SDK + Higress 管理 API', desc: '此次更新新增 7 款兑积的 AI 调度能力，通过 Higress API 实现了更精准稳定的请求路由机制管理。', category: '版本更新' },
  { tag: 'TECHNODE', tagColor: 'bg-purple-100 text-purple-600', date: '2026-03-18', title: '腾讯 QClaw 全面公测：QQ 端 AI Agent 正式面向大众', desc: 'QClaw 终端已连续 AI 领域的开发大门端，支持一键开启 OpenClaw Agent 插件 QQ 机器入。', category: '版本更新' },
  { tag: '机器之心', tagColor: 'bg-green-100 text-green-600', date: '2026-03-17', title: '智谱 AutoClaw CLI 模式深度测评：一键无人值守部署', desc: '测试显示 AutoClaw CLI 在各角色前提场景下的部署效率领跑同类 400%。', category: '教程' },
  { tag: '社区', tagColor: 'bg-yellow-100 text-yellow-700', date: '2026-03-17', title: 'OpenClaw + MiniMax M2.5：MaxClaw 实测报告', desc: '社区开发者报告了使用 MiniMax 最新锻型进一步提高实效客户 Agent 的全过程与集效力。', category: '社区精选' },
];

const VERSION_TRACKER = [
  { name: 'OpenClaw', version: 'v2.4.0', date: '2026-03-20' },
  { name: 'HiClaw', version: 'v1.2', date: '2026-03-19' },
  { name: 'CoPaw', version: 'v0.8.1', date: '2026-03-18' },
  { name: 'AutoClaw', version: 'v1.5.0', date: '2026-03-17' },
  { name: 'ArkClaw', version: 'v1.2 GA', date: '2026-03-15' },
  { name: 'DuClaw', version: 'v1.0', date: '2026-03-11' },
];

const TAGS = ['#MCP', '#飞书', '#一键部署', '#Skills', '#ClawHub', '#自动化', '#开源', '#企业'];

export default function NewsPage() {
  const { t } = useI18n();
  const [activeTab, setActiveTab] = useState<string>('news.tab.all');

  const filtered = activeTab === 'news.tab.all'
    ? NEWS_FEED
    : NEWS_FEED.filter(n => n.category === TAB_CATEGORIES[activeTab]);

  return (
    <div className="max-w-7xl mx-auto px-6 py-12">
      {/* Header */}
      <div className="mb-10">
        <h1
          className="text-4xl font-extrabold mb-4"
          style={{ fontFamily: 'Manrope, sans-serif', color: 'var(--on-surface)' }}
        >
          {t('news.title')}
        </h1>
        <p className="text-lg" style={{ color: 'var(--on-surface-variant)' }}>
          {t('news.subtitle')}
        </p>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 flex-wrap mb-10">
        {TAB_KEYS.map(tabKey => (
          <button
            key={tabKey}
            onClick={() => setActiveTab(tabKey)}
            className="px-4 py-2 rounded-full text-sm font-bold transition-all"
            style={{
              background: activeTab === tabKey ? 'var(--primary)' : 'var(--surface-container)',
              color: activeTab === tabKey ? 'var(--on-primary)' : 'var(--on-surface-variant)',
            }}
          >
            {t(tabKey)}
          </button>
        ))}
      </div>

      {/* Featured Article */}
      <section
        className="rounded-3xl overflow-hidden mb-12 flex flex-col md:flex-row"
        style={{ background: 'var(--surface-container-lowest)', border: '1px solid rgba(195, 198, 215, 0.3)' }}
      >
        <div className="md:w-3/5 p-8 md:p-12 flex flex-col justify-center space-y-5" style={{ borderLeft: '4px solid var(--primary-container)' }}>
          <div className="flex items-center gap-3">
            <span className={`px-3 py-1 text-[10px] font-bold rounded-full uppercase ${FEATURED.tagColor}`}>{FEATURED.tag}</span>
            <span className="text-xs" style={{ color: 'var(--on-surface-variant)' }}>{FEATURED.date}</span>
          </div>
          <h2
            className="text-3xl font-extrabold leading-tight"
            style={{ fontFamily: 'Manrope, sans-serif', color: 'var(--primary)' }}
          >
            {FEATURED.title}
          </h2>
          <p className="text-lg leading-relaxed" style={{ color: 'var(--on-surface-variant)' }}>{FEATURED.desc}</p>
          <a href="#" className="font-bold text-sm inline-flex items-center gap-2 hover:translate-x-1 transition-transform" style={{ color: 'var(--primary)' }}>
            {t('news.readMore')} <span className="material-symbols-outlined text-sm">arrow_forward</span>
          </a>
        </div>
        <div
          className="md:w-2/5 h-64 md:h-auto flex flex-col items-center justify-center relative overflow-hidden"
          style={{ background: 'linear-gradient(135deg, #003ea8, #1a1c2e)' }}
        >
          {/* Decorative diagonal lines */}
          <div className="absolute inset-0 opacity-20" style={{ backgroundImage: 'repeating-linear-gradient(45deg, transparent, transparent 20px, rgba(255,255,255,0.1) 20px, rgba(255,255,255,0.1) 21px)' }} />
          <div className="relative z-10 text-center space-y-3 p-8">
            <div className="text-5xl font-black text-white/30 italic" style={{ fontFamily: 'Manrope, sans-serif' }}>NEWS</div>
            <div className="text-sm text-white/50 tracking-widest uppercase">OpenClaw Foundry</div>
          </div>
        </div>
      </section>

      {/* Two-column layout */}
      <div className="flex flex-col lg:flex-row gap-10">
        {/* Left: News feed */}
        <div className="flex-1 space-y-1">
          {filtered.map((n, i) => (
            <article
              key={i}
              className="p-6 rounded-2xl transition-colors cursor-pointer"
              style={{ borderBottom: i < filtered.length - 1 ? '1px solid rgba(195, 198, 215, 0.2)' : 'none' }}
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'var(--surface-container-low)'; }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'transparent'; }}
            >
              <div className="flex items-center gap-3 mb-3">
                <span className={`px-3 py-1 text-[10px] font-bold rounded-full uppercase ${n.tagColor}`}>{n.tag}</span>
                <span className="text-xs" style={{ color: 'var(--on-surface-variant)' }}>{n.date}</span>
              </div>
              <h3 className="font-bold text-lg mb-2 transition-colors" style={{ color: 'var(--on-surface)' }}>{n.title}</h3>
              <p className="text-sm line-clamp-2" style={{ color: 'var(--on-surface-variant)' }}>{n.desc}</p>
            </article>
          ))}
        </div>

        {/* Right: Sidebar widgets */}
        <aside className="w-full lg:w-80 shrink-0 space-y-8">
          {/* Version Tracker */}
          <div className="p-6 rounded-2xl" style={{ background: 'var(--surface-container-lowest)', border: '1px solid rgba(195, 198, 215, 0.2)' }}>
            <h3 className="font-bold mb-4" style={{ fontFamily: 'Manrope, sans-serif', color: 'var(--on-surface)' }}>{t('news.versionTracker')}</h3>
            <div className="space-y-3">
              {VERSION_TRACKER.map(v => (
                <div key={v.name} className="flex justify-between items-center py-2" style={{ borderBottom: '1px solid rgba(195, 198, 215, 0.15)' }}>
                  <div>
                    <span className="text-sm font-bold" style={{ color: 'var(--on-surface)' }}>{v.name}</span>
                    <span className="ml-2 text-xs" style={{ color: 'var(--primary)' }}>{v.version}</span>
                  </div>
                  <span className="text-xs" style={{ color: 'var(--on-surface-variant)' }}>{v.date}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Tags */}
          <div className="p-6 rounded-2xl" style={{ background: 'var(--surface-container-lowest)', border: '1px solid rgba(195, 198, 215, 0.2)' }}>
            <h3 className="font-bold mb-4" style={{ fontFamily: 'Manrope, sans-serif', color: 'var(--on-surface)' }}>{t('news.popularTags')}</h3>
            <div className="flex flex-wrap gap-2">
              {TAGS.map(tag => (
                <span
                  key={tag}
                  className="px-3 py-1.5 rounded-full text-xs font-bold cursor-pointer transition-colors"
                  style={{ background: 'var(--surface-container)', color: 'var(--on-surface-variant)' }}
                >
                  {tag}
                </span>
              ))}
            </div>
          </div>

          {/* Subscribe */}
          <div
            className="p-6 rounded-2xl text-center space-y-4"
            style={{ background: 'var(--primary-container)', color: 'var(--on-primary)' }}
          >
            <span className="material-symbols-outlined text-3xl" style={{ fontVariationSettings: "'FILL' 1" }}>mail</span>
            <h3 className="font-bold" style={{ fontFamily: 'Manrope, sans-serif' }}>{t('news.subscribe')}</h3>
            <p className="text-xs opacity-80">{t('news.newsletter')}</p>
            <input
              type="email"
              placeholder="your@email.com"
              className="w-full rounded-lg py-2 px-3 text-sm text-[var(--on-surface)]"
              style={{ background: 'rgba(255,255,255,0.9)', border: 'none' }}
            />
            <button
              className="w-full py-2 rounded-lg text-sm font-bold transition-opacity hover:opacity-90"
              style={{ background: 'white', color: 'var(--primary)' }}
            >
              {t('news.subscribe')}
            </button>
          </div>
        </aside>
      </div>
    </div>
  );
}
