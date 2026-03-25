-- Seed data: 5 curated collections (hand-picked, featured)
-- Run: cd worker && npx wrangler d1 execute openclaw-foundry --file=src/seed-collections.sql

INSERT OR IGNORE INTO collections (id, name, tagline, description, skill_ids, curator, featured, install_count) VALUES
(
  'indie-survival-kit',
  '独立开发者生存包',
  '一个人做完产品+营销+发布的最小技能集',
  '从想法验证到产品发布，5 个技能覆盖完整独立开发者工作流：Lean Canvas 验证商业模型 → 前端设计一步到位 → SEO 优化获取自然流量 → 发布前全面检查 → GTM 策略推广上线。',
  '["lean-canvas","frontend-design","agentic-seo","launch-checklist","gtm-strategy"]',
  'Maurice', 1, 0
),
(
  'code-audit-pipeline',
  '全自动代码审计流水线',
  '三个 skill 组成端到端安全审计管道',
  '安全最佳实践扫描 → 代码质量审查 → 对抗性攻击测试。三层防线确保代码在合并前经过全面审计。',
  '["security-best-practices","code-review","adversarial-review"]',
  'Maurice', 1, 0
),
(
  'ai-researcher-kit',
  'AI 研究员套装',
  '从搜索到分析到输出的完整研究工作流',
  '深度研究多步骤信息综合 → HTTP 结构化数据提取 → 多语言翻译输出。适合竞品调研、技术选型、市场分析等场景。',
  '["deep-research","agent-fetch","baoyu-translate"]',
  'Maurice', 1, 0
),
(
  'frontend-craftsman',
  '前端工匠五件套',
  '设计到原型到开发到测试到发布一条龙',
  '前端设计 → React 最佳实践 → UI/UX 打磨 → 前端测试验证 → 部署预览。5 个技能覆盖前端开发全生命周期。',
  '["frontend-design","react-best-practices","ui-ux-polish","frontend-testing","deploy-preview"]',
  'Maurice', 1, 0
),
(
  'pm-toolkit',
  '产品经理全家桶',
  '从发现到定义到验证的产品管理工具箱',
  '创建 PRD 需求文档 → 拆分用户故事 → 竞品分析 → A/B 测试分析。4 个技能覆盖产品经理日常核心工作流。',
  '["create-prd","user-stories","competitor-analysis","ab-test-analysis"]',
  'Maurice', 0, 0
),
(
  'content-creator-suite',
  '内容创作工作站',
  '从选题到写作到发布的全链路内容管线',
  '深度研究选题 → 多语言翻译适配 → 公众号/自媒体全流程发布。适合内容团队和自媒体创作者。',
  '["deep-research","baoyu-translate","wechat-article-writer"]',
  'Maurice', 0, 0
),
(
  'devops-autopilot',
  'DevOps 自动驾驶',
  '基础设施巡检+部署预览+发布检查三合一',
  '基础设施安全巡检 → 部署预览验证 → 发布检查清单。确保每次部署都经过完整验证流程。',
  '["infra-patrol","deploy-preview","release-checklist"]',
  'Maurice', 0, 0
),
(
  'browser-automation-pro',
  '浏览器自动化专家包',
  '从 HTTP 提取到视觉驱动再到持久登录的全层覆盖',
  'HTTP 结构化提取(最快) → 持久登录浏览器自动化(反检测) → 视觉驱动自动化(兜底)。三层覆盖，按需升级。',
  '["agent-fetch","agent-browser-session","browser-automation"]',
  'Maurice', 0, 0
);
