'use client';

import { useState, useCallback, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import useSWR from 'swr';
import Link from 'next/link';
import { getEventStats, getRecommendations, submitEvent, type ClawHubSkill } from '@/lib/api';

// ── Shared constants (same as explore/skills) ──

const RATING_COLORS: Record<string, { bg: string; text: string }> = {
  S: { bg: '#fef3c7', text: '#92400e' },
  A: { bg: '#dbeafe', text: '#1e40af' },
  B: { bg: '#f1f5f9', text: '#475569' },
  C: { bg: '#f3f4f6', text: '#6b7280' },
  D: { bg: '#fef2f2', text: '#dc2626' },
};

const INSTALL_TARGETS = [
  { id: 'claude', name: 'Claude Code', icon: 'terminal',
    cmdSkill: (s: string) => `claude plugin install ${s}`,
    cmdMcp: (s: string, repo: string) => `claude mcp add ${s} -- npx -y ${repo}` },
  { id: 'cursor', name: 'Cursor', icon: 'edit',
    cmdSkill: null as null,
    cmdMcp: (s: string, repo: string) => `# .cursor/mcp.json\n{\n  "mcpServers": {\n    "${s}": {\n      "command": "npx",\n      "args": ["-y", "${repo}"]\n    }\n  }\n}` },
  { id: 'vscode', name: 'VS Code / Copilot', icon: 'code',
    cmdSkill: null as null,
    cmdMcp: (s: string, repo: string) => `# .vscode/mcp.json\n{\n  "servers": {\n    "${s}": {\n      "command": "npx",\n      "args": ["-y", "${repo}"]\n    }\n  }\n}` },
  { id: 'windsurf', name: 'Windsurf', icon: 'air',
    cmdSkill: null as null,
    cmdMcp: (s: string, repo: string) => `# ~/.codeium/windsurf/mcp_config.json\n{\n  "mcpServers": {\n    "${s}": {\n      "command": "npx",\n      "args": ["-y", "${repo}"]\n    }\n  }\n}` },
  { id: 'cline', name: 'Cline', icon: 'psychology',
    cmdSkill: null as null,
    cmdMcp: (s: string, repo: string) => `# cline_mcp_settings.json\n{\n  "mcpServers": {\n    "${s}": {\n      "command": "npx",\n      "args": ["-y", "${repo}"]\n    }\n  }\n}` },
  { id: 'cli', name: '\u76f4\u63a5\u8fd0\u884c', icon: 'play_arrow',
    cmdSkill: null as null,
    cmdMcp: (_s: string, repo: string) => `npx -y ${repo}` },
];

const SCENARIO_ICONS = ['rocket_launch', 'build', 'psychology'];

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

// ── Permission Display ──

interface PermItem { icon: string; label: string; detail: string; severity: 'safe' | 'warn' | 'danger' }

function parsePermissions(pm: Record<string, unknown>): PermItem[] {
  const items: PermItem[] = [];
  const net = pm.network_access as string | undefined;
  if (net === 'full') items.push({ icon: 'language', label: '\u7f51\u7edc\u8bbf\u95ee', detail: '\u5b8c\u5168\u7f51\u7edc\u8bbf\u95ee\u6743\u9650', severity: 'danger' });
  else if (net === 'outbound_only') items.push({ icon: 'cloud_upload', label: '\u7f51\u7edc\u8bbf\u95ee', detail: '\u4ec5\u51fa\u7ad9\u8bf7\u6c42', severity: 'warn' });
  else if (net) items.push({ icon: 'lock', label: '\u7f51\u7edc\u8bbf\u95ee', detail: String(net), severity: 'safe' });

  const fs = pm.filesystem_access as string | undefined;
  if (fs === 'write') items.push({ icon: 'edit_document', label: '\u6587\u4ef6\u7cfb\u7edf', detail: '\u53ef\u8bfb\u5199\u6587\u4ef6', severity: 'danger' });
  else if (fs === 'read') items.push({ icon: 'folder_open', label: '\u6587\u4ef6\u7cfb\u7edf', detail: '\u4ec5\u53ef\u8bfb\u53d6', severity: 'warn' });
  else items.push({ icon: 'folder_off', label: '\u6587\u4ef6\u7cfb\u7edf', detail: '\u65e0\u6587\u4ef6\u8bbf\u95ee', severity: 'safe' });

  if (pm.shell_execution) items.push({ icon: 'terminal', label: 'Shell \u6267\u884c', detail: '\u53ef\u6267\u884c Shell \u547d\u4ee4', severity: 'danger' });

  const sens = pm.data_sensitivity as string | undefined;
  if (sens === 'confidential') items.push({ icon: 'shield', label: '\u6570\u636e\u654f\u611f\u5ea6', detail: '\u5904\u7406\u673a\u5bc6\u6570\u636e', severity: 'danger' });
  else if (sens === 'internal') items.push({ icon: 'shield', label: '\u6570\u636e\u654f\u611f\u5ea6', detail: '\u5904\u7406\u5185\u90e8\u6570\u636e', severity: 'warn' });
  else if (sens) items.push({ icon: 'verified_user', label: '\u6570\u636e\u654f\u611f\u5ea6', detail: '\u4ec5\u516c\u5f00\u6570\u636e', severity: 'safe' });

  return items;
}

const SEVERITY_STYLES: Record<string, { bg: string; color: string }> = {
  safe: { bg: '#dcfce7', color: '#166534' },
  warn: { bg: '#fef9c3', color: '#854d0e' },
  danger: { bg: '#fee2e2', color: '#991b1b' },
};

// ── Testimonial Form ──

function TestimonialForm({ skillId, onDone }: { skillId: string; onDone: () => void }) {
  const [problem, setProblem] = useState('');
  const [timeBefore, setTimeBefore] = useState('');
  const [timeAfter, setTimeAfter] = useState('');
  const [isUp, setIsUp] = useState(true);
  const [sending, setSending] = useState(false);

  const submit = useCallback(async () => {
    if (!problem.trim() || sending) return;
    setSending(true);
    try {
      await submitEvent(skillId, isUp ? 'review_up' : 'review_down', {
        problem: problem.trim(),
        time_before: timeBefore.trim(),
        time_after: timeAfter.trim(),
      });
      onDone();
    } catch { /* best-effort */ } finally {
      setSending(false);
    }
  }, [skillId, problem, timeBefore, timeAfter, isUp, sending, onDone]);

  const inputStyle = {
    background: 'var(--surface-container-low)',
    border: '1px solid var(--outline-variant)',
    color: 'var(--on-surface)',
    borderRadius: '12px',
    padding: '10px 14px',
    fontSize: '14px',
    width: '100%',
  };

  return (
    <div className="space-y-3 p-4 rounded-xl" style={{ background: 'var(--surface-container-low)' }}>
      <input placeholder="\u89e3\u51b3\u4e86\u4ec0\u4e48\u95ee\u9898" value={problem} onChange={e => setProblem(e.target.value)} style={inputStyle} />
      <div className="flex gap-3">
        <input placeholder="\u4f7f\u7528\u524d\u8017\u65f6" value={timeBefore} onChange={e => setTimeBefore(e.target.value)} style={{ ...inputStyle, flex: 1 }} />
        <input placeholder="\u4f7f\u7528\u540e\u8017\u65f6" value={timeAfter} onChange={e => setTimeAfter(e.target.value)} style={{ ...inputStyle, flex: 1 }} />
      </div>
      <div className="flex items-center justify-between">
        <div className="flex gap-2">
          {([true, false] as const).map(up => (
            <button
              key={String(up)}
              onClick={() => setIsUp(up)}
              className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm font-bold transition-all"
              style={{
                background: isUp === up ? (up ? '#dcfce7' : '#fee2e2') : 'var(--surface-container)',
                color: isUp === up ? (up ? '#166534' : '#991b1b') : 'var(--on-surface-variant)',
              }}
            >
              <span className="material-symbols-outlined text-base">{up ? 'thumb_up' : 'thumb_down'}</span>
              {up ? '\u63a8\u8350' : '\u4e0d\u63a8\u8350'}
            </button>
          ))}
        </div>
        <button
          onClick={submit}
          disabled={!problem.trim() || sending}
          className="px-5 py-2 rounded-xl text-sm font-bold transition-all disabled:opacity-40"
          style={{ background: 'var(--primary)', color: 'white' }}
        >
          {sending ? '\u63d0\u4ea4\u4e2d...' : '\u63d0\u4ea4\u6218\u7ee9'}
        </button>
      </div>
    </div>
  );
}

// ── Main Content ──

function SkillDetailContent() {
  const params = useSearchParams();
  const skillId = params.get('id') || '';

  const [activeTab, setActiveTab] = useState('claude');
  const [copied, setCopied] = useState('');
  const [showForm, setShowForm] = useState(false);

  // Fetch all skills from static data, find by id
  const { data: skillsData, isLoading } = useSWR('all-skills', async () => {
    const res = await fetch('/data/skills.json');
    return res.ok ? res.json() : {};
  });

  const allSkills: ClawHubSkill[] = skillsData?.skills || [];
  const skill = allSkills.find((s: ClawHubSkill) => s.id === skillId) || null;

  // Event stats
  const { data: statsData } = useSWR(
    skillId ? `event-stats-${skillId}` : null,
    () => getEventStats(skillId),
  );

  // Recommendations
  const { data: recsData } = useSWR(
    skillId ? `recs-${skillId}` : null,
    () => getRecommendations(skillId),
  );

  const copy = useCallback((text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopied(id);
    setTimeout(() => setCopied(''), 2000);
  }, []);

  // ── Loading / Not Found ──

  if (!skillId) {
    return (
      <div className="max-w-3xl mx-auto px-6 py-20 text-center">
        <span className="material-symbols-outlined text-6xl mb-4 block" style={{ color: 'var(--outline)' }}>error</span>
        <h2 className="text-xl font-bold mb-2" style={{ color: 'var(--on-surface)' }}>缺少 Skill ID</h2>
        <p className="text-sm mb-6" style={{ color: 'var(--on-surface-variant)' }}>请从技能列表页面进入查看详情</p>
        <Link href="/explore/skills" className="px-5 py-2.5 rounded-xl text-sm font-bold" style={{ background: 'var(--primary)', color: 'white' }}>
          浏览全部技能
        </Link>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto px-6 py-12 space-y-6">
        <div className="h-10 w-64 rounded-xl skeleton-shimmer" />
        <div className="h-6 w-96 rounded-lg skeleton-shimmer" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[0, 1, 2].map(i => <div key={i} className="h-32 rounded-2xl skeleton-shimmer" />)}
        </div>
        <div className="h-48 rounded-2xl skeleton-shimmer" />
      </div>
    );
  }

  if (!skill) {
    return (
      <div className="max-w-3xl mx-auto px-6 py-20 text-center">
        <span className="material-symbols-outlined text-6xl mb-4 block" style={{ color: 'var(--outline)' }}>search_off</span>
        <h2 className="text-xl font-bold mb-2" style={{ color: 'var(--on-surface)' }}>未找到该技能</h2>
        <p className="text-sm mb-6" style={{ color: 'var(--on-surface-variant)' }}>ID &quot;{skillId}&quot; 不存在或已下架</p>
        <Link href="/explore/skills" className="px-5 py-2.5 rounded-xl text-sm font-bold" style={{ background: 'var(--primary)', color: 'white' }}>
          浏览全部技能
        </Link>
      </div>
    );
  }

  // ── Derived data ──

  const isSkillType = (skill.source || 'clawhub') !== 'mcp-registry';
  const installId = getInstallId(skill);
  const repoName = getRepoName(skill);
  const ratingStyle = RATING_COLORS[skill.rating] || RATING_COLORS.C;
  const pm = (skill as any).permissionManifest || {};
  const permItems = parsePermissions(pm);
  const rate = (skill as any).deploySuccessRate as number | undefined;
  const deployCount = (skill as any).deployCount as number | undefined;
  const stale = (skill as any).stale as boolean | undefined;
  const syncedAt = skillsData?.meta?.syncedAt;
  const reviewUp = statsData?.stats?.review_up?.count ?? (skill as any).reviewUp ?? 0;
  const reviewDown = statsData?.stats?.review_down?.count ?? (skill as any).reviewDown ?? 0;
  const compositeScore = (skill as any).compositeScore ?? skill.score ?? 0;

  // Scenarios (placeholder until payload populates)
  const scenarios = [
    { icon: SCENARIO_ICONS[0], title: '\u5feb\u901f\u96c6\u6210', desc: `\u5c06 ${skill.name} \u5feb\u901f\u96c6\u6210\u5230\u4f60\u7684\u5de5\u4f5c\u6d41\u4e2d\uff0c\u6269\u5c55 AI Agent \u7684\u80fd\u529b\u8fb9\u754c` },
    { icon: SCENARIO_ICONS[1], title: '\u81ea\u52a8\u5316\u64cd\u4f5c', desc: `\u901a\u8fc7 ${skill.name} \u81ea\u52a8\u5316\u91cd\u590d\u6027\u4efb\u52a1\uff0c\u8282\u7701\u5927\u91cf\u4eba\u5de5\u65f6\u95f4` },
    { icon: SCENARIO_ICONS[2], title: '\u667a\u80fd\u51b3\u7b56', desc: `\u8ba9 AI Agent \u57fa\u4e8e ${skill.name} \u505a\u51fa\u66f4\u51c6\u786e\u7684\u5224\u65ad\u548c\u64cd\u4f5c` },
  ];

  // Recommendations
  const recs = (recsData?.recommendations || [])
    .map(r => allSkills.find(s => s.id === r.partner_id))
    .filter(Boolean) as ClawHubSkill[];

  // Install command for active tab
  const activeTarget = INSTALL_TARGETS.find(t => t.id === activeTab) || INSTALL_TARGETS[0];
  const installCmd = isSkillType
    ? activeTarget.cmdSkill?.(installId)
    : activeTarget.cmdMcp?.(installId, repoName);
  const availableTargets = INSTALL_TARGETS.filter(t => isSkillType ? t.cmdSkill : t.cmdMcp);

  // Deploy success rate
  const hasDeployData = rate !== undefined && rate >= 0 && (deployCount ?? 0) > 0;
  const deployRate = rate ?? 0;

  return (
    <div className="max-w-4xl mx-auto px-6 pb-32">

      {/* ═══ Zone 1: Hero ═══ */}
      <section className="pt-8 pb-6">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-sm mb-6" style={{ color: 'var(--on-surface-variant)' }}>
          <Link href="/explore/skills" className="hover:underline">技能市场</Link>
          <span className="material-symbols-outlined text-sm">chevron_right</span>
          <span style={{ color: 'var(--on-surface)' }}>{skill.name}</span>
        </div>

        <div className="flex flex-col md:flex-row md:items-start gap-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-3 flex-wrap mb-3">
              <h1 className="text-3xl md:text-4xl font-extrabold" style={{ fontFamily: 'Manrope, sans-serif', color: 'var(--on-surface)' }}>
                {skill.name}
              </h1>
              <span
                className="px-3 py-1 text-sm font-bold rounded-full"
                style={{ background: ratingStyle.bg, color: ratingStyle.text }}
              >
                {skill.rating}
              </span>
            </div>

            <p className="text-base mb-4 max-w-2xl" style={{ color: 'var(--on-surface-variant)' }}>
              {skill.editorialTagline || (skill.description && skill.description.length > 80 ? skill.description.slice(0, 80) + '...' : skill.description)}
            </p>

            <div className="flex items-center gap-3 flex-wrap mb-4">
              <span className="text-sm font-medium" style={{ color: 'var(--on-surface-variant)' }}>@{skill.author}</span>
              <span
                className="px-3 py-1 text-xs font-bold rounded-full"
                style={{ background: 'var(--surface-container)', color: 'var(--on-surface-variant)' }}
              >
                {skill.category}
              </span>
              <span
                className="px-2 py-0.5 text-[10px] font-bold rounded-full"
                style={{ background: isSkillType ? '#dbeafe' : '#d1fae5', color: isSkillType ? '#1e40af' : '#065f46' }}
              >
                {isSkillType ? 'Skill' : 'MCP Server'}
              </span>
            </div>

            {/* Stats row */}
            <div className="flex items-center gap-5 text-sm" style={{ color: 'var(--on-surface-variant)' }}>
              {skill.downloads > 0 && (
                <span className="flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-base">download</span>
                  {skill.downloadsDisplay || formatNum(skill.downloads)}
                </span>
              )}
              {skill.stars > 0 && (
                <span className="flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-base" style={{ color: '#f59e0b', fontVariationSettings: "'FILL' 1" }}>star</span>
                  {skill.starsDisplay || formatNum(skill.stars)}
                </span>
              )}
              {skill.versions > 0 && (
                <span className="flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-base">history</span>
                  {skill.versions} 版本
                </span>
              )}
            </div>
          </div>

          {/* Source link */}
          {(skill.url || skill.sourceUrl) && (
            <a
              href={skill.url || skill.sourceUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="shrink-0 flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-bold transition-all hover:opacity-80"
              style={{ background: 'var(--surface-container)', color: 'var(--primary)' }}
            >
              <span className="material-symbols-outlined text-base">open_in_new</span>
              查看源地址
            </a>
          )}
        </div>
      </section>

      {/* ═══ Zone 2: Scenarios ═══ */}
      <section className="py-6">
        <h2 className="text-lg font-bold mb-4" style={{ fontFamily: 'Manrope, sans-serif', color: 'var(--on-surface)' }}>
          用了能做什么
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {scenarios.map((s, i) => (
            <div
              key={i}
              className="p-5 rounded-2xl"
              style={{ background: 'var(--surface-container-low)' }}
            >
              <span className="material-symbols-outlined text-2xl mb-3 block" style={{ color: 'var(--primary)' }}>{s.icon}</span>
              <h3 className="font-bold text-sm mb-1.5" style={{ color: 'var(--on-surface)' }}>{s.title}</h3>
              <p className="text-xs leading-relaxed" style={{ color: 'var(--on-surface-variant)' }}>{s.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ═══ Zone 3: Combo Recommendations ═══ */}
      <section className="py-6">
        <h2 className="text-lg font-bold mb-4" style={{ fontFamily: 'Manrope, sans-serif', color: 'var(--on-surface)' }}>
          经常搭配使用
        </h2>
        {recs.length > 0 ? (
          <div className="flex gap-4 overflow-x-auto pb-2" style={{ scrollbarWidth: 'thin' }}>
            {recs.map(r => {
              const rs = RATING_COLORS[r.rating] || RATING_COLORS.C;
              return (
                <Link
                  key={r.id}
                  href={`/skill?id=${encodeURIComponent(r.id)}`}
                  className="shrink-0 w-52 p-4 rounded-2xl transition-all card-hover"
                  style={{ background: 'var(--surface-container-lowest)', border: '1px solid var(--outline-variant)' }}
                >
                  <div className="flex items-center gap-2 mb-2">
                    <h4 className="font-bold text-sm truncate flex-1" style={{ color: 'var(--on-surface)' }}>{r.name}</h4>
                    <span className="px-2 py-0.5 text-[10px] font-bold rounded-full shrink-0" style={{ background: rs.bg, color: rs.text }}>{r.rating}</span>
                  </div>
                  <p className="text-xs line-clamp-2 mb-3" style={{ color: 'var(--on-surface-variant)' }}>
                    {r.description ? (r.description.length > 60 ? r.description.slice(0, 60) + '...' : r.description) : ''}
                  </p>
                  <span className="text-xs font-bold flex items-center gap-1" style={{ color: 'var(--primary)' }}>
                    <span className="material-symbols-outlined text-sm">add_circle</span>
                    一起安装
                  </span>
                </Link>
              );
            })}
          </div>
        ) : (
          <div className="py-8 text-center rounded-2xl" style={{ background: 'var(--surface-container-low)' }}>
            <span className="material-symbols-outlined text-3xl mb-2 block" style={{ color: 'var(--outline)' }}>group</span>
            <p className="text-sm" style={{ color: 'var(--on-surface-variant)' }}>暂无搭配数据</p>
          </div>
        )}
      </section>

      {/* ═══ Zone 4: Battle Record Testimonials ═══ */}
      <section className="py-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold" style={{ fontFamily: 'Manrope, sans-serif', color: 'var(--on-surface)' }}>
            用户战绩
          </h2>
          <button
            onClick={() => setShowForm(!showForm)}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-bold transition-all hover:opacity-80"
            style={{ background: 'var(--primary)', color: 'white' }}
          >
            <span className="material-symbols-outlined text-base">{showForm ? 'close' : 'add'}</span>
            {showForm ? '收起' : '提交你的战绩'}
          </button>
        </div>

        {showForm && (
          <div className="mb-4">
            <TestimonialForm
              skillId={skillId}
              onDone={() => setShowForm(false)}
            />
          </div>
        )}

        {(reviewUp > 0 || reviewDown > 0) ? (
          <div className="flex items-center gap-4 py-6 px-5 rounded-2xl" style={{ background: 'var(--surface-container-low)' }}>
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-xl" style={{ color: '#16a34a', fontVariationSettings: "'FILL' 1" }}>thumb_up</span>
              <span className="text-2xl font-bold" style={{ color: 'var(--on-surface)' }}>{reviewUp}</span>
              <span className="text-sm" style={{ color: 'var(--on-surface-variant)' }}>推荐</span>
            </div>
            <div className="w-px h-8" style={{ background: 'var(--outline-variant)' }} />
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-xl" style={{ color: '#dc2626', fontVariationSettings: "'FILL' 1" }}>thumb_down</span>
              <span className="text-2xl font-bold" style={{ color: 'var(--on-surface)' }}>{reviewDown}</span>
              <span className="text-sm" style={{ color: 'var(--on-surface-variant)' }}>不推荐</span>
            </div>
          </div>
        ) : (
          <div className="py-8 text-center rounded-2xl" style={{ background: 'var(--surface-container-low)' }}>
            <span className="material-symbols-outlined text-3xl mb-2 block" style={{ color: 'var(--outline)' }}>military_tech</span>
            <p className="text-sm mb-1" style={{ color: 'var(--on-surface-variant)' }}>还没有用户战绩</p>
            {!showForm && (
              <button
                onClick={() => setShowForm(true)}
                className="text-sm font-bold mt-2"
                style={{ color: 'var(--primary)' }}
              >
                成为第一个提交战绩的人
              </button>
            )}
          </div>
        )}
      </section>

      {/* ═══ Zone 6: Permissions ═══ */}
      <section className="py-6">
        <h2 className="text-lg font-bold mb-4" style={{ fontFamily: 'Manrope, sans-serif', color: 'var(--on-surface)' }}>
          权限说明
        </h2>
        {permItems.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {permItems.map((item, i) => {
              const sty = SEVERITY_STYLES[item.severity];
              return (
                <div key={i} className="flex items-center gap-3 p-4 rounded-xl" style={{ background: sty.bg }}>
                  <span className="material-symbols-outlined text-xl" style={{ color: sty.color }}>{item.icon}</span>
                  <div>
                    <div className="text-sm font-bold" style={{ color: sty.color }}>{item.label}</div>
                    <div className="text-xs" style={{ color: sty.color, opacity: 0.8 }}>{item.detail}</div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="py-6 text-center rounded-2xl" style={{ background: 'var(--surface-container-low)' }}>
            <span className="material-symbols-outlined text-2xl mb-2 block" style={{ color: 'var(--outline)' }}>info</span>
            <p className="text-sm" style={{ color: 'var(--on-surface-variant)' }}>权限信息暂未收集</p>
          </div>
        )}
      </section>

      {/* ═══ Zone 7: Activity ═══ */}
      <section className="py-6">
        <h2 className="text-lg font-bold mb-4" style={{ fontFamily: 'Manrope, sans-serif', color: 'var(--on-surface)' }}>
          活跃度
        </h2>
        <div className="p-5 rounded-2xl space-y-4" style={{ background: 'var(--surface-container-lowest)', border: '1px solid var(--outline-variant)' }}>
          {/* Deploy success rate */}
          {hasDeployData && (
            <div>
              <div className="flex items-center justify-between text-sm mb-2">
                <span style={{ color: 'var(--on-surface-variant)' }}>部署成功率</span>
                <span className="font-bold" style={{ color: deployRate >= 0.7 ? '#16a34a' : deployRate >= 0.4 ? '#ca8a04' : '#dc2626' }}>
                  {Math.round(deployRate * 100)}% ({deployCount} 次)
                </span>
              </div>
              <div className="h-2 rounded-full overflow-hidden" style={{ background: 'var(--surface-container)' }}>
                <div
                  className="h-full rounded-full transition-all"
                  style={{
                    width: `${Math.round(deployRate * 100)}%`,
                    background: deployRate >= 0.7 ? '#16a34a' : deployRate >= 0.4 ? '#ca8a04' : '#dc2626',
                  }}
                />
              </div>
            </div>
          )}

          {/* Composite score */}
          <div className="flex items-center justify-between">
            <span className="text-sm" style={{ color: 'var(--on-surface-variant)' }}>综合评分</span>
            <span className="text-lg font-bold" style={{ color: 'var(--on-surface)' }}>{compositeScore}</span>
          </div>

          {/* Review summary */}
          <div className="flex items-center justify-between">
            <span className="text-sm" style={{ color: 'var(--on-surface-variant)' }}>用户评价</span>
            <div className="flex items-center gap-3 text-sm">
              <span className="flex items-center gap-1" style={{ color: '#16a34a' }}>
                <span className="material-symbols-outlined text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>thumb_up</span>
                {reviewUp}
              </span>
              <span className="flex items-center gap-1" style={{ color: '#dc2626' }}>
                <span className="material-symbols-outlined text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>thumb_down</span>
                {reviewDown}
              </span>
            </div>
          </div>

          {/* Stale warning */}
          {stale && (
            <div className="flex items-center gap-2 px-3 py-2 rounded-lg" style={{ background: '#fee2e2', color: '#991b1b' }}>
              <span className="material-symbols-outlined text-base">schedule</span>
              <span className="text-sm font-bold">该技能已长时间未更新 (Stale)</span>
            </div>
          )}

          {/* Last sync */}
          {syncedAt && (
            <div className="flex items-center justify-between pt-2 border-t" style={{ borderColor: 'var(--outline-variant)' }}>
              <span className="text-xs" style={{ color: 'var(--on-surface-variant)' }}>最后更新</span>
              <span className="text-xs" style={{ color: 'var(--on-surface-variant)' }}>
                {new Date(syncedAt).toLocaleDateString('zh-CN')}
              </span>
            </div>
          )}
        </div>
      </section>

      {/* ═══ Zone 5: Install Command (STICKY) ═══ */}
      <div
        className="fixed bottom-0 left-0 right-0 z-40 border-t"
        style={{
          background: 'var(--surface-container-lowest)',
          borderColor: 'var(--outline-variant)',
          boxShadow: '0 -4px 24px rgba(0,0,0,0.08)',
        }}
      >
        <div className="max-w-4xl mx-auto px-6 py-4">
          {/* Platform tabs */}
          <div className="flex gap-1 mb-3 overflow-x-auto pb-1" style={{ scrollbarWidth: 'thin' }}>
            {availableTargets.map(tgt => (
              <button
                key={tgt.id}
                onClick={() => setActiveTab(tgt.id)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap shrink-0"
                style={{
                  background: activeTab === tgt.id ? 'var(--primary)' : 'var(--surface-container)',
                  color: activeTab === tgt.id ? 'white' : 'var(--on-surface-variant)',
                }}
              >
                <span className="material-symbols-outlined" style={{ fontSize: '14px' }}>{tgt.icon}</span>
                {tgt.name}
              </button>
            ))}
          </div>

          {/* Command + copy */}
          {installCmd && (
            <div className="flex items-start gap-3">
              <pre
                className="flex-1 text-xs overflow-x-auto rounded-xl p-3"
                style={{
                  background: '#1e1e2e',
                  color: '#cdd6f4',
                  fontFamily: 'monospace',
                  whiteSpace: installCmd.includes('\n') ? 'pre' : 'nowrap',
                  maxHeight: '120px',
                }}
              >
                {installCmd}
              </pre>
              <button
                onClick={() => copy(installCmd, 'install')}
                className="shrink-0 flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-sm font-bold transition-all"
                style={{
                  background: copied === 'install' ? '#22c55e' : 'var(--primary)',
                  color: 'white',
                }}
              >
                <span className="material-symbols-outlined text-base">
                  {copied === 'install' ? 'check' : 'content_copy'}
                </span>
                {copied === 'install' ? '已复制' : '复制'}
              </button>
            </div>
          )}
          {!installCmd && (
            <p className="text-xs py-2" style={{ color: 'var(--on-surface-variant)' }}>
              该平台暂不支持此类型的安装方式
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Page export with Suspense (required for useSearchParams in static export) ──

export default function SkillDetailPage() {
  return (
    <Suspense fallback={
      <div className="max-w-4xl mx-auto px-6 py-12 space-y-6">
        <div className="h-10 w-64 rounded-xl skeleton-shimmer" />
        <div className="h-6 w-96 rounded-lg skeleton-shimmer" />
        <div className="h-48 rounded-2xl skeleton-shimmer" />
      </div>
    }>
      <SkillDetailContent />
    </Suspense>
  );
}
