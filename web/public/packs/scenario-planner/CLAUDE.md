# CLAUDE.md — 业务分析 / 场景规划岗工作区

> 本文件来自 AI 训战工作坊 W3 波次。把它放进你工作仓库根目录后，每次 Claude Code 启动都会自动加载，省去 5 倍的初始化提示词。
>
> 替换标了 `[EDIT]` 的字段；其他段落直接保留即可。

## 为什么每个岗位都要有一份 CLAUDE.md

Claude Code 会在每次 session 启动时读取 `CLAUDE.md`。等你输入第一条 prompt 之前，模型其实已经完成了三件事：

1. 加载岗位级别的工具白名单（避免每个工具调用都触发 30 秒的权限协商）
2. 读到了 `core/harness/` 验证命令路径（验证闸口是一键即用，而不是 4 步配方）
3. 把当前激活的 `semantic_skill_router` 与你的岗位关键词做了匹配（skill 不需要你点名就会被激活）

不写 CLAUDE.md → 每个 session 你都要多敲 5 倍的初始化文字，且大概率忘记开 harness。

## 模板（拷贝下面整段，编辑标了 `[EDIT]` 的部分）

---

```markdown
# CLAUDE.md — [EDIT: 项目名] / 业务分析 / 场景规划岗工作区

> 维护者：[EDIT: 你的名字]。岗位：业务分析 / 场景规划。对齐 AI 训战工作坊 W3 波次（2026-06-04）。

## 岗位身份（决定 prompt 语气）

- **主业务线**：业务分析师，覆盖 [EDIT: 行业 — 例如 业财税合规 / SaaS / 跨境电商]
- **次要产出**：客户记录、政策 1-pager、商机报告、周度摘要
- **受众**：客户经理、销售管理层、偶尔包括合规岗
- **行文风格**：先结论后展开，主张 → 证据，禁止"一段话糊弄过去的有趣观察"

## 工具白名单（业务分析专用，自动放行以下条目）

| 工具家族 | 自动放行 | 备注 |
|---------|---------|------|
| Read / Grep / Glob | 是 — `${PROJECT_DIR}` 下任意文件 | 包含 `.csv`、`.xlsx`、`.md` |
| Bash（数据处理） | 是 — `csvkit`、`jq`、`xsv`、`wc`、`head`、`tail`、`sort`、`uniq` | 非破坏性 |
| Bash（网络只读） | 是 — `curl -s`、`gh api`、`gh issue list`、`gh pr list` | GitHub 只读 |
| Bash（破坏性） | 否 — 必须确认：`rm`、`git push --force`、`git rebase`、任何写生产 | HITL 必须人工介入 |
| Web search | 是，用于政策检索与税务公告 | 标注来源 URL + 访问日期 |
| MCP — mempalace | 是 — `mcp__mempalace__search`、`mcp__mempalace__kg_query` | 跨 session 记忆 |

## Harness 验证（可选段落）

> 如未安装 AI-Fleet（`~/00-AI-Fleet`），可跳过本段；模板正常工作不依赖 harness。
> 已安装则推荐启用以下模块，每个 BA 交付物结尾都会用到其中之一。

| 能力 | 路径 | 何时使用 |
|------|------|---------|
| `verification_gate` | `${AI_FLEET}/core/harness/verification_gate.py` | 任何客户可见交付物送出之前 |
| `semantic_skill_router` | `${AI_FLEET}/core/harness/semantic_skill_router.py` | 每个 session 启动一次（`--enable`） |
| `quality_scorer` | `${AI_FLEET}/core/harness/quality_scorer.py` | 周度自评自己的产出 |
| `context_monitor` | `${AI_FLEET}/core/harness/context_monitor.py` | 模型开始反复输出同样内容时 — context 腐烂的信号 |
| `loop_detector` | `${AI_FLEET}/core/harness/loop_detector.py` | 同一个方案连续失败 2 次后自动触发 |

CLI 快捷方式（先在 shell 里设置 `AI_FLEET=~/00-AI-Fleet`）：

- **交付物送出前闸口**：`python3 ${AI_FLEET}/core/harness/verification_gate.py`
- **打开 skill 自动路由**：`python3 ${AI_FLEET}/core/harness/semantic_skill_router.py --enable`
- **打分**：`python3 ${AI_FLEET}/core/harness/quality_scorer.py --report`
- **context 检查**：`python3 ${AI_FLEET}/core/harness/context_monitor.py`
- **死循环状态**：`python3 ${AI_FLEET}/core/harness/loop_detector.py --status`

## 输出语言

- 中间过程旁白（工具调用之间）：法语
- 最终给用户/相关方的总结：中文
- 规范化 `.md` 交付物（机器可读、可被 AI 再次摄入）：英文
- `html-style-router` 渲染的人类可读 `.html` 报告：中文
- 政策原文直引：保留原语言，不在引用块内翻译
- 同一段落不允许跨语言混用

## 领域规则（业务分析专用）

1. 每条客户记录必须标注来源 channel（邮件主题、会议名、企业微信群名等），禁止 anonymized 的"他们说"
2. 每份政策 1-pager 必须附原始公告/政府公告 URL + 访问日期 YYYY-MM-DD
3. 每份商机报告必须先把 lead source 分类（inbound / outbound / referral / cold）才能开始写正文
4. 客户风险画像用三档评分（low / medium / high），且必须列出 3 个领先信号 — 仅写一个字母分级而不列信号清单视为不合格

## 禁用句式（业务分析专用）

- "AI 建议..."、"根据 AI..." 不允许出现在任何客户可见交付物 — 自己签字背书，否则不要写
- 通用空话："synergy"、"leverage"、"robust"、"best-in-class"、"value-add" — 替换为具体的事
- 没有时间锚的 claim："recently"、"in the near future" — 给出具体日期，否则不要写
- 把 AI prompt 原文复制进交付物 — 出门前清理干净

## 已激活 skill（通过 `semantic_skill_router` 预加载）

业务分析最常用的 5 个：

1. `customer-journey-map` — 入门级客户关系可视化
2. `ft-business-analyst` — 通用 BA 工作流（注册、记账基础）
3. `competitive-battlecard` — 竞争商机情报
4. `ft-regulation-lookup` — 政策 / 税务公告检索
5. `cohort-analysis` — 客户群体留存 / 流失分析

---

Maurice | maurice_wen@proton.me
```

