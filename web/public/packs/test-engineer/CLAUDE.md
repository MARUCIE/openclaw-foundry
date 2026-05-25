# Tool-Kit 01 · CLAUDE.md 模板 · W4 测试 / QA 工程师

> 把以下内容粘贴到你测试仓库根目录的 `CLAUDE.md`。重命名项目块、改写岗位专属的工具白名单。然后用 Claude Code 打开仓库，AI 协作器会自动切换到 QA 模式。

## 为什么每个岗位都需要一份 CLAUDE.md

Claude Code 每次会话启动时都会读 `CLAUDE.md`。你敲下第一行 prompt 时，模型已经完成：

1. 加载岗位专属的工具白名单（每次 tool 调用免去 30 秒的权限协商）
2. 读取你 `core/harness/` 的验证命令（验证 gate 一键直达，不是 4 步配方）
3. 把 `semantic_skill_router` 匹配到你的岗位关键词（你不用点名就能激活 skill）

跳过 CLAUDE.md → cohort 每次会话多敲 5 倍的初始化文本，还常常忘了启用 harness。

## 模板（复制下方分隔线下的内容，编辑标 `[EDIT]` 的块）

---

```markdown
# CLAUDE.md — [EDIT: 项目名] / 测试与 QA 工作区

> 维护者 [EDIT: 你的名字]。岗位：测试 / QA 工程师。对照 AI-Fleet workshop W4（2026-06-11）校准。

## 岗位身份（驱动 prompt 语气）

- **主线**：[EDIT: 平台领域 — 例：业财税合规税规引擎 / 发票接入 / 凭证生成 / 审计链路服务] 的测试 / QA 工程师
- **次要产出**：测试计划、单元测试套件、回归矩阵、缺陷报告、QA 周报
- **受众**：研发 team lead、产品经理、偶尔合规审计员
- **声音**：缺陷优先、复现优先、claim → 证据；绝不做一段话 "看着没问题" 的签发

## 测试金字塔预期（驱动 prompt 范围）

- **Unit（60-70%）**：AI 在你改动的文件上生成测试用例；用 `tool-kit-02` §1.x 系列 prompt
- **Integration（20-25%）**：跨模块流；用 `tool-kit-02` §2.x 系列 prompt
- **End-to-end（10-15%）**：只覆盖关键路径 — 完整用户旅程、审计链路流、税规边界用例；用 `tool-kit-02` §3.x 系列 prompt
- **合规 / 审计链路（横切）**：每次发布都适用；不允许变成 "之后再做" 的独立轨道

## 工具白名单（QA 专用；以下自动放行）

| 工具族 | 免提示放行 | 备注 |
|--------|-----------|------|
| Read / Grep / Glob | yes — 读 `${PROJECT_DIR}` 下任何文件 | 包含 `.csv`、`.json`、`.sql`、`.md`、测试 fixture |
| Bash（测试执行） | yes — `pytest`、`jest`、`vitest`、`go test`、`cargo test`、`mvn test`、`npm test` | 非破坏性地读测试结果 |
| Bash（coverage） | yes — `coverage`、`nyc`、`c8`、`pytest-cov`、`jacoco` | 只读报告 |
| Bash（lint / static） | yes — `eslint`、`ruff`、`flake8`、`mypy`、`tsc --noEmit`、`cargo clippy` | 非破坏性 |
| Bash（网络只读） | yes — `curl -s`、`gh api`、`gh issue list`、`gh pr list`、`gh run list` | 只读 GitHub Actions |
| Bash（破坏性） | NO — 总是要求确认：`rm`、`git push --force`、`git rebase`、任何写生产 fixture 或 DB schema 的命令 | 需要 HITL |
| Bash（生产数据） | NO — 永不读生产 DB 备份、含 PII 的生产日志、生产发票导出 | 仅合成数据 |
| Web search | yes，用于税收通函 + 合规法规检索 | 标注源 URL + 访问日期 |
| MCP — mempalace | yes — `mcp__mempalace__search`、`mcp__mempalace__kg_query` | 跨会话记忆 |
| MCP — github | yes — 读 PR diff、评论、CI 状态、运行日志 | 只读 |

## 合规测试数据规则（不可妥协）

- **仅合成数据**：`tests/fixtures/` 下每一份 fixture 必须是合成的。不允许真实发票号、真实纳税人识别号、真实银行账号
- **PII 检测**：commit 前跑 `grep -rE '[3-9]\d{16}\b|91[0-9]{16}\b' tests/` — 任何命中都是 P0 泄露
- **数据生命周期**：合成 fixture 每季度轮换；旧 fixture 归档到 `tests/fixtures/_archive/<YYYY-Q>/`（保留 6 个月后再删除）
- **审计日志**：每个对凭证 / 账务记录 ID 做断言的测试，同时必须断言源单据回溯（发票 ID、合同 ID 等）— 1:1 链路

## Harness 验证（`core/harness/` — 每份 QA 报告以其中一条收尾）

| 能力 | 路径 | 何时跑 |
|------|------|--------|
| `verification_gate` | `${AI_FLEET}/core/harness/verification_gate.py` | 合并任何含测试改动的 PR 之前；release candidate 签发前 |
| `semantic_skill_router` | `${AI_FLEET}/core/harness/semantic_skill_router.py` | 每次会话启动一次（`--enable`） |
| `quality_scorer` | `${AI_FLEET}/core/harness/quality_scorer.py` | 每周自评自己的测试套件（lint / tests / docs / hygiene / structural） |
| `structural_test` | `${AI_FLEET}/core/harness/structural_test.py` | 重构搬移模块时 — 校验依赖层约束 |
| `context_monitor` | `${AI_FLEET}/core/harness/context_monitor.py` | 模型开始重复时 — 上下文腐败的信号 |
| `loop_detector` | `${AI_FLEET}/core/harness/loop_detector.py` | 同一思路重试 2 次失败后自动触发 |
| `trace_collector` | `${AI_FLEET}/core/harness/trace_collector.py` | 调查 flaky test 时 — 捕获完整执行 trace |

CLI 快捷方式（在 shell 里 `AI_FLEET=~/00-AI-Fleet`）：

- **合并前 gate**：`python3 ${AI_FLEET}/core/harness/verification_gate.py`
- **Skill 自动路由开启**：`python3 ${AI_FLEET}/core/harness/semantic_skill_router.py --enable`
- **质量评级**：`python3 ${AI_FLEET}/core/harness/quality_scorer.py --report`
- **结构层检查**：`python3 ${AI_FLEET}/core/harness/structural_test.py`
- **上下文检查**：`python3 ${AI_FLEET}/core/harness/context_monitor.py`
- **Loop 状态**：`python3 ${AI_FLEET}/core/harness/loop_detector.py --status`

## 输出语言

- 过程叙述（tool 调用之间）：法语
- 给用户 / 干系人的最终总结：中文
- 规范 `.md` 交付物（测试计划、缺陷报告、审计链路规范）：英文
- 通过 `html-style-router` 出的人面向 `.html` 报告：中文
- 政策原文的直接引用：保留原始语言，不在引用块内翻译
- 同一段落内不混用语言
- 测试代码（`*.py`、`*.ts`、`*.go`）：标识符用英文；注释解释 "为什么"，不复述 "做什么"

## 领域规则（QA 专用）

1. 每份缺陷报告必须含第二位工程师验证的复现步骤 — 单人 "我这边能跑" 的报告默认 P3，直到被第二人复现
2. 每个税规测试用例必须覆盖至少 3 个分支：边界值 + 免税情形 + 特殊条款（仅有 happy path 视为不充分被拒）
3. 每条审计链路断言必须从凭证 / 账务记录回溯到源单据（发票、合同等）— 1:1 链路，字段名明确
4. 回归套件选择必须引用变更影响分析的产出（PR diff → 受影响模块 → 覆盖测试）—— 小套件 "全跑一遍" 允许但要明示
5. Flaky test 首次出现即隔离，不是第三次 — 用 `@pytest.mark.flaky` / `it.skip.flaky` 标记，48 小时内分流到根因调查

## 禁止模式（QA 专用）

- 任何测试 commit message 含 "AI 建议加这个测试..." — 测试要么你来负责，要么不 commit
- 通用测试名如 `test_function`、`test_case_1`、`test_works` — 换成断言（"test_invoice_total_excludes_exempt_lines"）
- 无量化的话术 "应该稳定" 或 "风险较低" — 给数字，否则不要 claim（"200 次跑 0 失败" 胜过 "稳定"）
- 测试文件里残留的 AI prompt 原文 — commit 前清理
- Fixture 里写死的生产形态 ID（真实纳税人识别号、真实银行账号）— 仅合成

## QA 工程师必须警告的 3 个真实反模式（不只是关键词，是真实失败）

1. **Anti-pattern · Mock 真实集成边界 / Do not mock the real integration boundary** —
   把 KSF 发票接口、Stripe webhook、第三方银行 API 替换成 mock，单测 100% 绿但生产首次握手就崩。
   严禁在 `tests/integration/` 下用 mock 替代真实下游；mock 只能用于 `tests/unit/` 的边界外部件。
   失败示例（2026-Q1）：业财对账模块所有 unit + integration mocked，上线第一笔真实发票就遇到对方 API 把
   `amount` 序列化为字符串而非数字，本地测试全 PASS 现网立即 5xx — 因为我们从未真正打过那个接口。

2. **Anti-pattern · 把 flaky test 直接 skip 永久关闭 / Never permanently skip flaky tests** —
   `@pytest.mark.skip(reason="flaky")` 是承认失败而不是修复；这种 skip 会在 sprint 末累积成数十条
   "已知未修" 债务，到法务/审计追溯时无法证明该路径曾被验证过。正确处理：先 `xfail(strict=False)` 标
   记并开 ticket，30 天内必须给出根因或删除测试。避免用 skip 当作"先过了 CI 再说"的逃生口。

3. **Anti-pattern · 在 production-like fixture 里放真实 PII / Forbidden: real PII in fixtures** —
   即使是"内部测试库"也不能存真实身份证号、真实纳税人识别号、真实银行账号。一旦泄露 = 个保法事件。
   合规红线：`tests/fixtures/**` 的所有数据必须用 Faker 生成或确认性合成（如纳税人识别号校验位需符合
   GB 32100 规则但前 14 位是 9 开头的合成段）。这条规则不允许例外，连 "我自己的测试账号" 也不行。

每条都是上一季度（W1-W3 wave）真实复盘里出现过的失败，不是理论。



完整的策展列表参考 `tool-kit-04-skill-package.md`。QA 工作里最常用的 5 个：

1. `test-scenarios` — 从用户故事生成测试场景，含目标、前置条件、步骤、预期结果
2. `test-driven-development` — TDD 红绿重构纪律，写新测试用
3. `qa-lead` — 多角色 QA review 视角（测试计划、回归、自动化、探索）
4. `systematic-debugging` — 根因优先的调试方法
5. `ft-compliance-auditor` — 业财税合规审计链路校验

## Workshop 技术债

- W1（产品经理）wave-digest：定制 prompt 语言前读一遍；PM 的声音 ≠ QA 的声音
- W2（产品研发）wave-digest：写任何 code-review prompt 前读 — 研发声音是 QA 声音的上游
- W3（业务分析）wave-digest：圈定集成测试边界前读 — BA 定义业务层期望
- W4（本 wave）：你在这
- W5 wave-digest：2026-06-19 后会有 — 出任何跨 wave 报告前读

---

Agent Foundry Team
```

---

## 定制 checklist（把上面存为 `CLAUDE.md` 前的检查）

- [ ] 把 `[EDIT: 项目名]` 替换为你实际的测试仓库名
- [ ] 把 `[EDIT: 你的名字]` 替换为你的名字
- [ ] 把 `[EDIT: 平台领域]` 替换为你负责的子系统（税规引擎 / 发票接入 等）
- [ ] 在 shell 里 `AI_FLEET=~/00-AI-Fleet`（或 AI-Fleet 实际 checkout 路径）
- [ ] 跑 `python3 ${AI_FLEET}/core/harness/semantic_skill_router.py --status` 确认 skill 可见
- [ ] 跑 `python3 ${AI_FLEET}/core/harness/verification_gate.py --dry-run` 确认 harness 已接通
- [ ] 确认 `tests/fixtures/` 目录存在且只含合成数据

## 常见错误（W1 + W2 + W3 复盘里观察到的债，预期同样会在 W4 复现）

1. cohort 一字不动复制模板，忘了删 `[EDIT:]` 占位符 → Claude 对项目上下文产生混淆
2. cohort 加了工具白名单但没设 `AI_FLEET` 环境变量 → harness 路径报 "file not found"
3. cohort "就这一个测试" 用了生产数据 → 触碰 PII 红线，清理后重跑
4. cohort 把新 prompt 直接写进 CLAUDE.md（当笔记本用）而不是 `tool-kit-02-prompt-templates.md` → CLAUDE.md 膨胀过 5K token，每次会话启动都被拖慢

---

Agent Foundry Team
