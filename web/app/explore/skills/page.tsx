'use client';

import { useState, useCallback } from 'react';
import useSWR from 'swr';
import { getSkills, getSkillCategories, type ClawHubSkill, submitFeedback } from '@/lib/api';
import { useI18n } from '@/lib/i18n';
import { RATING_BADGE_CLASSES, INSTALL_TARGETS } from '@/lib/constants';

const SOURCE_KEYS = ['all', 'Skills', 'MCP Servers'] as const;
const RATING_KEYS = ['all', 'S', 'A', 'B', 'C', 'D'];

// Map Chinese category names (from API) to i18n keys
const CATEGORY_KEY_MAP: Record<string, string> = {
  '区块链 Web3': 'skills.cat.blockchain',
  '金融交易': 'skills.cat.finance',
  '电商营销': 'skills.cat.ecommerce',
  '办公文档': 'skills.cat.office',
  '教育学习': 'skills.cat.education',
  '游戏娱乐': 'skills.cat.gaming',
  '生活服务': 'skills.cat.lifestyle',
  'HR 人才': 'skills.cat.hr',
  'Agent 基建': 'skills.cat.agent',
  '安全合规': 'skills.cat.security',
  'AI 模型': 'skills.cat.ai',
  '浏览器自动化': 'skills.cat.browser',
  '搜索与研究': 'skills.cat.search',
  '通讯集成': 'skills.cat.communication',
  '数据分析': 'skills.cat.data',
  '内容创作': 'skills.cat.content',
  '效率工具': 'skills.cat.productivity',
  '多媒体': 'skills.cat.multimedia',
  'DevOps 部署': 'skills.cat.devops',
  '代码开发': 'skills.cat.development',
  '系统工具': 'skills.cat.system',
  'API 网关': 'skills.cat.api',
  '其他': 'skills.cat.other',
};

// Chinese → English synonym map for fuzzy search
const SEARCH_SYNONYMS: Record<string, string[]> = {
  '前端': ['frontend', 'react', 'vue', 'next', 'tailwind', 'css', 'html', 'ui', 'component', 'web'],
  '后端': ['backend', 'api', 'server', 'express', 'fastapi', 'django', 'node'],
  '数据库': ['database', 'sql', 'postgres', 'mysql', 'mongodb', 'redis', 'sqlite', 'supabase'],
  '搜索': ['search', 'google', 'bing', 'exa', 'tavily', 'brave'],
  '浏览器': ['browser', 'chrome', 'playwright', 'puppeteer', 'selenium'],
  '邮件': ['email', 'gmail', 'imap', 'smtp', 'mail'],
  '聊天': ['chat', 'slack', 'discord', 'telegram', 'wechat', 'message'],
  '图片': ['image', 'photo', 'picture', 'png', 'screenshot', 'vision'],
  '视频': ['video', 'youtube', 'ffmpeg', 'recording'],
  '音频': ['audio', 'speech', 'tts', 'stt', 'whisper', 'voice'],
  '翻译': ['translate', 'translation', 'language', 'i18n'],
  '安全': ['security', 'auth', 'guard', 'antivirus', 'vulnerability'],
  '部署': ['deploy', 'docker', 'kubernetes', 'ci', 'cd', 'vercel', 'cloudflare'],
  '测试': ['test', 'testing', 'jest', 'playwright', 'e2e', 'unit'],
  '文档': ['document', 'doc', 'markdown', 'pdf', 'word', 'notion'],
  '笔记': ['note', 'obsidian', 'notion', 'memo', 'journal'],
  '股票': ['stock', 'trading', 'finance', 'market', 'investment'],
  '加密': ['crypto', 'bitcoin', 'blockchain', 'web3', 'defi', 'nft'],
  '游戏': ['game', 'gaming', 'unity', 'unreal'],
  '设计': ['design', 'figma', 'ui', 'ux', 'prototype'],
  '爬虫': ['crawl', 'scrape', 'spider', 'fetch'],
};

function expandSearch(query: string): string[] {
  const q = query.toLowerCase();
  const terms = [q];
  for (const [cn, en] of Object.entries(SEARCH_SYNONYMS)) {
    if (q.includes(cn)) terms.push(...en);
    for (const e of en) { if (q.includes(e)) terms.push(cn, ...en); }
  }
  return [...new Set(terms)];
}

