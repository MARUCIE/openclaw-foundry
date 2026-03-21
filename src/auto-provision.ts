// Auto-provision: integrate existing skills for IM + model API setup
// Strategy: call existing tools (claude-to-im, telegram:configure, discord:configure)
// instead of reimplementing registration flows

import { execa } from 'execa';
import { writeFile, readFile, mkdir, access } from 'fs/promises';
import { join } from 'path';
import type { StepResult } from './types.js';

const HOME = process.env.HOME || process.env.USERPROFILE || '~';

// --- IM Provision Result ---

interface IMProvisionResult {
  success: boolean;
  channel: string;
  credentials: Record<string, string>;
  steps: StepResult[];
}

// --- IM Bot Provisioning via existing skills ---

/**
 * Provision IM channel using the best available tool:
 * 1. Telegram/Discord → check official plugin paths (~/.claude/channels/{platform}/.env)
 * 2. Feishu/QQ → check claude-to-im config (~/.claude-to-im/config.env)
 * 3. If no existing config → write setup instructions
 */
export async function provisionIMBot(
  channel: string,
  agentName: string,
  homeDir: string,
): Promise<IMProvisionResult> {
  const steps: StepResult[] = [];

  // Route to the right provisioning method
  switch (channel) {
    case 'telegram':
      return provisionFromPlugin('telegram', homeDir, steps);
    case 'discord':
      return provisionFromPlugin('discord', homeDir, steps);
    case 'feishu':
    case 'qq':
      return provisionFromClaudeToIM(channel, homeDir, steps);
    case 'wecom':
    case 'dingtalk':
    case 'slack':
      return writeSetupGuide(channel, homeDir, steps);
    default:
      steps.push(step(channel, 'warn', `Unknown IM channel: ${channel}`));
      return { success: false, channel, credentials: {}, steps };
  }
}

/**
 * Check if Telegram/Discord is already configured via official Claude Code plugin.
 * Path: ~/.claude/channels/{platform}/.env
 * If configured → copy token to provider's IM config.
 * If not → write instructions to run /telegram:configure or /discord:configure.
 */
async function provisionFromPlugin(
  channel: string,
  homeDir: string,
  steps: StepResult[],
): Promise<IMProvisionResult> {
  const pluginEnvPath = join(HOME, '.claude', 'channels', channel, '.env');
  const tokenKey = channel === 'telegram' ? 'TELEGRAM_BOT_TOKEN' : 'DISCORD_BOT_TOKEN';

  try {
    const envContent = await readFile(pluginEnvPath, 'utf-8');
    const tokenMatch = envContent.match(new RegExp(`${tokenKey}=(\\S+)`));

    if (tokenMatch && tokenMatch[1]) {
      const token = tokenMatch[1];
      steps.push(step(`${channel} Plugin`, 'ok',
        `Token found in ${pluginEnvPath} (${token.slice(0, 10)}...)`));

      // Copy to provider's IM config
      const imDir = join(homeDir, 'im');
      await mkdir(imDir, { recursive: true });
      await writeFile(join(imDir, `${channel}.json`), JSON.stringify({
        channel,
        token: token,
        source: 'claude-plugin',
        sourcePath: pluginEnvPath,
        status: 'active',
        configuredAt: new Date().toISOString(),
      }, null, 2));

      steps.push(step(`${channel} IM`, 'ok', `Config synced from Claude Code plugin`));
      return { success: true, channel, credentials: { token }, steps };
    }
  } catch { /* plugin not configured */ }

  // Not configured — check claude-to-im as fallback
  const c2imResult = await checkClaudeToIMConfig(channel);
  if (c2imResult) {
    steps.push(step(`${channel} claude-to-im`, 'ok',
      `Token found in claude-to-im config`));

    const imDir = join(homeDir, 'im');
    await mkdir(imDir, { recursive: true });
    await writeFile(join(imDir, `${channel}.json`), JSON.stringify({
      channel,
      token: c2imResult,
      source: 'claude-to-im',
      status: 'active',
      configuredAt: new Date().toISOString(),
    }, null, 2));

    return { success: true, channel, credentials: { token: c2imResult }, steps };
  }

  // Neither configured — write instructions
  const skillCmd = channel === 'telegram' ? '/telegram:configure' : '/discord:configure';
  const setupSteps = channel === 'telegram'
    ? [
        '1. 在 Telegram 搜索 @BotFather',
        '2. 发送 /newbot 创建机器人',
        '3. 获取 Bot Token',
        `4. 在 Claude Code 中运行: ${skillCmd} <token>`,
        '5. 重新部署本平台即可自动同步 token',
      ]
    : [
        '1. 前往 https://discord.com/developers/applications',
        '2. 创建 Application → Bot → 获取 Token',
        '3. 开启 Message Content Intent',
        `4. 在 Claude Code 中运行: ${skillCmd} <token>`,
        '5. 重新部署本平台即可自动同步 token',
      ];

  const imDir = join(homeDir, 'im');
  await mkdir(imDir, { recursive: true });
  await writeFile(join(imDir, `${channel}.json`), JSON.stringify({
    channel,
    status: 'pending_setup',
    setupCommand: skillCmd,
    setupSteps,
    setupGuide: channel === 'telegram'
      ? 'https://core.telegram.org/bots#how-do-i-create-a-bot'
      : 'https://discord.com/developers/docs/getting-started',
  }, null, 2));

  steps.push(step(`${channel} IM`, 'warn',
    `Not configured. Run "${skillCmd} <token>" in Claude Code, then redeploy`));

  return { success: false, channel, credentials: {}, steps };
}

