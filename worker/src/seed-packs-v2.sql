-- seed-packs-v2.sql: 10 Job Pack definitions for v2
-- Each pack references 3 layer IDs: universal + line + role
-- Adapted to 财税AI-Agent平台公司 org structure

-- ============================================================
-- 研发职能线 (Engineering) — 5 packs
-- ============================================================

INSERT OR REPLACE INTO config_packs (id, name, name_zh, description, description_zh, icon, color, line, line_zh, layer_ids, version) VALUES
('frontend-engineer', 'Frontend Engineer', '前端工程师',
 'React/Vue + Tailwind CSS + accessibility + invoice UI patterns for finance-tax platforms.',
 '面向财税平台的前端工程师配置：React/Vue + Tailwind CSS + 无障碍 + 发票 UI 规范。覆盖 APP/PC/财税前端开发组。',
 'web', '#0053A4', 'engineering', '研发职能线',
 '["universal","line-engineering","role-frontend"]', '2.0');

INSERT OR REPLACE INTO config_packs (id, name, name_zh, description, description_zh, icon, color, line, line_zh, layer_ids, version) VALUES
('backend-engineer', 'Backend Engineer', '后端工程师',
 'Go/Java/Python + API design + database + Golden Tax API integration patterns.',
 '面向财税平台的后端工程师配置：Go/Java/Python + API 设计 + 数据库 + 金税系统对接。覆盖 APP/PC/财税后端开发组。',
 'dns', '#005136', 'engineering', '研发职能线',
 '["universal","line-engineering","role-backend"]', '2.0');

INSERT OR REPLACE INTO config_packs (id, name, name_zh, description, description_zh, icon, color, line, line_zh, layer_ids, version) VALUES
('test-engineer', 'Test Engineer', '测试工程师',
 'Test strategy + Playwright E2E + API testing + finance-tax scenario coverage.',
 '面向财税平台的测试工程师配置：测试策略 + Playwright E2E + API 测试 + 财税场景覆盖。覆盖所有测试组。',
 'bug_report', '#7C3AED', 'engineering', '研发职能线',
 '["universal","line-engineering","role-test"]', '2.0');

INSERT OR REPLACE INTO config_packs (id, name, name_zh, description, description_zh, icon, color, line, line_zh, layer_ids, version) VALUES
('infra-engineer', 'Infrastructure Engineer', '基础架构工程师',
 'Docker + K8s + Terraform + monitoring + compliance infrastructure for finance-tax.',
 '面向财税平台的基础架构工程师配置：Docker + K8s + IaC + 监控 + 等保合规基础设施。覆盖基础能力项目部。',
 'cloud', '#059669', 'engineering', '研发职能线',
 '["universal","line-engineering","role-infra"]', '2.0');

INSERT OR REPLACE INTO config_packs (id, name, name_zh, description, description_zh, icon, color, line, line_zh, layer_ids, version) VALUES
('ops-engineer', 'Operations Engineer', '运维工程师',
 'Deployment + monitoring + incident response + tax filing period operations.',
 '面向财税平台的运维工程师配置：部署管理 + 监控告警 + 故障响应 + 申报期保障。覆盖运维管理部。',
 'settings', '#D97706', 'engineering', '研发职能线',
 '["universal","line-engineering","role-ops"]', '2.0');

-- ============================================================
-- 数据AI职能线 (Data & AI) — 2 packs
-- ============================================================

INSERT OR REPLACE INTO config_packs (id, name, name_zh, description, description_zh, icon, color, line, line_zh, layer_ids, version) VALUES
('algorithm-engineer', 'Algorithm Engineer', '算法工程师',
 'PyTorch + experiment tracking + invoice OCR + anomaly detection for tax scenarios.',
 '面向财税平台的算法工程师配置：PyTorch + 实验管理 + 发票 OCR + 税务异常检测。覆盖数据项目部算法组。',
 'psychology', '#DC2626', 'data-ai', '数据AI职能线',
 '["universal","line-data-ai","role-algorithm"]', '2.0');

INSERT OR REPLACE INTO config_packs (id, name, name_zh, description, description_zh, icon, color, line, line_zh, layer_ids, version) VALUES
('bigdata-engineer', 'Big Data Engineer', '大数据工程师',
 'Spark/Flink + data warehouse + ETL pipelines + tax data analytics at scale.',
 '面向财税平台的大数据工程师配置：Spark/Flink + 数据仓库 + ETL 管线 + 海量税务数据分析。覆盖数据项目部大数据组。',
 'storage', '#0053A4', 'data-ai', '数据AI职能线',
 '["universal","line-data-ai","role-bigdata"]', '2.0');

-- ============================================================
-- 产品职能线 (Product) — 2 packs
-- ============================================================

INSERT OR REPLACE INTO config_packs (id, name, name_zh, description, description_zh, icon, color, line, line_zh, layer_ids, version) VALUES
('product-manager', 'Product Manager', '产品经理',
 'PRD + user stories + RICE prioritization + finance-tax product lifecycle.',
 '面向财税平台的产品经理配置：PRD + 用户故事 + RICE 排序 + 财税产品全生命周期管理。覆盖产品部和商品管理部。',
 'lightbulb', '#7C3AED', 'product', '产品职能线',
 '["universal","line-product","role-pm"]', '2.0');

INSERT OR REPLACE INTO config_packs (id, name, name_zh, description, description_zh, icon, color, line, line_zh, layer_ids, version) VALUES
('scenario-planner', 'Scenario Planner', '场景规划师',
 'AI scenario design + feasibility assessment + cross-department coordination for finance-tax.',
 '面向财税平台的场景规划师配置：AI 场景设计 + 可行性评估 + 跨部门协调。覆盖场景规划部各组。',
 'explore', '#003A70', 'product', '产品职能线',
 '["universal","line-product","role-scenario"]', '2.0');

-- ============================================================
-- 业务职能线 (Business) — 1 pack
-- ============================================================

INSERT OR REPLACE INTO config_packs (id, name, name_zh, description, description_zh, icon, color, line, line_zh, layer_ids, version) VALUES
('compliance-expert', 'Compliance & Risk Control Expert', '合规风控专家',
 'Tax compliance + risk rules + policy tracking + audit for finance-tax platforms.',
 '面向财税平台的合规风控专家配置：税务合规 + 风控规则 + 政策追踪 + 审计管理。覆盖场景规划部合规风控组。',
 'verified_user', '#D97706', 'business', '业务职能线',
 '["universal","line-business","role-compliance"]', '2.0');
