// Capability Registry — single source of truth for Foundry's skill/MCP routing
// Each category defines: skills to install, MCP servers to enable, and keywords for AI matching

export interface CapabilityCategory {
  id: string;
  name: string;
  description: string;
  skills: string[];           // skill IDs (from AI-Fleet or ClawHub)
  mcpServers: string[];       // MCP server IDs to enable
  mcpRepos: string[];         // GitHub repos for MCP servers (for catalog display + install)
  keywords: string[];         // for AI matching against free-text role descriptions
  roles: string[];            // wizard role IDs that auto-include this category
  useCases: string[];         // wizard use-case IDs that auto-include this category
}

export const CAPABILITY_REGISTRY: CapabilityCategory[] = [
  // ===== Software Engineering =====
  {
    id: 'core-dev',
    name: 'Core Development',
    description: 'Fundamental coding, review, testing, and debugging',
    skills: ['code-review', 'git-commit', 'commit-helper', 'test-driven-development',
             'systematic-debugging', 'security-best-practices', 'requesting-code-review',
             'receiving-code-review', 'verification-before-completion'],
    mcpServers: ['github'],
    mcpRepos: ['github/github-mcp-server', 'zilliztech/claude-context'],
    keywords: ['coding', 'programming', 'software', 'developer', 'engineer', 'code'],
    roles: ['fullstack-developer', 'backend-developer', 'frontend-developer', 'java-developer',
            'go-developer', 'python-developer', 'cpp-developer', 'mobile-developer', 'embedded-developer', 'cto-tech-lead'],
    useCases: ['coding', 'code-review'],
  },
  {
    id: 'frontend',
    name: 'Frontend & UI',
    description: 'UI design, React/Next.js, frontend testing, design systems',
    skills: ['frontend-design', 'frontend-testing', 'react-best-practices',
             'design-taste-frontend', 'stitch-design-pipeline', 'diceui',
             'canvas-design', 'jh3y-hover-cards', 'remotion-best-practices'],
    mcpServers: [],
    mcpRepos: [],
    keywords: ['frontend', 'ui', 'ux', 'react', 'vue', 'css', 'web', 'design system'],
    roles: ['frontend-developer', 'designer-ux'],
    useCases: ['design'],
  },
  {
    id: 'backend',
    name: 'Backend & APIs',
    description: 'Server-side development, APIs, databases, microservices',
    skills: ['sql-queries', 'security-best-practices', 'test-driven-development',
             'systematic-debugging'],
    mcpServers: ['postgres', 'supabase'],
    mcpRepos: ['crystaldba/postgres-mcp', 'executeautomation/mcp-database-server'],
    keywords: ['backend', 'api', 'server', 'database', 'microservice', 'rest', 'graphql'],
    roles: ['backend-developer', 'fullstack-developer', 'java-developer', 'go-developer', 'python-developer', 'dba'],
    useCases: ['coding', 'api-development'],
  },
  {
    id: 'mobile',
    name: 'Mobile Development',
    description: 'iOS, Android, cross-platform mobile app development',
    skills: ['ios-device-automation', 'android-device-automation',
             'harmonyos-device-automation', 'vphone-cli'],
    mcpServers: [],
    mcpRepos: [],
    keywords: ['mobile', 'ios', 'android', 'swift', 'kotlin', 'react native', 'flutter', 'app'],
    roles: ['mobile-developer', 'embedded-developer'],
    useCases: ['mobile-development'],
  },
  {
    id: 'devops',
    name: 'DevOps & Infrastructure',
    description: 'CI/CD, deployment, monitoring, infrastructure automation',
    skills: ['infra-patrol', 'release-skills', 'github-pr-creation', 'github-pr-merge',
             'github-pr-review', 'finishing-a-development-branch', 'deploy-preview',
             'using-git-worktrees', 'n8n-automation'],
    mcpServers: ['github', 'vercel', 'aws', 'docker'],
    mcpRepos: ['awslabs/mcp', 'grafana/mcp-grafana', 'shelfio/datadog-mcp', 'github/github-mcp-server',
               'hashicorp/terraform-mcp-server', 'docker/mcp-server-docker',
               'stophemo/kubernetes-mcp-server', 'cloudflare/mcp-server-cloudflare'],
    keywords: ['devops', 'sre', 'infrastructure', 'deploy', 'ci', 'cd', 'kubernetes', 'docker', 'terraform', 'monitoring'],
    roles: ['devops'],
    useCases: ['automation'],
  },

  // ===== Data & Analytics =====
  {
    id: 'data-analytics',
    name: 'Data Analysis & Visualization',
    description: 'Excel analysis, SQL, dashboards, cohort analysis',
    skills: ['excel-analysis', 'sql-queries', 'cohort-analysis', 'metrics-dashboard',
             'dummy-dataset', 'ab-test-analysis', 'sentiment-analysis'],
    mcpServers: ['postgres', 'supabase'],
    mcpRepos: ['crystaldba/postgres-mcp', 'HenkDz/postgresql-mcp-server', 'executeautomation/mcp-database-server',
               'elastic/mcp-server-elasticsearch', 'xing5/mcp-google-sheets'],
    keywords: ['data', 'analytics', 'dashboard', 'metrics', 'excel', 'sql', 'visualization', 'bi', 'elasticsearch'],
    roles: ['data-analyst'],
    useCases: ['data-analysis'],
  },
  {
    id: 'ml-ai',
    name: 'Machine Learning & AI',
    description: 'ML pipelines, model training, experiment tracking, AI ops',
    skills: ['bigdata-ml', 'bigdata-core', 'bigdata-dl', 'algo-core', 'algo-dl',
             'bigdata-viz', 'karpathy-autoresearch'],
    mcpServers: [],
    mcpRepos: ['Snowflake-Labs/mcp', 'SnowLeopard-AI/bigquery-mcp'],
    keywords: ['machine learning', 'ml', 'ai', 'deep learning', 'model', 'training', 'pytorch', 'tensorflow', 'nlp'],
    roles: ['ml-ai-engineer', 'algorithm-engineer', 'ai-product-manager'],
    useCases: ['ml-ai'],
  },

  // ===== Product & Strategy =====
  {
    id: 'product-management',
    name: 'Product Management',
    description: 'PRDs, roadmaps, user stories, sprint planning, stakeholder mapping',
    skills: ['create-prd', 'competitive-analysis', 'user-stories', 'sprint-plan',
             'stakeholder-map', 'user-personas', 'customer-journey-map', 'north-star-metric',
             'outcome-roadmap', 'prioritize-features', 'opportunity-solution-tree',
             'pre-mortem', 'brainstorming', 'product-strategy', 'product-vision',
             'lean-canvas', 'business-model', 'wwas'],
    mcpServers: ['linear', 'notion', 'jira'],
    mcpRepos: ['atlassian/atlassian-mcp-server', 'sooperset/mcp-atlassian'],
    keywords: ['product', 'prd', 'roadmap', 'backlog', 'sprint', 'agile', 'scrum', 'pm'],
    roles: ['product-manager'],
    useCases: ['project-management'],
  },

  // ===== Marketing & Growth =====
  {
    id: 'marketing-growth',
    name: 'Marketing & Growth',
    description: 'SEO, social media, email marketing, growth loops, positioning',
    skills: ['agentic-seo', 'marketing-ideas', 'positioning-ideas', 'growth-loops',
             'gtm-strategy', 'gtm-motions', 'monetization-strategy', 'pricing-strategy',
             'market-sizing', 'market-segments', 'ideal-customer-profile',
             'beachhead-segment', 'competitive-battlecard', 'value-prop-statements',
             'product-name', 'ansoff-matrix', 'porters-five-forces', 'swot-analysis',
             'pestle-analysis', 'startup-canvas'],
    mcpServers: ['hubspot'],
    mcpRepos: ['peakmojo/mcp-hubspot', 'mailchimp/mcp-mailchimp'],
    keywords: ['marketing', 'seo', 'growth', 'social media', 'content marketing', 'email', 'advertising',
               'brand', 'campaign', 'funnel', 'conversion', 'lead generation'],
    roles: ['marketing-growth'],
    useCases: ['marketing-seo'],
  },

  // ===== Content & Communication =====
  {
    id: 'content-creation',
    name: 'Content Creation & Writing',
    description: 'Blog posts, social media, copywriting, technical writing, newsletters',
    skills: ['grammar-check', 'md-report-summary', 'release-notes', 'wechat-article-writer',
             'paper-write', 'research-paper-writing', 'baoyu-translate',
             'skill-prompt-convert', 'bestblogs-daily-digest'],
    mcpServers: [],
    mcpRepos: ['deus-h/claudeus-wp-mcp', 'alejandroBallesterosC/document-edit-mcp'],
    keywords: ['content', 'writing', 'blog', 'copywriting', 'newsletter', 'editorial',
               'article', 'documentation', 'tech writer'],
    roles: ['content-creator', 'researcher'],
    useCases: ['writing', 'content-social'],
  },
  {
    id: 'social-media',
    name: 'Social Media & Community',
    description: 'Twitter/X, WeChat, Xiaohongshu, community management',
    skills: ['grok-twitter-search', 'grok-search', 'x-tweet-fetcher',
             'qiaomu-x-article-publisher', 'wechat-article-writer', 'wechat-article-search',
             'xiaohongshu-automation', 'trends24'],
    mcpServers: ['slack', 'discord'],
    mcpRepos: [],
    keywords: ['social media', 'twitter', 'x', 'wechat', 'xiaohongshu', 'community',
               'influencer', 'engagement'],
    roles: ['content-creator', 'marketing-growth'],
    useCases: ['content-social'],
  },

  // ===== Research & Knowledge =====
  {
    id: 'research',
    name: 'Research & Intelligence',
    description: 'Deep research, web search, news aggregation, competitive intel',
    skills: ['deep-research', 'search-first', 'web-multi-search', 'multi-search-engine',
             'news-aggregator-skill', 'tavily-search', 'agent-reach', 'defuddle',
             'apify-competitor-intelligence', 'apify-trend-analysis'],
    mcpServers: [],
    mcpRepos: ['blazickjp/arxiv-mcp-server', 'openags/paper-search-mcp'],
    keywords: ['research', 'analysis', 'intelligence', 'news', 'trends', 'competitive',
               'market research', 'academic'],
    roles: ['researcher', 'data-analyst'],
    useCases: ['research'],
  },

  // ===== Finance & Accounting =====
  {
    id: 'finance',
    name: 'Finance & Accounting',
    description: 'Financial analysis, budgeting, invoicing, tax planning, trading',
    skills: ['excel-analysis', 'sql-queries', 'metrics-dashboard', 'cohort-analysis',
             'pricing-strategy', 'monetization-strategy', 'business-model'],
    mcpServers: ['stripe'],
    mcpRepos: ['stripe/agent-toolkit', 'xero/xero-mcp-server'],
    keywords: ['finance', 'accounting', 'budget', 'invoice', 'tax', 'revenue', 'profit',
               'financial', 'bookkeeping', 'trading', 'investment', 'portfolio', 'xero'],
    roles: ['finance-accounting'],
    useCases: ['finance-accounting'],
  },

  // ===== Compliance & Legal =====
  {
    id: 'compliance-legal',
    name: 'Compliance & Legal',
    description: 'Policy drafting, NDA, privacy, audit, regulatory compliance',
    skills: ['compliance-docs', 'privacy-policy', 'draft-nda', 'test-scenarios',
             'create-prd', 'osint-framework'],
    mcpServers: [],
    mcpRepos: [],
    keywords: ['compliance', 'legal', 'audit', 'regulation', 'gdpr', 'ccpa', 'hipaa',
               'contract', 'nda', 'policy', 'privacy', 'governance'],
    roles: ['compliance'],
    useCases: ['compliance'],
  },

  // ===== Education =====
  {
    id: 'education',
    name: 'Education & Training',
    description: 'Course creation, tutoring, assessment, knowledge sites',
    skills: ['knowledge-site-creator', 'paper-write', 'grammar-check',
             'deep-research', 'excalidraw-diagram-skill', 'codegen-doc',
             'anything-to-notebooklm', 'notebooklm'],
    mcpServers: ['notion'],
    mcpRepos: [],
    keywords: ['education', 'teaching', 'tutoring', 'course', 'training', 'curriculum',
               'learning', 'assessment', 'student', 'instructor'],
    roles: ['educator'],
    useCases: ['education-training'],
  },

  // ===== Customer Support =====
  {
    id: 'customer-support',
    name: 'Customer Support & Help Desk',
    description: 'Ticket management, FAQ, knowledge base, customer feedback analysis',
    skills: ['sentiment-analysis', 'grammar-check', 'summarize-meeting',
             'summarize-interview', 'user-segmentation'],
    mcpServers: ['slack', 'discord', 'zendesk'],
    mcpRepos: ['reminia/zendesk-mcp-server', 'YiyangLi/sms-mcp-server', 'Garoth/sendgrid-mcp'],
    keywords: ['customer support', 'help desk', 'ticket', 'faq', 'knowledge base',
               'customer service', 'support agent', 'email', 'sms'],
    roles: ['customer-support'],
    useCases: ['customer-support'],
  },

  // ===== Sales =====
  {
    id: 'sales',
    name: 'Sales & Business Development',
    description: 'Battlecards, pipeline management, proposals, CRM',
    skills: ['competitive-battlecard', 'ideal-customer-profile', 'value-proposition',
             'stakeholder-map', 'market-segments', 'gtm-motions',
             'interview-script', 'pricing-strategy'],
    mcpServers: ['hubspot', 'slack'],
    mcpRepos: ['peakmojo/mcp-hubspot', 'kablewy/salesforce-mcp'],
    keywords: ['sales', 'business development', 'crm', 'pipeline', 'deal', 'proposal',
               'pitch', 'client', 'prospecting', 'salesforce'],
    roles: ['sales-bizdev'],
    useCases: ['sales-bizdev'],
  },

  // ===== Automation & Workflow =====
  {
    id: 'automation',
    name: 'Automation & Workflow',
    description: 'Browser automation, n8n workflows, scripting, scheduling',
    skills: ['n8n-automation', 'browser-automation', 'playwright-codex',
             'playwright-interactive', 'agent-browser-electron', 'agent-browser-slack',
             'chrome-bridge-automation', 'desktop-computer-automation',
             'apify-ultimate-scraper'],
    mcpServers: [],
    mcpRepos: ['lackeyjb/playwright-skill', 'czlonkowski/n8n-mcp', 'executeautomation/mcp-playwright'],
    keywords: ['automation', 'workflow', 'scraping', 'bot', 'rpa', 'scheduling',
               'integration', 'zapier', 'n8n', 'puppeteer'],
    roles: ['devops'],
    useCases: ['automation'],
  },
  {
    id: 'testing-qa',
    name: 'Testing & Quality Assurance',
    description: 'Functional, integration, performance, and automated testing',
    skills: ['test-driven-development', 'systematic-debugging', 'playwright-codex',
             'playwright-interactive', 'verification-before-completion', 'test-scenarios',
             'browser-automation'],
    mcpServers: [],
    mcpRepos: ['kieranlal/mcp_pytest_service', 'jazzberry-ai/python-testing-mcp',
               'executeautomation/mcp-playwright', 'microsoft/playwright-mcp'],
    keywords: ['testing', 'qa', 'quality assurance', 'test automation', 'regression', 'performance test',
               'e2e', 'unit test', 'integration test'],
    roles: ['qa-tester'],
    useCases: ['testing-qa'],
  },
  {
    id: 'database-admin',
    name: 'Database Administration',
    description: 'Schema design, query optimization, replication, backup/recovery',
    skills: ['sql-queries', 'excel-analysis', 'systematic-debugging'],
    mcpServers: ['postgres', 'supabase'],
    mcpRepos: ['crystaldba/postgres-mcp', 'HenkDz/postgresql-mcp-server', 'subnetmarco/pgmcp',
               'executeautomation/mcp-database-server', 'Nam088/mcp-database-server',
               'Snowflake-Labs/mcp', 'elastic/mcp-server-elasticsearch'],
    keywords: ['database', 'dba', 'postgresql', 'mysql', 'mongodb', 'redis', 'schema',
               'query optimization', 'replication', 'backup', 'snowflake', 'elasticsearch'],
    roles: ['dba', 'data-engineer'],
    useCases: ['data-analysis'],
  },
  {
    id: 'seo-sem',
    name: 'SEO/SEM & Paid Advertising',
    description: 'Search engine optimization, paid search, information flow ads',
    skills: ['agentic-seo', 'web-multi-search', 'multi-search-engine', 'tavily-search',
             'deep-research', 'excel-analysis', 'metrics-dashboard'],
    mcpServers: [],
    mcpRepos: [],
    keywords: ['seo', 'sem', 'search engine', 'google ads', 'baidu ads', 'information flow',
               'keyword', 'ranking', 'paid search', 'advertising'],
    roles: ['seo-sem', 'marketing-growth'],
    useCases: ['marketing-seo'],
  },
  {
    id: 'user-operations',
    name: 'User & Community Operations',
    description: 'User retention, community management, engagement strategies',
    skills: ['sentiment-analysis', 'user-segmentation', 'user-personas', 'cohort-analysis',
             'customer-journey-map', 'metrics-dashboard', 'grammar-check'],
    mcpServers: ['slack', 'discord'],
    mcpRepos: [],
    keywords: ['user operations', 'community', 'retention', 'engagement', 'churn',
               'lifecycle', 'push notification', 'user growth'],
    roles: ['user-ops', 'data-ops'],
    useCases: ['customer-support'],
  },
  {
    id: 'content-operations',
    name: 'Content & New Media Operations',
    description: 'Content creation for WeChat, Douyin, Weibo, Xiaohongshu',
    skills: ['wechat-article-writer', 'wechat-article-search', 'xiaohongshu-automation',
             'grok-twitter-search', 'x-tweet-fetcher', 'qiaomu-x-article-publisher',
             'trends24', 'grammar-check', 'nanobanana-image-gen', 'canvas-design',
             'yt-search-download', 'makeownsrt'],
    mcpServers: [],
    mcpRepos: ['deus-h/claudeus-wp-mcp'],
    keywords: ['content operations', 'new media', 'wechat', 'douyin', 'weibo', 'xiaohongshu',
               'tiktok', 'content calendar', 'editorial'],
    roles: ['content-ops', 'content-creator'],
    useCases: ['content-social'],
  },
  {
    id: 'data-engineering',
    name: 'Data Engineering & Warehousing',
    description: 'ETL pipelines, data warehouses, streaming, BI',
    skills: ['sql-queries', 'excel-analysis', 'bigdata-core', 'bigdata-viz',
             'metrics-dashboard', 'dummy-dataset'],
    mcpServers: ['postgres', 'supabase'],
    mcpRepos: ['crystaldba/postgres-mcp', 'Snowflake-Labs/mcp', 'SnowLeopard-AI/bigquery-mcp'],
    keywords: ['data engineering', 'etl', 'data warehouse', 'data pipeline', 'spark',
               'kafka', 'flink', 'airflow', 'dbt', 'data lake', 'snowflake', 'bigquery'],
    roles: ['data-engineer'],
    useCases: ['data-analysis'],
  },
  {
    id: 'hr-recruiting',
    name: 'HR & Recruiting',
    description: 'Talent acquisition, org design, HR analytics, interview prep',
    skills: ['interview-script', 'summarize-interview', 'excel-analysis',
             'grammar-check', 'review-resume'],
    mcpServers: [],
    mcpRepos: [],
    keywords: ['hr', 'human resources', 'recruiting', 'hiring', 'talent', 'interview',
               'onboarding', 'performance review', 'org design'],
    roles: ['hr-recruiter'],
    useCases: [],
  },
  {
    id: 'project-management',
    name: 'Project Management / PMO',
    description: 'Cross-team coordination, milestone tracking, risk management',
    skills: ['create-prd', 'sprint-plan', 'stakeholder-map', 'pre-mortem',
             'summarize-meeting', 'retro', 'brainstorming'],
    mcpServers: ['jira', 'linear', 'notion'],
    mcpRepos: ['atlassian/atlassian-mcp-server'],
    keywords: ['project management', 'pmo', 'milestone', 'gantt', 'risk management',
               'cross-team', 'coordination', 'agile', 'waterfall'],
    roles: ['project-manager'],
    useCases: ['project-management'],
  },

  // ===== Security =====
  {
    id: 'security',
    name: 'Security & Pen-testing',
    description: 'Security audits, OSINT, vulnerability assessment, supply chain security',
    skills: ['security-best-practices', 'osint-framework', 'code-review',
             'verification-before-completion'],
    mcpServers: [],
    mcpRepos: ['nicholasgriffen/snyk-mcp-server', 'AquaSecure/mcp-trivy'],
    keywords: ['security', 'penetration testing', 'pentest', 'vulnerability', 'osint',
               'cybersecurity', 'infosec', 'audit', 'owasp', 'cve', 'supply chain'],
    roles: ['devops', 'security-engineer'],
    useCases: ['security'],
  },

  // ===== Design =====
  {
    id: 'design',
    name: 'Design & Prototyping',
    description: 'UI/UX design, diagrams, visual assets, prototyping',
    skills: ['frontend-design', 'canvas-design', 'excalidraw-diagram-skill',
             'codegen-diagram', 'drawio-diagram', 'pptgen-drawio',
             'nanobanana-image-gen', 'qiaomu-mondo-poster-design',
             'stitch-design-pipeline', 'lobe-icons', 'svglogo-icons'],
    mcpServers: [],
    mcpRepos: [],
    keywords: ['design', 'ui', 'ux', 'prototype', 'mockup', 'wireframe', 'figma',
               'illustration', 'graphic', 'poster', 'diagram'],
    roles: ['designer-ux', 'visual-designer', 'frontend-developer'],
    useCases: ['design'],
  },

  // ===== Video & Media =====
  {
    id: 'video-media',
    name: 'Video & Media Production',
    description: 'Video download, subtitle, compression, multimedia processing',
    skills: ['yt-search-download', 'makeownsrt', 'downloadhd', 'video-constrict',
             'screenshot-codex', 'remotion-best-practices'],
    mcpServers: [],
    mcpRepos: [],
    keywords: ['video', 'youtube', 'media', 'subtitle', 'audio', 'podcast',
               'streaming', 'multimedia'],
    roles: ['content-creator'],
    useCases: ['content-social'],
  },

  // ===== E-commerce =====
  {
    id: 'ecommerce',
    name: 'E-commerce & Retail',
    description: 'Product catalog, pricing, inventory, customer segmentation',
    skills: ['pricing-strategy', 'user-segmentation', 'customer-journey-map',
             'ideal-customer-profile', 'competitive-analysis', 'excel-analysis',
             'agentic-seo'],
    mcpServers: ['stripe', 'shopify'],
    mcpRepos: ['stripe/agent-toolkit', 'shopify/dev-mcp-server'],
    keywords: ['ecommerce', 'e-commerce', 'retail', 'shop', 'store', 'inventory',
               'product', 'checkout', 'payment', 'shopify', 'taobao', 'amazon'],
    roles: ['ecommerce-ops'],
    useCases: ['ecommerce'],
  },

  // ===== IoT & Embedded =====
  {
    id: 'iot-embedded',
    name: 'IoT & Embedded Systems',
    description: 'Raspberry Pi, device automation, firmware, sensor data, smart home',
    skills: ['rpi-implement', 'rpi-plan', 'rpi-research',
             'desktop-computer-automation'],
    mcpServers: [],
    mcpRepos: ['nicholasgriffen/homeassistant-mcp'],
    keywords: ['iot', 'embedded', 'raspberry pi', 'arduino', 'sensor', 'firmware',
               'edge computing', 'hardware', 'home assistant', 'smart home'],
    roles: ['embedded-developer', 'mobile-developer'],
    useCases: ['iot-embedded'],
  },

  // ===== Healthcare (from research: FreedomIntelligence Medical Skills) =====
  {
    id: 'healthcare',
    name: 'Healthcare & Medical',
    description: 'Clinical reports, medical knowledge, fitness analytics, FHIR APIs',
    skills: ['deep-research', 'excel-analysis', 'grammar-check', 'compliance-docs',
             'privacy-policy'],
    mcpServers: [],
    mcpRepos: [],
    keywords: ['healthcare', 'medical', 'clinical', 'patient', 'fhir', 'ehr',
               'diagnosis', 'pharmaceutical', 'health', 'fitness', 'nutrition'],
    roles: [],
    useCases: [],
  },

  // ===== Crypto & DeFi (from research: BankrBot ecosystem) =====
  {
    id: 'crypto-defi',
    name: 'Crypto & DeFi',
    description: 'Token trading, DeFi protocols, smart contracts, on-chain analytics',
    skills: ['deep-research', 'web-multi-search', 'excel-analysis', 'metrics-dashboard'],
    mcpServers: [],
    mcpRepos: [],
    keywords: ['crypto', 'defi', 'blockchain', 'ethereum', 'solana', 'web3',
               'smart contract', 'nft', 'token', 'trading', 'dex'],
    roles: [],
    useCases: [],
  },

  // ===== Audio & Speech (from research: 45+ skills) =====
  {
    id: 'audio-speech',
    name: 'Audio & Speech Processing',
    description: 'Transcription, TTS, voice calls, podcast production, diarization',
    skills: ['makeownsrt', 'yt-search-download', 'downloadhd'],
    mcpServers: [],
    mcpRepos: ['elevenlabs/elevenlabs-mcp'],
    keywords: ['audio', 'speech', 'transcription', 'tts', 'voice', 'whisper',
               'podcast', 'stt', 'diarization', 'elevenlabs'],
    roles: ['content-creator'],
    useCases: ['content-social'],
  },

  // ===== PDF & Documents (from research: 111+ skills) =====
  {
    id: 'pdf-documents',
    name: 'PDF & Document Processing',
    description: 'PDF parsing, OCR, document generation, form extraction',
    skills: ['pdf-processing', 'pdf-layout-analysis', 'excel-analysis',
             'codegen-doc', 'anything-to-notebooklm'],
    mcpServers: [],
    mcpRepos: ['alejandroBallesterosC/document-edit-mcp'],
    keywords: ['pdf', 'document', 'ocr', 'form', 'extraction', 'parsing',
               'report generation', 'invoice', 'receipt'],
    roles: ['data-analyst', 'finance-accounting', 'compliance'],
    useCases: ['research', 'data-analysis'],
  },

  // ===== Agent Orchestration (from research: mission-control, ClawWork) =====
  {
    id: 'agent-orchestration',
    name: 'Multi-Agent Orchestration',
    description: 'Agent-to-agent coordination, task delegation, parallel execution',
    skills: ['dispatching-parallel-agents', 'planning-with-files', 'subagent-driven-development',
             'skill-group-loop', 'enterprise-agent-ops'],
    mcpServers: [],
    mcpRepos: [],
    keywords: ['multi-agent', 'orchestration', 'delegation', 'coordination',
               'parallel', 'swarm', 'crew', 'agent team'],
    roles: ['cto-tech-lead', 'devops'],
    useCases: ['automation'],
  },
];

