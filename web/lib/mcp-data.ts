// MCP server data — static seed, should be replaced with API integration
// TODO: Replace with /api/mcp endpoint backed by D1

export interface McpServer {
  name: string;
  icon: string;
  iconBg: string;
  iconColor: string;
  category: string; // internal key matching CATEGORY_KEYS
  cmd: string;
  stars: string;
  protocol: 'STDIO' | 'HTTP';
  desc: string;
}

export interface FeaturedMcp {
  name: string;
  icon: string;
  iconBg: string;
  iconColor: string;
  badge: string;
  badgeBg: string;
  desc: string;
  cmd: string;
  stars: string;
}

// Internal category keys — i18n mapping is in the page via mcp.cat.* keys
export const CATEGORY_KEYS = ['all', 'database', 'communication', 'cloud', 'filesystem', 'devtools', 'search', 'browser', 'im'] as const;

export const CATEGORY_I18N: Record<string, string> = {
  all: 'mcp.cat.all',
  database: 'mcp.cat.database',
  communication: 'mcp.cat.communication',
  cloud: 'mcp.cat.cloud',
  filesystem: 'mcp.cat.filesystem',
  devtools: 'mcp.cat.devtools',
  search: 'mcp.cat.search',
  browser: 'mcp.cat.browser',
  im: 'mcp.cat.im',
};

export const FEATURED_MCP: FeaturedMcp[] = [
  { name: 'GitHub', icon: 'code', iconBg: 'var(--primary-fixed)', iconColor: 'var(--primary)', badge: 'PREMIUM', badgeBg: 'var(--surface-container-high)', desc: '完整集成 GitHub 工作流、管理仓库、PR、Issue 及代码特扫等全 Agent 操作能力。', cmd: 'npx -y @modelcontextprotocol/server-github', stars: '12.4k' },
  { name: 'Filesystem', icon: 'folder', iconBg: 'var(--tertiary-fixed)', iconColor: 'var(--tertiary)', badge: 'CORE', badgeBg: 'var(--tertiary-fixed)', desc: '本地文件系统读写和搜索，支持目录浏览下的文件操作、内置权限控制，Agent 的大脑延展干泉。', cmd: 'npx -y @modelcontextprotocol/server-filesystem', stars: '8.7k' },
  { name: 'PostgreSQL', icon: 'database', iconBg: 'var(--secondary-fixed)', iconColor: 'var(--secondary)', badge: 'DATA', badgeBg: 'var(--secondary-fixed)', desc: '安全地连接定位的关系型数据源，支持查询 Schema 自查、复合 SQL 执行与数据分析统计构建。', cmd: 'npx -y @modelcontextprotocol/server-postgres', stars: '6.3k' },
];

export const MCP_SERVERS: McpServer[] = [
  { name: 'PostgreSQL', icon: 'database', iconBg: '#e8f5e9', iconColor: '#2e7d32', category: 'database', cmd: 'npx @mcp/postgres', stars: '2.4k', protocol: 'STDIO', desc: '安全地连接与管理数据' },
  { name: 'GitHub', icon: 'code', iconBg: '#e3f2fd', iconColor: '#1565c0', category: 'devtools', cmd: 'npx @mcp/github', stars: '3.5k', protocol: 'HTTP', desc: '代码托管和Issue管理' },
  { name: 'Slack', icon: 'chat_bubble', iconBg: '#fce4ec', iconColor: '#c62828', category: 'im', cmd: 'npx @mcp/slack', stars: '1.8k', protocol: 'HTTP', desc: '消息发送与频道联动管理' },
  { name: 'Filesystem', icon: 'folder', iconBg: '#fff3e0', iconColor: '#e65100', category: 'filesystem', cmd: 'npx @mcp/filesystem', stars: '4.3k', protocol: 'STDIO', desc: '本地文件的读写和操控' },
  { name: 'Docker', icon: 'deployed_code', iconBg: '#e8eaf6', iconColor: '#283593', category: 'devtools', cmd: 'npx @mcp/docker', stars: '1.2k', protocol: 'STDIO', desc: '容器管理和服务编排' },
  { name: 'Brave Search', icon: 'search', iconBg: '#fce4ec', iconColor: '#ad1457', category: 'search', cmd: 'npx @mcp/brave-search', stars: '900', protocol: 'STDIO', desc: '隐私友好的 AI 搜索引擎' },
  { name: 'Chrome DevTools', icon: 'web', iconBg: '#e8f5e9', iconColor: '#2e7d32', category: 'browser', cmd: 'npx @mcp/chrome-devtools', stars: '', protocol: 'HTTP', desc: '浏览器调试和可视化自动化' },
  { name: '飞书', icon: 'mark_chat_read', iconBg: '#e3f2fd', iconColor: '#1565c0', category: 'im', cmd: 'npx @mcp/feishu', stars: '', protocol: 'HTTP', desc: '飞书开放平台 API 集成' },
  { name: 'Cloudflare', icon: 'cloud_done', iconBg: '#fff3e0', iconColor: '#e65100', category: 'cloud', cmd: 'npx @mcp/cloudflare', stars: '3.4k', protocol: 'STDIO', desc: 'Workers/KV/D1/R2 全栈管理' },
  { name: 'MongoDB', icon: 'database', iconBg: '#e8f5e9', iconColor: '#2e7d32', category: 'database', cmd: 'npx @mcp/mongodb', stars: '1.1k', protocol: 'STDIO', desc: 'NoSQL 数据库查询与管理' },
  { name: 'Vercel', icon: 'cloud_upload', iconBg: '#f3e5f5', iconColor: '#6a1b9a', category: 'cloud', cmd: 'npx @mcp/vercel', stars: '700', protocol: 'STDIO', desc: '项目与域名化管理部署' },
  { name: 'Playwright', icon: 'smart_display', iconBg: '#e8eaf6', iconColor: '#283593', category: 'browser', cmd: 'npx @mcp/playwright', stars: '2k', protocol: 'STDIO', desc: '跨浏览器自动化测试引擎' },
  { name: '钉钉', icon: 'forum', iconBg: '#e3f2fd', iconColor: '#1565c0', category: 'im', cmd: 'npx @mcp/dingtalk', stars: '650', protocol: 'HTTP', desc: '钉钉机器人和公告推送集成' },
  { name: 'Redis MCP', icon: 'memory', iconBg: '#ffebee', iconColor: '#c62828', category: 'database', cmd: 'npx @mcp/redis', stars: '3.1k', protocol: 'STDIO', desc: 'Redis 缓存和消息队列集成' },
  { name: 'AWS S3', icon: 'cloud_upload', iconBg: '#fff3e0', iconColor: '#e65100', category: 'cloud', cmd: 'npx @mcp/aws-s3', stars: '4.0k', protocol: 'STDIO', desc: 'S3 存储桶管理和文件操作' },
  { name: 'Elasticsearch', icon: 'manage_search', iconBg: '#e8eaf6', iconColor: '#283593', category: 'search', cmd: 'npx @mcp/elasticsearch', stars: '2.1k', protocol: 'STDIO', desc: '全文搜索与日志分析' },
];
