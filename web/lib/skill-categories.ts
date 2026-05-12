export const CATEGORY_KEY_MAP: Record<string, string> = {
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

export function localizeSkillCategory(
  category: string,
  t: (key: string, vars?: Record<string, string | number>) => string,
): string {
  const key = CATEGORY_KEY_MAP[category];
  return key ? t(key) : category;
}