// --- Routing helpers ---

/** Find all categories that match a role ID */
export function categoriesForRole(roleId: string): CapabilityCategory[] {
  return CAPABILITY_REGISTRY.filter(c => c.roles.includes(roleId));
}

/** Find all categories that match a use-case ID */
export function categoriesForUseCase(ucId: string): CapabilityCategory[] {
  return CAPABILITY_REGISTRY.filter(c => c.useCases.includes(ucId));
}

/** Fuzzy match a free-text description against category keywords */
export function categoriesForText(text: string): CapabilityCategory[] {
  const lower = text.toLowerCase();
  return CAPABILITY_REGISTRY
    .map(c => ({
      category: c,
      score: c.keywords.filter(kw => lower.includes(kw)).length,
    }))
    .filter(r => r.score > 0)
    .sort((a, b) => b.score - a.score)
    .map(r => r.category);
}

/** Collect all unique skills from matched categories */
export function collectSkills(categories: CapabilityCategory[]): string[] {
  const set = new Set<string>();
  for (const c of categories) for (const s of c.skills) set.add(s);
  return [...set];
}

/** Collect all unique MCP servers from matched categories */
export function collectMcpServers(categories: CapabilityCategory[]): string[] {
  const set = new Set<string>();
  for (const c of categories) for (const m of c.mcpServers) set.add(m);
  return [...set];
}

