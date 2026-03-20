# Findings: OpenClaw Foundry v2.0 升维

## 现有架构分析

### Blueprint 核心数据流
```
WizardAnswers → analyzeAndGenerateBlueprint() → Blueprint JSON → executeBlueprint() → ~/.openclaw/
```

### 升维切入点
1. **types.ts**: Blueprint 新增 `target` 字段
2. **executor.ts**: `executeBlueprint()` 从直接执行改为 Provider dispatch
3. **wizard.ts**: 新增平台选择步骤 (在 OS 检测之后)
4. **doctor.ts**: `runDoctor()` 委托给 Provider.diagnose()
5. **server.ts**: 新增 `/api/providers` 端点

### 不需修改的模块
- `capability-registry.ts` — 纯 skill/MCP 路由，与平台无关
- `catalog.ts` — skill 扫描，与平台无关
- `llm-proxy.ts` — LLM 代理，与平台无关
- `customers.ts` — 客户管理，与平台无关
- `profiles.ts` — 预设配置，可复用
- `utils.ts` — 工具函数

## 目标平台清单 (12 个)

### 研究验证后的真实分类 (2026-03-20 调研)

**12 个平台全部真实存在且已发布。** 形态分化为 5 类：

### Desktop / Local (4 个)
| 平台 | 厂商 | 状态 | 特色 |
|------|------|------|------|
| OpenClaw | Anthropic | stable | 原生默认，npm 安装 |
| WorkBuddy | 腾讯 | stable | 本地桌面 Agent，QClaw 装进微信/QQ（内测），2000+ 内部测试 |
| LobsterAI | 网易有道 | stable+开源 | 国内首个 100% 全开源，27 万月访问，GitHub 开源 |
| AutoClaw | 智谱 AI | stable | 一键安装本地客户端，AutoGLM Browser-Use，预置 50+ Skills |

### SaaS 零部署 (4 个)
| 平台 | 厂商 | 状态 | 特色 | 价格 |
|------|------|------|------|------|
| ArkClaw | 火山引擎(字节) | stable | 浏览器直接用，飞书深度集成，多模型 | Coding Plan Pro 含 |
| DuClaw | 百度 | stable | 浏览器直接用，百度搜索/百科/学术 | 17.8 元/月 |
| Kimi Claw | 月之暗面 | stable | 1 分钟创建，5000+ 插件，20 天营收亿级 | 199 元/月起 |
| MaxClaw | MiniMax | stable | 唯一 Web+iOS+Android 三端，10 秒上线 | 未知 |

### Cloud IaaS (3 个)
| 平台 | 厂商 | 状态 | 特色 | 价格 |
|------|------|------|------|------|
| 京东云 | 京东 | 疑下架 | 轻量服务器 + 预置镜像 | 未知 |
| 华为云 | 华为 | stable | Flexus L 一键部署，4 大 IM | 9.9 元/月 |
| AgentBay | 阿里云 | stable | 唯一企业 PaaS，4 种执行环境，千级并发 | 企业定价 |

### Mobile (1 个)
| 平台 | 厂商 | 状态 | 特色 |
|------|------|------|------|
| miclaw | 小米 | 封测 | 国内首款手机系统级 Agent，MiMo 模型，50+ 系统工具 + 米家 |

### Remote Service (1 个)
| 平台 | 厂商 | 状态 | 特色 |
|------|------|------|------|
| 联想百应 | 联想 | stable | 美团下单 + 工程师远程部署（"龙虾安装"服务） |

## Provider 接口设计

```typescript
interface Provider {
  id: string;                    // e.g. 'openclaw', 'arkclaw', 'duclaw'
  name: string;                  // 显示名
  type: 'cloud' | 'desktop' | 'mobile' | 'saas' | 'remote';
  platforms: ('darwin' | 'win32' | 'linux' | 'android' | 'ios')[];
  status: 'stable' | 'beta' | 'preview';

  // Lifecycle
  deploy(blueprint: Blueprint): Promise<DeployResult>;
  test(blueprint: Blueprint): Promise<TestResult>;
  repair(blueprint: Blueprint): Promise<RepairResult>;
  uninstall(options: UninstallOptions): Promise<UninstallResult>;
  diagnose(): Promise<DiagnoseResult>;

  // Info
  getRequirements(): Requirement[];
  getDocUrl(): string;
  getConsoleUrl(): string;
}
```

## Blueprint v2 Target 字段

```typescript
target: {
  provider: string;              // 'openclaw' | 'arkclaw' | 'duclaw' | ...
  deployMode: 'local' | 'cloud' | 'saas' | 'mobile' | 'remote';
  region?: string;               // 云平台区域
  instanceType?: string;         // 云实例规格
  credentials?: {
    accessKeyId?: string;
    accessKeySecret?: string;
    token?: string;
    endpoint?: string;
  };
  imChannel?: string;            // 'feishu' | 'wecom' | 'qq' | 'dingtalk'
  extras?: Record<string, string>;
}
```