/**
 * Check if Feishu/QQ is configured via claude-to-im daemon.
 * Config: ~/.claude-to-im/config.env
 */
async function provisionFromClaudeToIM(
  channel: string,
  homeDir: string,
  steps: StepResult[],
): Promise<IMProvisionResult> {
  const token = await checkClaudeToIMConfig(channel);

  if (token) {
    steps.push(step(`${channel} claude-to-im`, 'ok',
      `Credentials found in ~/.claude-to-im/config.env`));

    const imDir = join(homeDir, 'im');
    await mkdir(imDir, { recursive: true });
    await writeFile(join(imDir, `${channel}.json`), JSON.stringify({
      channel,
      credentials: token,
      source: 'claude-to-im',
      status: 'active',
      configuredAt: new Date().toISOString(),
    }, null, 2));

    return { success: true, channel, credentials: { configured: 'true' }, steps };
  }

  // Not configured — write setup instructions
  const guides: Record<string, string[]> = {
    feishu: [
      '1. 前往 https://open.feishu.cn/app 创建自建应用',
      '2. 获取 App ID 和 App Secret',
      '3. 批量配置权限 (参考 claude-to-im setup guide)',
      '4. 添加机器人能力 + 配置事件回调',
      '5. 在 Claude Code 中运行: /claude-to-im setup',
      '6. 重新部署本平台即可自动同步凭证',
    ],
    qq: [
      '1. 前往 https://q.qq.com/qqbot/openclaw 创建应用',
      '2. 获取 App ID 和 App Secret',
      '3. 在 Claude Code 中运行: /claude-to-im setup',
      '4. 重新部署本平台即可自动同步凭证',
    ],
  };

  const imDir = join(homeDir, 'im');
  await mkdir(imDir, { recursive: true });
  await writeFile(join(imDir, `${channel}.json`), JSON.stringify({
    channel,
    status: 'pending_setup',
    setupCommand: '/claude-to-im setup',
    setupSteps: guides[channel] || [`Run /claude-to-im setup in Claude Code`],
  }, null, 2));

  steps.push(step(`${channel} IM`, 'warn',
    `Not configured. Run "/claude-to-im setup" in Claude Code, then redeploy`));

  return { success: false, channel, credentials: {}, steps };
}

/**
 * For WeCom/DingTalk/Slack — no existing skill, write setup guide only.
 */
