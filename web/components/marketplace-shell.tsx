'use client';

import { useState, useCallback, useMemo, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import useSWR from 'swr';
import { type ClawHubSkill, submitFeedback } from '@/lib/api';
import { useI18n } from '@/lib/i18n';
import { RATING_BADGE_CLASSES, INSTALL_TARGETS } from '@/lib/constants';
import { localizeSkillCategory } from '@/lib/skill-categories';

const SOURCE_KEYS = ['all', 'Skills', 'MCP Servers'] as const;
const RATING_KEYS = ['all', 'S', 'A', 'B', 'C', 'D'];

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
      <div className="absolute inset-0 bg-black/60 backdrop-blur-md transition-opacity" />
      <div
        className="relative w-full max-w-lg rounded-[2.5rem] p-8 space-y-6 max-h-[90vh] overflow-y-auto shadow-2xl scale-in"
        style={{ background: 'var(--surface-container-lowest)', border: '1px solid var(--outline-variant)' }}
        onClick={e => e.stopPropagation()}
      >
        <div className="flex justify-between items-start">
          <div className="space-y-1">
            <h3 className="font-bold text-2xl tracking-tight text-balance" style={{ color: 'var(--on-surface)' }}>{skill.name}</h3>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-xs font-bold" style={{ color: 'var(--on-surface-variant)' }}>@{skill.author}</span>
              <span className={`px-2.5 py-0.5 text-[var(--af-fs-meta)] font-black uppercase tracking-wider rounded-full ${isSkill ? 'bg-blue-100 text-blue-700' : 'bg-emerald-100 text-emerald-700'}`}>
                {isSkill ? 'Skill' : 'MCP Server'}
              </span>
            </div>
          </div>
          <button aria-label="Close install dialog" onClick={onClose} className="w-10 h-10 rounded-full flex items-center justify-center hover:bg-black/5 transition-colors">
            <span aria-hidden="true" className="material-symbols-outlined font-black" style={{ color: 'var(--on-surface-variant)' }}>close</span>
          </button>
        </div>

        <p className="text-sm leading-relaxed text-pretty" style={{ color: 'var(--on-surface-variant)' }}>{skill.description}</p>

        <div className="space-y-4">
          <h4 className="text-[var(--af-fs-meta)] font-black uppercase tracking-[0.2em] text-balance" style={{ color: 'var(--on-surface-variant)' }}>
            {t('skills.selectTarget')}
          </h4>
          <div className="space-y-3">
            {targets.map(tgt => {
              const cmd = isSkill ? tgt.cmdSkill?.(installId) : tgt.cmdMcp?.(installId, repoName);
              if (!cmd) return null;
              const isMultiline = cmd.includes('\n');
              return (
                <div key={tgt.id} className="rounded-2xl p-4 transition-all hover:bg-[var(--surface-container-high)]" style={{ background: 'var(--surface-container)' }}>
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <span aria-hidden="true" className="material-symbols-outlined text-lg font-black" style={{ color: 'var(--primary)' }}>{tgt.icon}</span>
                      <span className="text-xs font-black uppercase tracking-widest" style={{ color: 'var(--on-surface)' }}>{tgt.id === 'cli' ? t(tgt.name) : tgt.name}</span>
                    </div>
                    <button
                      onClick={() => copy(cmd, tgt.id)}
                      className="flex items-center gap-1.5 px-4 py-1.5 rounded-full text-[var(--af-fs-meta)] font-black uppercase tracking-widest transition-all hover:shadow-lg active:scale-95"
                      style={{
                        background: copied === tgt.id ? 'var(--tertiary)' : 'var(--primary)',
                        color: 'white',
                      }}
                    >
                      <span aria-hidden="true" className="material-symbols-outlined text-sm">{copied === tgt.id ? 'check' : 'content_copy'}</span>
                      {copied === tgt.id ? t('skills.copied') : t('skills.copy')}
                    </button>
                  </div>
                  <pre
                    className={`text-[var(--af-fs-meta)] overflow-x-auto rounded-xl p-3 scrollbar-hide shadow-inner ${isMultiline ? 'whitespace-pre' : 'whitespace-nowrap'}`}
                    style={{ background: 'var(--af-code-bg-dark)', color: 'var(--af-code-text)', fontFamily: 'monospace' }}
                  >
                    {cmd}
                  </pre>
                </div>
              );
            })}
          </div>
        </div>

        <div className="pt-4 border-t border-dashed" style={{ borderColor: 'var(--outline-variant)' }}>
          <a
            href={skill.url || skill.sourceUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-[var(--af-fs-meta)] font-black uppercase tracking-widest flex items-center gap-2 transition-all hover:text-[var(--primary)] group"
            style={{ color: 'var(--on-surface-variant)' }}
          >
            <span aria-hidden="true" className="material-symbols-outlined text-sm font-black transition-transform group-hover:translate-x-0.5">open_in_new</span>
            {t('skills.viewDetails', { source: isSkill ? 'ClawHub' : 'MCP Registry' })}
          </a>
        </div>
      </div>
    </div>
  );
}