function formatNum(n: number): string {
  if (n >= 100000) return (n / 1000).toFixed(0) + 'k';
  if (n >= 1000) return (n / 1000).toFixed(1) + 'k';
  return String(n);
}

function getInstallId(skill: ClawHubSkill): string {
  if (skill.source === 'mcp-registry') return skill.slug || skill.name;
  return `${skill.author}/${skill.slug || skill.name}`;
}

function getRepoName(skill: ClawHubSkill): string {
  if (skill.repositoryUrl) {
    const m = skill.repositoryUrl.match(/github\.com\/([^/]+\/[^/]+)/);
    if (m) return m[1];
  }
  return skill.slug || skill.name;
}

// ── Install Modal ──
function InstallModal({ skill, onClose }: { skill: ClawHubSkill; onClose: () => void }) {
  const { t } = useI18n();
  const [copied, setCopied] = useState('');
  const isSkill = (skill.source || 'clawhub') !== 'mcp-registry';
  const installId = getInstallId(skill);
  const repoName = getRepoName(skill);

  const copy = useCallback((text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopied(id);
    setTimeout(() => setCopied(''), 2000);
  }, []);

  const targets = INSTALL_TARGETS.filter(tgt => isSkill ? tgt.cmdSkill : tgt.cmdMcp);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
      <div
        className="relative w-full max-w-lg rounded-2xl p-6 space-y-4 max-h-[80vh] overflow-y-auto"
        style={{ background: 'var(--surface-container-lowest)' }}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex justify-between items-start">
          <div>
            <h3 className="font-bold text-lg" style={{ color: 'var(--on-surface)' }}>{skill.name}</h3>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-xs" style={{ color: 'var(--on-surface-variant)' }}>@{skill.author}</span>
              <span className={`px-2 py-0.5 text-[10px] font-bold rounded-full ${isSkill ? 'bg-blue-50 text-blue-600' : 'bg-emerald-50 text-emerald-600'}`}>
                {isSkill ? 'Skill' : 'MCP Server'}
              </span>
            </div>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-black/5">
            <span className="material-symbols-outlined text-xl" style={{ color: 'var(--on-surface-variant)' }}>close</span>
          </button>
        </div>

        <p className="text-sm" style={{ color: 'var(--on-surface-variant)' }}>{skill.description}</p>

        {/* Install commands */}
        <div className="space-y-3">
          <h4 className="text-xs font-bold uppercase tracking-wider" style={{ color: 'var(--on-surface-variant)' }}>
            {t('skills.selectTarget')}
          </h4>
          {targets.map(tgt => {
            const cmd = isSkill ? tgt.cmdSkill?.(installId) : tgt.cmdMcp?.(installId, repoName);
            if (!cmd) return null;
            const isMultiline = cmd.includes('\n');
            return (
              <div key={tgt.id} className="rounded-xl p-3" style={{ background: 'var(--surface-container)' }}>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-sm" style={{ color: 'var(--primary)' }}>{tgt.icon}</span>
                    <span className="text-sm font-bold" style={{ color: 'var(--on-surface)' }}>{tgt.id === 'cli' ? t(tgt.name) : tgt.name}</span>
                  </div>
                  <button
                    onClick={() => copy(cmd, tgt.id)}
                    className="flex items-center gap-1 px-3 py-1 rounded-lg text-xs font-bold transition-all"
                    style={{
                      background: copied === tgt.id ? '#22c55e' : 'var(--primary)',
                      color: 'white',
                    }}
                  >
                    <span className="material-symbols-outlined text-sm">{copied === tgt.id ? 'check' : 'content_copy'}</span>
                    {copied === tgt.id ? t('skills.copied') : t('skills.copy')}
                  </button>
                </div>
                <pre
                  className={`text-xs overflow-x-auto rounded-lg p-2 ${isMultiline ? 'whitespace-pre' : 'whitespace-nowrap'}`}
                  style={{ background: '#1e1e2e', color: '#cdd6f4', fontFamily: 'monospace' }}
                >
                  {cmd}
                </pre>
              </div>
            );
          })}
        </div>

        {/* Source link */}
        <div className="pt-2 border-t" style={{ borderColor: 'rgba(195, 198, 215, 0.3)' }}>
          <a
            href={skill.url || skill.sourceUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs flex items-center gap-1 hover:underline"
            style={{ color: 'var(--primary)' }}
          >
            <span className="material-symbols-outlined text-sm">open_in_new</span>
            {t('skills.viewDetails', { source: isSkill ? 'ClawHub' : 'MCP Registry' })}
          </a>
        </div>
      </div>
    </div>
  );
}

