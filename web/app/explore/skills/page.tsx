'use client';

import { useState, useCallback } from 'react';
import useSWR from 'swr';
import { getSkills, getSkillCategories, type ClawHubSkill } from '@/lib/api';

const SOURCES = ['全部', 'Skills', 'MCP Servers'] as const;
const RATINGS = ['全部', 'S', 'A', 'B', 'C', 'D'];
const RATING_COLORS: Record<string, string> = {
  S: 'bg-amber-100 text-amber-700',
  A: 'bg-blue-100 text-blue-700',
  B: 'bg-slate-100 text-slate-600',
  C: 'bg-gray-100 text-gray-500',
  D: 'bg-red-50 text-red-400',
};

// Install targets with real, verified commands (March 2026)
const INSTALL_TARGETS = [
  { id: 'claude', name: 'Claude Code', icon: 'terminal',
    cmdSkill: (s: string) => `claude plugin install ${s}`,
    cmdMcp: (s: string, repo: string) => `claude mcp add ${s} -- npx -y ${repo}` },
  { id: 'openclaw', name: 'OpenClaw / Lobster', icon: 'smart_toy',
    cmdSkill: (s: string) => `clawhub install ${s}`,
    cmdMcp: null },
  { id: 'cursor', name: 'Cursor', icon: 'edit',
    cmdSkill: null,
    cmdMcp: (s: string, repo: string) => `# .cursor/mcp.json\n{\n  "mcpServers": {\n    "${s}": {\n      "command": "npx",\n      "args": ["-y", "${repo}"]\n    }\n  }\n}` },
  { id: 'vscode', name: 'VS Code / Copilot', icon: 'code',
    cmdSkill: null,
    cmdMcp: (s: string, repo: string) => `# .vscode/mcp.json\n{\n  "servers": {\n    "${s}": {\n      "command": "npx",\n      "args": ["-y", "${repo}"]\n    }\n  }\n}` },
  { id: 'windsurf', name: 'Windsurf', icon: 'air',
    cmdSkill: null,
    cmdMcp: (s: string, repo: string) => `# ~/.codeium/windsurf/mcp_config.json\n{\n  "mcpServers": {\n    "${s}": {\n      "command": "npx",\n      "args": ["-y", "${repo}"]\n    }\n  }\n}` },
  { id: 'cline', name: 'Cline', icon: 'psychology',
    cmdSkill: null,
    cmdMcp: (s: string, repo: string) => `# cline_mcp_settings.json\n{\n  "mcpServers": {\n    "${s}": {\n      "command": "npx",\n      "args": ["-y", "${repo}"]\n    }\n  }\n}` },
  { id: 'cli', name: '直接运行', icon: 'play_arrow',
    cmdSkill: (s: string) => `clawhub install ${s}`,
    cmdMcp: (_s: string, repo: string) => `npx -y ${repo}` },
];

function formatNum(n: number): string {
  if (n >= 100000) return (n / 1000).toFixed(0) + 'k';
  if (n >= 1000) return (n / 1000).toFixed(1) + 'k';
  return String(n);
}

function getInstallId(skill: any): string {
  if (skill.source === 'mcp-registry') return skill.slug || skill.name;
  return `${skill.author}/${skill.slug || skill.name}`;
}

function getRepoName(skill: any): string {
  if (skill.repositoryUrl) {
    const m = skill.repositoryUrl.match(/github\.com\/([^/]+\/[^/]+)/);
    if (m) return m[1];
  }
  return skill.slug || skill.name;
}