function CurationBadges({ skill, compact = false }: { skill: ClawHubSkill; compact?: boolean }) {
  const rate = (skill as any).deploySuccessRate ?? -1;
  const count = (skill as any).deployCount ?? 0;
  const stale = (skill as any).stale;
  const pm = (skill as any).permissionManifest || {};

  const hasDeployData = rate >= 0 && count > 0;
  const hasPermissions = pm.network_access || pm.filesystem_access || pm.shell_execution || pm.data_sensitivity;

  if (!hasDeployData && !stale && !hasPermissions) return null;

  // Round 1 Jobs P0: card mode (compact=true) shows ONLY the highest-severity
  // signal — confidential > stale > deploy-fail > shell > FS:W > NET > deploy-rate.
  // Full chip set still renders inside the install modal (compact=false).
  if (compact) {
    const topChip = (() => {
      if (pm.data_sensitivity === 'confidential') return { cls: '', style: { background: 'var(--error-container)', color: 'var(--on-error-container)' }, icon: 'shield', label: 'CONF' };
      if (stale) return { cls: '', style: { background: 'var(--error-container)', color: 'var(--on-error-container)' }, icon: 'schedule', label: 'Stale' };
      if (hasDeployData && rate < 0.5) return { cls: '', style: { background: 'var(--error-container)', color: 'var(--on-error-container)' }, icon: 'error', label: `${Math.round(rate * 100)}%` };
      if (pm.shell_execution) return { cls: 'tag-violet', style: undefined, icon: 'terminal', label: 'SHELL' };
      if (pm.filesystem_access === 'write') return { cls: 'tag-pink', style: undefined, icon: 'edit_document', label: 'FS:W' };
      if (pm.network_access === 'full') return { cls: 'tag-amber', style: undefined, icon: 'language', label: 'NET' };
      if (hasDeployData && rate >= 0.8) return { cls: '', style: { background: 'var(--tertiary-container)', color: 'var(--on-tertiary-container)' }, icon: 'verified', label: `${Math.round(rate * 100)}%` };
      if (hasDeployData) return { cls: 'tag-yellow', style: undefined, icon: 'warning', label: `${Math.round(rate * 100)}%` };
      return null;
    })();
    if (!topChip) return null;
    return (
      <div className="flex items-center gap-1.5 mb-3">
        <span className={`${topChip.cls} flex items-center gap-1 px-2 py-0.5 rounded-full text-[var(--af-fs-micro)] font-bold uppercase tracking-wider`} style={topChip.style}>
          <span aria-hidden="true" className="material-symbols-outlined text-[var(--af-fs-caption)] font-bold">{topChip.icon}</span>
          {topChip.label}
        </span>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-1.5 mb-3 flex-wrap">
      {hasDeployData && (
        <span
          className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-[var(--af-fs-micro)] font-black uppercase tracking-wider ${
            rate >= 0.8
              ? ''
              : rate >= 0.5
              ? 'tag-yellow'
              : ''
          }`}
          style={
            rate >= 0.8
              ? { background: 'var(--tertiary-container)', color: 'var(--on-tertiary-container)' }
              : rate >= 0.5
              ? undefined
              : { background: 'var(--error-container)', color: 'var(--on-error-container)' }
          }
        >
          <span aria-hidden="true" className="material-symbols-outlined text-[var(--af-fs-caption)] font-black">
            {rate >= 0.8 ? 'verified' : (rate >= 0.5 ? 'warning' : 'error')}
          </span>
          {Math.round(rate * 100)}% ({count})
        </span>
      )}

      {stale && (
        <span className="flex items-center gap-1 px-2 py-0.5 rounded-full text-[var(--af-fs-micro)] font-black uppercase tracking-wider"
          style={{ background: 'var(--error-container)', color: 'var(--on-error-container)' }}>
          <span aria-hidden="true" className="material-symbols-outlined text-[var(--af-fs-caption)] font-black">schedule</span>
          Stale
        </span>
      )}

      {pm.network_access === 'full' && (
        <span className="tag-amber flex items-center gap-1 px-2 py-0.5 rounded-full text-[var(--af-fs-micro)] font-black uppercase tracking-wider"
          title="Full network access">
          <span aria-hidden="true" className="material-symbols-outlined text-[var(--af-fs-caption)] font-black">language</span>
          NET
        </span>
      )}
      {pm.filesystem_access === 'write' && (
        <span className="tag-pink flex items-center gap-1 px-2 py-0.5 rounded-full text-[var(--af-fs-micro)] font-black uppercase tracking-wider"
          title="File write access">
          <span aria-hidden="true" className="material-symbols-outlined text-[var(--af-fs-caption)] font-black">edit_document</span>
          FS:W
        </span>
      )}
      {pm.shell_execution && (
        <span className="tag-violet flex items-center gap-1 px-2 py-0.5 rounded-full text-[var(--af-fs-micro)] font-black uppercase tracking-wider"
          title="Shell execution">
          <span aria-hidden="true" className="material-symbols-outlined text-[var(--af-fs-caption)] font-black">terminal</span>
          SHELL
        </span>
      )}
      {pm.data_sensitivity === 'confidential' && (
        <span className="flex items-center gap-1 px-2 py-0.5 rounded-full text-[var(--af-fs-micro)] font-black uppercase tracking-wider"
          style={{ background: 'var(--error-container)', color: 'var(--on-error-container)' }}
          title="Handles confidential data">
          <span aria-hidden="true" className="material-symbols-outlined text-[var(--af-fs-caption)] font-black">shield</span>
          CONF
        </span>
      )}
    </div>
  );
}

function DeployFeedbackBar({ skillId }: { skillId: string }) {
  const [submitted, setSubmitted] = useState<string | null>(null);
  const [sending, setSending] = useState(false);

  const submit = useCallback(async (outcome: 'success' | 'fail' | 'not_tried') => {
    if (sending || submitted) return;
    setSending(true);
    try {
      await submitFeedback(skillId, outcome);
      setSubmitted(outcome);
    } catch { /* best-effort */ } finally {
      setSending(false);
    }
  }, [skillId, sending, submitted]);

  const OUTCOMES = [
    { key: 'success' as const, icon: 'check_circle', label: 'OK', color: 'var(--tertiary)' },
    { key: 'fail' as const, icon: 'cancel', label: 'FAIL', color: 'var(--error)' },
    { key: 'not_tried' as const, icon: 'help', label: '?', color: 'var(--on-surface-variant)' },
  ];

  return (
    <div className="flex items-center gap-2 mb-4 py-2 border-t border-dashed" style={{ borderColor: 'var(--outline-variant)' }}>
      <span className="text-[var(--af-fs-micro)] font-black uppercase tracking-widest opacity-50">
        {submitted ? 'Thanks!' : 'Tried it?'}
      </span>
      <div className="flex gap-1 ml-auto">
        {OUTCOMES.map(o => (
          <button
            key={o.key}
            onClick={() => submit(o.key)}
            disabled={sending || !!submitted}
            className="flex items-center gap-1 px-2 py-0.5 rounded-full text-[var(--af-fs-micro)] font-black transition-all hover:scale-105 active:scale-95"
            style={{
              background: submitted === o.key ? o.color : 'var(--surface-container-high)',
              color: submitted === o.key ? 'var(--on-primary)' : 'var(--on-surface-variant)',
              opacity: submitted && submitted !== o.key ? 0.2 : 1,
            }}
          >
            <span aria-hidden="true" className="material-symbols-outlined text-[var(--af-fs-caption)] font-black">{o.icon}</span>
            {o.label}
          </button>
        ))}
      </div>
    </div>
  );
}

export function MarketplaceShell() {
  const { t } = useI18n();
  const searchParams = useSearchParams();
  const [search, setSearch] = useState('');
  const [activeSource, setActiveSource] = useState<typeof SOURCE_KEYS[number]>('all');
  const [activeCategory, setActiveCategory] = useState('all');
  const [activeRating, setActiveRating] = useState('all');
  const [page, setPage] = useState(0);
  const [showAllCats, setShowAllCats] = useState(false);
  const [installSkill, setInstallSkill] = useState<ClawHubSkill | null>(null);
  const LIMIT = 18;

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

  const requestedCategory = searchParams.get('category');
  const requestedRating = searchParams.get('rating');

  useEffect(() => {
    if (!requestedCategory) {
      setActiveCategory(prev => (prev === 'all' ? prev : 'all'));
      setPage(0);
      return;
    }

    if (Object.keys(categories).length === 0) {
      return;
    }

    const nextCategory = requestedCategory && requestedCategory in categories ? requestedCategory : 'all';
    setActiveCategory(prev => (prev === nextCategory ? prev : nextCategory));
    setPage(0);
  }, [requestedCategory, categories]);

  useEffect(() => {
    const nextRating: typeof RATING_KEYS[number] = requestedRating && RATING_KEYS.includes(requestedRating as typeof RATING_KEYS[number])
      ? requestedRating as typeof RATING_KEYS[number]
      : 'all';
    setActiveRating(prev => (prev === nextRating ? prev : nextRating));
    setPage(0);
  }, [requestedRating]);

  const filtered = useMemo(() => {
    return allSkills.filter((s: ClawHubSkill) => {
      const src = s.source || 'clawhub';
      if (activeSource === 'Skills' && src === 'mcp-registry') return false;
      if (activeSource === 'MCP Servers' && src !== 'mcp-registry') return false;
      if (activeCategory !== 'all' && s.category !== activeCategory) return false;
      if (activeRating !== 'all' && s.rating !== activeRating) return false;
      if (search) {
        const terms = expandSearch(search);
        const text = `${s.name} ${s.description || ''} ${s.author || ''} ${s.category || ''}`.toLowerCase();
        if (!terms.some(term => text.includes(term))) return false;
      }
      return true;
    });
  }, [allSkills, activeSource, activeCategory, activeRating, search]);

  const total = filtered.length;
  const totalPages = Math.ceil(total / LIMIT);
  const skills = filtered.slice(page * LIMIT, (page + 1) * LIMIT);

  return (
    <div className="page-shell py-12 space-y-12">
      <div className="text-center space-y-5 max-w-3xl mx-auto">
        <h1
          className="font-black tracking-tight text-balance"
          style={{
            color: 'var(--on-surface)',
            fontSize: 'var(--af-fs-h1)',
            lineHeight: 1.1,
          }}
        >
          {t('skills.title')}
        </h1>
        <p className="font-medium opacity-60 text-pretty" style={{ fontSize: 'var(--af-fs-body-lg)' }}>
          {formatNum(data?.total || 0)} {t('skills.subtitle')}
          {syncedAt && <span className="text-[var(--af-fs-meta)] ml-3 uppercase tracking-widest opacity-40">({syncedAt} {t('skills.synced')})</span>}
        </p>

        <div className="relative group max-w-2xl mx-auto">
          <div className="absolute -inset-1 bg-gradient-to-r from-[var(--primary)] to-[var(--tertiary)] rounded-[2rem] blur opacity-20 group-focus-within:opacity-40 transition-opacity" />
          <div className="relative flex items-center bg-[var(--surface-container-lowest)] rounded-[1.5rem] border-2 border-[var(--outline-variant)] focus-within:border-[var(--primary)] transition-all overflow-hidden">
            <span aria-hidden="true" className="material-symbols-outlined ml-5 text-2xl font-black opacity-40">search</span>
            <input
              type="text"
              placeholder={t('skills.searchPlaceholder')}
              value={search}
              onChange={e => { setSearch(e.target.value); setPage(0); }}
              className="w-full py-5 pl-4 pr-12 text-sm font-bold bg-transparent outline-none"
            />
            {search && (
              <button aria-label="Clear search" onClick={() => { setSearch(''); setPage(0); }} className="absolute right-4 w-8 h-8 rounded-full flex items-center justify-center hover:bg-black/5">
                <span aria-hidden="true" className="material-symbols-outlined text-lg font-black opacity-40">close</span>
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
        <div className="flex gap-1 p-1.5 rounded-2xl bg-[var(--surface-container)] border border-[var(--outline-variant)]">
          {SOURCE_KEYS.map(src => (
            <button
              key={src}
              onClick={() => { setActiveSource(src); setPage(0); }}
              className="px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all"
              style={{
                background: activeSource === src ? 'var(--primary)' : 'transparent',
                color: activeSource === src ? 'white' : 'var(--on-surface-variant)',
              }}
            >
              {src === 'all' ? t('skills.all') : src}
            </button>
          ))}
        </div>

        {/* Round 1 Jobs P1: Rating demoted to secondary chip group — Source is the
            primary axis; Rating is a refinement, not a peer filter. */}
        <div className="flex items-center gap-1.5 ml-1">
          <span className="text-[var(--af-fs-micro)] font-bold uppercase tracking-[var(--af-tracking-uppercase)] opacity-50 mr-1">
            {t('skills.allRatings')}:
          </span>
          {RATING_KEYS.map(r => (
            <button
              key={r}
              onClick={() => { setActiveRating(r); setPage(0); }}
              className="px-2.5 py-1 rounded-full text-[var(--af-fs-micro)] font-bold transition-all"
              style={{
                background: activeRating === r ? 'var(--primary)' : 'var(--surface-container-low)',
                color: activeRating === r ? 'white' : 'var(--on-surface-variant)',
                border: activeRating === r ? 'none' : '1px solid var(--outline-variant)',
              }}
            >
              {r === 'all' ? '∗' : r}
            </button>
          ))}
        </div>
      </div>

      <div className="flex gap-10">
        <aside className="hidden lg:block w-64 shrink-0 space-y-10">
          <div>
            <h3 className="text-[var(--af-fs-meta)] font-black uppercase tracking-[0.2em] mb-6 opacity-50 text-balance">{t('skills.categories')}</h3>
            <div className="space-y-1.5">
              {(showAllCats ? allCategories : allCategories.slice(0, 12)).map(cat => (
                <button
                  key={cat}
                  onClick={() => { setActiveCategory(cat); setPage(0); }}
                  className="group flex items-center justify-between w-full text-left px-4 py-3 rounded-2xl transition-all"
                  style={{
                    background: activeCategory === cat ? 'var(--primary-container)' : 'transparent',
                    color: activeCategory === cat ? 'var(--on-primary-container)' : 'var(--on-surface)',
                  }}
                >
                  <span className="text-sm font-bold truncate">
                    {cat === 'all' ? t('skills.all') : localizeSkillCategory(cat, t)}
                  </span>
                  {cat !== 'all' && categories[cat] && (
                    <span className="text-[var(--af-fs-meta)] font-black px-2 py-0.5 rounded-full bg-[var(--surface-container-high)] opacity-60">
                      {formatNum(categories[cat] as number)}
                    </span>
                  )}
                </button>
              ))}
              <button
                onClick={() => setShowAllCats(!showAllCats)}
                className="w-full text-center py-3 text-[var(--af-fs-meta)] font-black uppercase tracking-[0.2em] transition-all hover:text-[var(--primary)]"
              >
                {showAllCats ? 'Collapse' : 'Show More'}
              </button>
            </div>
          </div>
        </aside>

        <div className="flex-1 min-w-0 space-y-8">
          <div className="lg:hidden flex gap-2 overflow-x-auto pb-4 no-scrollbar">
            {allCategories.slice(0, 15).map(cat => (
              <button
                key={cat}
                onClick={() => { setActiveCategory(cat); setPage(0); }}
                className="px-5 py-2.5 rounded-full text-xs font-black uppercase tracking-widest whitespace-nowrap transition-all shadow-sm"
                style={{
                  background: activeCategory === cat ? 'var(--primary)' : 'var(--surface-container-low)',
                  color: activeCategory === cat ? 'white' : 'var(--on-surface-variant)',
                  border: activeCategory === cat ? 'none' : '1px solid var(--outline-variant)',
                }}
              >
                {cat === 'all' ? t('skills.all') : localizeSkillCategory(cat, t)}
              </button>
            ))}
          </div>

          <div className="flex justify-between items-center px-2">
            <span className="text-[var(--af-fs-meta)] font-black uppercase tracking-[0.2em] opacity-50">
              {t('skills.showing', { start: total > 0 ? page * LIMIT + 1 : 0, end: Math.min((page + 1) * LIMIT, total), total })}
            </span>
          </div>

          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
              {[1, 2, 3, 4, 5, 6].map(i => (
                <div key={i} className="h-64 rounded-[2.5rem] animate-pulse bg-[var(--surface-container-low)]" />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
              {skills.map((skill: ClawHubSkill) => {
                const isSkill = (skill.source || 'clawhub') !== 'mcp-registry';
                return (
                  <div
                    key={skill.id}
                    className="p-8 rounded-[2.5rem] bg-[var(--surface-container-lowest)] border border-[var(--outline-variant)] transition-all hover:shadow-2xl hover:-translate-y-1.5 group flex flex-col"
                  >
                    <div className="flex justify-between items-start mb-4">
                      <h4 className="font-black text-lg leading-tight tracking-tight text-balance" style={{ color: 'var(--on-surface)' }}>{skill.name}</h4>
                      <span className={`px-3 py-1 text-[var(--af-fs-micro)] font-black uppercase tracking-widest rounded-full ${RATING_BADGE_CLASSES[skill.rating] || 'bg-gray-100 text-gray-500'}`}>
                        {skill.rating}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 mb-4 flex-wrap">
                      <span className="text-xs font-bold opacity-60">@{skill.author}</span>
                      <span className="text-[var(--af-fs-micro)] font-black px-2 py-0.5 rounded-full uppercase tracking-wider bg-[var(--surface-container-high)] opacity-60">
                        {localizeSkillCategory(skill.category, t)}
                      </span>
                    </div>

                    <p className="text-sm leading-relaxed mb-6 line-clamp-2 opacity-80 flex-1 text-pretty">{skill.description}</p>

                    <div className="flex items-center gap-4 mb-6">
                      {skill.downloads > 0 && (
                        <div className="flex items-center gap-1.5">
                          <span aria-hidden="true" className="material-symbols-outlined text-sm font-black opacity-40">download</span>
                          <span className="sr-only">{t('skills.downloads')} </span>
                          <span className="text-[var(--af-fs-meta)] font-black tracking-widest opacity-60">{skill.downloadsDisplay || formatNum(skill.downloads)}</span>
                        </div>
                      )}
                      {skill.stars > 0 && (
                        <div className="flex items-center gap-1.5">
                          <span aria-hidden="true" className="material-symbols-outlined text-sm font-black text-amber-500 fill-1">star</span>
                          <span className="sr-only">{t('skills.stars')} </span>
                          <span className="text-[var(--af-fs-meta)] font-black tracking-widest opacity-60">{skill.starsDisplay || formatNum(skill.stars)}</span>
                        </div>
                      )}
                    </div>

                    <CurationBadges skill={skill} compact />
                    {/* DeployFeedbackBar moved to install modal — Round 1 Jobs P0:
                        the card is for discovery, not for asking "did you try it?" */}

                    <div className="flex items-center justify-between pt-4 border-t border-dashed" style={{ borderColor: 'var(--outline-variant)' }}>
                      <a
                        href={skill.url || skill.sourceUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[var(--af-fs-meta)] font-black uppercase tracking-[0.2em] opacity-40 hover:opacity-100 transition-opacity"
                      >
                        Details
                      </a>
                      <button
                        onClick={() => setInstallSkill(skill)}
                        className="px-6 py-2.5 rounded-2xl text-[var(--af-fs-meta)] font-black uppercase tracking-widest text-white transition-all hover:shadow-xl active:scale-95"
                        style={{ background: isSkill ? 'var(--primary)' : 'var(--tertiary)' }}
                      >
                        Install
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {totalPages > 1 && (
            <div className="flex flex-col sm:flex-row justify-between items-center gap-6 pt-10 border-t border-[var(--outline-variant)]">
              <span className="text-[var(--af-fs-meta)] font-black uppercase tracking-[0.2em] opacity-40">
                Page {page + 1} of {totalPages}
              </span>
              <div className="flex items-center gap-2">
                <button
                  aria-label="Previous page"
                  onClick={() => { setPage(Math.max(0, page - 1)); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                  disabled={page === 0}
                  className="w-12 h-12 rounded-2xl flex items-center justify-center bg-[var(--surface-container-low)] border border-[var(--outline-variant)] disabled:opacity-20 transition-all hover:bg-[var(--surface-container-high)]"
                >
                  <span aria-hidden="true" className="material-symbols-outlined font-black">chevron_left</span>
                </button>
                <div className="flex gap-1.5">
                  {Array.from({ length: Math.min(totalPages, 5) }).map((_, i) => {
                    const p = page < 3 ? i : (page >= totalPages - 2 ? totalPages - 5 + i : page - 2 + i);
                    if (p < 0 || p >= totalPages) return null;
                    return (
                      <button
                        key={p}
                        onClick={() => { setPage(p); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                        className={`w-12 h-12 rounded-2xl text-sm font-black transition-all shadow-sm ${p === page ? 'scale-110' : ''}`}
                        style={{
                          background: p === page ? 'var(--primary)' : 'var(--surface-container-lowest)',
                          color: p === page ? 'white' : 'var(--on-surface)',
                          border: p === page ? 'none' : '1px solid var(--outline-variant)',
                        }}
                      >
                        {p + 1}
                      </button>
                    );
                  })}
                </div>
                <button
                  aria-label="Next page"
                  onClick={() => { setPage(Math.min(totalPages - 1, page + 1)); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                  disabled={page >= totalPages - 1}
                  className="w-12 h-12 rounded-2xl flex items-center justify-center bg-[var(--surface-container-low)] border border-[var(--outline-variant)] disabled:opacity-20 transition-all hover:bg-[var(--surface-container-high)]"
                >
                  <span aria-hidden="true" className="material-symbols-outlined font-black">chevron_right</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {installSkill && <InstallModal skill={installSkill} onClose={() => setInstallSkill(null)} />}
    </div>
  );
}