// ── Curation Badges (v2: deploy stats + stale + permissions) ──
function CurationBadges({ skill }: { skill: ClawHubSkill }) {
  const rate = (skill as any).deploySuccessRate ?? -1;
  const count = (skill as any).deployCount ?? 0;
  const stale = (skill as any).stale;
  const pm = (skill as any).permissionManifest || {};

  const hasDeployData = rate >= 0 && count > 0;
  const hasPermissions = pm.network_access || pm.filesystem_access;

  if (!hasDeployData && !stale && !hasPermissions) return null;

  return (
    <div className="flex items-center gap-1.5 mb-2 flex-wrap">
      {/* Deploy success rate */}
      {hasDeployData && (
        <span
          className="flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[10px] font-bold"
          style={{
            background: rate >= 0.8 ? '#dcfce7' : rate >= 0.5 ? '#fef9c3' : '#fee2e2',
            color: rate >= 0.8 ? '#166534' : rate >= 0.5 ? '#854d0e' : '#991b1b',
          }}
        >
          <span className="material-symbols-outlined" style={{ fontSize: '11px' }}>
            {rate >= 0.8 ? 'verified' : rate >= 0.5 ? 'warning' : 'error'}
          </span>
          {Math.round(rate * 100)}% ({count})
        </span>
      )}

      {/* Stale warning */}
      {stale && (
        <span className="flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[10px] font-bold"
          style={{ background: '#fee2e2', color: '#991b1b' }}>
          <span className="material-symbols-outlined" style={{ fontSize: '11px' }}>schedule</span>
          Stale
        </span>
      )}

      {/* Permission icons */}
      {pm.network_access === 'full' && (
        <span className="flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[10px] font-medium"
          style={{ background: '#fef3c7', color: '#92400e' }}
          title="Full network access">
          <span className="material-symbols-outlined" style={{ fontSize: '11px' }}>language</span>
          NET
        </span>
      )}
      {pm.filesystem_access === 'write' && (
        <span className="flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[10px] font-medium"
          style={{ background: '#fce7f3', color: '#9d174d' }}
          title="File write access">
          <span className="material-symbols-outlined" style={{ fontSize: '11px' }}>edit_document</span>
          FS:W
        </span>
      )}
      {pm.shell_execution && (
        <span className="flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[10px] font-medium"
          style={{ background: '#ede9fe', color: '#5b21b6' }}
          title="Shell execution">
          <span className="material-symbols-outlined" style={{ fontSize: '11px' }}>terminal</span>
          SHELL
        </span>
      )}
      {pm.data_sensitivity === 'confidential' && (
        <span className="flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[10px] font-medium"
          style={{ background: '#fee2e2', color: '#991b1b' }}
          title="Handles confidential data">
          <span className="material-symbols-outlined" style={{ fontSize: '11px' }}>shield</span>
          CONF
        </span>
      )}
    </div>
  );
}

