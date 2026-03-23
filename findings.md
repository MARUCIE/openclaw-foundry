# Findings: OpenClaw Foundry v3.0 — 真实自动化部署研究

> 2026-03-22 | 9 个研究 Agent 并行调查 | 覆盖 8 大产品 + 3 云 IaaS

## v2.0 审计结论

原 v2.0 的 13 个 Provider **只有 OpenClaw 1 个是真实实现**（7.7%）。
- 12 个 Provider 的 API endpoint 全是编造的（fetch 假 URL）
- `checkApiReady()` 守卫失效（永远返回 null）
- 3 个测试失败，确认凭证守卫不生效
- 所有非 OpenClaw Provider 静默 fallback 到本地写 JSON 文件

## v3.0 重设计：3 Tier × 12 Provider

### Tier 1: 全自动（提供凭证 → 一键完成）

| # | id | 产品 | 安装方式 | 自动化路径 | Auth |
|---|-----|------|---------|-----------|------|
| 1 | `openclaw` | Claude Code (Anthropic) | `curl -fsSL https://claude.ai/install.sh \| bash` | 写 `~/.claude/{settings.json,skills/,agents/}` | OAuth |
| 2 | `hiclaw` | HiClaw 团队版 (阿里开源) | `curl -sSL https://higress.ai/hiclaw/install.sh \| bash` | Higress API :8001 + Matrix SDK | Local |
| 3 | `copaw` | CoPaw 个人版 (阿里开源) | `pip install copaw` | CLI `copaw init --defaults` + env vars | DashScope Key |
| 4 | `autoclaw` | AutoClaw (智谱 AI) | 下载 .dmg/.exe | CLI `--no-interactive` + `~/.autoclaw/setting.json` | Zhipu Key |
| 5 | `huaweicloud` | 华为云 Flexus L | `pip install huaweicloud-sdk-python-v3` | `FlexusLClient.create_instance()` | AK/SK |
| 6 | `jdcloud` | 京东云 Compute Factory | `pip install jdcloud-sdk-python` | `ComputeClient.create_instance()` | AK/SK |
| 7 | `aliyun` | 阿里云轻量服务器 | `pip install aliyun-python-sdk-core` | `RunInstancesRequest` + 镜像 | AK/SK |

### Tier 2: 半自动（需一次人工交互）

| # | id | 产品 | 人工步骤 | 之后自动化 |
|---|-----|------|---------|-----------|
| 8 | `qclaw` | QClaw QQ Bot (腾讯) | QQ 开放平台申请 AppID | 官方插件 `tencent-connect/openclaw-qqbot` |
| 9 | `arkclaw` | ArkClaw (火山引擎) | 飞书 QR 扫码授权 | Feishu Open Platform API |
| 10 | `maxclaw` | MaxClaw (MiniMax) | 浏览器注册账号 | REST API 调模型 |

### Tier 3: 引导式（打开页面 + 步骤指南）

| # | id | 产品 | 方式 |
|---|-----|------|------|
| 11 | `kimiclaw` | KimiClaw (月之暗面) | `open URL` + 步骤 + K2.5 API fallback |
| 12 | `duclaw` | DuClaw (百度) | `open URL` + 步骤 |

### 砍掉

| 原 Provider | 原因 | 替代 |
|-------------|------|------|
| miclaw (小米) | 封闭内测，无公开 SDK | MiMo API 作为 LLM (非 Agent 平台) |
| 联想百应 | IT 远程支持，非 Agent 平台 | 无 |
| WorkBuddy | 纯 GUI，无 API | 合并到 QClaw |
| LobsterAI | Electron 源码构建，npm 包不存在 | 暂不纳入 |

---

## 各 Provider 真实自动化细节

### 1. OpenClaw — 全文件操作

```bash
curl -fsSL https://claude.ai/install.sh | bash
mkdir -p ~/.claude/{skills,agents}
# settings.json, skills/*, agents/*.md, .mcp.json 全写文件
claude --version && claude doctor
```

- npm 安装已弃用，原生二进制
- Skills 复制目录（symlink 功能正常但不显示在 /skills 列表）
- Channels: Telegram/Discord 通过 MCP plugin

### 2. HiClaw — Higress API + Matrix SDK

```bash
curl -sSL https://higress.ai/hiclaw/install.sh | bash
# Docker Compose: Manager + Workers + Matrix IM + Higress + MinIO
# Matrix SDK 创建 Worker, Higress API 管理凭证
```

- GitHub: `alibaba/hiclaw` + `higress-group/hiclaw`
- 自托管，完全控制
- 端口: 8080(proxy) 8001(管理) 6167(Matrix) 9000(MinIO)

### 3. CoPaw — pip + CLI + Python Skills

```bash
pip install copaw
export DASHSCOPE_API_KEY=sk-xxx
copaw init --defaults
# ~/.copaw/skills/*.py 自动发现
# 内置 Cron 调度器
```

- GitHub: `agentscope-ai/CoPaw`
- 支持 DingTalk/Feishu/QQ/Discord/iMessage 多通道
- AgentScope 框架

### 4. AutoClaw — CLI-first, 可无人值守

```bash
# macOS 静默安装
curl -L "https://autoglm.zhipuai.cn/autoclaw/AutoClaw-macos-arm64.dmg" -o /tmp/autoclaw.dmg
hdiutil attach /tmp/autoclaw.dmg -nobrowse -mountpoint /Volumes/AutoClaw
cp -r /Volumes/AutoClaw/AutoClaw.app /Applications/
hdiutil detach /Volumes/AutoClaw

# 配置
cat > ~/.autoclaw/setting.json << 'EOF'
{"apiKey":"xxx","model":"glm-5-turbo","noInteractive":true,"autoConfirm":true}
EOF

# 无人值守执行
autoclaw "task description" --no-interactive -y
```