---

## 自定义清单（保存为你的 `CLAUDE.md` 之前请逐项勾选）

- [ ] 把 `[EDIT: 项目名]` 替换为你实际的仓库名
- [ ] 把 `[EDIT: 你的名字]` 替换为你的名字
- [ ] 把 `[EDIT: 行业]` 替换为你覆盖的具体垂直领域
- [ ] 在 shell 里设置 `AI_FLEET=~/00-AI-Fleet`（或你 AI-Fleet 的实际位置）— 仅当你打算启用 harness 段
- [ ] 已安装 harness 时，运行 `python3 ${AI_FLEET}/core/harness/semantic_skill_router.py --status` 确认 skill 可见
- [ ] 已安装 harness 时，运行 `python3 ${AI_FLEET}/core/harness/verification_gate.py --dry-run` 确认 harness 接通

## 常见错误（来自 W1 + W2 复盘）

1. 直接把模板原样复制，忘了删掉 `[EDIT:]` 占位符 → Claude 拿到的项目上下文就是占位符本身，prompt 输出会困惑
2. 加了工具白名单但没设置 `AI_FLEET` 环境变量 → harness 路径报"file not found"
3. 启用过 `semantic_skill_router --enable` 一次后，每次 prompt 都重复跑 — 无害但白白浪费 ~30 秒/session
4. 把新 prompt 直接写进 CLAUDE.md（当成笔记本用），而不是写进 `prompts.md` → CLAUDE.md 撑过 5K token，每次 session 启动都拖慢

---

AI 训战工作坊 · scenario-planner pack · 业务分析 / 场景规划岗
Maurice | maurice_wen@proton.me
