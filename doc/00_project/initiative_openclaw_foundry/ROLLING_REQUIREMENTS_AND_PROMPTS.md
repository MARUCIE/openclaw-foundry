# ROLLING_REQUIREMENTS_AND_PROMPTS

## Requirements Ledger
| Date | ID | Type | Requirement | Status | Notes |
| --- | --- | --- | --- | --- | --- |
| 2026-03-11 | REQ-001 | Governance | Project root must contain local governance entry files (`AGENTS.md`, `CLAUDE.md`, `CODEX.md`, `GEMINI.md`) | Completed | Added as thin project-local policy entrypoints |
| 2026-03-11 | REQ-002 | Documentation | Canonical project docs must live under `doc/00_project/initiative_openclaw_foundry/` | Completed | `docs/` retained as historical reference |
| 2026-03-11 | REQ-003 | Architecture | Current CLI/server/browser/bootstrap entrypoints must be mapped in architecture and UX docs | Completed | Derived from `src/` and `client/` |
| 2026-03-11 | REQ-004 | Precheck | History lookup and tooling health check should be attempted before major work | Completed | `aline search` 0 hits; `ai doctor` timed out |
| 2026-03-11 | REQ-005 | Contract | AI-generated blueprints must be normalized against trusted user inputs and the scanned catalog before being returned | Completed | Implemented in `src/analyzer.ts` |
| 2026-04-03 | REQ-006 | Support | LLM proxy must support OpenAI GPT models as upstreams | Completed | Implemented in `src/llm-proxy.ts` |
| 2026-04-03 | REQ-007 | UI | Admin UI must provide customer management (list, tier upgrade, deactivate) | Completed | Added `web/app/admin/customers` |
| 2026-04-03 | REQ-008 | UX | Browser wizard and pipeline manual must be interlinked | Completed | Added header links in both static files |
| 2026-04-03 | REQ-009 | Release | Canonical docs must include reproducible verification commands | Completed | Created `VERIFICATION.md` |
| 2026-04-03 | REQ-010 | Release | Acceptance criteria must be round-based (Integrity/Journeys/Perf/Compliance) | Completed | Added to `USER_EXPERIENCE_MAP.md` |
| 2026-04-23 | REQ-011 | Architecture | Foundry must remain the only product surface; SOTA capability is integrated as artifact-producing skill intelligence, not as a second runtime/UI | Approved | Canonicalized in `SYSTEM_ARCHITECTURE.md` |
| 2026-04-23 | REQ-012 | Data | Skills, ratings, taxonomy, and bundle candidates must converge on one Foundry-owned artifact contract | Approved | Follow-up implementation pending |
| 2026-05-18 | REQ-013 | Auth/UX | Public pages and ordinary Skill/MCP/API copy actions must remain open, while Job Pack install/download payloads require registration/login through email magic-link or WeChat OAuth | Completed | Implemented through public Skill copy, `web/lib/protected-downloads.ts`, Worker protected pack routes, R2 upload, and Pages payload pruning |
| 2026-05-18 | REQ-014 | Auth / Delivery | Email login must only show “sent” after real Resend delivery; missing production email config must fail closed | Completed | `/api/auth/config` exposes capability flags; `/api/auth/request` returns 503 when `RESEND_API_KEY` is absent in production |
| 2026-05-18 | REQ-015 | Auth / WeChat | WeChat login must not expose a broken jump when Enterprise WeChat OAuth is unconfigured | Completed | Login UI disables WeChat CTA unless `WECHAT_CORP_ID`, `WECHAT_AGENT_ID`, and `WECHAT_SECRET` are present |
| 2026-05-18 | REQ-016 | IA / Routing | Removed platform overview page must not be reachable from production navigation | Completed | `/explore/platforms` route implementation removed; Cloudflare Pages redirects it to `/packs` |
| 2026-05-25 | REQ-017 | Distribution | All current local role/job configuration packs must be synchronized into a standalone Git repo with local-first installers | Completed | `/Users/mauricewen/Projects/openclaw-role-packs` commit `aa55e2ff92e254ab1b7b59ecd7d454bcc976e422`; 26 packs validated and smoke-installed from remote tag `v2026.05.25.2` |
| 2026-05-25 | REQ-018 | Distribution / Production | Installing from a Git address is the safest default for shared role-pack delivery | Completed | Production `/packs` copy and pack guides use `git clone --depth 1 --branch v2026.05.25.2 https://github.com/MARUCIE/openclaw-role-packs.git`; remote tag clone smoke confirmed 26/26 packs install and no local-only catalog source |
| 2026-05-25 | REQ-019 | CI / Release | Production frontend build must not require developer-local `~/.claude/skills` | Completed | `scripts/reconcile-catalog-integrity.py --allow-missing-local-root`; empty-HOME `web` build passes |
| 2026-05-25 | REQ-020 | CI / Release | Protected role-pack payload uploads must complete within the production deploy budget | Completed | GitHub Actions deploy run `26383364471` uploaded 437/437 protected payloads to R2 and deployed Pages successfully |
| 2026-05-25 | REQ-021 | Production / Frontend | Static Pages builds must not emit missing `/api/*` console errors for catalog data that already has `/data/*.json` fallback | Completed | `web/lib/api.ts` now reads static GET data directly when `NEXT_PUBLIC_API_URL` is unset; local static export no longer contains `/api/packs` |
| 2026-05-25 | REQ-022 | Production / UX | `/packs` decision-tree entrypoints must never route to hidden `stub` packs or empty recommendation panels | Completed | First-level and second-level options derive availability from released packs; unavailable directions show `即将上线`; local checks and production Playwright smoke on `https://agent-foundry.pages.dev/packs?verify=d54abd8` passed |
| 2026-05-25 | REQ-023 | Job Pack / Strategy | The strategic-thinking prompt bundle must become a reusable global Job Pack under `/packs` `定策略`, and data first-level IA must merge `做数据` + `看数据` | Completed | Added `strategy-roundtable-advisor` enriched pack, merged data entry to `做/看数据`, and published standalone role-pack tag `v2026.05.25.2` |
| 2026-05-25 | REQ-024 | Skill / Pack Installability | Public skill catalog and all role-pack payloads must not expose workstation-only links or backup local catalogs | Completed | `scripts/audit-public-install-sources.mjs` now scans 5000 public skills, 26 settings, 22 guides, 485 pack files, and blocks public `_backup*` data directories |
| 2026-05-25 | REQ-025 | Job Pack / Product Line | Rename `prototype-designer` to `designer`; Product Manager owns prototype hypothesis and validation demo, while Designer owns design system, QA, and handoff | Completed | Foundry and `openclaw-role-packs` now expose `designer`; remote tag `v2026.05.25.3` validates and installs designer 15/15 files; no public `prototype-designer` strings remain in web/data/scripts scan |

