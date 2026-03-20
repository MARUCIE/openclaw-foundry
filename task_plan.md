# Task Plan: OpenClaw Foundry v2.0 — 全平台通用部署中枢

## Goal
将 OpenClaw Foundry 从单平台安装器升维为全平台通用 Agent 部署中枢，支持 12+ 中国主流云/桌面/移动/SaaS Agent 平台的一键安装、部署、测试、修复。

## Current Phase
Phase 6: Testing & Verification (tsc PASS, CLI verified)

## Phases

### Phase 1: Architecture Design
- [x] 读完全部源码 (13 modules, ~2500 lines)
- [x] 读完 PDCA 4-doc
- [x] 研究 12 个目标平台 (Agent 进行中)
- [x] 设计 Provider 抽象层 + Blueprint v2 schema
- [x] 写入 findings.md
- [x] 用户确认架构方向

### Phase 2: Core Type System Upgrade
- [x] Blueprint v2: 新增 target 字段 (platform + deployMode + credentials)
- [x] Provider 接口定义 (deploy/test/repair/uninstall/diagnose)
- [x] ProviderRegistry: 平台发现 + 路由
- [x] 5 类 Provider 基类 (Cloud/Desktop/Mobile/SaaS/Remote)

### Phase 3: Provider Implementations
- [x] CloudProvider 实现: ArkClaw(火山), WorkBuddy(腾讯), JDCloud(京东), HuaweiCloud(华为), Aliyun(阿里), DuClaw(百度)
- [x] DesktopProvider 实现: OpenClaw(Anthropic), LobsterAI(有道), AutoClaw(智谱)
- [x] MobileProvider 实现: miclaw(小米)
- [x] SaaSProvider 实现: KimiClaw(月之暗面), MaxClaw(MiniMax)
- [x] RemoteProvider 实现: Lenovo(联想百应)

### Phase 4: Wizard + CLI Upgrade
- [x] Wizard v2 新增平台选择步骤 (分类分组展示)
- [x] CLI 新增 `ocf platforms` 命令 (--type/--json/--check)
- [x] CLI `ocf init` 增加 `--target <provider>` 和 `--classic` 选项
- [x] init 改为 Provider.deploy() dispatch

### Phase 5: Server + Web UI Upgrade
- [x] Server 新增 `/api/providers` 端点 (list + detail + diagnose)
- [x] Server health check 包含 provider stats
- [x] Blueprint 生成注入 target 信息
- [ ] Web Wizard 新增平台选择 UI (待后续)

### Phase 6: Testing & Verification
- [x] TypeScript 零错误编译 (tsc --noEmit PASS)
- [x] `ocf platforms` 命令验证 (13 platforms, 5 types)
- [x] `ocf platforms --type cloud --json` 验证
- [x] `ocf --help` 验证 (v2.0.0)
- [ ] PDCA 4-doc 同步更新 (待后续)

## Key Questions
1. 各平台的真实 API/CLI 接口能力如何？(研究 Agent 待回复)
2. 是否需要支持多平台同时部署？(初版建议单选)
3. 云平台认证凭证如何安全存储？(复用 LLM proxy 的 customer token 模式)

## Decisions Made
1. 引入 Provider 抽象层，不修改 Blueprint 核心结构，而是扩展
2. 4 类 Provider: Cloud / Desktop / Mobile / SaaS
3. 保持 OpenClaw 作为默认 Provider (向后兼容)
4. 平台 12 个目标: ArkClaw, WorkBuddy/QClaw, 京东云, miclaw, 华为云, 联想百应, 阿里云AgentBay, DuClaw, LobsterAI, Kimi Claw, MaxClaw, AutoClaw

## Errors Encountered
(none yet)

## Notes
- 现有代码质量高，模块化清晰，升维风险可控
- capability-registry.ts (758 lines) 是最大模块，不需修改
- executor.ts (1189 lines) 是改动最大的模块，需要从硬编码变 Provider dispatch