// ----- Dimensional Modifiers (industry × level × teamSize) -----

/** Industry vertical → additional category IDs to inject */
const INDUSTRY_MODIFIERS: Record<string, string[]> = {
  fintech:    ['finance', 'compliance-legal', 'security'],
  ecommerce:  ['ecommerce', 'data-analytics', 'seo-sem'],
  gaming:     ['core-dev', 'testing-qa', 'automation'],
  saas:       ['devops', 'testing-qa', 'data-analytics'],
  education:  ['education', 'content-creation'],
  healthcare: ['healthcare', 'compliance-legal', 'security', 'data-analytics'],
  media:      ['content-creation', 'social-media', 'video-media'],
  iot:        ['iot-embedded', 'devops', 'security'],
  'ai-native': ['ml-ai', 'data-engineering', 'research'],
  general:    [],
};

/** Experience level → additional skills (cross-domain universal) */
const LEVEL_SKILL_MODIFIERS: Record<string, string[]> = {
  junior:    ['grammar-check', 'search-first', 'continuous-learning-v2'],
  mid:       ['code-review', 'test-driven-development'],
  senior:    ['code-review', 'planning-with-files', 'security-best-practices', 'dispatching-parallel-agents'],
  lead:      ['planning-with-files', 'dispatching-parallel-agents', 'sprint-plan', 'stakeholder-map'],
  executive: ['planning-with-files', 'product-strategy', 'stakeholder-map', 'metrics-dashboard'],
};