## Prompt / Workflow Notes
| Date | Prompt Pattern | Use Case | Notes |
| --- | --- | --- | --- |
| 2026-03-11 | "先补齐 doc 基线，再进入代码" | Existing project optimization | Avoids starting code work without architecture and UX source of truth |
| 2026-03-11 | "基于仓库事实，不写空模板" | Documentation bootstrap | Keeps specs tied to actual runtime surfaces |
| 2026-04-23 | "先蜂群思考，输出架构设计文档，在PDCA执行" | Cross-repo architecture decision | Use parallel architecture review first, then write the decision into canonical PDCA docs before any runtime merge |
| 2026-05-18 | "把skill 的复制打开，只有岗位配置包需要登陆" | Auth-wall scope correction | Keep Skill/MCP/API-doc copy public; use protected Worker/R2 delivery only for Job Pack payloads |
| 2026-05-25 | "别人直接复制安装不了，配置包和本地最新同步并单独建 repo" | Role-pack distribution hardening | Create a local-first standalone pack repo; remote fetch must be opt-in |
| 2026-05-25 | "继续，从git地址安装是最安全的" | Production install-command hardening | Keep registration gate, but copy a pinned GitHub clone command instead of a Worker token URL |
| 2026-05-25 | "打开定策略，怎么没有配置包" | Pack recommendation availability hardening | Audit decision-tree targets against public released-pack availability before allowing a path to be clickable |
| 2026-05-25 | "把这个skill组合包打包，放到岗位配置包的定策略模块；做数据/看数据合并" | Strategy job-pack packaging + data IA merge | Package existing canonical strategy skills as `strategy-roundtable-advisor`; merge data entry without pretending stub data packs are released |
| 2026-05-25 | "原型设计师改为设计师，原型是产品经理的" | Product/design role boundary cutover | Do not keep a compatibility alias; rename slug, copy, manifest, guides, and Git install command to `designer` |

