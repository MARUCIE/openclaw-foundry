// News content data — static seed, should be replaced with API integration
// TODO: Replace with /api/news endpoint backed by D1

export interface NewsItem {
  tag: string;
  tagColor: string;
  date: string;
  title: string;
  desc: string;
  category: string; // internal key: 'releases' | 'industry' | 'tutorials' | 'community'
}

export interface VersionEntry {
  name: string;
  version: string;
  date: string;
}

export const TAB_KEYS = ['news.tab.all', 'news.tab.releases', 'news.tab.industry', 'news.tab.tutorials', 'news.tab.community'] as const;

// Map tab i18n key → internal category key for filtering
export const TAB_TO_CATEGORY: Record<string, string> = {
  'news.tab.releases': 'releases',
  'news.tab.industry': 'industry',
  'news.tab.tutorials': 'tutorials',
  'news.tab.community': 'community',
};

export const FEATURED: NewsItem = {
  tag: 'GITHUB RELEASE',
  tagColor: 'bg-blue-100 text-blue-700',
  date: '2026-03-20',
  title: 'OpenClaw 2.0 正式发布：全面支持 MCP 协议',
  desc: '全新架构支持插件化扩展！OpenClaw v2.0 正式引入 Model Context Protocol (MCP)，实现 Agent 与工具链的无缝对接，大幅提升开发效率与生态兼容性。',
  category: 'releases',
};

export const NEWS_FEED: NewsItem[] = [
  { tag: 'IT之家', tagColor: 'bg-red-100 text-red-600', date: '2026-03-21', title: '火山引擎 ArkClaw 推出飞书深度集成，企业用户免费试用', desc: '飞书飞工作台配件，企业开发者可以直接出 ArkClaw 直接 IM 界面中调度所有 AI Agent 任务。', category: 'industry' },
  { tag: '36KR', tagColor: 'bg-orange-100 text-orange-600', date: '2026-03-20', title: '百度 DuClaw 上线千机平台，接入文心/DeepSeek/Qwen 三大模型', desc: 'DuClaw 完成多模型通道无缝衔接，开发者可以一套代码对接三大模型厂商入大规模推理产力。', category: 'industry' },
  { tag: 'GITHUB', tagColor: 'bg-slate-100 text-slate-600', date: '2026-03-20', title: 'HiClaw v1.2 发布：新增 Matrix SDK + Higress 管理 API', desc: '此次更新新增 7 款兑积的 AI 调度能力，通过 Higress API 实现了更精准稳定的请求路由机制管理。', category: 'releases' },
  { tag: 'TECHNODE', tagColor: 'bg-purple-100 text-purple-600', date: '2026-03-18', title: '腾讯 QClaw 全面公测：QQ 端 AI Agent 正式面向大众', desc: 'QClaw 终端已连续 AI 领域的开发大门端，支持一键开启 OpenClaw Agent 插件 QQ 机器入。', category: 'releases' },
  { tag: '机器之心', tagColor: 'bg-green-100 text-green-600', date: '2026-03-17', title: '智谱 AutoClaw CLI 模式深度测评：一键无人值守部署', desc: '测试显示 AutoClaw CLI 在各角色前提场景下的部署效率领跑同类 400%。', category: 'tutorials' },
  { tag: '社区', tagColor: 'bg-yellow-100 text-yellow-700', date: '2026-03-17', title: 'OpenClaw + MiniMax M2.5：MaxClaw 实测报告', desc: '社区开发者报告了使用 MiniMax 最新锻型进一步提高实效客户 Agent 的全过程与集效力。', category: 'community' },
];

export const VERSION_TRACKER: VersionEntry[] = [
  { name: 'OpenClaw', version: 'v2.4.0', date: '2026-03-20' },
  { name: 'HiClaw', version: 'v1.2', date: '2026-03-19' },
  { name: 'CoPaw', version: 'v0.8.1', date: '2026-03-18' },
  { name: 'AutoClaw', version: 'v1.5.0', date: '2026-03-17' },
  { name: 'ArkClaw', version: 'v1.2 GA', date: '2026-03-15' },
  { name: 'DuClaw', version: 'v1.0', date: '2026-03-11' },
];

export const TAGS = ['#MCP', '#飞书', '#一键部署', '#Skills', '#ClawHub', '#自动化', '#开源', '#企业'];
