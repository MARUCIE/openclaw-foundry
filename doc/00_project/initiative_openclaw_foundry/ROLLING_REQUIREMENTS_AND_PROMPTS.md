# ROLLING_REQUIREMENTS_AND_PROMPTS

## Requirements Ledger
| Date | ID | Type | Requirement | Status | Notes |
| --- | --- | --- | --- | --- | --- |
| 2026-03-11 | REQ-001 | Governance | Project root must contain local governance entry files (`AGENTS.md`, `CLAUDE.md`, `CODEX.md`, `GEMINI.md`) | Completed | Added as thin project-local policy entrypoints |
| 2026-03-11 | REQ-002 | Documentation | Canonical project docs must live under `doc/00_project/initiative_openclaw_foundry/` | Completed | `docs/` retained as historical reference |
| 2026-03-11 | REQ-003 | Architecture | Current CLI/server/browser/bootstrap entrypoints must be mapped in architecture and UX docs | Completed | Derived from `src/` and `client/` |
| 2026-03-11 | REQ-004 | Precheck | History lookup and tooling health check should be attempted before major work | Completed | `aline search` 0 hits; `ai doctor` timed out |
| 2026-03-11 | REQ-005 | Contract | AI-generated blueprints must be normalized against trusted user inputs and the scanned catalog before being returned | Completed | Implemented in `src/analyzer.ts` |
<<<<<<< Updated upstream
| 2026-05-18 | REQ-006 | Auth / UX | Skill install command copy stays public; job-pack download/copy remains gated after registration | Completed | Auth wall applies to job packs only; Skill copy must not show login wall |
| 2026-05-18 | REQ-007 | Auth / Delivery | Email login must only show “sent” after real Resend delivery; missing production email config must fail closed | Completed | `/api/auth/config` exposes capability flags; `/api/auth/request` returns 503 when `RESEND_API_KEY` is absent in production |
| 2026-05-18 | REQ-008 | Auth / WeChat | WeChat login must not expose a broken jump when Enterprise WeChat OAuth is unconfigured | Completed | Login UI disables WeChat CTA unless `WECHAT_CORP_ID`, `WECHAT_AGENT_ID`, and `WECHAT_SECRET` are present |
| 2026-05-18 | REQ-009 | IA / Routing | Removed platform overview page must not be reachable from production navigation | Completed | `/explore/platforms` route implementation removed; Cloudflare Pages redirects it to `/packs` |
=======
| 2026-04-03 | REQ-006 | Support | LLM proxy must support OpenAI GPT models as upstreams | Completed | Implemented in `src/llm-proxy.ts` |
| 2026-04-03 | REQ-007 | UI | Admin UI must provide customer management (list, tier upgrade, deactivate) | Completed | Added `web/app/admin/customers` |
| 2026-04-03 | REQ-008 | UX | Browser wizard and pipeline manual must be interlinked | Completed | Added header links in both static files |
| 2026-04-03 | REQ-009 | Release | Canonical docs must include reproducible verification commands | Completed | Created `VERIFICATION.md` |
| 2026-04-03 | REQ-010 | Release | Acceptance criteria must be round-based (Integrity/Journeys/Perf/Compliance) | Completed | Added to `USER_EXPERIENCE_MAP.md` |
| 2026-04-23 | REQ-011 | Architecture | Foundry must remain the only product surface; SOTA capability is integrated as artifact-producing skill intelligence, not as a second runtime/UI | Approved | Canonicalized in `SYSTEM_ARCHITECTURE.md` |
| 2026-04-23 | REQ-012 | Data | Skills, ratings, taxonomy, and bundle candidates must converge on one Foundry-owned artifact contract | Approved | Follow-up implementation pending |
| 2026-05-18 | REQ-013 | Auth/UX | Public pages and ordinary Skill/MCP/API copy actions must remain open, while Job Pack install/download payloads require registration/login through email magic-link or WeChat OAuth | Completed | Implemented through public Skill copy, `web/lib/protected-downloads.ts`, Worker protected pack routes, R2 upload, and Pages payload pruning |
>>>>>>> Stashed changes