## Anti-Regression Q&A
| Q | A |
| --- | --- |
| 新的规范文档应该写在 `docs/` 还是 `doc/`? | 写在 `doc/`。`docs/` 现在只是历史参考目录。 |
| 项目级 PRD/架构/UX/优化计划的单一事实源在哪里? | `doc/00_project/initiative_openclaw_foundry/`。 |
| 如果 OneContext 没有历史命中怎么办? | 记录 0 命中结果，然后继续基于仓库代码与现有文档推进。 |
| 如果 `ai doctor` 卡住怎么办? | 记录超时证据，不伪造结果；在下一次实现任务中补做可复现的健康检查。 |
| 为什么 `/api/analyze` 不能直接信任模型给出的 `meta.created` 或 skill 列表? | 因为这些字段属于系统约束和 catalog 约束，必须在服务端做二次规范化，否则模型会返回错误日期或不存在的 skill。 |
| 邮箱接口返回成功但用户没收到邮件时应如何处理? | 生产环境禁止 `console_fallback` 成功；缺少 `RESEND_API_KEY` 时后端必须 503，前端不能展示“已发送”。 |
| 企业微信 OAuth 未配置时前端该怎么表现? | 不跳转到 Worker 503 页面；通过 `/api/auth/config` 禁用按钮并显示配置缺失状态。 |
| `/explore/platforms` 还能作为入口吗? | 不能。该页面已废弃，入口 CTA 指向 `/packs`，旧 URL 由 Pages `_redirects` 301 到 `/packs`。 |
| 为什么 `llm-proxy.ts` 需要 OpenAI 支持? | 因为蓝图支持 `openai` provider，但此前代理层只有 Google 和 Anthropic 的实现，导致 GPT 模型无法通过代理调用。 |
| 如何管理托管的 LLM 客户? | 访问 `/admin/customers` (Web Console) 或使用 `ocf customer` (CLI) 命令进行增删改查。 |
| 如何验证系统健康? | 参考 `VERIFICATION.md` 执行 Round 1 (自动化) 和 Round 2 (手动) 验证。 |
| 两个 skill 相关项目是否应该直接合并成一个运行时? | 不应该直接做整仓/整运行时硬合并。推荐做法是让 Foundry 保持唯一产品面，把 SOTA 收敛为 artifact-producing skill intelligence factory，再按契约接入。 |
| 登录墙的正确边界是什么? | 页面可以正常打开和浏览；Skill/MCP/API 文档复制直接开放；只有岗位配置包的安装命令、文件下载、payload 交付必须先完成邮箱或微信注册/登录。 |
| 为什么不能把包文件继续放在 `/packs/<id>/install.sh` 直链? | 直链会绕过注册态。静态 Pages 只保留 `guide.html`，payload 文件由 R2 + Worker auth/token API 提供。 |
| 为什么岗位配置包复制后不能默认从 `agent-foundry.pages.dev` 拉取? | 复制本地配置包的语义是安装当前本地快照；默认远程拉取会回到线上旧状态。独立仓库和单包 `install.sh` 必须 local-first，远程源只能显式传入。 |
| 为什么生产页安装命令优先 GitHub tag clone? | GitHub tag clone 可审计、可固定版本、无需短链 token，有利于复现；注册态仍由 `/packs` 复制动作控制，单文件下载仍走 Worker 授权。 |
| CI 生产构建能依赖 `~/.claude/skills` 吗? | 不能。`web` prebuild 必须传 `--allow-missing-local-root`，缺失本地技能根目录时 no-op，避免 GitHub runner 因 `/home/runner/.claude/skills` 不存在而阻塞生产部署。 |
| R2 protected pack 上传可以逐文件跑 `npx wrangler` 吗? | 不可以。437 个小文件逐个启动 `npx wrangler` 会耗尽 Actions job 预算；必须使用 worker lockfile 安装的本地 Wrangler binary，并通过 `R2_UPLOAD_CONCURRENCY` 做有界并发。 |
| 静态 Pages 环境中，`/packs` 是否应该先请求 `/api/packs` 再回退? | 不应该。未配置 `NEXT_PUBLIC_API_URL` 时，GET 型 catalog 数据应直接读取 `/data/*.json`，否则生产控制台会留下可避免的 404 噪音。 |
| `/packs` 问答入口可以指向 `tier: "stub"` 的配置包吗? | 不可以直接可点。公开推荐和浏览必须共用 `tier !== "stub"` 的已开放口径；没有已开放包的方向只能显示 `即将上线` 或明确空态，不能进入空推荐区。 |
| `定策略` 应该如何承载复杂战略思维 prompt? | 不要只塞一段系统提示词。应打成 Job Pack：真实 `SKILL.md` 资源、专家/advisor、toolkit、checklist、first-use demo、manifest 和 installer 一起交付，并通过 pack audit 验证。 |
| `做数据` 和 `看数据` 应该是两个一级入口吗? | 不应该。一级入口合并为 `做/看数据`，二级或包内再区分算法、大数据、指标、A/B、Dashboard；公开点击状态仍由 released-pack availability 决定。 |
| 原型能力归谁? | 产品经理。PM 负责 PRD、用户故事、RICE、原型假设和可点击验证 demo；设计师负责体验架构、视觉层级、设计 token、状态覆盖、设计 QA 和工程 handoff。 |