- 配置优先级: CLI flags > env vars > project config > global config
- 50+ 预装 Skills
- AutoGLM 浏览器自动化 (Playwright-based)

### 5-7. 云 IaaS — Python SDK

```python
# 华为云: pip install huaweicloud-sdk-python-v3
# FlexusLClient.create_instance(marketplace_image_id="openclaw-*", instance_spec="flexus.large")
# 文档: support.huaweicloud.com/intl/en-us/api-flexusl/

# 京东云: pip install jdcloud-sdk-core jdcloud-sdk-compute
# ComputeClient.create_instance(image_id="openclaw-*", region_id="cn-east-2")
# 文档: docs.jdcloud.com/cn/compute-factory/openclaw

# 阿里云: pip install aliyun-python-sdk-core aliyun-python-sdk-ecs
# RunInstancesRequest(ImageId="openclaw-linux-ubuntu-2204")
# 文档: alibabacloud.com/help/en/simple-application-server/
```

### 8. QClaw — QQ Bot 官方插件

```bash
# 前置: QQ 开放平台创建 Bot (人工, 一次性)
# GitHub: tencent-connect/openclaw-qqbot (官方)
# 备选: npm install qclaw-wechat-client (社区逆向, 标记 unmaintained)
# 企业路径: Tencent Cloud ADP (adp.tencentcloud.com)
```

### 9. ArkClaw — 飞书生态 API

```bash
# 前置: console.volcengine.com 创建 API Key (人工)
# 前置: open.feishu.cn 创建飞书 App + Bot (人工)
# 前置: 飞书扫码授权 (人工, 一次性)
# 之后: Feishu Open Platform API 全自动 (消息/文档/日历/多维表格)
# 三层: 火山引擎 Ark API + 飞书 Bot + 豆包模型
```

### 10. MaxClaw — 浏览器注册 + REST API

```bash
# 前置: agent.minimax.io 注册 (人工)
# API: POST https://api.minimax.io/anthropic/v1/messages (Anthropic 兼容)
# API: POST https://api.minimaxi.com/v1/chat/completions (OpenAI 兼容)
# 无 workspace 创建 API, Agent 管理必须 Web UI
```

### 11-12. KimiClaw / DuClaw — 引导式

```bash
# KimiClaw: open "https://www.kimi.com/kimiplus/en/kimiclaw"
# LLM fallback: POST https://api.moonshot.ai/v1/chat/completions
# ¥199/月, 40GB 云存储, K2.5 模型

# DuClaw: open "https://cloud.baidu.com/product/duclaw.html"
# 纯 Web SaaS, 无任何 API
# ¥17.8/月 (限时), ¥142/月 (正常)
```

---

## 真实 URL 速查

| Provider | Console | API/SDK | GitHub |
|----------|---------|---------|--------|
| openclaw | console.anthropic.com | `curl https://claude.ai/install.sh` | anthropics/claude-code |
| hiclaw | hiclaw.io | Higress :8001 + Matrix SDK | alibaba/hiclaw |
| copaw | copaw.bot | `pip install copaw` | agentscope-ai/CoPaw |
| autoclaw | autoglm.zhipuai.cn/autoclaw | CLI `--no-interactive` | tsingliuwin/autoclaw |
| huaweicloud | activity.huaweicloud.com/openclaw.html | huaweicloud-sdk-python-v3 | huaweicloud/huaweicloud-sdk-python-v3 |
| jdcloud | jdcloud.com/products/lighthouse-openclaw | jdcloud-sdk-python | jdcloud-api/jdcloud-sdk-python |
| aliyun | jvs.wuying.aliyun.com | aliyun-python-sdk-core | aliyun/wuying-agentbay-sdk |
| qclaw | qclaw.qq.com | 官方 QQ Bot 插件 | tencent-connect/openclaw-qqbot |
| arkclaw | console.volcengine.com/ark/claw | Feishu Open Platform | — |
| maxclaw | agent.minimax.io/max-claw | REST API | — |
| kimiclaw | kimi.com/kimiplus/en/kimiclaw | K2.5 API | — |
| duclaw | cloud.baidu.com/product/duclaw.html | 无 | — |

---

## 实装优先级

1. 修复 `checkApiReady()` 守卫 (按 Tier 返回正确状态)
2. 砍掉 4 个不可行 Provider (miclaw/联想/WorkBuddy/LobsterAI)
3. 新增 HiClaw + CoPaw Provider
4. 重写全部 API endpoint 为真实 URL
5. 重写全部安装命令为真实命令
6. 修复 3 个失败测试
7. tsc 编译通过

---

## 数据来源

9 个并行研究 Agent (2026-03-22), 覆盖:
- 官方文档: Anthropic, Alibaba Cloud, Huawei Cloud, JD Cloud, Volcengine, Zhipu AI, Moonshot, MiniMax, Tencent, Baidu
- 开源仓库: alibaba/hiclaw, agentscope-ai/CoPaw, tsingliuwin/autoclaw, tencent-connect/openclaw-qqbot
- NPM: qclaw-wechat-client, @anthropic-ai/claude-code
- Python SDK: huaweicloud-sdk-python-v3, jdcloud-sdk-python, aliyun-python-sdk-core, copaw
- 行业报道: IT之家, 36kr, TechNode, PANews, SCMP, PRNewswire
