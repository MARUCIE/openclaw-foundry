import { select, input, checkbox, password } from '@inquirer/prompts';
import type { WizardAnswers, WizardAnswersV2, ProviderId, DeployMode, ImChannel } from './types.js';
import { detectOS, log } from './utils.js';
import { listProviders, listProvidersByOS } from './providers/index.js';
import chalk from 'chalk';

const ROLES = [
  // --- 技术开发 (Development) ---
  { name: '全栈开发 Full-Stack Developer',              value: 'fullstack-developer' },
  { name: '前端开发 Frontend (React/Vue/小程序)',        value: 'frontend-developer' },
  { name: 'Java/Spring 后端开发',                        value: 'java-developer' },
  { name: 'Go 后端开发',                                 value: 'go-developer' },
  { name: 'Python 后端开发',                             value: 'python-developer' },
  { name: 'Node.js/TypeScript 后端开发',                value: 'backend-developer' },
  { name: 'C/C++ 系统开发',                             value: 'cpp-developer' },
  { name: 'iOS/Android 移动开发',                        value: 'mobile-developer' },
  { name: '嵌入式/IoT 开发',                            value: 'embedded-developer' },
  // --- 质量与基础设施 (QA & Infra) ---
  { name: '测试/QA 工程师',                             value: 'qa-tester' },
  { name: 'DevOps/SRE 运维工程师',                      value: 'devops' },
  { name: 'DBA 数据库管理员',                           value: 'dba' },
  { name: '安全工程师 Security',                        value: 'security-engineer' },
  // --- 数据与算法 (Data & AI) ---
  { name: '数据分析师/BI',                              value: 'data-analyst' },
  { name: '数据开发/数据工程师',                         value: 'data-engineer' },
  { name: '算法工程师 (推荐/搜索/NLP/CV)',               value: 'algorithm-engineer' },
  { name: 'AI/大模型工程师',                            value: 'ml-ai-engineer' },
  // --- 产品 (Product) ---
  { name: '产品经理 (ToB/ToC/电商/金融)',               value: 'product-manager' },
  { name: 'AI 产品经理',                                value: 'ai-product-manager' },
  { name: '项目管理 PMO',                               value: 'project-manager' },
  // --- 设计 (Design) ---
  { name: 'UI/UX 设计师',                               value: 'designer-ux' },
  { name: '视觉/品牌设计师',                            value: 'visual-designer' },
  // --- 运营 (Operations) ---
  { name: '用户/产品/社区运营',                         value: 'user-ops' },
  { name: '内容/新媒体运营 (抖音/微信/微博)',           value: 'content-ops' },
  { name: '电商运营 (淘宝/京东/亚马逊)',                value: 'ecommerce-ops' },
  { name: '数据/策略运营',                              value: 'data-ops' },
  // --- 市场与销售 (Marketing & Sales) ---
  { name: 'SEO/SEM/信息流优化师',                       value: 'seo-sem' },
  { name: '市场营销/品牌公关',                          value: 'marketing-growth' },
  { name: '销售/BD/大客户',                             value: 'sales-bizdev' },
  { name: '售前/客户成功',                              value: 'customer-support' },
  // --- 职能 (Corporate) ---
  { name: '财务/会计',                                   value: 'finance-accounting' },
  { name: '法务/合规',                                   value: 'compliance' },
  { name: 'HR/招聘',                                     value: 'hr-recruiter' },
  // --- 其他 ---
  { name: 'CTO/技术总监/架构师',                        value: 'cto-tech-lead' },
  { name: '研究员/学术研究',                            value: 'researcher' },
  { name: '教育/培训师',                                value: 'educator' },
  { name: '自定义 (请描述)',                             value: 'custom' },
];

