'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import useSWR from 'swr';
import { getProviders, type ProviderMeta, type ProviderTier, type ClawHubSkill } from '@/lib/api';

/* ── Tier config ── */
const TIER_CONFIG: Record<ProviderTier, { label: string; bg: string; color: string; dot: string; icon: string }> = {
  'full-auto': { label: 'Tier 1 全自动', bg: 'var(--tertiary-fixed)', color: 'var(--on-tertiary-fixed)', dot: '#22c55e', icon: 'bolt' },
  'semi-auto': { label: 'Tier 2 半自动', bg: 'var(--secondary-fixed)', color: 'var(--on-secondary-fixed)', dot: '#f59e0b', icon: 'auto_awesome_motion' },
  'guided': { label: 'Tier 3 引导式', bg: 'var(--surface-container-high)', color: 'var(--on-surface)', dot: '#94a3b8', icon: 'menu_book' },
};

const TYPE_ICONS: Record<string, string> = {
  desktop: 'desktop_windows', cloud: 'cloud', saas: 'language', mobile: 'smartphone', remote: 'router',
};

const RATING_COLORS: Record<string, string> = {
  S: 'bg-amber-100 text-amber-700',
  A: 'bg-blue-100 text-blue-700',
  B: 'bg-slate-100 text-slate-600',
};

function formatNum(n: number): string {
  if (n >= 100000) return (n / 1000).toFixed(0) + 'k';
  if (n >= 1000) return (n / 1000).toFixed(1) + 'k';
  return String(n);
}