// ── Deploy Feedback Bar (R1 flywheel seed) ──
function DeployFeedbackBar({ skillId }: { skillId: string }) {
  const [submitted, setSubmitted] = useState<string | null>(null);
  const [sending, setSending] = useState(false);

  const submit = useCallback(async (outcome: 'success' | 'fail' | 'not_tried') => {
    if (sending || submitted) return;
    setSending(true);
    try {
      await submitFeedback(skillId, outcome);
      setSubmitted(outcome);
    } catch {
      // Silent fail — feedback is best-effort
    } finally {
      setSending(false);
    }
  }, [skillId, sending, submitted]);

  const OUTCOMES = [
    { key: 'success' as const, icon: 'check_circle', label: 'OK', color: '#22c55e' },
    { key: 'fail' as const, icon: 'cancel', label: 'FAIL', color: '#ef4444' },
    { key: 'not_tried' as const, icon: 'help', label: '?', color: '#94a3b8' },
  ];

  return (
    <div className="flex items-center gap-2 mb-3 py-1.5 border-t" style={{ borderColor: 'rgba(195,198,215,0.2)' }}>
      <span className="text-[10px] font-medium" style={{ color: 'var(--on-surface-variant)' }}>
        {submitted ? 'Thanks!' : 'Tried it?'}
      </span>
      <div className="flex gap-1 ml-auto">
        {OUTCOMES.map(o => (
          <button
            key={o.key}
            onClick={() => submit(o.key)}
            disabled={sending || !!submitted}
            className="flex items-center gap-0.5 px-2 py-0.5 rounded text-[10px] font-bold transition-all"
            style={{
              background: submitted === o.key ? o.color : 'var(--surface-container)',
              color: submitted === o.key ? '#fff' : 'var(--on-surface-variant)',
              opacity: submitted && submitted !== o.key ? 0.3 : 1,
            }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: '12px' }}>{o.icon}</span>
            {o.label}
          </button>
        ))}
      </div>
    </div>
  );
}