const USE_CASES = [
  // --- Engineering ---
  { name: 'Coding & Development',          value: 'coding' },
  { name: 'Code Review & Quality',         value: 'code-review' },
  { name: 'Testing & QA',                  value: 'testing-qa' },
  { name: 'API Development',               value: 'api-development' },
  { name: 'Mobile App Development',        value: 'mobile-development' },
  { name: 'Machine Learning & AI',         value: 'ml-ai' },
  { name: 'DevOps & CI/CD',               value: 'devops-cicd' },
  { name: 'Security & Pen-testing',        value: 'security' },
  // --- Business & Ops ---
  { name: 'Project Management',            value: 'project-management' },
  { name: 'Marketing & SEO',              value: 'marketing-seo' },
  { name: 'Sales & Business Dev',         value: 'sales-bizdev' },
  { name: 'Customer Support',             value: 'customer-support' },
  { name: 'Finance & Accounting',         value: 'finance-accounting' },
  { name: 'E-commerce Operations',        value: 'ecommerce' },
  // --- Content & Knowledge ---
  { name: 'Research & Analysis',           value: 'research' },
  { name: 'Technical Writing & Docs',     value: 'writing' },
  { name: 'Content & Social Media',       value: 'content-social' },
  { name: 'Education & Training',         value: 'education-training' },
  // --- Data & Design ---
  { name: 'Data Analysis & Viz',          value: 'data-analysis' },
  { name: 'Design & Prototyping',         value: 'design' },
  { name: 'Automation & Scripting',       value: 'automation' },
  { name: 'Compliance & Audit',           value: 'compliance' },
  { name: 'IoT & Embedded',              value: 'iot-embedded' },
];

const LANGUAGES = [
  { name: 'TypeScript / JavaScript', value: 'typescript' },
  { name: 'Python',                  value: 'python' },
  { name: 'Go',                      value: 'go' },
  { name: 'Rust',                    value: 'rust' },
  { name: 'Java / Kotlin',           value: 'java' },
  { name: 'Swift',                   value: 'swift' },
  { name: 'C / C++',                 value: 'cpp' },
  { name: 'SQL',                     value: 'sql' },
  { name: 'Shell / Bash',            value: 'shell' },
];

const INTEGRATIONS = [
  { name: 'GitHub',            value: 'github' },
  { name: 'Telegram',          value: 'telegram' },
  { name: 'Slack',             value: 'slack' },
  { name: 'Discord',           value: 'discord' },
  { name: 'Notion',            value: 'notion' },
  { name: 'Linear',            value: 'linear' },
  { name: 'Jira',              value: 'jira' },
  { name: 'Google Workspace',  value: 'google' },
  { name: 'Supabase',          value: 'supabase' },
  { name: 'Vercel',            value: 'vercel' },
  { name: 'AWS',               value: 'aws' },
  { name: 'Stripe',            value: 'stripe' },
  { name: 'Shopify',           value: 'shopify' },
  { name: 'HubSpot',           value: 'hubspot' },
  { name: 'PostgreSQL',        value: 'postgres' },
  { name: 'None for now',      value: 'none' },
];