// ── Install Modal ──
function InstallModal({ skill, onClose }: { skill: any; onClose: () => void }) {
  const [copied, setCopied] = useState('');
  const isSkill = (skill.source || 'clawhub') !== 'mcp-registry';
  const installId = getInstallId(skill);
  const repoName = getRepoName(skill);

  const copy = useCallback((text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopied(id);
    setTimeout(() => setCopied(''), 2000);
  }, []);

  const targets = INSTALL_TARGETS.filter(t => isSkill ? t.cmdSkill : t.cmdMcp);

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
            选择安装目标
          </h4>
          {targets.map(t => {
            const cmd = isSkill ? t.cmdSkill?.(installId) : t.cmdMcp?.(installId, repoName);
            if (!cmd) return null;
            const isMultiline = cmd.includes('\n');
            return (
              <div key={t.id} className="rounded-xl p-3" style={{ background: 'var(--surface-container)' }}>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-sm" style={{ color: 'var(--primary)' }}>{t.icon}</span>
                    <span className="text-sm font-bold" style={{ color: 'var(--on-surface)' }}>{t.name}</span>
                  </div>
                  <button
                    onClick={() => copy(cmd, t.id)}
                    className="flex items-center gap-1 px-3 py-1 rounded-lg text-xs font-bold transition-all"
                    style={{
                      background: copied === t.id ? '#22c55e' : 'var(--primary)',
                      color: 'white',
                    }}
                  >
                    <span className="material-symbols-outlined text-sm">{copied === t.id ? 'check' : 'content_copy'}</span>
                    {copied === t.id ? '已复制' : '复制'}
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
            在 {isSkill ? 'ClawHub' : 'MCP Registry'} 查看详情
          </a>
        </div>
      </div>
    </div>
  );
}

// ── Main Page ──
export default function SkillsMarketplacePage() {
  const [search, setSearch] = useState('');
  const [activeSource, setActiveSource] = useState<typeof SOURCES[number]>('全部');
  const [activeCategory, setActiveCategory] = useState('全部');
  const [activeRating, setActiveRating] = useState('全部');
  const [page, setPage] = useState(0);
  const [showAllCats, setShowAllCats] = useState(false);
  const [installSkill, setInstallSkill] = useState<any>(null);
  const LIMIT = 18;

  const { data, isLoading } = useSWR('all-skills', () => getSkills('limit=2000'));
  const { data: catData } = useSWR('skill-categories', () => getSkillCategories());

  const allSkills = data?.skills || [];
  const categories = catData?.categories || data?.meta?.byCategory || {};
  const sortedCats = Object.entries(categories)
    .sort(([, a], [, b]) => (b as number) - (a as number))
    .map(([k]) => k);
  const allCategories = ['全部', ...sortedCats];
  const syncedAt = data?.meta?.syncedAt ? new Date(data.meta.syncedAt).toLocaleDateString('zh-CN') : '';

  // Source counts
  const skillCount = allSkills.filter((s: any) => (s.source || 'clawhub') !== 'mcp-registry').length;
  const mcpCount = allSkills.filter((s: any) => s.source === 'mcp-registry').length;

  // Client-side filtering
  const filtered = allSkills.filter((s: any) => {
    const src = s.source || 'clawhub';
    if (activeSource === 'Skills' && src === 'mcp-registry') return false;
    if (activeSource === 'MCP Servers' && src !== 'mcp-registry') return false;
    if (activeCategory !== '全部' && s.category !== activeCategory) return false;
    if (activeRating !== '全部' && s.rating !== activeRating) return false;
    if (search) {
      const q = search.toLowerCase();
      if (!s.name.toLowerCase().includes(q) && !s.description?.toLowerCase().includes(q) && !s.author?.toLowerCase().includes(q)) return false;
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
          Agent 能力市场
        </h1>
        <p className="text-lg" style={{ color: 'var(--on-surface-variant)' }}>
          {formatNum(data?.total || 0)} Skills &amp; MCP Servers，一键安装到任意工具
          {syncedAt && <span className="text-xs ml-2 opacity-60">({syncedAt} 同步)</span>}
        </p>
        <div className="relative max-w-lg mx-auto">
          <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-xl" style={{ color: 'var(--outline)' }}>search</span>
          <input
            type="text"
            placeholder="搜索 Skills 或 MCP Servers..."
            value={search}
            onChange={e => { setSearch(e.target.value); setPage(0); }}
            className="w-full rounded-2xl py-4 pl-12 pr-4 text-sm"
            style={{ background: 'var(--surface-container-low)', border: 'none' }}
          />
        </div>
      </div>

      {/* ═══ Source Tabs ═══ */}
      <div className="flex justify-center gap-1 mb-8 p-1 rounded-2xl max-w-md mx-auto" style={{ background: 'var(--surface-container)' }}>
        {SOURCES.map(src => (
          <button
            key={src}
            onClick={() => { setActiveSource(src); setPage(0); }}
            className="flex-1 px-4 py-2.5 rounded-xl text-sm font-bold transition-all"
            style={{
              background: activeSource === src ? 'var(--primary)' : 'transparent',
              color: activeSource === src ? 'var(--on-primary)' : 'var(--on-surface-variant)',
            }}
          >
            {src}
            <span className="ml-1.5 text-xs opacity-70">
              {src === '全部' ? formatNum(allSkills.length) : src === 'Skills' ? formatNum(skillCount) : formatNum(mcpCount)}
            </span>
          </button>
        ))}
      </div>

      {/* ═══ Main layout ═══ */}
      <div className="flex gap-8 pb-16">
        {/* Sidebar */}
        <aside className="hidden lg:block w-52 shrink-0 sticky top-28 self-start space-y-8">
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider mb-4" style={{ color: 'var(--on-surface-variant)' }}>分类</h3>
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
                  {cat}
                  {cat !== '全部' && categories[cat] && (
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
                  {showAllCats ? '收起' : `展开全部 (${allCategories.length - 1})`}
                </button>
              )}
            </div>
          </div>
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider mb-4" style={{ color: 'var(--on-surface-variant)' }}>质量评级</h3>
            <div className="space-y-1">
              {RATINGS.map(r => (
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
                  {r === '全部' ? '全部评级' : `${r} 级`}
                  {r !== '全部' && data?.meta?.byRating?.[r] && (
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
                {cat}
              </button>
            ))}
          </div>

          <div className="mb-4 text-sm" style={{ color: 'var(--on-surface-variant)' }}>
            显示 {total > 0 ? page * LIMIT + 1 : 0}-{Math.min((page + 1) * LIMIT, total)} / {total}
            {activeSource !== '全部' && ` ${activeSource}`}
          </div>

          {isLoading && skills.length === 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
              {Array.from({ length: 9 }).map((_, i) => (
                <div key={i} className="h-52 rounded-2xl skeleton-shimmer" />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
              {skills.map((skill: any) => {
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
                        <span className={`px-2 py-0.5 text-[10px] font-bold rounded-full ${RATING_COLORS[skill.rating] || 'bg-gray-100 text-gray-500'}`}>
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
                        {skill.category}
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
                      {skill.versions > 0 && <span>{skill.versions} 版本</span>}
                      {!isSkill && skill.remoteUrl && (
                        <span className="flex items-center gap-1">
                          <span className="material-symbols-outlined text-sm">cloud</span> Remote
                        </span>
                      )}
                    </div>

                    {/* Install button */}
                    <div className="flex justify-between items-center">
                      <a
                        href={skill.url || skill.sourceUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs flex items-center gap-1 hover:underline"
                        style={{ color: 'var(--on-surface-variant)' }}
                      >
                        <span className="material-symbols-outlined text-sm">open_in_new</span> 详情
                      </a>
                      <button
                        onClick={() => setInstallSkill(skill)}
                        className="px-4 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1 transition-all hover:opacity-90"
                        style={{ background: 'var(--primary)', color: 'white' }}
                      >
                        <span className="material-symbols-outlined text-sm">download</span>
                        安装
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
                显示 {page * LIMIT + 1}-{Math.min((page + 1) * LIMIT, total)} / {total}
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