// ── Main Page ──
export default function SkillsMarketplacePage() {
  const { t } = useI18n();
  const [search, setSearch] = useState('');
  const [activeSource, setActiveSource] = useState<typeof SOURCE_KEYS[number]>('all');
  const [activeCategory, setActiveCategory] = useState('all');
  const [activeRating, setActiveRating] = useState('all');
  const [page, setPage] = useState(0);
  const [showAllCats, setShowAllCats] = useState(false);
  const [installSkill, setInstallSkill] = useState<ClawHubSkill | null>(null);
  const LIMIT = 18;

  // Load from static prebuild (has 1500 Skills + 500 MCP split)
  // Workers API returns by score only, losing MCP representation
  const { data, isLoading } = useSWR('all-skills', async () => {
    const res = await fetch('/data/skills.json');
    return res.ok ? res.json() : {};
  });
  const { data: catData } = useSWR('skill-categories', async () => {
    const res = await fetch('/data/skills-categories.json');
    return res.ok ? res.json() : {};
  });

  const allSkills = data?.skills || [];
  const categories = catData?.categories || data?.meta?.byCategory || {};
  const sortedCats = Object.entries(categories)
    .sort(([, a], [, b]) => (b as number) - (a as number))
    .map(([k]) => k);
  const allCategories = ['all', ...sortedCats];
  const syncedAt = data?.meta?.syncedAt ? new Date(data.meta.syncedAt).toLocaleDateString('zh-CN') : '';

  // Source counts
  const skillCount = allSkills.filter((s: ClawHubSkill) => (s.source || 'clawhub') !== 'mcp-registry').length;
  const mcpCount = allSkills.filter((s: ClawHubSkill) => s.source === 'mcp-registry').length;

  // Client-side filtering
  const filtered = allSkills.filter((s: ClawHubSkill) => {
    const src = s.source || 'clawhub';
    if (activeSource === 'Skills' && src === 'mcp-registry') return false;
    if (activeSource === 'MCP Servers' && src !== 'mcp-registry') return false;
    if (activeCategory !== 'all' && s.category !== activeCategory) return false;
    if (activeRating !== 'all' && s.rating !== activeRating) return false;
    if (search) {
      const terms = expandSearch(search);
      const text = `${s.name} ${s.description || ''} ${s.author || ''} ${s.category || ''}`.toLowerCase();
      if (!terms.some(t => text.includes(t))) return false;
    }
    return true;
  });

  const total = filtered.length;
  const totalPages = Math.ceil(total / LIMIT);
  const skills = filtered.slice(page * LIMIT, (page + 1) * LIMIT);

  return (
    <div className="max-w-[1440px] mx-auto px-6 md:px-8">
      {/* ═══ Hero ═══ */}
      <div className="text-center pt-8 pb-6 space-y-5">
        <h1
          className="text-4xl md:text-5xl font-extrabold"
          style={{ fontFamily: 'Manrope, sans-serif', color: 'var(--on-surface)' }}
        >
          {t('skills.title')}
        </h1>
        <p className="text-lg" style={{ color: 'var(--on-surface-variant)' }}>
          {formatNum(data?.total || 0)} {t('skills.subtitle')}
          {syncedAt && <span className="text-xs ml-2 opacity-60">({syncedAt} {t('skills.synced')})</span>}
        </p>
        <div className="relative max-w-lg mx-auto">
          <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-xl" style={{ color: 'var(--outline)' }}>search</span>
          <input
            type="text"
            placeholder={t('skills.searchPlaceholder')}
            value={search}
            onChange={e => { setSearch(e.target.value); setPage(0); }}
            className="w-full rounded-2xl py-4 pl-12 pr-4 text-sm"
            style={{ background: 'var(--surface-container-low)', border: 'none' }}
          />
        </div>
      </div>

      {/* ═══ Source Tabs ═══ */}
      <div className="flex justify-center gap-1 mb-8 p-1 rounded-2xl max-w-md mx-auto" style={{ background: 'var(--surface-container)' }}>
        {SOURCE_KEYS.map(src => (
          <button
            key={src}
            onClick={() => { setActiveSource(src); setPage(0); }}
            className="flex-1 px-4 py-2.5 rounded-xl text-sm font-bold transition-all"
            style={{
              background: activeSource === src ? 'var(--primary)' : 'transparent',
              color: activeSource === src ? 'var(--on-primary)' : 'var(--on-surface-variant)',
            }}
          >
            {src === 'all' ? t('skills.all') : src}
            <span className="ml-1.5 text-xs opacity-70">
              {src === 'all' ? formatNum(allSkills.length) : src === 'Skills' ? formatNum(skillCount) : formatNum(mcpCount)}
            </span>
          </button>
        ))}
      </div>

      {/* ═══ Main layout ═══ */}
      <div className="flex gap-8 pb-16">
        {/* Sidebar */}
        <aside className="hidden lg:block w-52 shrink-0 sticky top-28 self-start space-y-8">
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider mb-4" style={{ color: 'var(--on-surface-variant)' }}>{t('skills.categories')}</h3>
            <div className="space-y-1">
              {(showAllCats ? allCategories : allCategories.slice(0, 11)).map(cat => (
                <button
                  key={cat}
                  onClick={() => { setActiveCategory(cat); setPage(0); }}
                  className="block w-full text-left text-sm px-3 py-2 rounded-lg transition-colors"
                  style={{
                    background: activeCategory === cat ? 'var(--primary-fixed)' : 'transparent',
                    color: activeCategory === cat ? 'var(--on-primary-fixed-variant)' : 'var(--on-surface)',
                    fontWeight: activeCategory === cat ? 600 : 400,
                  }}
                >
                  {cat === 'all' ? t('skills.all') : (CATEGORY_KEY_MAP[cat] ? t(CATEGORY_KEY_MAP[cat]) : cat)}
                  {cat !== 'all' && categories[cat] && (
                    <span className="float-right text-xs opacity-50">{formatNum(categories[cat] as number)}</span>
                  )}
                </button>
              ))}
              {allCategories.length > 11 && (
                <button
                  onClick={() => setShowAllCats(!showAllCats)}
                  className="block w-full text-left text-xs px-3 py-2 rounded-lg font-medium"
                  style={{ color: 'var(--primary)' }}
                >
                  {showAllCats ? t('skills.collapse') : `${t('skills.expandAll')} (${allCategories.length - 1})`}
                </button>
              )}
            </div>
          </div>
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider mb-4" style={{ color: 'var(--on-surface-variant)' }}>{t('skills.qualityRating')}</h3>
            <div className="space-y-1">
              {RATING_KEYS.map(r => (
                <button
                  key={r}
                  onClick={() => { setActiveRating(r); setPage(0); }}
                  className="block w-full text-left text-sm px-3 py-2 rounded-lg transition-colors"
                  style={{
                    background: activeRating === r ? 'var(--primary-fixed)' : 'transparent',
                    color: activeRating === r ? 'var(--on-primary-fixed-variant)' : 'var(--on-surface)',
                    fontWeight: activeRating === r ? 600 : 400,
                  }}
                >
                  {r === 'all' ? t('skills.allRatings') : `${r} ${t('skills.level')}`}
                  {r !== 'all' && data?.meta?.byRating?.[r] && (
                    <span className="float-right text-xs opacity-50">{formatNum(data.meta.byRating[r])}</span>
                  )}
                </button>
              ))}
            </div>
          </div>
        </aside>

        {/* Grid */}
        <div className="flex-1">
          {/* Mobile filters */}
          <div className="lg:hidden flex gap-2 mb-6 overflow-x-auto pb-1 no-scrollbar">
            {allCategories.slice(0, 12).map(cat => (
              <button
                key={cat}
                onClick={() => { setActiveCategory(cat); setPage(0); }}
                className="px-3 py-1.5 rounded-full text-xs font-bold transition-all whitespace-nowrap shrink-0"
                style={{
                  background: activeCategory === cat ? 'var(--primary)' : 'var(--surface-container)',
                  color: activeCategory === cat ? 'var(--on-primary)' : 'var(--on-surface-variant)',
                }}
              >
                {cat === 'all' ? t('skills.all') : (CATEGORY_KEY_MAP[cat] ? t(CATEGORY_KEY_MAP[cat]) : cat)}
              </button>
            ))}
          </div>

          <div className="mb-4 text-sm" style={{ color: 'var(--on-surface-variant)' }}>
            {t('skills.showing', { start: total > 0 ? page * LIMIT + 1 : 0, end: Math.min((page + 1) * LIMIT, total), total })}
            {activeSource !== 'all' && ` ${activeSource}`}
          </div>

          {isLoading && skills.length === 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
              {Array.from({ length: 9 }).map((_, i) => (
                <div key={i} className="h-52 rounded-2xl skeleton-shimmer" />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
              {skills.map((skill: ClawHubSkill) => {
                const isSkill = (skill.source || 'clawhub') !== 'mcp-registry';
                return (
                  <div
                    key={skill.id}
                    className="p-6 rounded-2xl transition-all card-hover flex flex-col"
                    style={{
                      background: 'var(--surface-container-lowest)',
                      border: '1px solid rgba(195, 198, 215, 0.3)',
                    }}
                  >
                    {/* Header: name + type + rating */}
                    <div className="flex justify-between items-start mb-1">
                      <h4 className="font-bold text-base leading-tight" style={{ color: 'var(--on-surface)' }}>{skill.name}</h4>
                      <div className="flex items-center gap-1 shrink-0 ml-2">
                        <span className={`px-2 py-0.5 text-[10px] font-bold rounded-full ${isSkill ? 'bg-blue-50 text-blue-600' : 'bg-emerald-50 text-emerald-600'}`}>
                          {isSkill ? 'Skill' : 'MCP'}
                        </span>
                        <span className={`px-2 py-0.5 text-[10px] font-bold rounded-full ${RATING_BADGE_CLASSES[skill.rating] || 'bg-gray-100 text-gray-500'}`}>
                          {skill.rating}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 mb-3 flex-wrap">
                      <span className="text-xs" style={{ color: 'var(--on-surface-variant)' }}>@{skill.author}</span>
                      {skill.official && (
                        <span className="text-[9px] px-1.5 py-0.5 rounded font-bold" style={{ background: 'var(--primary-fixed)', color: 'var(--on-primary-fixed-variant)' }}>Official</span>
                      )}
                      <span className="text-[10px] px-2 py-0.5 rounded-full font-medium" style={{ background: 'var(--surface-container)', color: 'var(--on-surface-variant)' }}>
                        {CATEGORY_KEY_MAP[skill.category] ? t(CATEGORY_KEY_MAP[skill.category]) : skill.category}
                      </span>
                    </div>

                    {/* Description */}
                    <p className="text-sm mb-4 line-clamp-2 flex-1" style={{ color: 'var(--on-surface-variant)' }}>{skill.description}</p>

                    {/* Metrics */}
                    <div className="flex items-center gap-4 mb-3 text-xs" style={{ color: 'var(--on-surface-variant)' }}>
                      {skill.downloads > 0 && (
                        <span className="flex items-center gap-1">
                          <span className="material-symbols-outlined text-sm">download</span> {skill.downloadsDisplay || formatNum(skill.downloads)}
                        </span>
                      )}
                      {skill.stars > 0 && (
                        <span className="flex items-center gap-1">
                          <span className="material-symbols-outlined text-sm" style={{ color: '#f59e0b', fontVariationSettings: "'FILL' 1" }}>star</span> {skill.starsDisplay || formatNum(skill.stars)}
                        </span>
                      )}
                      {skill.versions > 0 && <span>{skill.versions} {t('skills.versions')}</span>}
                      {!isSkill && skill.remoteUrl && (
                        <span className="flex items-center gap-1">
                          <span className="material-symbols-outlined text-sm">cloud</span> Remote
                        </span>
                      )}
                    </div>

                    {/* V2 Curation badges */}
                    <CurationBadges skill={skill} />

                    {/* Deploy Feedback (R1 flywheel) */}
                    <DeployFeedbackBar skillId={skill.id} />

                    {/* Install button */}
                    <div className="flex justify-between items-center">
                      <a
                        href={skill.url || skill.sourceUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs flex items-center gap-1 hover:underline"
                        style={{ color: 'var(--on-surface-variant)' }}
                      >
                        <span className="material-symbols-outlined text-sm">open_in_new</span> {t('skills.details')}
                      </a>
                      <button
                        onClick={() => setInstallSkill(skill)}
                        className="px-4 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1 transition-all hover:opacity-90"
                        style={{ background: 'var(--primary)', color: 'white' }}
                      >
                        <span className="material-symbols-outlined text-sm">download</span>
                        {t('skills.install')}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex justify-between items-center mt-10">
              <span className="text-sm" style={{ color: 'var(--on-surface-variant)' }}>
                {t('skills.showing', { start: page * LIMIT + 1, end: Math.min((page + 1) * LIMIT, total), total })}
              </span>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setPage(Math.max(0, page - 1))}
                  disabled={page === 0}
                  className="w-9 h-9 rounded-lg flex items-center justify-center disabled:opacity-30"
                  style={{ background: 'var(--surface-container)', color: 'var(--on-surface-variant)' }}
                >
                  <span className="material-symbols-outlined text-sm">chevron_left</span>
                </button>
                {Array.from({ length: Math.min(totalPages, 5) }).map((_, i) => {
                  const p = page < 3 ? i : page - 2 + i;
                  if (p >= totalPages) return null;
                  return (
                    <button
                      key={p}
                      onClick={() => setPage(p)}
                      className="w-9 h-9 rounded-lg text-sm font-bold"
                      style={{
                        background: p === page ? 'var(--primary)' : 'var(--surface-container)',
                        color: p === page ? 'var(--on-primary)' : 'var(--on-surface-variant)',
                      }}
                    >
                      {p + 1}
                    </button>
                  );
                })}
                {totalPages > 5 && page < totalPages - 3 && (
                  <>
                    <span className="px-2 text-sm" style={{ color: 'var(--outline)' }}>...</span>
                    <button
                      onClick={() => setPage(totalPages - 1)}
                      className="w-9 h-9 rounded-lg text-sm font-bold"
                      style={{ background: 'var(--surface-container)', color: 'var(--on-surface-variant)' }}
                    >
                      {totalPages}
                    </button>
                  </>
                )}
                <button
                  onClick={() => setPage(Math.min(totalPages - 1, page + 1))}
                  disabled={page >= totalPages - 1}
                  className="w-9 h-9 rounded-lg flex items-center justify-center disabled:opacity-30"
                  style={{ background: 'var(--surface-container)', color: 'var(--on-surface-variant)' }}
                >
                  <span className="material-symbols-outlined text-sm">chevron_right</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Install Modal */}
      {installSkill && <InstallModal skill={installSkill} onClose={() => setInstallSkill(null)} />}
    </div>
  );
}