export async function runWizard(): Promise<WizardAnswers> {
  console.log('');
  console.log(chalk.bold('=== OpenClaw Foundry ==='));
  console.log(chalk.dim('AI-driven one-click OpenClaw deployment'));
  console.log('');

  const userName = await input({
    message: 'Your name:',
    default: process.env.USER || 'user',
  });

  const os = detectOS();
  const osLabel: Record<string, string> = { darwin: 'macOS', win32: 'Windows', linux: 'Linux' };
  log.note(`Detected OS: ${osLabel[os] || os}`);

  let role = await select({ message: 'Your primary role:', choices: ROLES });
  if (role === 'custom') {
    role = await input({ message: 'Describe your role:' });
  }

  const industry = await select({
    message: 'Your industry / company type:',
    choices: [
      { name: 'SaaS / 企业服务',            value: 'saas' },
      { name: '金融科技 FinTech',            value: 'fintech' },
      { name: '电商 / 新零售',               value: 'ecommerce' },
      { name: '游戏 / 娱乐',                value: 'gaming' },
      { name: '教育 / EdTech',              value: 'education' },
      { name: '医疗健康 HealthTech',         value: 'healthcare' },
      { name: '内容 / 社交 / 媒体',          value: 'media' },
      { name: '物联网 / 硬件 / 智能制造',    value: 'iot' },
      { name: 'AI / 大模型',                 value: 'ai-native' },
      { name: '通用 / 其他',                 value: 'general' },
    ],
  });

  const level = await select({
    message: 'Your experience level:',
    choices: [
      { name: '初级 Junior (0-2 年)',        value: 'junior' },
      { name: '中级 Mid (2-5 年)',            value: 'mid' },
      { name: '高级 Senior (5-10 年)',        value: 'senior' },
      { name: '负责人 Lead / Manager',        value: 'lead' },
      { name: '总监/VP/CTO',                  value: 'executive' },
    ],
  });

  const teamSize = await select({
    message: 'Your team size:',
    choices: [
      { name: '独立开发 Solo',               value: 'solo' },
      { name: '小团队 (2-10 人)',            value: 'small' },
      { name: '中型团队 (10-50 人)',         value: 'medium' },
      { name: '大型团队 (50+ 人)',           value: 'large' },
    ],
  });

  const useCases = await checkbox({
    message: 'Main use cases (space to toggle, enter to confirm):',
    choices: USE_CASES,
    required: true,
  });

  const deliverables = await checkbox({
    message: 'What deliverables do you produce? (space to toggle):',
    choices: [
      { name: 'PDF (reports, papers, forms)',       value: 'pdf' },
      { name: 'PPT (slides, presentations)',        value: 'ppt' },
      { name: 'Word (documents, proposals)',        value: 'word' },
      { name: 'Excel (spreadsheets, models)',       value: 'excel' },
      { name: 'Text (articles, blog posts)',        value: 'text' },
      { name: 'Images (graphics, screenshots)',     value: 'image' },
      { name: 'Video (clips, tutorials)',           value: 'video' },
      { name: 'Posters (marketing, events)',        value: 'poster' },
      { name: 'Diagrams (architecture, flowcharts)',value: 'diagram' },
      { name: 'Prototypes (UI mockups)',            value: 'prototype' },
      { name: 'Reports (dashboards, analytics)',    value: 'report' },
      { name: 'Code (libraries, scripts)',          value: 'code' },
      { name: 'Articles (WeChat, social media)',    value: 'article' },
    ],
  });

  const languages = await checkbox({
    message: 'Languages & tools you work with:',
    choices: LANGUAGES,
  });

  const autonomy = await select({
    message: 'AI autonomy level:',
    choices: [
      { name: 'L1 Guided  — AI suggests, you approve',                   value: 'L1-guided' },
      { name: 'L2 Semi    — AI acts on routine, asks for important ones', value: 'L2-semi' },
      { name: 'L3 Full    — AI handles everything, reports results',      value: 'L3-full' },
    ],
  });

  const integrations = await checkbox({
    message: 'Integrations you need:',
    choices: INTEGRATIONS,
  });

  // --- LLM API setup ---
  console.log('');
  const llmMode = await select({
    message: 'How would you like to set up LLM access for OpenClaw?',
    choices: [
      { name: 'BYOK    — I have my own API key (free)',           value: 'byok' as const },
      { name: 'Managed — Use Foundry LLM service (subscription)', value: 'managed' as const },
      { name: 'Skip    — Configure later',                        value: 'skip' as const },
    ],
  });

  let llmProvider: string | undefined;
  let llmApiKey: string | undefined;

  if (llmMode === 'byok') {
    llmProvider = await select({
      message: 'LLM provider:',
      choices: [
        { name: 'Google Gemini (recommended, free tier available)', value: 'google' },
        { name: 'Anthropic Claude',                                 value: 'anthropic' },
        { name: 'OpenAI',                                           value: 'openai' },
      ],
    });

    llmApiKey = await password({
      message: `Enter your ${llmProvider} API key:`,
      mask: '*',
    });

    if (llmApiKey) {
      log.note('API key received. Will be validated during installation.');
    }
  }

  return {
    userName,
    os,
    role,
    industry,
    level,
    teamSize,
    useCases,
    deliverables,
    languages,
    autonomy,
    integrations: integrations.filter(i => i !== 'none'),
    llmMode,
    llmProvider,
    llmApiKey,
  };
}

// --- v2 Wizard: adds platform selection ---

const DEPLOY_MODE_MAP: Record<string, DeployMode> = {
  cloud: 'cloud', desktop: 'local', mobile: 'mobile', saas: 'saas', remote: 'remote',
};