async function writeSetupGuide(
  channel: string,
  homeDir: string,
  steps: StepResult[],
): Promise<IMProvisionResult> {
  const guides: Record<string, { url: string; steps: string[] }> = {
    wecom: {
      url: 'https://work.weixin.qq.com/wework_admin/frame#apps/createApiApp',
      steps: [
        '1. 登录企业微信管理后台',
        '2. 应用管理 → 创建自建应用',
        '3. 获取 CorpID / AgentId / Secret',
        '4. 配置接收消息 API',
      ],
    },
    dingtalk: {
      url: 'https://open-dev.dingtalk.com/fe/app#/corp/app',
      steps: [
        '1. 登录钉钉开放平台',
        '2. 创建企业内部应用 + 机器人',
        '3. 获取 AppKey / AppSecret / RobotCode',
        '4. 配置消息回调地址',
      ],
    },
    slack: {
      url: 'https://api.slack.com/apps',
      steps: [
        '1. 前往 https://api.slack.com/apps 创建 App',
        '2. 添加 Bot User + 配置权限',
        '3. 获取 Bot Token 和 Signing Secret',
        '4. 安装到 Workspace',
      ],
    },
  };

  const guide = guides[channel];
  const imDir = join(homeDir, 'im');
  await mkdir(imDir, { recursive: true });

  if (guide) {
    await writeFile(join(imDir, `${channel}.json`), JSON.stringify({
      channel,
      status: 'pending_setup',
      consoleUrl: guide.url,
      setupSteps: guide.steps,
    }, null, 2));
    steps.push(step(`${channel} IM`, 'warn',
      `Manual setup required at ${guide.url}`));
  } else {
    steps.push(step(`${channel} IM`, 'warn', `No setup guide available for ${channel}`));
  }

  return { success: false, channel, credentials: {}, steps };
}

// --- Model API Key Provisioning ---

interface ModelProvisionResult {
  success: boolean;
  provider: string;
  apiKey?: string;
  steps: StepResult[];
}

const MODEL_PLATFORMS: Record<string, { name: string; envVar: string; keyPage: string }> = {
  google: {
    name: 'Google AI Studio',
    envVar: 'GOOGLE_API_KEY',
    keyPage: 'https://aistudio.google.com/apikey',
  },
  anthropic: {
    name: 'Anthropic Console',
    envVar: 'ANTHROPIC_API_KEY',
    keyPage: 'https://console.anthropic.com/settings/keys',
  },
  openai: {
    name: 'OpenAI Platform',
    envVar: 'OPENAI_API_KEY',
    keyPage: 'https://platform.openai.com/api-keys',
  },
  moonshot: {
    name: 'Moonshot 平台',
    envVar: 'MOONSHOT_API_KEY',
    keyPage: 'https://platform.moonshot.cn/console/api-keys',
  },
  deepseek: {
    name: 'DeepSeek',
    envVar: 'DEEPSEEK_API_KEY',
    keyPage: 'https://platform.deepseek.com/api_keys',
  },
  zhipu: {
    name: '智谱 BigModel',
    envVar: 'ZHIPU_API_KEY',
    keyPage: 'https://open.bigmodel.cn/usercenter/apikeys',
  },
  volcengine: {
    name: '火山引擎方舟',
    envVar: 'VOLC_ACCESS_KEY',
    keyPage: 'https://console.volcengine.com/ark/region:ark+cn-beijing/apiKey',
  },
  baidu: {
    name: '百度千帆',
    envVar: 'BAIDU_API_KEY',
    keyPage: 'https://console.bce.baidu.com/qianfan/ais/console/applicationConsole/application',
  },
};

/**
 * Auto-provision model API key:
 * 1. Check environment variable (e.g. GOOGLE_API_KEY)
 * 2. Check ~/.config/{provider}/credentials
 * 3. If not found → write instructions with direct link
 */