/** Experience level → additional category IDs */
const LEVEL_CATEGORY_MODIFIERS: Record<string, string[]> = {
  junior:    [],
  mid:       [],
  senior:    ['testing-qa'],
  lead:      ['project-management', 'product-management'],
  executive: ['project-management', 'product-management', 'data-analytics'],
};

/** Team size → additional skills (collaboration & workflow) */
const TEAM_SIZE_SKILL_MODIFIERS: Record<string, string[]> = {
  solo:   ['full-output-enforcement', 'deep-research', 'automation'],
  small:  ['git-commit', 'github-pr-creation', 'sprint-plan'],
  medium: ['git-commit', 'github-pr-creation', 'github-pr-review', 'sprint-plan', 'release-notes'],
  large:  ['git-commit', 'github-pr-creation', 'github-pr-review', 'sprint-plan', 'release-notes', 'compliance-docs'],
};

/** Team size → additional category IDs */
const TEAM_SIZE_CATEGORY_MODIFIERS: Record<string, string[]> = {
  solo:   ['automation'],
  small:  [],
  medium: ['project-management'],
  large:  ['project-management', 'compliance-legal'],
};

// ----- Deliverable Modifiers (output artifact → skills + categories) -----

/** Deliverable type → specific skills that produce or process this artifact */
const DELIVERABLE_SKILL_MAP: Record<string, string[]> = {
  pdf:       ['pdf-processing', 'pdf-layout-analysis', 'codegen-doc'],
  ppt:       ['pptgen-drawio', 'excalidraw-diagram-skill', 'codegen-diagram'],
  word:      ['codegen-doc', 'grammar-check', 'md-report-summary', 'paper-write'],
  excel:     ['excel-analysis', 'sql-queries', 'dummy-dataset', 'metrics-dashboard'],
  text:      ['grammar-check', 'md-report-summary', 'baoyu-translate', 'paper-write', 'research-paper-writing'],
  image:     ['nanobanana-image-gen', 'canvas-design', 'lobe-icons', 'svglogo-icons'],
  video:     ['yt-search-download', 'video-constrict', 'remotion-best-practices', 'downloadhd', 'makeownsrt'],
  poster:    ['qiaomu-mondo-poster-design', 'canvas-design', 'nanobanana-image-gen'],
  diagram:   ['excalidraw-diagram-skill', 'drawio-diagram', 'codegen-diagram', 'pptgen-drawio'],
  prototype: ['stitch-design-pipeline', 'frontend-design', 'design-taste-frontend'],
  report:    ['md-report-summary', 'codegen-doc', 'excel-analysis', 'metrics-dashboard', 'deep-research'],
  code:      ['code-review', 'test-driven-development', 'git-commit', 'verification-before-completion'],
  article:   ['wechat-article-writer', 'grammar-check', 'research-paper-writing', 'baoyu-translate', 'bestblogs-daily-digest'],
};

