'use client';

import { useState } from 'react';
import { useI18n } from '@/lib/i18n';

// Category keys map to i18n keys mcp.cat.*
const CATEGORY_KEYS = ['all', '数据库', '通讯', '云服务', '文件系统', '开发工具', '搜索', '浏览器', 'IM'] as const;
const MCP_CAT_I18N: Record<string, string> = {
  'all': 'mcp.cat.all',
  '数据库': 'mcp.cat.database',
  '通讯': 'mcp.cat.communication',
  '云服务': 'mcp.cat.cloud',
  '文件系统': 'mcp.cat.filesystem',
  '开发工具': 'mcp.cat.devtools',
  '搜索': 'mcp.cat.search',
  '浏览器': 'mcp.cat.browser',
  'IM': 'mcp.cat.im',
};

const FEATURED = [
  { name: 'GitHub', icon: 'code', iconBg: 'var(--primary-fixed)', iconColor: 'var(--primary)', badge: 'PREMIUM', badgeBg: 'var(--surface-container-high)', desc: '完整集成 GitHub 工作流、管理仓库、PR、Issue 及代码特扫等全 Agent 操作能力。', cmd: 'npx -y @modelcontextprotocol/server-github', stars: '12.4k' },
  { name: 'Filesystem', icon: 'folder', iconBg: 'var(--tertiary-fixed)', iconColor: 'var(--tertiary)', badge: 'CORE', badgeBg: 'var(--tertiary-fixed)', desc: '本地文件系统读写和搜索，支持目录浏览下的文件操作、内置权限控制，Agent 的大脑延展干泉。', cmd: 'npx -y @modelcontextprotocol/server-filesystem', stars: '8.7k' },
  { name: 'PostgreSQL', icon: 'database', iconBg: 'var(--secondary-fixed)', iconColor: 'var(--secondary)', badge: 'DATA', badgeBg: 'var(--secondary-fixed)', desc: '安全地连接定位的关系型数据源，支持查询 Schema 自查、复合 SQL 执行与数据分析统计构建。', cmd: 'npx -y @modelcontextprotocol/server-postgres', stars: '6.3k' },
];

const MCP_SERVERS = [
  { name: 'PostgreSQL', icon: 'database', iconBg: '#e8f5e9', iconColor: '#2e7d32', category: '数据库', cmd: 'npx @mcp/postgres', stars: '2.4k', protocol: 'STDIO', desc: '安全地连接与管理数据' },
  { name: 'GitHub', icon: 'code', iconBg: '#e3f2fd', iconColor: '#1565c0', category: '开发工具', cmd: 'npx @mcp/github', stars: '3.5k', protocol: 'HTTP', desc: '代码托管和Issue管理' },
  { name: 'Slack', icon: 'chat_bubble', iconBg: '#fce4ec', iconColor: '#c62828', category: 'IM', cmd: 'npx @mcp/slack', stars: '1.8k', protocol: 'HTTP', desc: '消息发送与频道联动管理' },
  { name: 'Filesystem', icon: 'folder', iconBg: '#fff3e0', iconColor: '#e65100', category: '文件系统', cmd: 'npx @mcp/filesystem', stars: '4.3k', protocol: 'STDIO', desc: '本地文件的读写和操控' },
  { name: 'Docker', icon: 'deployed_code', iconBg: '#e8eaf6', iconColor: '#283593', category: '开发工具', cmd: 'npx @mcp/docker', stars: '1.2k', protocol: 'STDIO', desc: '容器管理和服务编排' },
  { name: 'Brave Search', icon: 'search', iconBg: '#fce4ec', iconColor: '#ad1457', category: '搜索', cmd: 'npx @mcp/brave-search', stars: '900', protocol: 'STDIO', desc: '隐私友好的 AI 搜索引擎' },
  { name: 'Chrome DevTools', icon: 'web', iconBg: '#e8f5e9', iconColor: '#2e7d32', category: '浏览器', cmd: 'npx @mcp/chrome-devtools', stars: '', protocol: 'HTTP', desc: '浏览器调试和可视化自动化' },
  { name: '飞书', icon: 'mark_chat_read', iconBg: '#e3f2fd', iconColor: '#1565c0', category: 'IM', cmd: 'npx @mcp/feishu', stars: '', protocol: 'HTTP', desc: '飞书开放平台 API 集成' },
  { name: 'Cloudflare', icon: 'cloud_done', iconBg: '#fff3e0', iconColor: '#e65100', category: '云服务', cmd: 'npx @mcp/cloudflare', stars: '3.4k', protocol: 'STDIO', desc: 'Workers/KV/D1/R2 全栈管理' },
  { name: 'MongoDB', icon: 'database', iconBg: '#e8f5e9', iconColor: '#2e7d32', category: '数据库', cmd: 'npx @mcp/mongodb', stars: '1.1k', protocol: 'STDIO', desc: 'NoSQL 数据库查询与管理' },
  { name: 'Vercel', icon: 'cloud_upload', iconBg: '#f3e5f5', iconColor: '#6a1b9a', category: '云服务', cmd: 'npx @mcp/vercel', stars: '700', protocol: 'STDIO', desc: '项目与域名化管理部署' },
  { name: 'Playwright', icon: 'smart_display', iconBg: '#e8eaf6', iconColor: '#283593', category: '浏览器', cmd: 'npx @mcp/playwright', stars: '2k', protocol: 'STDIO', desc: '跨浏览器自动化测试引擎' },
  { name: '钉钉', icon: 'forum', iconBg: '#e3f2fd', iconColor: '#1565c0', category: 'IM', cmd: 'npx @mcp/dingtalk', stars: '650', protocol: 'HTTP', desc: '钉钉机器人和公告推送集成' },
  { name: 'Redis MCP', icon: 'memory', iconBg: '#ffebee', iconColor: '#c62828', category: '数据库', cmd: 'npx @mcp/redis', stars: '3.1k', protocol: 'STDIO', desc: 'Redis 缓存和消息队列集成' },
  { name: 'AWS S3', icon: 'cloud_upload', iconBg: '#fff3e0', iconColor: '#e65100', category: '云服务', cmd: 'npx @mcp/aws-s3', stars: '4.0k', protocol: 'STDIO', desc: 'S3 存储桶管理和文件操作' },
  { name: 'Elasticsearch', icon: 'manage_search', iconBg: '#e8eaf6', iconColor: '#283593', category: '搜索', cmd: 'npx @mcp/elasticsearch', stars: '2.1k', protocol: 'STDIO', desc: '全文搜索与日志分析' },
];