export async function runWizardV2(): Promise<WizardAnswersV2> {
  // Run base wizard first
  const base = await runWizard();

  console.log('');
  console.log(chalk.bold('--- Platform Selection ---'));
  console.log(chalk.dim('Choose where to deploy your AI agent'));
  console.log('');

  // Filter providers by detected OS
  const allProviders = listProviders();
  const osProviders = listProvidersByOS(base.os);

  // Group by type for display
  const groups: Record<string, typeof allProviders> = {};
  for (const p of allProviders) {
    const group = p.type;
    (groups[group] ??= []).push(p);
  }

  const statusIcon: Record<string, string> = {
    stable: '', beta: ' [beta]', preview: ' [preview]', planned: ' [planned]',
  };

  const providerChoices = allProviders.map(p => {
    const compatible = osProviders.some(op => op.id === p.id);
    const suffix = !compatible ? chalk.dim(' (requires ' + p.platforms.join('/') + ')') : '';
    return {
      name: `${p.name} — ${p.vendor}${statusIcon[p.status] || ''}${suffix}`,
      value: p.id as ProviderId,
      disabled: !compatible && p.status !== 'preview' ? '(OS not supported)' : false,
    };
  });

  const targetProvider = await select({
    message: 'Deploy target platform:',
    choices: [
      { name: chalk.cyan('--- Desktop / Local ---'), value: 'openclaw' as ProviderId, disabled: false },
      ...providerChoices.filter(c => {
        const p = allProviders.find(pp => pp.id === c.value);
        return p?.type === 'desktop';
      }),
      { name: chalk.cyan('--- Cloud Platforms ---'), value: '__cloud_header' as ProviderId, disabled: '─' },
      ...providerChoices.filter(c => {
        const p = allProviders.find(pp => pp.id === c.value);
        return p?.type === 'cloud';
      }),
      { name: chalk.cyan('--- SaaS Hosted ---'), value: '__saas_header' as ProviderId, disabled: '─' },
      ...providerChoices.filter(c => {
        const p = allProviders.find(pp => pp.id === c.value);
        return p?.type === 'saas';
      }),
      { name: chalk.cyan('--- Mobile ---'), value: '__mobile_header' as ProviderId, disabled: '─' },
      ...providerChoices.filter(c => {
        const p = allProviders.find(pp => pp.id === c.value);
        return p?.type === 'mobile';
      }),
      { name: chalk.cyan('--- Remote Service ---'), value: '__remote_header' as ProviderId, disabled: '─' },
      ...providerChoices.filter(c => {
        const p = allProviders.find(pp => pp.id === c.value);
        return p?.type === 'remote';
      }),
    ].filter(c => !c.value.startsWith('__')),
  });

  const selectedProvider = allProviders.find(p => p.id === targetProvider)!;
  const targetDeployMode = DEPLOY_MODE_MAP[selectedProvider.type] || 'local';

  // Region for cloud providers
  let targetRegion: string | undefined;
  if (targetDeployMode === 'cloud') {
    targetRegion = await input({
      message: 'Cloud region (default auto):',
      default: 'auto',
    });
    if (targetRegion === 'auto') targetRegion = undefined;
  }

  // IM channel for providers that support it
  let targetImChannel: ImChannel | undefined;
  if (selectedProvider.imChannels.length > 0) {
    targetImChannel = await select({
      message: 'IM channel integration:',
      choices: [
        ...selectedProvider.imChannels.map(im => ({ name: im, value: im })),
        { name: 'Skip', value: undefined as any },
      ],
    });
  }

  // Credentials for cloud/saas
  let cloudAccessKeyId: string | undefined;
  let cloudAccessKeySecret: string | undefined;
  if (targetDeployMode === 'cloud' || targetDeployMode === 'saas') {
    console.log('');
    log.note(`${selectedProvider.vendor} credentials needed for deployment`);
    cloudAccessKeyId = await input({
      message: `${selectedProvider.vendor} Access Key / Token:`,
    });
    if (cloudAccessKeyId) {
      cloudAccessKeySecret = await password({
        message: `${selectedProvider.vendor} Secret Key:`,
        mask: '*',
      });
    }
  }

  log.ok(`Target: ${selectedProvider.name} (${selectedProvider.vendor})`);

  return {
    ...base,
    targetProvider,
    targetDeployMode,
    targetRegion,
    targetImChannel,
    cloudAccessKeyId,
    cloudAccessKeySecret,
  };
}