/* ── Platform card ── */
function PlatformCard({ p }: { p: ProviderMeta }) {
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

/* ── Skill card (real data) ── */
function SkillCard({ s }: { s: ClawHubSkill }) {
  return (
    <Link
      href="/explore/skills"
      className="p-6 rounded-2xl transition-all group hover:border-[rgba(0,62,168,0.5)] block"
      style={{ background: 'var(--surface-container-low)', border: '1px solid rgba(195, 198, 215, 0.3)' }}
    >
      <div className="flex justify-between items-start mb-3">
        <h4 className="font-bold text-base leading-tight" style={{ color: 'var(--on-surface)' }}>{s.name}</h4>
        <span className={`px-2 py-0.5 text-[10px] font-bold rounded-full shrink-0 ml-2 ${RATING_COLORS[s.rating] || 'bg-gray-100 text-gray-500'}`}>
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
    { icon: 'rocket_launch', value: String(totalProviders), label: '支持平台' },
    { icon: 'widgets', value: formatNum(totalSkills), label: 'Agent Skills' },
    { icon: 'hub', value: formatNum(mcpCount || 4200), label: 'MCP Servers' },
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
                浏览 {formatNum(totalSkills)} Skills
              </Link>
            </div>
          </div>
          <div className="flex-1 w-full max-w-xl hidden md:block">
            <div className="relative group">
              <div className="absolute -inset-4 bg-white/10 rounded-[2.5rem] blur-2xl opacity-50" />
              <div className="relative bg-white/5 p-4 rounded-[2.5rem] shadow-2xl border border-white/20 overflow-hidden backdrop-blur-md">
                <div className="rounded-[2rem] w-full aspect-[4/3] bg-gradient-to-br from-white/10 to-white/5 relative overflow-hidden">
                  {/* Animated constellation of agent nodes */}
                  <svg viewBox="0 0 400 300" className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
                    {/* Connection lines */}
                    <g stroke="rgba(255,255,255,0.15)" strokeWidth="1">
                      <line x1="200" y1="100" x2="100" y2="180"><animate attributeName="opacity" values="0.1;0.4;0.1" dur="3s" repeatCount="indefinite"/></line>
                      <line x1="200" y1="100" x2="300" y2="160"><animate attributeName="opacity" values="0.1;0.4;0.1" dur="3.5s" repeatCount="indefinite"/></line>
                      <line x1="200" y1="100" x2="160" y2="50"><animate attributeName="opacity" values="0.1;0.4;0.1" dur="2.8s" repeatCount="indefinite"/></line>
                      <line x1="200" y1="100" x2="280" y2="60"><animate attributeName="opacity" values="0.1;0.4;0.1" dur="4s" repeatCount="indefinite"/></line>
                      <line x1="100" y1="180" x2="170" y2="230"><animate attributeName="opacity" values="0.1;0.3;0.1" dur="3.2s" repeatCount="indefinite"/></line>
                      <line x1="300" y1="160" x2="340" y2="220"><animate attributeName="opacity" values="0.1;0.3;0.1" dur="3.8s" repeatCount="indefinite"/></line>
                      <line x1="100" y1="180" x2="60" y2="120"><animate attributeName="opacity" values="0.1;0.3;0.1" dur="2.5s" repeatCount="indefinite"/></line>
                      <line x1="300" y1="160" x2="350" y2="100"><animate attributeName="opacity" values="0.1;0.3;0.1" dur="3s" repeatCount="indefinite"/></line>
                    </g>
                    {/* Central hub */}
                    <g>
                      <circle cx="200" cy="100" r="28" fill="rgba(255,255,255,0.15)" stroke="rgba(255,255,255,0.3)" strokeWidth="2">
                        <animate attributeName="r" values="26;30;26" dur="2s" repeatCount="indefinite"/>
                      </circle>
                      <text x="200" y="106" textAnchor="middle" fill="white" fontSize="22" fontFamily="Material Symbols Outlined">&#xe86c;</text>
                    </g>
                    {/* Agent nodes */}
                    {[
                      { x: 100, y: 180, icon: '&#xf049;', delay: '0.5s' },
                      { x: 300, y: 160, icon: '&#xe322;', delay: '1s' },
                      { x: 160, y: 50, icon: '&#xe8b8;', delay: '0.3s' },
                      { x: 280, y: 60, icon: '&#xe9da;', delay: '0.8s' },
                      { x: 170, y: 230, icon: '&#xef42;', delay: '1.2s' },
                      { x: 340, y: 220, icon: '&#xe30a;', delay: '0.6s' },
                      { x: 60, y: 120, icon: '&#xe161;', delay: '1.5s' },
                      { x: 350, y: 100, icon: '&#xeb8b;', delay: '0.9s' },
                    ].map((n, i) => (
                      <g key={i}>
                        <circle cx={n.x} cy={n.y} r="18" fill="rgba(255,255,255,0.08)" stroke="rgba(255,255,255,0.2)" strokeWidth="1">
                          <animate attributeName="opacity" values="0.5;1;0.5" dur="3s" begin={n.delay} repeatCount="indefinite"/>
                        </circle>
                        <circle cx={n.x} cy={n.y} r="3" fill="rgba(78,222,163,0.8)">
                          <animate attributeName="r" values="2;4;2" dur="2s" begin={n.delay} repeatCount="indefinite"/>
                        </circle>
                      </g>
                    ))}
                    {/* Floating particles */}
                    {Array.from({ length: 12 }).map((_, i) => (
                      <circle key={`p${i}`} cx={50 + (i * 30)} cy={40 + (i % 3) * 80} r="1.5" fill="rgba(255,255,255,0.3)">
                        <animate attributeName="cy" values={`${40 + (i % 3) * 80};${30 + (i % 3) * 80};${40 + (i % 3) * 80}`} dur={`${3 + i * 0.3}s`} repeatCount="indefinite"/>
                      </circle>
                    ))}
                    {/* Stats badges */}
                    <g transform="translate(120, 260)">
                      <rect x="0" y="0" width="70" height="24" rx="12" fill="rgba(255,255,255,0.15)" />
                      <text x="35" y="16" textAnchor="middle" fill="white" fontSize="10" fontWeight="bold">37K Skills</text>
                    </g>
                    <g transform="translate(210, 260)">
                      <rect x="0" y="0" width="80" height="24" rx="12" fill="rgba(255,255,255,0.15)" />
                      <text x="40" y="16" textAnchor="middle" fill="white" fontSize="10" fontWeight="bold">4.2K MCP</text>
                    </g>
                  </svg>
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
              <span className="stat-icon material-symbols-outlined text-3xl transition-colors" style={{ color: 'var(--primary)' }}>{stat.icon}</span>
              <span className="stat-value text-4xl font-extrabold transition-colors" style={{ fontFamily: 'Manrope, sans-serif', color: 'var(--on-surface)' }}>{stat.value}</span>
              <span className="stat-label text-xs font-bold tracking-widest uppercase transition-colors" style={{ color: 'var(--on-surface-variant)' }}>{stat.label}</span>
            </div>
          ))}
        </div>
      </section>

      {/* ═══ Platform Showcase (REAL DATA) ═══ */}
      <section className="py-24 max-w-7xl mx-auto px-6">
        <div className="flex flex-col md:flex-row justify-between items-end gap-6 mb-16">
          <div className="space-y-4">
            <h2 className="text-4xl font-extrabold" style={{ fontFamily: 'Manrope, sans-serif', color: 'var(--on-surface)' }}>
              {totalProviders} 大 Agent 平台，3 级自动化
            </h2>
            <p style={{ color: 'var(--on-surface-variant)' }} className="text-lg">基于自动化程度精细化分类，找到最适合您的部署方案。</p>
          </div>
          <Link href="/explore/platforms" className="px-4 py-2 rounded-full text-sm font-bold" style={{ background: 'var(--primary)', color: 'var(--on-primary)' }}>
            查看全部平台
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

      {/* ═══ Hot Skills (REAL DATA from prebuild) ═══ */}
      <section className="py-24 max-w-7xl mx-auto px-6">
        <div className="flex justify-between items-end mb-12">
          <div className="space-y-4">
            <h2 className="text-4xl font-extrabold" style={{ fontFamily: 'Manrope, sans-serif', color: 'var(--on-surface)' }}>
              热门 Skills
            </h2>
            <p className="text-lg" style={{ color: 'var(--on-surface-variant)' }}>
              从 {formatNum(totalSkills)} Agent Skills 中发现最适合您工作流的工具。
            </p>
          </div>
          <Link href="/explore/skills" className="font-bold hover:underline underline-offset-8" style={{ color: 'var(--primary)' }}>
            浏览全部 Skills →
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
