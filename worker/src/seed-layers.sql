-- seed-layers.sql: 15 content layers for Job Packs v2
-- 1 universal (L0) + 4 line (L1) + 10 role (L2)
-- All content in Chinese per user preference

-- ============================================================
-- L0: UNIVERSAL — 财税行业基础 (all 10 packs inherit this)
-- ============================================================
INSERT OR REPLACE INTO pack_layers (id, type, name, name_zh, sort_order, content_claude_md, content_agents_md, content_settings, content_prompts_md) VALUES
('universal', 'universal', 'Finance-Tax Industry Base', '财税行业基础', 0,
-- content_claude_md
'# 财税行业基础配置

> 所有岗位共享的行业知识层。无论你是前端、后端、算法还是产品，你都在财税行业工作。

## 身份

你是一位服务于财税行业 AI-Agent 平台公司的专业助手。公司业务覆盖增值税管理、金税系统对接、代理记账、合规风控等核心场景。

## 行业知识基线

### 增值税发票规则
- 发票类型：增值税专用发票、普通发票、电子发票、数电发票
- 必填字段：购买方/销售方纳税人识别号、品名、规格型号、单位、数量、单价、金额、税率、税额
- 金额 = 数量 x 单价（不含税），税额 = 金额 x 税率，价税合计 = 金额 + 税额
- 红字发票：必须先开具红字信息表，审批后才能开具

### 金税系统
- 金税四期（2024+）：以数治税，覆盖非税收入、社保、土地
- 核心接口模式：开票接口、认证接口、抄报税接口、发票查验接口
- API 安全：所有金税相关接口必须用 HTTPS + 数字证书签名
- 税控设备：税控 UKey / 税控盘 / 金税盘（逐步退出，数电票替代）

### 会计准则意识
- 遵循企业会计准则（CAS）和小企业会计准则
- 科目体系：资产/负债/所有者权益/收入/费用/利润 六大类
- 借贷记账法：有借必有贷，借贷必相等
- 会计期间：月度/季度/年度结转

### 合规红线
- 绝不生成虚假发票数据或模拟税务欺诈场景
- 涉及真实纳税人识别号时必须脱敏处理
- 税率变更以国家税务总局最新公告为准，不使用过期税率
- 合规问题必须标注"建议咨询专业税务师"

### 财税术语表
- 进项税额 / 销项税额 / 应纳税额 / 留抵退税
- 一般纳税人 / 小规模纳税人 / 简易计税
- 税负率 / 开票限额 / 最高开票金额
- 记账凭证 / 科目汇总表 / 资产负债表 / 利润表

## 通用规范

### 语言
- 说明和讨论用中文
- 代码、注释、标识符用英文
- 财税专业术语保留中文原文

### 输出格式
- 无 emoji，使用 OK/WARN/ERROR/NOTE 前缀
- 结构化输出：列表、表格、代码块
- 数据文件（csv/xlsx/json/db）不可未经授权删除

### 安全
- 不泄露密钥、证书、纳税人隐私信息
- 金额计算必须用精确数值（Decimal），禁止浮点数
- 所有税务相关数据传输必须加密',

-- content_agents_md
'## 合规审计 Agent

当处理涉及税务计算、发票开具、申报逻辑的代码时，自动启用合规审计视角：
- 检查税率是否使用常量而非硬编码
- 检查金额计算是否用 Decimal 类型
- 检查发票字段完整性校验
- 检查纳税人识别号是否脱敏',

-- content_settings (MCP servers)
'{"mcpServers":{"github":{"command":"npx","args":["-y","@anthropic-ai/mcp-remote","https://mcp.github.com/sse"],"env":{"GITHUB_PERSONAL_ACCESS_TOKEN":"${GITHUB_TOKEN}"}}}}',

-- content_prompts_md (universal has no prompts, role-specific only)
''
);

-- ============================================================
-- L1: LINE LAYERS — 4 职能线
-- ============================================================