/** Deliverable type → category IDs (for MCP server + broader skill inheritance) */
const DELIVERABLE_CATEGORY_MAP: Record<string, string[]> = {
  pdf:       ['pdf-documents'],
  ppt:       ['design'],
  word:      ['content-creation'],
  excel:     ['data-analytics'],
  text:      ['content-creation', 'research'],
  image:     ['design'],
  video:     ['video-media'],
  poster:    ['design'],
  diagram:   ['design'],
  prototype: ['design', 'frontend'],
  report:    ['research', 'data-analytics', 'pdf-documents'],
  code:      ['core-dev', 'testing-qa'],
  article:   ['content-creation', 'social-media'],
};

export interface DimensionalContext {
  industry?: string;
  level?: string;
  teamSize?: string;
  deliverables?: string[];
}

/** Full routing: given role + useCases + dimensional context, return all skills + MCP servers */
export function routeCapabilities(
  role: string,
  useCases: string[],
  freeText?: string,
  dimensions?: DimensionalContext,
): { skills: string[]; mcpServers: string[]; categories: string[] } {
  const matched = new Map<string, CapabilityCategory>();

  // Phase 1: base routing (role + useCases + freeText)
  for (const c of categoriesForRole(role)) matched.set(c.id, c);
  for (const uc of useCases) for (const c of categoriesForUseCase(uc)) matched.set(c.id, c);
  if (freeText) for (const c of categoriesForText(freeText)) matched.set(c.id, c);

  // Always include core-dev for any developer role
  if (role.includes('developer') || role.includes('engineer')) {
    const core = CAPABILITY_REGISTRY.find(c => c.id === 'core-dev');
    if (core) matched.set(core.id, core);
  }

  // Phase 2: dimensional modifiers (industry × level × teamSize)
  const extraSkills = new Set<string>();

  if (dimensions?.industry) {
    const industryCats = INDUSTRY_MODIFIERS[dimensions.industry] || [];
    for (const catId of industryCats) {
      const cat = CAPABILITY_REGISTRY.find(c => c.id === catId);
      if (cat) matched.set(cat.id, cat);
    }
  }

  if (dimensions?.level) {
    // Inject level-specific skills
    const levelSkills = LEVEL_SKILL_MODIFIERS[dimensions.level] || [];
    for (const s of levelSkills) extraSkills.add(s);
    // Inject level-specific categories
    const levelCats = LEVEL_CATEGORY_MODIFIERS[dimensions.level] || [];
    for (const catId of levelCats) {
      const cat = CAPABILITY_REGISTRY.find(c => c.id === catId);
      if (cat) matched.set(cat.id, cat);
    }
  }

  if (dimensions?.teamSize) {
    // Inject team-size-specific skills
    const teamSkills = TEAM_SIZE_SKILL_MODIFIERS[dimensions.teamSize] || [];
    for (const s of teamSkills) extraSkills.add(s);
    // Inject team-size-specific categories
    const teamCats = TEAM_SIZE_CATEGORY_MODIFIERS[dimensions.teamSize] || [];
    for (const catId of teamCats) {
      const cat = CAPABILITY_REGISTRY.find(c => c.id === catId);
      if (cat) matched.set(cat.id, cat);
    }
  }

  // Phase 3: deliverable modifiers (output artifact → skills + categories)
  if (dimensions?.deliverables) {
    for (const d of dimensions.deliverables) {
      const dSkills = DELIVERABLE_SKILL_MAP[d] || [];
      for (const s of dSkills) extraSkills.add(s);
      const dCats = DELIVERABLE_CATEGORY_MAP[d] || [];
      for (const catId of dCats) {
        const cat = CAPABILITY_REGISTRY.find(c => c.id === catId);
        if (cat) matched.set(cat.id, cat);
      }
    }
  }

  const cats = [...matched.values()];
  // Deduplicate skills: merge category skills + extra skills into one Set
  const allSkills = new Set([...collectSkills(cats), ...extraSkills]);
  return {
    skills: [...allSkills],
    mcpServers: collectMcpServers(cats),
    categories: cats.map(c => c.id),
  };
}