export async function provisionModelAPIKey(
  provider: string,
  homeDir: string,
): Promise<ModelProvisionResult> {
  const steps: StepResult[] = [];
  const platform = MODEL_PLATFORMS[provider];

  if (!platform) {
    steps.push(step('Model API', 'warn', `Unknown provider: ${provider}`));
    return { success: false, provider, steps };
  }

  // Strategy 1: Check environment variable
  const envKey = process.env[platform.envVar];
  if (envKey) {
    steps.push(step(`${platform.name}`, 'ok',
      `API key found in env ${platform.envVar} (${envKey.slice(0, 8)}...)`));

    // Write to provider config
    const keysPath = join(homeDir, 'model-keys.json');
    let existing: Record<string, any> = {};
    try { existing = JSON.parse(await readFile(keysPath, 'utf-8')); } catch {}
    existing[provider] = {
      apiKey: envKey,
      source: 'environment',
      envVar: platform.envVar,
      configuredAt: new Date().toISOString(),
    };
    await writeFile(keysPath, JSON.stringify(existing, null, 2));

    return { success: true, provider, apiKey: envKey, steps };
  }

  // Strategy 2: Check common config paths
  const configPaths = [
    join(HOME, '.config', provider, 'credentials'),
    join(HOME, `.${provider}`, 'credentials'),
    join(HOME, `.${provider}_api_key`),
  ];

  for (const p of configPaths) {
    try {
      const content = (await readFile(p, 'utf-8')).trim();
      if (content.length > 10) {
        steps.push(step(`${platform.name}`, 'ok',
          `API key found at ${p} (${content.slice(0, 8)}...)`));

        const keysPath = join(homeDir, 'model-keys.json');
        let existing: Record<string, any> = {};
        try { existing = JSON.parse(await readFile(keysPath, 'utf-8')); } catch {}
        existing[provider] = {
          apiKey: content,
          source: 'config-file',
          sourcePath: p,
          configuredAt: new Date().toISOString(),
        };
        await writeFile(keysPath, JSON.stringify(existing, null, 2));

        return { success: true, provider, apiKey: content, steps };
      }
    } catch { /* file doesn't exist */ }
  }

  // Not found — write instructions
  steps.push(step(`${platform.name}`, 'warn',
    `API key not found. Set ${platform.envVar} or get one at ${platform.keyPage}`));

  const keysPath = join(homeDir, 'model-keys.json');
  let existing: Record<string, any> = {};
  try { existing = JSON.parse(await readFile(keysPath, 'utf-8')); } catch {}
  existing[provider] = {
    status: 'pending_setup',
    envVar: platform.envVar,
    keyPage: platform.keyPage,
    instructions: `export ${platform.envVar}=your-key-here`,
  };
  await writeFile(keysPath, JSON.stringify(existing, null, 2));

  return { success: false, provider, steps };
}

/** List all supported model API providers */
export function listModelProviders(): { id: string; name: string; envVar: string; keyPage: string }[] {
  return Object.entries(MODEL_PLATFORMS).map(([id, p]) => ({
    id, name: p.name, envVar: p.envVar, keyPage: p.keyPage,
  }));
}

// --- Helpers ---

function step(name: string, status: 'ok' | 'warn' | 'error', message: string): StepResult {
  return { name, status, message };
}

/** Check if claude-to-im has config for a given channel */
async function checkClaudeToIMConfig(channel: string): Promise<string | null> {
  try {
    const configPath = join(HOME, '.claude-to-im', 'config.env');
    const content = await readFile(configPath, 'utf-8');

    // Channel-specific token keys
    const keyMap: Record<string, string> = {
      telegram: 'TELEGRAM_BOT_TOKEN',
      discord: 'DISCORD_BOT_TOKEN',
      feishu: 'FEISHU_APP_ID',  // Feishu uses App ID + Secret pair
      qq: 'QQ_APP_ID',
    };

    const key = keyMap[channel];
    if (!key) return null;

    const match = content.match(new RegExp(`${key}=(\\S+)`));
    if (match && match[1]) return match[1];
  } catch { /* config doesn't exist */ }

  return null;
}
