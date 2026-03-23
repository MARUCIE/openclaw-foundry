'use client';

import Link from 'next/link';
import useSWR from 'swr';
import { getProviders, getStats, type ProviderMeta, type ProviderTier } from '@/lib/api';

/* ── Static content (not from API) ── */

const SKILLS = [
  { icon: 'query_stats', name: '深度市场分析', installs: '2.4k', desc: '自动抓取主流财经媒体数据，生成多维度的市场情绪简报。' },
  { icon: 'translate', name: '术语精准翻译', installs: '1.8k', desc: '集成自研术语库，为科研和工程文档提供专家级的中英互译。' },
  { icon: 'code', name: '代码重构大师', installs: '4.1k', desc: '深度扫描遗留代码，根据最新的设计模式提供自动化重构建议。' },
  { icon: 'schedule', name: '智能日程编排', installs: '1.1k', desc: '跨平台同步日程，自动冲突检测并推荐最优的工作流路径。' },
  { icon: 'shield', name: '安全合规助手', installs: '900+', desc: '实时监测交互数据，确保符合企业级安全标准和隐私法规要求。' },
  { icon: 'psychology_alt', name: '创意思维导图', installs: '2.8k', desc: '通过自然语言交互，快速生成结构化的脑暴导图及初步方案。' },
];

const NEWS = [
  {
    featured: true,
    source: 'IT之家', sourceColor: 'bg-red-100 text-red-600',
    date: '2024年11月12日',
    title: 'OpenClaw 2.0 正式发布：全面支持 MCP 协议',
    desc: '全新架构支持插件化扩展，大幅提升 Agent 之间的协同效率，打通最后 1 公里...',
  },
  {
    source: '36kr', sourceColor: 'bg-orange-100 text-orange-600',
    date: '2024年11月10日',
    title: 'Foundry 与华为云达成战略协作',
    desc: '开发者现在可以通过 Foundry 控制台直接调用华为云计算资源...',
  },
  {
    source: 'GitHub', sourceColor: 'bg-slate-100 text-slate-600',
    date: '2024年11月08日',
    title: '100+ 新 MCP 插件上架资源库',
    desc: '社区贡献者力量爆发，Foundry 插件市场现已覆盖金融、医疗等...',
  },
];

/* ── Tier config ── */
const TIER_CONFIG: Record<ProviderTier, { label: string; bg: string; color: string; dot: string; icon: string }> = {
  'full-auto': { label: 'Tier 1 全自动', bg: 'var(--tertiary-fixed)', color: 'var(--on-tertiary-fixed)', dot: '#22c55e', icon: 'bolt' },
  'semi-auto': { label: 'Tier 2 半自动', bg: 'var(--secondary-fixed)', color: 'var(--on-secondary-fixed)', dot: '#f59e0b', icon: 'auto_awesome_motion' },
  'guided': { label: 'Tier 3 引导式', bg: 'var(--surface-container-high)', color: 'var(--on-surface)', dot: '#94a3b8', icon: 'menu_book' },
};

const TYPE_ICONS: Record<string, string> = {
  desktop: 'desktop_windows', cloud: 'cloud', saas: 'language', mobile: 'smartphone', remote: 'router',
};

