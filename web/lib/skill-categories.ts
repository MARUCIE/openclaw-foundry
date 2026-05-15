// Job Pack 8-tier taxonomy + Agent cross-cut + 其他 residual (post 2026-05-15 retag)
export const CATEGORY_KEY_MAP: Record<string, string> = {
  '写代码': 'skills.cat.jobPack.code',
  '做数据': 'skills.cat.jobPack.data',
  '做产品': 'skills.cat.jobPack.product',
  '做业务': 'skills.cat.jobPack.business',
  '定策略': 'skills.cat.jobPack.strategy',
  '做研究': 'skills.cat.jobPack.research',
  '场景规划': 'skills.cat.jobPack.scenario',
  '看数据': 'skills.cat.jobPack.analytics',
  'Agent 工具': 'skills.cat.jobPack.agent',
  '其他': 'skills.cat.other',
};

export function localizeSkillCategory(
  category: string,
  t: (key: string, vars?: Record<string, string | number>) => string,
): string {
  const key = CATEGORY_KEY_MAP[category];
  return key ? t(key) : category;
}
