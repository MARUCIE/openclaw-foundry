# Foundry Weekly #001 | 2026-W13

> 每周跨平台 AI Agent Skill 质量报告。独立策展，数据驱动。

---

## 本周数据快照

| 指标 | 数值 | 变化 |
|------|------|------|
| 技能总量 | 37,310 | baseline |
| S 级占比 | 5.5% (2,049) | baseline |
| Stale 标记 | 1.3% (502) | baseline |
| 覆盖平台 | 12 | baseline |
| 权限已标注 | 100% (37,310) | baseline |

## S 级 Top 10 — 本周最值得关注的 Skill

| # | 名称 | 下载量 | 分类 | 权限风险 |
|---|------|--------|------|----------|
| 1 | self-improving-agent | 287K | Agent 基建 | NET:outbound, SHELL |
| 2 | ontology | 126K | Agent 基建 | NET:outbound |
| 3 | Self-Improving + Proactive Agent | 102K | Agent 基建 | NET:outbound |
| 4 | AdMapix | 65K | 电商营销 | NET:full |
| 5 | Nano Banana Pro | 63K | AI 模型 | NET:outbound |
| 6 | Obsidian | 61K | 效率工具 | NET:outbound |
| 7 | Baidu Search | 57K | 搜索与研究 | NET:outbound |
| 8 | API Gateway | 52K | API 网关 | NET:full |
| 9 | Free Ride - Unlimited free AI | 45K | AI 模型 | NET:outbound |
| 10 | Mcporter | 43K | Agent 基建 | NET:full |

**洞察**: Top 10 中 7 个只需 outbound 网络访问，3 个需要 full access（AdMapix、API Gateway、Mcporter）。企业部署时优先选择 outbound-only 类型，风险可控。

## 隐藏宝石 — S 级但下载量 <100

这些 Skill 质量足够获得 S 评级，但还没被大多数人发现：

| 名称 | 下载 | 分类 | 亮点 |
|------|------|------|------|
| 飞书云盘助手 | 28 | 通讯集成 | 国内唯一的飞书云盘 MCP 集成 |
| AI Agent Trading on DEX | 39 | 金融交易 | DEX 自动交易 Agent |
| siyuan-api-skill | 44 | 区块链 Web3 | 思源笔记 API 集成 |
| 野狐棋谱下载 | 53 | 教育学习 | 中文围棋棋谱批量下载 |
| Workflow Automator | 63 | 办公文档 | 无代码工作流编排 |
| i-skill | 66 | Agent 基建 | Agent 技能自增强框架 |

## 权限风险报告

首次发布 37,310 个 Skill 的权限清单（自动扫描标注）：

| 权限维度 | 分布 | 风险信号 |
|----------|------|----------|
| 网络访问 | none: 12% / outbound: 40% / **full: 48%** | 近半数 Skill 有完整网络权限 |
| 文件系统 | none: 45% / read: 28% / **write: 27%** | 四分之一可写入本地文件 |
| Shell 执行 | **28% 需要 shell** | 超过 1 万个 Skill 可执行任意命令 |
| 数据敏感度 | public: 30% / internal: 46% / **confidential: 24%** | 近四分之一涉及机密数据 |

**安全建议**: 在生产环境中使用 AI Agent Skill 前，优先检查 OpenClaw Foundry 的权限标签。`NET:full + SHELL + CONF` 三标齐亮的 Skill 需要额外审查。

## S 级密度排行 — 哪些分类质量最高

| 分类 | S 级密度 | S 级数量/总数 |
|------|----------|-------------|
| 区块链 Web3 | 8.9% | 270/3,025 |
| 游戏娱乐 | 8.0% | 170/2,120 |
| 办公文档 | 7.8% | 136/1,752 |
| 电商营销 | 7.2% | 190/2,644 |
| Agent 基建 | 7.0% | 116/1,649 |

**洞察**: 区块链 Web3 分类不仅数量最多（3,025），S 级密度也最高（8.9%）。这个领域的 Skill 竞争最激烈，优胜劣汰效果最明显。

## Stale 预警 — 需要注意的分类

| 分类 | Stale 数量 | 占比 |
|------|-----------|------|
| 其他 | 95 | 2.7% |
| DevOps 部署 | 76 | 3.5% |
| Agent 基建 | 52 | 3.2% |
| 搜索与研究 | 33 | 1.4% |
| 数据分析 | 26 | 4.0% |

DevOps 和 Agent 基建分类的 stale 率偏高，可能与工具迭代速度快、旧版本快速被替代有关。

---

## 下周预告

- 平台变更追踪：12 个 Claw 平台的版本更新监控上线
- 评级公式 v2：引入真实部署成功率权重（需要你的反馈数据）
- 跨平台兼容性矩阵：同一 Skill 在 OpenClaw vs ArkClaw 上的表现对比

---

OpenClaw Foundry -- 中国 AI Agent 生态的武器库
https://openclaw-foundry.pages.dev

Maurice | maurice_wen@proton.me