/* ── Platform card component ── */
function PlatformCard({ p }: { p: ProviderMeta }) {
  const cfg = TIER_CONFIG[p.tier] || TIER_CONFIG.guided;
  return (
    <div
      className="p-5 rounded-2xl transition-all group hover:bg-[var(--surface-container-lowest)]"
      style={{
        background: 'var(--surface-container-low)',
        border: '1px solid transparent',
      }}
    >
      <div className="flex justify-between items-start mb-4">
        <div className="flex gap-4">
          <div
            className="w-12 h-12 rounded-xl shadow-sm flex items-center justify-center"
            style={{ background: 'white', color: cfg.color }}
          >
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
          部署
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

/* ── Skill card component ── */
function SkillCard({ s }: { s: typeof SKILLS[0] }) {
  return (
    <div
      className="p-6 rounded-2xl transition-all group hover:border-[rgba(0,62,168,0.5)]"
      style={{
        background: 'var(--surface-container-low)',
        border: '1px solid rgba(195, 198, 215, 0.3)',
      }}
    >
      <div className="flex justify-between items-start mb-4">
        <div
          className="w-12 h-12 rounded-xl flex items-center justify-center"
          style={{ background: 'rgba(0, 62, 168, 0.1)', color: 'var(--primary)' }}
        >
          <span className="material-symbols-outlined">{s.icon}</span>
        </div>
        <div className="flex flex-col items-end">
          <span className="text-xs font-bold" style={{ color: 'var(--on-surface-variant)' }}>{s.installs} 安装</span>
          <button
            className="mt-2 px-4 py-1.5 rounded-lg text-xs font-bold transition-opacity hover:opacity-90"
            style={{ background: 'var(--primary)', color: 'white' }}
          >
            安装
          </button>
        </div>
      </div>
      <h4 className="font-bold text-lg mb-2" style={{ color: 'var(--on-surface)' }}>{s.name}</h4>
      <p className="text-sm" style={{ color: 'var(--on-surface-variant)' }}>{s.desc}</p>
    </div>
  );
}

/* ── Main Landing Page ── */
export default function LandingPage() {
  const { data: providerData } = useSWR('providers', () => getProviders());
  const { data: statsData } = useSWR('stats', () => getStats());

  const providers = providerData?.providers || [];
  const grouped: Record<ProviderTier, ProviderMeta[]> = {
    'full-auto': providers.filter(p => p.tier === 'full-auto'),
    'semi-auto': providers.filter(p => p.tier === 'semi-auto'),
    'guided': providers.filter(p => p.tier === 'guided'),
  };

  const totalProviders = statsData?.providers.total || providers.length || 12;

  const STATS = [
    { icon: 'rocket_launch', value: String(totalProviders), label: '支持平台' },
    { icon: 'widgets', value: '5,400+', label: 'Agent Skills' },
    { icon: 'hub', value: '100+', label: 'MCP Connectors' },
    { icon: 'auto_fix', value: 'L3', label: '自动化级别' },
  ];

  return (
    <div className="-mt-20">
      {/* ═══ Hero Section ═══ */}
      <header className="relative pt-32 pb-24 md:pt-48 md:pb-40 overflow-hidden bg-gradient-to-br from-[#003ea8] to-[#712ae2]">
        <div className="absolute inset-0 mesh-overlay opacity-30" />
        <div className="max-w-7xl mx-auto px-6 relative z-10 flex flex-col md:flex-row items-center gap-16">
          <div className="flex-1 space-y-8 text-center md:text-left">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/10 text-white text-xs font-bold tracking-widest uppercase backdrop-blur-md">
              <span className="material-symbols-outlined text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
              China AI Agent Portal
            </div>
            <h1
              className="text-5xl md:text-7xl font-extrabold text-white leading-[1.1] tracking-tight"
              style={{ fontFamily: 'Manrope, sans-serif' }}
            >
              一键部署 AI Agent <br />
              <span className="opacity-90">{totalProviders} 大平台，一个入口</span>
            </h1>
            <p className="text-xl md:text-2xl text-blue-50/80 max-w-2xl leading-relaxed">
              OpenClaw Foundry 是中国 OpenClaw 生态的一站式部署、导航、资讯平台。
            </p>
            <div className="flex flex-col sm:flex-row items-center gap-4 pt-4 justify-center md:justify-start">
              <Link
                href="/explore/platforms"
                className="w-full sm:w-auto px-10 py-4 rounded-2xl font-bold text-lg shadow-2xl transition-all transform hover:-translate-y-1"
                style={{ background: 'white', color: 'var(--primary)', fontFamily: 'Manrope, sans-serif' }}
              >
                立即部署
              </Link>
              <Link
                href="/explore/skills"
                className="w-full sm:w-auto px-10 py-4 border-2 border-white/30 text-white rounded-2xl font-bold text-lg backdrop-blur-sm transition-all transform hover:-translate-y-1 hover:bg-white/10"
                style={{ fontFamily: 'Manrope, sans-serif' }}
              >
                浏览平台
              </Link>
            </div>
          </div>
          <div className="flex-1 w-full max-w-xl hidden md:block">
            <div className="relative group">
              <div className="absolute -inset-4 bg-white/10 rounded-[2.5rem] blur-2xl opacity-50" />
              <div className="relative bg-white/5 p-4 rounded-[2.5rem] shadow-2xl border border-white/20 overflow-hidden backdrop-blur-md">
                <div className="rounded-[2rem] w-full aspect-[4/3] flex items-center justify-center bg-white/10">
                  <span className="material-symbols-outlined text-white/60" style={{ fontSize: '120px', fontVariationSettings: "'FILL' 1" }}>
                    deployed_code
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* ═══ Quick Stats Bar ═══ */}
      <section className="max-w-7xl mx-auto px-6 -mt-16 relative z-20">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          {STATS.map(stat => (
            <div
              key={stat.label}
              className="stat-card p-8 rounded-3xl flex flex-col items-center justify-center text-center space-y-3"
              style={{
                background: 'var(--surface-container-lowest)',
                boxShadow: '0 25px 50px -12px rgba(0, 62, 168, 0.1)',
                border: '1px solid rgba(195, 198, 215, 0.3)',
              }}
            >
              <span
                className="stat-icon material-symbols-outlined text-3xl transition-colors"
                style={{ color: 'var(--primary)' }}
              >
                {stat.icon}
              </span>
              <span
                className="stat-value text-4xl font-extrabold transition-colors animate-count"
                style={{ fontFamily: 'Manrope, sans-serif', color: 'var(--on-surface)' }}
              >
                {stat.value}
              </span>
              <span
                className="stat-label text-xs font-bold tracking-widest uppercase transition-colors"
                style={{ color: 'var(--on-surface-variant)' }}
              >
                {stat.label}
              </span>
            </div>
          ))}
        </div>
      </section>

      {/* ═══ Platform Showcase (REAL DATA) ═══ */}
      <section className="py-24 max-w-7xl mx-auto px-6">
        <div className="flex flex-col md:flex-row justify-between items-end gap-6 mb-16">
          <div className="space-y-4">
            <h2
              className="text-4xl font-extrabold"
              style={{ fontFamily: 'Manrope, sans-serif', color: 'var(--on-surface)' }}
            >
              {totalProviders} 大 Agent 平台，3 级自动化
            </h2>
            <p style={{ color: 'var(--on-surface-variant)' }} className="text-lg">
              基于自动化程度精细化分类，找到最适合您的部署方案。
            </p>
          </div>
          <Link
            href="/explore/platforms"
            className="px-4 py-2 rounded-full text-sm font-bold"
            style={{ background: 'var(--primary)', color: 'var(--on-primary)' }}
          >
            查看全部平台
          </Link>
        </div>

        {providers.length === 0 ? (
          /* Loading skeleton */
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
                    <h3 className="font-bold" style={{ fontFamily: 'Manrope, sans-serif', color: cfg.color }}>{cfg.label}</h3>
                    <span className="ml-auto text-sm font-bold" style={{ color: cfg.color }}>{items.length}</span>
                  </div>
                  <div className="space-y-4">
                    {displayItems.map(p => <PlatformCard key={p.id} p={p} />)}
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

      {/* ═══ Latest News ═══ */}
      <section className="py-24" style={{ background: 'var(--surface-container-low)' }}>
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex justify-between items-center mb-16">
            <h2
              className="text-4xl font-extrabold"
              style={{ fontFamily: 'Manrope, sans-serif', color: 'var(--on-surface)' }}
            >
              最新动态
            </h2>
            <Link
              href="/news"
              className="font-bold hover:underline underline-offset-8"
              style={{ color: 'var(--primary)' }}
            >
              查看全部动态 →
            </Link>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            {/* Featured card */}
            <div
              className="md:col-span-2 rounded-3xl overflow-hidden shadow-sm hover:shadow-2xl transition-all group flex flex-col md:flex-row"
              style={{ background: 'var(--surface-container-lowest)' }}
            >
              <div className="md:w-1/2 overflow-hidden h-64 md:h-auto flex items-center justify-center" style={{ background: 'var(--primary-fixed)' }}>
                <span className="material-symbols-outlined text-[80px]" style={{ color: 'var(--primary)', fontVariationSettings: "'FILL' 1" }}>
                  newspaper
                </span>
              </div>
              <div className="md:w-1/2 p-8 flex flex-col justify-center space-y-4">
                <div className="flex items-center gap-3">
                  <span className={`px-3 py-1 text-[10px] font-bold rounded-full uppercase ${NEWS[0].sourceColor}`}>{NEWS[0].source}</span>
                  <span className="text-xs" style={{ color: 'var(--on-surface-variant)' }}>{NEWS[0].date}</span>
                </div>
                <h3 className="font-bold text-2xl leading-tight" style={{ color: 'var(--on-surface)' }}>{NEWS[0].title}</h3>
                <p style={{ color: 'var(--on-surface-variant)' }}>{NEWS[0].desc}</p>
                <Link href="/news" className="font-bold text-sm inline-flex items-center gap-2 hover:translate-x-1 transition-transform" style={{ color: 'var(--primary)' }}>
                  阅读原文 <span className="material-symbols-outlined text-sm">arrow_forward</span>
                </Link>
              </div>
            </div>
            {NEWS.slice(1).map((n, i) => (
              <div
                key={i}
                className="rounded-3xl overflow-hidden shadow-sm hover:shadow-2xl transition-all group"
                style={{ background: 'var(--surface-container-lowest)' }}
              >
                <div className="h-48 overflow-hidden flex items-center justify-center" style={{ background: i === 0 ? 'var(--secondary-fixed)' : 'var(--surface-container-high)' }}>
                  <span className="material-symbols-outlined text-[60px]" style={{ color: 'var(--on-surface-variant)', fontVariationSettings: "'FILL' 1" }}>
                    {i === 0 ? 'handshake' : 'extension'}
                  </span>
                </div>
                <div className="p-6 space-y-4">
                  <div className="flex items-center gap-3">
                    <span className={`px-3 py-1 text-[10px] font-bold rounded-full uppercase ${n.sourceColor}`}>{n.source}</span>
                    <span className="text-xs" style={{ color: 'var(--on-surface-variant)' }}>{n.date}</span>
                  </div>
                  <h3 className="font-bold text-lg leading-snug" style={{ color: 'var(--on-surface)' }}>{n.title}</h3>
                  <p className="text-sm line-clamp-2" style={{ color: 'var(--on-surface-variant)' }}>{n.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ ClawHub Skills ═══ */}
      <section className="py-24 max-w-7xl mx-auto px-6">
        <div className="flex justify-between items-end mb-12">
          <div className="space-y-4">
            <h2
              className="text-4xl font-extrabold"
              style={{ fontFamily: 'Manrope, sans-serif', color: 'var(--on-surface)' }}
            >
              热门 Skills
            </h2>
            <p className="text-lg" style={{ color: 'var(--on-surface-variant)' }}>
              从 5,400+ Agent Skills 中发现最适合您工作流的工具。
            </p>
          </div>
          <Link
            href="/explore/skills"
            className="font-bold hover:underline underline-offset-8"
            style={{ color: 'var(--primary)' }}
          >
            浏览 5,400+ Skills →
          </Link>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {SKILLS.map(s => <SkillCard key={s.name} s={s} />)}
        </div>
      </section>
    </div>
  );
}