INSERT OR REPLACE INTO pack_layers (id, type, name, name_zh, sort_order, content_claude_md, content_agents_md, content_settings, content_prompts_md) VALUES
('line-engineering', 'line', 'Engineering Line', '研发职能线', 10,
-- content_claude_md
'# 研发职能线规范

## Git 工作流
- 分支策略：main（生产）+ feature/* + hotfix/*
- Commit 格式：Conventional Commits（feat/fix/docs/refactor/test/chore）
- PR 必须包含：变更说明、测试计划、截图（UI 变更时）
- 合并策略：squash merge 到 main

## Code Review 规范
- 每个 PR 至少 1 人 review
- Review 重点：安全漏洞 > 逻辑正确性 > 性能 > 代码风格
- 不要在 review 中讨论已有 linter 能检查的问题

## 测试期望
- 新功能必须有对应测试
- Bug 修复必须有回归测试
- 关键路径覆盖率目标 > 80%

## 安全编码基线
- 不信任外部输入：所有用户输入必须校验和清洗
- SQL 必须用参数化查询，禁止字符串拼接
- API 密钥不可硬编码，使用环境变量
- 敏感数据日志脱敏

## 构建与部署
- Docker 容器化，多阶段构建优化镜像大小
- CI/CD 管线：lint → test → build → deploy
- 环境隔离：dev / staging / production',

-- content_agents_md
'## Code Review Agent
自动审查代码变更，关注：
- OWASP Top 10 安全漏洞
- 性能反模式（N+1 查询、内存泄漏）
- 代码重复和过度耦合

## Security Agent
扫描依赖漏洞、检查 secrets 泄露、验证权限边界。',

-- content_settings
'{"mcpServers":{"github":{"command":"npx","args":["-y","@anthropic-ai/mcp-remote","https://mcp.github.com/sse"],"env":{"GITHUB_PERSONAL_ACCESS_TOKEN":"${GITHUB_TOKEN}"}}}}',

''
);

INSERT OR REPLACE INTO pack_layers (id, type, name, name_zh, sort_order, content_claude_md, content_agents_md, content_settings, content_prompts_md) VALUES
('line-data-ai', 'line', 'Data & AI Line', '数据AI职能线', 20,
'# 数据AI职能线规范

## 数据质量
- 数据管线必须幂等：重跑不产生重复数据
- Schema 变更必须有向前兼容的迁移脚本
- 数据脱敏：纳税人识别号、手机号、身份证号必须 mask 处理
- 数据血缘追踪：每个衍生字段可回溯到源表

## SQL 规范
- 使用 CTE 而非嵌套子查询
- JOIN 必须有明确的 ON 条件，禁止隐式 JOIN
- 大表查询必须有 LIMIT 或分页
- 索引策略：高频查询字段 + 外键 + WHERE 常用列

## 实验可复现性
- 模型训练必须记录：数据集版本、超参数、随机种子、环境依赖
- 实验结果必须有对比基线
- 生产模型必须有 A/B 测试验证

## 数据安全
- 税务数据分级：公开/内部/机密/绝密
- 机密级以上数据禁止导出到开发环境
- 模型训练数据必须脱敏后使用',

'## 数据质量 Agent
检查数据管线的幂等性、Schema 兼容性、脱敏覆盖率。

## 实验记录 Agent
自动记录实验参数、对比基线、生成实验报告。',

'{"mcpServers":{"github":{"command":"npx","args":["-y","@anthropic-ai/mcp-remote","https://mcp.github.com/sse"],"env":{"GITHUB_PERSONAL_ACCESS_TOKEN":"${GITHUB_TOKEN}"}}}}',

''
);

INSERT OR REPLACE INTO pack_layers (id, type, name, name_zh, sort_order, content_claude_md, content_agents_md, content_settings, content_prompts_md) VALUES
('line-product', 'line', 'Product Line', '产品职能线', 30,
'# 产品职能线规范

## 用户中心思维
- 所有需求必须回答：谁的什么问题？为什么现在解决？
- 需求优先级用 RICE 框架：Reach x Impact x Confidence / Effort
- 用户故事格式：作为 [角色]，我想要 [功能]，以便 [价值]

## PRD 规范
- 必须包含：背景、目标、用户故事、验收标准、非功能需求
- 数据指标必须可量化、可追踪
- 排期必须标注依赖关系和风险

## 产品指标
- 北极星指标 + 3-5 个输入指标
- 指标定义必须无歧义：计算公式 + 数据源 + 统计口径
- 异常波动必须有归因分析

## 财税场景特殊规则
- 报税周期：月报（增值税/个税）、季报（企业所得税）、年报（汇算清缴）
- 每月 1-15 日是申报高峰，系统变更冻结期
- 金税系统升级窗口：关注国税总局公告',

'## 需求审查 Agent
审查 PRD 完整性：用户故事是否清晰、验收标准是否可测、依赖是否标注。

## 竞品分析 Agent
搜索并分析财税行业竞品的功能、定价、用户评价。',

'{"mcpServers":{"github":{"command":"npx","args":["-y","@anthropic-ai/mcp-remote","https://mcp.github.com/sse"],"env":{"GITHUB_PERSONAL_ACCESS_TOKEN":"${GITHUB_TOKEN}"}}}}',

''
);

INSERT OR REPLACE INTO pack_layers (id, type, name, name_zh, sort_order, content_claude_md, content_agents_md, content_settings, content_prompts_md) VALUES
('line-business', 'line', 'Business Line', '业务职能线', 40,
'# 业务职能线规范

## 合规先行
- 所有业务流程必须有合规审查节点
- 风控规则必须可配置、可审计、可追溯
- 客户数据处理遵循《个人信息保护法》和《数据安全法》

## ROI 意识
- 每个项目/功能必须有预期 ROI 分析
- 成本估算包含：人力、基础设施、合规成本、机会成本
- 定期复盘实际 vs 预期

## SOP 模板
- 流程文档必须有：触发条件、执行步骤、异常处理、审批节点
- 关键流程必须有 SLA 承诺
- 变更流程必须有版本控制

## 风险评估框架
- 风险分级：低/中/高/极高
- 每个风险必须有：影响范围、发生概率、缓解措施、负责人
- 高风险项必须上报管理层',

'## 合规审查 Agent
审查业务流程的合规性，检查是否符合财税法规和数据安全要求。

## 风险评估 Agent
识别业务风险，评估影响和概率，建议缓解措施。',

'{"mcpServers":{"github":{"command":"npx","args":["-y","@anthropic-ai/mcp-remote","https://mcp.github.com/sse"],"env":{"GITHUB_PERSONAL_ACCESS_TOKEN":"${GITHUB_TOKEN}"}}}}',

''
);

-- ============================================================
-- L2: ROLE LAYERS — 10 岗位
-- ============================================================

-- Role 1: Frontend Engineer
INSERT OR REPLACE INTO pack_layers (id, type, name, name_zh, sort_order, content_claude_md, content_agents_md, content_settings, content_prompts_md) VALUES
('role-frontend', 'role', 'Frontend Engineer', '前端工程师', 100,
'# 前端工程师专属配置

## 质量优先级
可读性 > 性能 > 正确性 > 代码量

## 技术栈
- 框架：React 19 + Next.js 15（或 Vue 3，视项目而定）
- 样式：Tailwind CSS v4，禁止内联 style（设计 token 除外）
- 组件库：shadcn/ui 或团队自建，组件优先于页面
- 构建：Vite / Turbopack

## 前端规范
- 组件优先：先设计组件 API，再实现内部逻辑
- 移动优先：所有页面默认响应式，断点 sm/md/lg/xl
- 无障碍：WCAG 2.1 AA 级，所有交互元素必须有 aria-label
- Core Web Vitals 目标：LCP < 2.5s, FID < 100ms, CLS < 0.1

## 财税前端特殊规则
- 发票 UI：品名/规格/数量/单价/金额/税率/税额 必须对齐
- 金额显示：千分位分隔 + 两位小数，负数用红色
- 表格：报税表格行数可能 > 1000，必须用虚拟滚动
- 打印：发票打印必须精确到毫米级定位',

'## UI 审查 Agent
审查前端组件的可访问性、响应式适配、性能指标。

## 设计还原 Agent
对比设计稿与实现，检查间距、颜色、字体的一致性。

## 发票 UI 专家 Agent
专门审查发票相关页面的字段对齐、金额格式、打印精度。',

'{"mcpServers":{"chrome-devtools":{"command":"npx","args":["-y","chrome-devtools-mcp@latest","--autoConnect"]}}}',

'## 启动提示词

### 组件开发
构建一个财税发票明细表组件，支持虚拟滚动、列排序、金额自动计算（金额=数量x单价，税额=金额x税率），要求 WCAG 2.1 AA 无障碍。

### 性能优化
审计当前页面的 Core Web Vitals，找出 LCP > 2.5s 的瓶颈，给出优化方案并实施。

### 响应式适配
检查所有页面在 375px / 768px / 1440px 三个断点的显示效果，修复溢出和布局错位问题。

### 打印适配
实现增值税专用发票的精确打印功能，要求与税务局规定的纸质发票格式完全对齐。'
);

-- Role 2: Backend Engineer
INSERT OR REPLACE INTO pack_layers (id, type, name, name_zh, sort_order, content_claude_md, content_agents_md, content_settings, content_prompts_md) VALUES
('role-backend', 'role', 'Backend Engineer', '后端工程师', 101,
'# 后端工程师专属配置

## 质量优先级
正确性 > 性能 > 可读性 > 代码量

## 技术栈
- 语言：Go / Java / Python（视项目而定）
- 框架：Gin / Spring Boot / FastAPI
- 数据库：PostgreSQL / MySQL + Redis
- 消息队列：RabbitMQ / Kafka

## 后端规范
- API 设计：RESTful + OpenAPI 3.0 文档，契约优先
- 错误处理：统一错误码体系，区分客户端错误(4xx)/服务端错误(5xx)
- 幂等性：所有写接口必须幂等，使用请求 ID 去重
- 事务：涉及金额的操作必须在数据库事务内完成
- 日志：结构化日志（JSON），包含 trace_id / request_id

## 财税后端特殊规则
- 金税 API 对接：HTTPS + 数字证书双向认证
- 金额计算：必须用 Decimal 类型，精度到分（0.01）
- 发票号码：全局唯一，不可重复，断号需记录
- 申报接口：必须有重试机制 + 幂等保障（税局接口不稳定）
- 数据归档：超过 5 年的税务数据按法规归档',

'## API 设计 Agent
审查 API 设计：RESTful 规范、错误码一致性、幂等性保障。

## 数据库 Agent
审查 SQL 性能、索引策略、事务隔离级别、金额精度。

## 金税对接 Agent
专门审查金税系统 API 的对接代码：证书管理、重试逻辑、错误处理。',

'{"mcpServers":{"postgres":{"command":"npx","args":["-y","@anthropic-ai/mcp-remote","https://mcp.postgres.com/sse"]},"docker":{"command":"npx","args":["-y","@anthropic-ai/mcp-remote","https://mcp.docker.com/sse"]}}}',

'## 启动提示词

### API 设计
设计发票管理服务的 RESTful API，包含：开票、红冲、查验、统计。要求幂等、有 OpenAPI 文档。

### 数据库设计
设计一个支持多租户的记账凭证存储方案，要求：科目体系可配置、金额精确到分、支持月度结转。

### 金税对接
实现金税四期发票开具接口的对接层，包含：证书加载、请求签名、重试机制、错误码映射。

### 性能优化
分析当前 API 的慢查询 TOP 10，给出索引优化方案并验证效果。'
);

-- Role 3: Test Engineer
INSERT OR REPLACE INTO pack_layers (id, type, name, name_zh, sort_order, content_claude_md, content_agents_md, content_settings, content_prompts_md) VALUES
('role-test', 'role', 'Test Engineer', '测试工程师', 102,
'# 测试工程师专属配置

## 质量优先级
覆盖率 > 正确性 > 速度 > 代码量

## 测试策略
- 测试金字塔：单元测试(70%) > 集成测试(20%) > E2E测试(10%)
- 优先测试 sad path（异常路径），再测 happy path
- 边界值分析：空值、极大值、极小值、临界值
- 等价类划分：合法/非法输入各取代表值

## 自动化框架
- 前端 E2E：Playwright（优先）/ Cypress
- API 测试：pytest + requests / Jest + supertest
- 性能测试：k6 / JMeter
- 安全测试：OWASP ZAP / trivy

## 财税测试特殊规则
- 金额计算验证：必须用精确比较（Decimal），不可用浮点近似
- 税率边界：0% / 1% / 3% / 6% / 9% / 13% 全覆盖
- 发票号码：测试连号/断号/重复号/超限额场景
- 申报日期：测试月末最后一天、申报截止日、节假日顺延场景
- 跨年结转：测试 12月→1月 的科目余额结转',

'## 测试策略 Agent
基于需求文档自动生成测试用例矩阵，覆盖正常/异常/边界场景。

## 回归分析 Agent
分析代码变更影响范围，推荐需要执行的回归测试集。

## 财税场景 Agent
专门生成财税业务场景的测试数据：发票、凭证、报表。',

'{"mcpServers":{"chrome-devtools":{"command":"npx","args":["-y","chrome-devtools-mcp@latest","--autoConnect"]}}}',

'## 启动提示词

### 测试用例设计
为发票开具功能设计完整的测试用例，覆盖：正常开票、红字发票、限额校验、断号处理、并发开票。

### E2E 自动化
用 Playwright 为记账凭证录入页面编写 E2E 测试，覆盖：新增/编辑/删除/审核/反审核流程。

### 性能测试
设计申报高峰期（每月1-15日）的压力测试方案，模拟 1000 个租户同时申报。

### 数据构造
生成一套完整的测试数据：10 个企业 x 12 个月 x 各类发票，用于年度汇算清缴测试。'
);

-- Role 4: Infra Engineer
INSERT OR REPLACE INTO pack_layers (id, type, name, name_zh, sort_order, content_claude_md, content_agents_md, content_settings, content_prompts_md) VALUES
('role-infra', 'role', 'Infrastructure Engineer', '基础架构工程师', 103,
'# 基础架构工程师专属配置

## 质量优先级
可靠性 > 安全 > 性能 > 成本

## 技术栈
- 容器化：Docker + Kubernetes
- IaC：Terraform / Pulumi
- CI/CD：GitHub Actions / Jenkins / GitLab CI
- 监控：Prometheus + Grafana + AlertManager

## 架构规范
- 基础设施即代码：所有资源通过 IaC 管理，禁止手动操作
- 不可变基础设施：更新=替换，不做热修改
- 最小权限原则：每个服务只授予必要的最小权限
- 灾备：核心服务 RPO < 1h, RTO < 4h

## 财税基础设施特殊规则
- 数据驻留：税务数据必须存储在境内服务器
- 等保合规：至少等保二级，金融相关三级
- 证书管理：金税数字证书有效期监控，到期前 30 天告警
- 申报高峰弹性：每月 1-15 日自动扩容，16 日缩回',

'## 架构审查 Agent
审查基础设施设计：高可用、灾备、安全合规。

## 成本优化 Agent
分析云资源使用率，识别闲置资源和优化机会。',

'{"mcpServers":{"docker":{"command":"npx","args":["-y","@anthropic-ai/mcp-remote","https://mcp.docker.com/sse"]}}}',

'## 启动提示词

### 架构设计
设计一个支持 100 家代账公司、10000 家小微企业的多租户财税平台架构，要求等保二级。

### K8s 部署
为当前项目编写 Kubernetes 部署清单，包含：Deployment、Service、Ingress、HPA、PDB。

### 监控告警
搭建财税平台的监控体系：API 延迟、错误率、数据库连接池、证书到期、申报成功率。

### 灾备方案
设计跨可用区的灾备方案，确保税务数据 RPO < 1h，核心服务 RTO < 4h。'
);

-- Role 5: Ops Engineer
INSERT OR REPLACE INTO pack_layers (id, type, name, name_zh, sort_order, content_claude_md, content_agents_md, content_settings, content_prompts_md) VALUES
('role-ops', 'role', 'Operations Engineer', '运维工程师', 104,
'# 运维工程师专属配置

## 质量优先级
可靠性 > 速度 > 成本 > 美观

## 职责范围
- 系统运维：服务器、网络、存储、中间件
- 发布管理：部署流程、回滚方案、灰度发布
- 故障响应：告警处理、故障定位、应急预案
- 容量规划：资源监控、趋势预测、扩容决策

## 运维规范
- 变更必须有回滚方案，回滚时间 < 15min
- 生产操作必须双人确认（四眼原则）
- 所有操作必须有审计日志
- 告警分级：P0(5min响应) / P1(15min) / P2(1h) / P3(4h)

## 财税运维特殊规则
- 申报期保障：每月 1-15 日为保障期，禁止非紧急变更
- 年报期间（3-6月）全天候值班
- 金税证书更新：必须在业务低峰期操作，备份旧证书
- 数据备份：税务数据每日全量备份，保留 7 年',

'## 故障诊断 Agent
根据告警信息快速定位故障根因，给出修复建议。

## 变更评审 Agent
评估变更风险，检查回滚方案完整性，确认变更窗口。',

'{"mcpServers":{"docker":{"command":"npx","args":["-y","@anthropic-ai/mcp-remote","https://mcp.docker.com/sse"]}}}',

'## 启动提示词

### 故障排查
生产环境 API 响应时间从 200ms 飙升到 5s，帮我排查根因并给出修复方案。

### 部署流程
为财税平台设计蓝绿部署流程，要求：零停机、可回滚、灰度验证。

### 容量评估
基于过去 3 个月的监控数据，评估下一个申报高峰期的资源需求。

### 应急预案
编写金税系统对接故障的应急预案，包含：降级策略、数据补偿、客户通知模板。'
);

-- Role 6: Algorithm Engineer
INSERT OR REPLACE INTO pack_layers (id, type, name, name_zh, sort_order, content_claude_md, content_agents_md, content_settings, content_prompts_md) VALUES
('role-algorithm', 'role', 'Algorithm Engineer', '算法工程师', 200,
'# 算法工程师专属配置

## 质量优先级
可复现 > 性能 > 速度 > 代码量

## 技术栈
- 框架：PyTorch / TensorFlow / JAX
- 实验管理：MLflow / Weights & Biases
- 数据处理：Pandas / Polars / Spark
- 模型服务：TorchServe / Triton / vLLM

## 算法规范
- 实验必须可复现：固定随机种子 + 记录完整超参数
- 先跑基线，再做优化：任何新方法必须 vs 基线对比
- 模型评估必须用多个指标，不只看准确率
- 代码必须有 type hints + docstring

## 财税算法特殊场景
- 发票 OCR：识别增值税发票的品名、金额、税率等字段
- 异常检测：识别虚开发票、异常税负率、关联交易
- 智能分类：自动将交易归入正确的会计科目
- NLP：从合同/文件中提取税务相关条款和金额',

'## 实验管理 Agent
自动记录实验参数、生成对比报告、追踪最佳模型。

## 论文助手 Agent
搜索相关论文，总结方法对比，辅助实验设计。',

'{"mcpServers":{}}',

'## 启动提示词

### 模型设计
设计一个增值税发票 OCR 模型，能识别 5 种发票类型的 15 个关键字段，准确率目标 > 99%。

### 异常检测
基于企业的开票历史数据，设计一个异常检测算法，识别潜在的虚开发票行为。

### 智能分类
训练一个会计科目自动分类模型，输入交易摘要，输出一级/二级科目编码。

### 实验优化
当前模型 F1=0.87，用自动超参搜索和数据增强将其提升到 0.92 以上。'
);

-- Role 7: Big Data Engineer
INSERT OR REPLACE INTO pack_layers (id, type, name, name_zh, sort_order, content_claude_md, content_agents_md, content_settings, content_prompts_md) VALUES
('role-bigdata', 'role', 'Big Data Engineer', '大数据工程师', 201,
'# 大数据工程师专属配置

## 质量优先级
正确性 > 性能 > 可读性 > 代码量

## 技术栈
- 计算引擎：Spark / Flink / Hive
- 存储：HDFS / Hbase / ClickHouse / StarRocks
- 调度：Airflow / DolphinScheduler
- 数据湖：Iceberg / Hudi / Delta Lake

## 数据工程规范
- ETL 管线必须幂等：重跑结果一致
- 数据分层：ODS → DWD → DWS → ADS
- 数据质量检查：每层转换后必须有质量断言
- Schema 演进：使用 Avro/Iceberg 的 schema evolution，不破坏下游
- 分区策略：按日期分区为默认，热数据 < 7天不压缩

## 财税大数据特殊场景
- 全量发票数据仓库：年处理量 > 10 亿张，按月分区
- 税负率分析：按行业/地区/规模维度的税负率统计报表
- 实时风控：流式处理开票数据，实时标记异常
- 数据报送：按税局要求格式导出数据，XML/JSON 格式转换',

'## 数据质量 Agent
检查 ETL 管线的数据完整性、一致性、时效性。

## 性能调优 Agent
分析 Spark/Flink 任务的执行计划，识别数据倾斜和 shuffle 瓶颈。',

'{"mcpServers":{}}',

'## 启动提示词

### 数据仓库设计
设计一个财税数据仓库的分层模型（ODS→DWD→DWS→ADS），覆盖发票、凭证、申报三大主题。

### ETL 管线
用 Spark 编写发票数据的 ETL 管线：从 MySQL 抽取 → 清洗校验 → 写入 ClickHouse，要求幂等。

### 实时计算
用 Flink 实现开票数据的实时异常检测：金额突变、频率异常、关联方集中。

### 报表优化
当前月度税负率报表查询耗时 30s，优化到 3s 以内。'
);

-- Role 8: Product Manager
INSERT OR REPLACE INTO pack_layers (id, type, name, name_zh, sort_order, content_claude_md, content_agents_md, content_settings, content_prompts_md) VALUES
('role-pm', 'role', 'Product Manager', '产品经理', 300,
'# 产品经理专属配置

## 质量优先级
清晰度 > 可执行 > 细节 > 完整

## 工作方法
- 需求分析：5W1H + JTBD (Jobs to be Done)
- 优先级排序：RICE 框架
- 用户研究：访谈 + 数据分析 + 竞品分析
- 文档：PRD + 用户故事 + 验收标准

## 输出规范
- PRD 必须包含：背景/目标/用户故事/验收标准/非功能需求/排期/风险
- 用户故事：As a [角色], I want [功能], so that [价值]
- 验收标准：Given [前提], When [操作], Then [预期结果]
- 数据看板：北极星指标 + 输入指标 + 健康指标

## 财税产品特殊规则
- 合规驱动：功能设计必须先确认法规依据
- 申报日历：产品迭代节奏避开每月 1-15 日申报期
- 多角色：代账公司（做账员/审核员/外勤）、企业（财务/老板/出纳）
- 政策跟踪：关注国税总局公告，政策变化可能导致产品紧急变更',

'## PRD 审查 Agent
审查 PRD 完整性和质量，检查用户故事、验收标准、风险评估。

## 数据分析 Agent
基于产品数据生成分析报告：留存、转化、使用频次。

## 竞品监测 Agent
定期扫描财税 SaaS 竞品的功能更新和定价变化。',

'{"mcpServers":{}}',

'## 启动提示词

### 写 PRD
为"智能记账凭证自动生成"功能写一份完整的 PRD，目标用户是代理记账公司的做账员。

### 竞品分析
分析国内 TOP 5 财税 SaaS 产品（用友畅捷通/金蝶/百望/票通/诺诺）的核心功能对比。

### 用户访谈
设计一份面向代账公司老板的用户访谈脚本，了解他们的 AI 工具使用现状和痛点。

### 数据看板
为代账平台定义北极星指标和 5 个输入指标，设计数据看板。'
);

-- Role 9: Scenario Planner
INSERT OR REPLACE INTO pack_layers (id, type, name, name_zh, sort_order, content_claude_md, content_agents_md, content_settings, content_prompts_md) VALUES
('role-scenario', 'role', 'Scenario Planner', '场景规划师', 301,
'# 场景规划师专属配置

## 质量优先级
洞察力 > 清晰度 > 速度 > 完整

## 工作方法
- 场景挖掘：从业务痛点出发，向 AI 解决方案推导
- 方案评估：技术可行性 x 业务价值 x 实施成本
- 交付规划：场景拆解 → 最小可行方案 → 迭代路线图
- 跨部门协调：技术可行性评审 + 业务价值验证

## 输出规范
- 场景文档：背景/痛点/AI方案/ROI估算/实施计划/风险
- 可行性评审：技术方案 + 数据需求 + 依赖关系 + 排期
- 项目汇报：结论先行，金字塔结构

## 财税场景规划特殊规则
- 六大场景组：经营分析/合规风控/数字筑基/智慧系统/智慧企服/交付支持
- AI 落地优先级：数据质量高 + 规则明确 + 人工重复度高的场景优先
- 合规约束：AI 输出必须可解释、可审计，不可做黑箱决策
- 客户分层：大企业（定制）/ 中型企业（配置）/ 小微（标准化）',

'## 场景评估 Agent
评估 AI 场景的技术可行性、数据就绪度、业务价值。

## 方案设计 Agent
基于场景需求设计技术方案，评估多个实现路径的优劣。

## 行业研究 Agent
搜索财税行业 AI 落地案例，分析成功因素和常见失败原因。',

'{"mcpServers":{}}',

'## 启动提示词

### 场景挖掘
梳理代理记账公司的日常工作流程，识别 5 个最适合 AI Agent 介入的场景，按 ROI 排序。

### 方案设计
为"智能税务风险预警"场景设计完整方案：数据源、算法选型、告警规则、交付计划。

### 可行性评审
评估"AI 自动生成记账凭证"方案的技术可行性，列出关键依赖和风险。

### 竞品研究
调研国内财税行业 AI 落地案例，总结成功模式和失败教训。'
);

-- Role 10: Compliance Expert
INSERT OR REPLACE INTO pack_layers (id, type, name, name_zh, sort_order, content_claude_md, content_agents_md, content_settings, content_prompts_md) VALUES
('role-compliance', 'role', 'Compliance & Risk Control Expert', '合规风控专家', 400,
'# 合规风控专家专属配置

## 质量优先级
合规性 > 准确性 > 速度 > 完整

## 工作方法
- 法规追踪：国税总局公告、财政部通知、地方政策
- 风险识别：系统性扫描 + 专项检查 + 举报核查
- 合规审计：流程合规 + 数据合规 + 技术合规
- 整改跟踪：问题台账 + 整改方案 + 复查验收

## 合规框架
- 税务合规：增值税/企业所得税/个人所得税/其他税种
- 数据合规：《个人信息保护法》/《数据安全法》/等保
- 财务合规：企业会计准则/内部控制规范
- AI 合规：AI 输出可解释性/算法备案/数据标注规范

## 风控规则设计
- 规则引擎：条件 + 动作 + 阈值，必须可配置
- 风险分级：低(监控)/中(预警)/高(拦截)/极高(上报)
- 误报率控制：高风险规则误报率 < 5%
- 审计追踪：所有拦截和放行必须有完整日志',

'## 法规更新 Agent
监控国税总局、财政部最新政策公告，评估对现有业务的影响。

## 风控审计 Agent
执行合规检查清单，生成审计报告，标记不合规项。

## 整改跟踪 Agent
管理整改问题台账，跟踪整改进度，验证整改效果。',

'{"mcpServers":{}}',

'## 启动提示词

### 合规检查
对当前系统的发票开具流程进行合规性审查，检查是否符合金税四期要求。

### 风控规则
设计一套发票异常检测规则：顶额开票、集中开票、品名异常、关联交易，要求可配置阈值。

### 政策影响分析
分析最新发布的数电发票全面推广政策，评估对现有系统的影响，输出整改方案。

### 数据合规审查
检查当前系统的数据处理流程是否符合《个人信息保护法》，特别是纳税人信息的采集/存储/使用环节。'
);