## Prompt / Workflow Notes
| Date | Prompt Pattern | Use Case | Notes |
| --- | --- | --- | --- |
| 2026-03-11 | "先补齐 doc 基线，再进入代码" | Existing project optimization | Avoids starting code work without architecture and UX source of truth |
| 2026-03-11 | "基于仓库事实，不写空模板" | Documentation bootstrap | Keeps specs tied to actual runtime surfaces |
| 2026-04-23 | "先蜂群思考，输出架构设计文档，在PDCA执行" | Cross-repo architecture decision | Use parallel architecture review first, then write the decision into canonical PDCA docs before any runtime merge |
| 2026-05-18 | "把skill 的复制打开，只有岗位配置包需要登陆" | Auth-wall scope correction | Keep Skill/MCP/API-doc copy public; use protected Worker/R2 delivery only for Job Pack payloads |

## Anti-Regression Q&A
| Q | A |
| --- | --- |
| 新的规范文档应该写在 `docs/` 还是 `doc/`? | 写在 `doc/`。`docs/` 现在只是历史参考目录。 |
| 项目级 PRD/架构/UX/优化计划的单一事实源在哪里? | `doc/00_project/initiative_openclaw_foundry/`。 |
| 如果 OneContext 没有历史命中怎么办? | 记录 0 命中结果，然后继续基于仓库代码与现有文档推进。 |
| 如果 `ai doctor` 卡住怎么办? | 记录超时证据，不伪造结果；在下一次实现任务中补做可复现的健康检查。 |
| 为什么 `/api/analyze` 不能直接信任模型给出的 `meta.created` 或 skill 列表? | 因为这些字段属于系统约束和 catalog 约束，必须在服务端做二次规范化，否则模型会返回错误日期或不存在的 skill。 |
<<<<<<< Updated upstream
| 邮箱接口返回成功但用户没收到邮件时应如何处理? | 生产环境禁止 `console_fallback` 成功；缺少 `RESEND_API_KEY` 时后端必须 503，前端不能展示“已发送”。 |
| 企业微信 OAuth 未配置时前端该怎么表现? | 不跳转到 Worker 503 页面；通过 `/api/auth/config` 禁用按钮并显示配置缺失状态。 |
| `/explore/platforms` 还能作为入口吗? | 不能。该页面已废弃，入口 CTA 指向 `/packs`，旧 URL 由 Pages `_redirects` 301 到 `/packs`。 |
=======
| 为什么 `llm-proxy.ts` 需要 OpenAI 支持? | 因为蓝图支持 `openai` provider，但此前代理层只有 Google 和 Anthropic 的实现，导致 GPT 模型无法通过代理调用。 |
| 如何管理托管的 LLM 客户? | 访问 `/admin/customers` (Web Console) 或使用 `ocf customer` (CLI) 命令进行增删改查。 |
| 如何验证系统健康? | 参考 `VERIFICATION.md` 执行 Round 1 (自动化) 和 Round 2 (手动) 验证。 |
| 两个 skill 相关项目是否应该直接合并成一个运行时? | 不应该直接做整仓/整运行时硬合并。推荐做法是让 Foundry 保持唯一产品面，把 SOTA 收敛为 artifact-producing skill intelligence factory，再按契约接入。 |
| 登录墙的正确边界是什么? | 页面可以正常打开和浏览；Skill/MCP/API 文档复制直接开放；只有岗位配置包的安装命令、文件下载、payload 交付必须先完成邮箱或微信注册/登录。 |
| 为什么不能把包文件继续放在 `/packs/<id>/install.sh` 直链? | 直链会绕过注册态。静态 Pages 只保留 `guide.html`，payload 文件由 R2 + Worker auth/token API 提供。 |
>>>>>>> Stashed changes

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
<<<<<<< Updated upstream
14. `web/app/login/page.tsx`
15. `worker/src/routes/auth.ts`
16. `worker/src/lib/email.ts`
17. `web/public/_redirects`
=======
14. `/Users/mauricewen/Projects/sota-skill-library/pipeline.py`
15. `/Users/mauricewen/Projects/sota-skill-library/skill_recommender.py`
16. `/Users/mauricewen/Projects/sota-skill-library/jit_router.py`
17. `/Users/mauricewen/Projects/sota-skill-library/generate_bundles.py`
18. `doc/00_project/initiative_openclaw_foundry/AUTH_SURFACE_INVARIANT.md`
19. `web/lib/session.ts`
20. `web/lib/protected-downloads.ts`
21. `worker/src/routes/packs.ts`
>>>>>>> Stashed changes