## References
1. `package.json`
2. `src/cli.ts`
3. `src/server.ts`
4. `src/types.ts`
5. `src/catalog.ts`
6. `src/customers.ts`
7. `src/llm-proxy.ts`
8. `src/capability-registry.ts`
9. `client/index.html`
10. `client/foundry.sh`
11. `client/foundry.ps1`
12. `client/pipeline-manual.html`
13. `docs/plans/2026-03-10-openclaw-foundry-design.md`
14. `/Users/mauricewen/Projects/sota-skill-library/pipeline.py`
15. `/Users/mauricewen/Projects/sota-skill-library/skill_recommender.py`
16. `/Users/mauricewen/Projects/sota-skill-library/jit_router.py`
17. `/Users/mauricewen/Projects/sota-skill-library/generate_bundles.py`
18. `doc/00_project/initiative_openclaw_foundry/AUTH_SURFACE_INVARIANT.md`
19. `web/lib/session.ts`
20. `web/lib/protected-downloads.ts`
21. `worker/src/routes/packs.ts`
22. `web/app/login/page.tsx`
23. `worker/src/routes/auth.ts`
24. `worker/src/lib/email.ts`
25. `web/public/_redirects`
26. `/Users/mauricewen/Projects/openclaw-role-packs`
27. `/Users/mauricewen/Projects/openclaw-role-packs/scripts/validate-packs.mjs`
28. `/Users/mauricewen/Projects/openclaw-role-packs/scripts/smoke-install.mjs`
29. `https://github.com/MARUCIE/openclaw-role-packs`
30. `scripts/reconcile-catalog-integrity.py`
31. `postmortem/PM-2026-05-25-ci-local-skill-root.md`
32. `scripts/upload-protected-packs-to-r2.mjs`
33. `postmortem/PM-2026-05-25-ci-r2-upload-timeout.md`
34. `scripts/generate-pack-guides.mjs`
35. `web/lib/api.ts`
36. `web/app/packs/page.tsx`
37. `scripts/sync-strategy-roundtable-pack.py`
38. `web/public/packs/strategy-roundtable-advisor/manifest.json`
39. `/tmp/pack-audit.json`