export default function McpDirectoryPage() {
  const { t } = useI18n();
  const [activeCategory, setActiveCategory] = useState('all');
  const [search, setSearch] = useState('');

  const filtered = MCP_SERVERS.filter(s => {
    if (activeCategory !== 'all' && s.category !== activeCategory) return false;
    if (search && !s.name.toLowerCase().includes(search.toLowerCase()) && !s.desc.includes(search)) return false;
    return true;
  });

  return (
    <div className="max-w-[1440px] mx-auto px-6 md:px-8">
      {/* Header */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-end gap-6 pt-8 pb-10">
        <div className="space-y-3">
          <h1
            className="text-4xl md:text-5xl font-extrabold"
            style={{ fontFamily: 'Manrope, sans-serif', color: 'var(--on-surface)' }}
          >
            {t('mcp.title')}
          </h1>
          <p className="text-lg max-w-2xl" style={{ color: 'var(--on-surface-variant)' }}>
            {t('mcp.subtitle')}
          </p>
        </div>
        <div className="relative w-full lg:w-80">
          <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--outline)' }}>search</span>
          <input
            type="text"
            placeholder={t('mcp.searchPlaceholder')}
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full rounded-xl py-3 pl-10 pr-4 text-sm"
            style={{ background: 'var(--surface-container-low)', border: 'none' }}
          />
        </div>
      </div>

      {/* Category Tabs */}
      <div className="flex gap-2 flex-wrap mb-12">
        {CATEGORY_KEYS.map(cat => (
          <button
            key={cat}
            onClick={() => setActiveCategory(cat)}
            className="px-4 py-2 rounded-full text-sm font-bold transition-all"
            style={{
              background: activeCategory === cat ? 'var(--primary)' : 'var(--surface-container)',
              color: activeCategory === cat ? 'var(--on-primary)' : 'var(--on-surface-variant)',
            }}
          >
            {MCP_CAT_I18N[cat] ? t(MCP_CAT_I18N[cat]) : cat}
          </button>
        ))}
      </div>

      {/* Featured Section */}
      <section className="mb-16">
        <h2 className="text-xl font-bold mb-6" style={{ fontFamily: 'Manrope, sans-serif', color: 'var(--on-surface-variant)' }}>
          {t('mcp.featured')}
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {FEATURED.map(mcp => (
            <div
              key={mcp.name}
              className="p-8 rounded-3xl transition-all card-hover"
              style={{
                background: 'var(--surface-container-lowest)',
                border: '1px solid rgba(195, 198, 215, 0.3)',
              }}
            >
              <div className="flex items-start gap-4 mb-5">
                <div
                  className="w-14 h-14 rounded-2xl flex items-center justify-center shrink-0"
                  style={{ background: mcp.iconBg, color: mcp.iconColor }}
                >
                  <span className="material-symbols-outlined text-3xl">{mcp.icon}</span>
                </div>
                <span className="px-2.5 py-1 rounded-full text-[9px] font-bold tracking-wider uppercase" style={{ background: mcp.badgeBg, color: mcp.iconColor }}>
                  {mcp.badge}
                </span>
              </div>
              <h3 className="text-xl font-bold mb-2" style={{ fontFamily: 'Manrope, sans-serif', color: 'var(--on-surface)' }}>{mcp.name}</h3>
              <p className="text-sm mb-6 leading-relaxed" style={{ color: 'var(--on-surface-variant)' }}>{mcp.desc}</p>
              <div
                className="p-3 rounded-xl mb-4 text-xs font-mono truncate flex items-center justify-between"
                style={{ background: 'var(--surface-container)', color: 'var(--on-surface)' }}
              >
                <span className="truncate">{mcp.cmd}</span>
                <span className="material-symbols-outlined text-sm shrink-0 ml-2 cursor-pointer" style={{ color: 'var(--outline)' }}>content_copy</span>
              </div>
              <button
                className="w-full py-3 rounded-xl font-bold text-sm transition-opacity hover:opacity-90 flex items-center justify-center gap-2"
                style={{ background: 'var(--primary-container)', color: 'var(--on-primary)' }}
              >
                <span className="material-symbols-outlined text-sm">download</span>
                {t('mcp.install')}
              </button>
            </div>
          ))}
        </div>
      </section>

      {/* Grid */}
      <section className="pb-16">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold" style={{ fontFamily: 'Manrope, sans-serif', color: 'var(--on-surface-variant)' }}>
            {t('mcp.exploreAll')}
          </h2>
          <span className="text-sm" style={{ color: 'var(--on-surface-variant)' }}>
            {t('mcp.showingResults', { count: filtered.length, total: 128 })}
          </span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filtered.map((mcp, i) => (
            <div
              key={`${mcp.name}-${i}`}
              className="p-5 rounded-2xl transition-all card-hover"
              style={{
                background: 'var(--surface-container-lowest)',
                border: '1px solid rgba(195, 198, 215, 0.2)',
              }}
            >
              <div className="flex items-center gap-3 mb-3">
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                  style={{ background: mcp.iconBg, color: mcp.iconColor }}
                >
                  <span className="material-symbols-outlined text-lg">{mcp.icon}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="font-bold text-sm truncate" style={{ color: 'var(--on-surface)' }}>{mcp.name}</h4>
                  <p className="text-xs truncate" style={{ color: 'var(--on-surface-variant)' }}>{mcp.desc}</p>
                </div>
                <span className="px-2 py-0.5 rounded text-[9px] font-bold shrink-0" style={{ background: mcp.protocol === 'HTTP' ? 'var(--secondary-fixed)' : 'var(--surface-container)', color: mcp.protocol === 'HTTP' ? 'var(--on-secondary-fixed-variant)' : 'var(--on-surface-variant)' }}>
                  {mcp.protocol}
                </span>
              </div>
              <div
                className="px-2 py-1.5 rounded-lg text-[10px] font-mono truncate mb-3"
                style={{ background: 'var(--surface-container)', color: 'var(--on-surface-variant)' }}
              >
                {mcp.cmd}
              </div>
              <div className="flex justify-between items-center">
                {mcp.stars ? (
                  <span className="text-xs flex items-center gap-1" style={{ color: 'var(--on-surface-variant)' }}>
                    <span className="material-symbols-outlined text-sm" style={{ fontVariationSettings: "'FILL' 1", color: '#f59e0b' }}>star</span>
                    {mcp.stars}
                  </span>
                ) : <span />}
                <button
                  className="px-3 py-1.5 rounded-lg text-xs font-bold transition-opacity hover:opacity-90"
                  style={{ background: 'var(--primary)', color: 'white' }}
                >
                  {t('mcp.install')}
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Pagination */}
        <div className="flex justify-center items-center gap-1 mt-10">
          <button className="w-9 h-9 rounded-lg flex items-center justify-center" style={{ background: 'var(--surface-container)', color: 'var(--on-surface-variant)' }}>
            <span className="material-symbols-outlined text-sm">chevron_left</span>
          </button>
          {[1, 2, 3].map(p => (
            <button
              key={p}
              className="w-9 h-9 rounded-lg text-sm font-bold"
              style={{
                background: p === 1 ? 'var(--primary)' : 'var(--surface-container)',
                color: p === 1 ? 'var(--on-primary)' : 'var(--on-surface-variant)',
              }}
            >
              {p}
            </button>
          ))}
          <span className="px-2 text-sm" style={{ color: 'var(--outline)' }}>...</span>
          <button className="w-9 h-9 rounded-lg text-sm font-bold" style={{ background: 'var(--surface-container)', color: 'var(--on-surface-variant)' }}>11</button>
          <button className="w-9 h-9 rounded-lg flex items-center justify-center" style={{ background: 'var(--surface-container)', color: 'var(--on-surface-variant)' }}>
            <span className="material-symbols-outlined text-sm">chevron_right</span>
          </button>
        </div>
      </section>
    </div>
  );
}
