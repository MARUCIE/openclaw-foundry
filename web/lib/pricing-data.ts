// Pricing metadata — enriched static data not available from the API
// Maintained separately from API provider data for manual curation

export interface PricingMeta {
  type: string;
  price: string;
  model: string;
  skills: string;
  im: string;
  opensource: boolean;
  recommended?: boolean;
}

export const PRICING_META: Record<string, PricingMeta> = {
  openclaw:    { type: '开源核心', price: '免费开源', model: 'Claude/GPT', skills: '无限', im: 'Telegram/Discord/Slack', opensource: true, recommended: true },
  hiclaw:      { type: '协作版', price: '¥199/月', model: 'DashScope', skills: '500+', im: '钉钉/飞书/Discord/Telegram', opensource: true, recommended: true },
  copaw:       { type: '全托管', price: '¥99/月', model: 'DashScope', skills: '300+', im: '钉钉/飞书/QQ/Discord', opensource: true, recommended: true },
  autoclaw:    { type: '全自动化', price: '¥149/月', model: 'GLM-4', skills: '200+', im: '钉钉', opensource: true },
  huaweicloud: { type: '企业云', price: '按量计费', model: 'DeepSeek/GLM/Qwen', skills: '150+', im: 'WeLink', opensource: false },
  jdcloud:     { type: '电商版', price: '¥99/月', model: '言犀', skills: '100+', im: '京东客服', opensource: false },
  aliyun:      { type: 'PaaS 版', price: '按量计费', model: '通义千问', skills: '200+', im: '钉钉', opensource: false },
  qclaw:       { type: '社区版', price: '免费/¥99', model: '混元', skills: '50+', im: 'QQ/微信', opensource: true },
  arkclaw:     { type: '企业版', price: '¥499/月', model: '豆包/Kimi/SLM', skills: '400+', im: '飞书', opensource: false },
  maxclaw:     { type: '多模态', price: '¥199/月', model: 'MiniMax', skills: '120+', im: '海螺', opensource: false },
  kimiclaw:    { type: '对话式', price: '免费/Pro', model: 'Moonshot', skills: '80+', im: 'Web Chat', opensource: false },
  duclaw:      { type: '全中文', price: '¥59/月', model: '文心一言', skills: '60+', im: '百度搜索/百科', opensource: false },
};
