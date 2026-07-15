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
| 2026-05-25 | REQ-022 | Production / UX | `/packs` decision-tree entrypoints must never route to hidden `stub` packs or empty recommendation panels | Completed | Recommendation groups render concrete cards; pending packs show `即将上线` and disabled install/download actions; local checks and production Playwright smoke on `https://agent-foundry.pages.dev/packs?verify=d54abd8` passed |
| 2026-05-25 | REQ-023 | Job Pack / Strategy | The strategic-thinking prompt bundle must become a reusable global Job Pack under `/packs` `定策略`, and data first-level IA must merge `做数据` + `看数据` | Completed | Added `strategy-roundtable-advisor` enriched pack, merged data entry to `做/看数据`, and published standalone role-pack tag `v2026.05.25.2` |
| 2026-05-25 | REQ-028 | Job Pack / Identity Neutrality | All released role/job configuration packs must avoid concrete person names in advisor IDs, names, guides, catalogs, installers, and installed output | Completed | Added pack person-name sanitizer, neutralized advisor identities, switched installers local-first, and prepared standalone release tag `v2026.05.25.5` |
| 2026-05-25 | REQ-024 | Skill / Pack Installability | Public skill catalog and all role-pack payloads must not expose workstation-only links or backup local catalogs | Completed | `scripts/audit-public-install-sources.mjs` now scans 5000 public skills, 26 settings, 22 guides, 485 pack files, and blocks public `_backup*` data directories |
| 2026-05-25 | REQ-025 | Job Pack / Product Line | Rename `prototype-designer` to `designer`; Product Manager owns prototype hypothesis and validation demo, while Designer owns design system, QA, and handoff | Completed | Foundry and `openclaw-role-packs` now expose `designer`; remote tag `v2026.05.25.3` validates and installs designer 15/15 files; no public `prototype-designer` strings remain in web/data/scripts scan |
| 2026-05-26 | REQ-029 | Job Pack / Taxonomy | `/packs` second-level choices must be scientific, compact task-domain groups, not a flat card for every public catalog pack; all canonical public packs must remain covered | Completed | `QUESTION_TREE` now uses `packIds` groups; audit parses group assignments and fails on missing catalog IDs or missing UI coverage |
| 2026-05-26 | REQ-030 | Job Pack / Online State | All non-deprecated public role/job packs must be live/installable when generated artifacts exist; `tier: "stub"` is a Basic maturity badge, not an offline state | Completed | Added online-status audit, generated guide pages, and split release logic from PACK_SPEC tier |
| 2026-05-26 | REQ-031 | Job Pack / Dedup | Public `/packs` must show only the richest canonical role pack when a deprecated alias points at the same job | Completed | Public catalog now has 22 canonical packs; 4 `deprecated_alias_of` spellbook aliases are suppressed from cards/counts/question-tree IDs by `generate-packs.mjs` and `audit-pack-public-dedup.mjs`; production deploy run `26435492679` verified commit `5e68a4a6b881b3fd048cd2c50c982129f4e3fcf3` |
| 2026-05-26 | REQ-032 | Job Pack / Git Installability | Public role/job packs and their bundled skills must be installable from the pinned standalone Git release, with no drift from Foundry's enriched manifests | Completed | Published `openclaw-role-packs` tag `v2026.05.26.1`; fresh GitHub clone validates 26 packs and smoke-installs 26/26, while Foundry vs standalone manifest counts match for all 22 public packs |
| 2026-05-26 | REQ-033 | Job Pack / Maturity Floor | All canonical public job packs must be at least `enriched`; no public card or public catalog entry may remain `stub` / `基础档` | Completed | Added `enrich-public-pack-maturity.mjs` before tier injection and `audit-public-pack-maturity.mjs` as prebuild gate; public catalog audits as 22 packs, 22 enriched, 0 certified, 0 stub; certified promotion now requires tracked evidence |
| 2026-05-26 | REQ-034 | CI / Runtime Lifecycle | Production and catalog-health workflows must stop depending on Node 20 action runtimes before GitHub's 2026-06-02 Node 24 runner default switch | Completed | Upgraded workflow actions to Node 24-compatible majors, pinned Cloudflare Wrangler to `4.76.0`, and validated deploy run `26443292530` plus production `/packs` smoke at commit `9a081d9366df33f57b714c7872adc16d89409051` |
| 2026-05-26 | REQ-035 | Job Pack / Release Automation | Role-pack Git release checks and local zip bundle creation must be reproducible through npm scripts, with drift detection, checksums, manifest summaries, and archive install smoke tests | Completed | Added `role-packs:audit-git`, `role-packs:package`, and `role-packs:package:all`; scripts verified pinned tag `v2026.05.26.1`, generated 22 public zips plus all-in-one public zip, and generated 26 all-pack zips plus all-in-one all-pack zip |
| 2026-05-27 | REQ-036 | Job Pack / Guide Manual Completeness | Every job-pack guide must show each bundled skill as a complete three-part card: `是什么` / `怎么用` / `架构图`; no unfinished placeholder text or stub guide card is allowed | Completed | Updated guide generator to normalize legacy/imported skill docs, added `role-packs:audit-guides`, published standalone tag `v2026.05.27.2`, and verified Foundry vs Git release parity |
| 2026-05-27 | REQ-037 | Job Pack / Source Contract + Release SSOT | Guide completeness must be proven from source Markdown skill docs, and role-pack Git ref/version must have a single JSON source across Foundry UI, guide generation, Git audit, and standalone validation | Completed | Added `role-pack-release.json`, `role-packs:enrich-source-skills`, strict source guide audit, path-level person-name audit, standalone release self-validation, and tag `v2026.05.27.3` |
| 2026-05-31 | REQ-038 | Auth / Payload Hardening | Public pack detail APIs must expose metadata only, auth return paths must be safe local-relative, and generated Worker install scripts must never embed browser bearer sessions | Completed locally | Attacker review accepted these as release-blocking fixes; verified by `tests/auth-boundary.test.ts`, `scripts/audit-auth-surfaces.sh`, builds, worker typecheck, and `ai check`; GitHub tag install and open email registration remain documented product contracts unless a new business requirement changes them |
| 2026-05-31 | REQ-039 | Release / Postmortem | Historical postmortem triggers must be executable release gates, not passive documentation | Completed locally | Added `scripts/scan-postmortems.mjs --strict`, root `postmortem:scan`, root build gate, and `web` prebuild gate; current auth PM and local-skill-root PM are acknowledged in this diff |
| 2026-06-11 | REQ-040 | Job Pack / Designer Infrastructure | Integrate `https://www.ui-skills.com/` into the design infrastructure pack | Completed locally | Added Designer skill `ui-skills-directory`, first-use demo, prompts, checklist, toolkit template, public metadata, and guide/audit validation; UI Skills remains an external directory routed by task-fit shortlist, not a second catalog truth |

## Prompt / Workflow Notes
| Date | Prompt Pattern | Use Case | Notes |
| --- | --- | --- | --- |
| 2026-03-11 | "先补齐 doc 基线，再进入代码" | Existing project optimization | Avoids starting code work without architecture and UX source of truth |
| 2026-03-11 | "基于仓库事实，不写空模板" | Documentation bootstrap | Keeps specs tied to actual runtime surfaces |
| 2026-04-23 | "先蜂群思考，输出架构设计文档，在PDCA执行" | Cross-repo architecture decision | Use parallel architecture review first, then write the decision into canonical PDCA docs before any runtime merge |
| 2026-05-18 | "把skill 的复制打开，只有岗位配置包需要登陆" | Auth-wall scope correction | Keep Skill/MCP/API-doc copy public; use protected Worker/R2 delivery only for Job Pack payloads |
| 2026-05-25 | "别人直接复制安装不了，配置包和本地最新同步并单独建 repo" | Role-pack distribution hardening | Create a local-first standalone pack repo; remote fetch must be opt-in |
| 2026-05-25 | "继续，从git地址安装是最安全的" | Production install-command hardening | Keep registration gate, but copy a pinned GitHub clone command instead of a Worker token URL |
| 2026-05-25 | "打开定策略，怎么没有配置包" | Pack recommendation availability hardening | Audit decision-tree targets against concrete pack-card rendering; lower-maturity packs remain visible and installable when generated artifacts exist |
| 2026-05-25 | "把这个skill组合包打包，放到岗位配置包的定策略模块；做数据/看数据合并" | Strategy job-pack packaging + data IA merge | Package existing canonical strategy skills as `strategy-roundtable-advisor`; merge data entry without pretending stub data packs are released |
| 2026-05-25 | "原型设计师改为设计师，原型是产品经理的" | Product/design role boundary cutover | Do not keep a compatibility alias; rename slug, copy, manifest, guides, and Git install command to `designer` |
| 2026-05-25 | "全面审核，所有的配置包不能出现具体的人名" | Pack identity neutrality release gate | Run sanitizer + exact-match scans across Foundry packs, standalone packs, catalogs, guides, and installed smoke output before publishing |
| 2026-05-26 | "怎么有那么多配置包缺失，全面检查和修复" | Pack UI coverage invariant | `/packs` must display every catalog pack; Basic-tier packs stay visible/installable when generated artifacts exist, and prebuild fails if catalog coverage is missing |
| 2026-05-26 | "还有这个分类也要科学，不要分那么多，但是要全部覆盖" | Pack taxonomy grouping invariant | Collapse noisy second-level pack lists into user-task groups; result pages expand grouped packs, and coverage audit proves all canonical public packs are reachable |
| 2026-05-26 | "所有的配置包缺失 / 全部上线" | Pack online-state invariant | Do not use `PACK_SPEC` tier as availability; all public catalog packs with generated artifacts are live, and Basic tier copy must not say `Coming soon` |
| 2026-05-26 | "为什么还有2个一样的，只保留最丰富、最好的" | Pack public dedup invariant | Deprecated alias packs can remain as historical directories, but public `/packs` cards, counts, and groups must expose only the canonical target |
| 2026-05-26 | "要全部已富化，全面检查和修复" | Pack maturity-floor invariant | Canonical public packs must be audit-enriched to at least `enriched`; deprecated alias guides inherit canonical maturity and remain outside public cards; ignored local E2E logs must not create local-only Certified labels |
| 2026-05-26 | "继续" after production maturity closeout | CI runtime lifecycle cleanup | Treat GitHub Actions Node 20 deprecation annotations as release debt; upgrade actions to Node 24-native majors rather than relying on temporary opt-out or opt-in environment flags |
| 2026-05-26 | "所有的skill都已经是git安装了吗？确定都打通了吗？把所有岗位再每个一个总的压缩包保存再本地" | Role-pack release automation invariant | Git release proof and local zip packaging must be commandized; do not rely on one-off shell checks when sharing pack releases |
| 2026-05-27 | "为什么很多工具包里的说明书还没有完成 skill 三段式美化？全面检查和修复" | Guide manual completeness invariant | Generated guide pages must be reader-complete even when imported SKILL/SPEC sources use older heading conventions; make incomplete cards a prebuild failure instead of a visual TODO |
| 2026-05-27 | "执行code review swarm / 按照SOTA路线" | Source-of-truth hardening invariant | Fix review findings by moving checks to the earliest truthful layer: source Markdown docs, release config JSON, root installer smoke, and standalone validation, not generated HTML or manual shell history |
| 2026-05-31 | "Step 0 autonomous delivery protocol + attacker review" | Auth payload hardening invariant | Treat public metadata, protected payload delivery, generated install scripts, and return-path sanitization as one auth boundary; convert accepted review findings into audit/test gates |
| 2026-05-31 | "继续" after auth closeout | Postmortem release guard | Convert PM machine triggers into a strict diff scanner; if a historical PM triggers, update the matching PM with fresh verification before release |
| 2026-06-11 | "https://www.ui-skills.com/ 这个整合进去设计基建包" | Designer pack design-infrastructure integration | Add UI Skills as a bounded routing skill inside `designer`; use 3-5 task-fit recommendations with owner, sequence, and stop condition instead of copying the whole external directory |

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
| `/packs` 问答入口可以指向 `tier: "stub"` 的配置包吗? | 可以。`tier: "stub"` 是 `Basic` 成熟度，不是未上线；只要生成产物完整，就必须正常展示并允许注册后安装。 |
| `定策略` 应该如何承载复杂战略思维 prompt? | 不要只塞一段系统提示词。应打成 Job Pack：真实 `SKILL.md` 资源、专家/advisor、toolkit、checklist、first-use demo、manifest 和 installer 一起交付，并通过 pack audit 验证。 |
| `做数据` 和 `看数据` 应该是两个一级入口吗? | 不应该。一级入口合并为 `做/看数据`，二级或包内再区分算法、大数据、指标、A/B、Dashboard；公开安装状态由生成产物完整性决定，pack tier 只表达成熟度。 |
| 原型能力归谁? | 产品经理。PM 负责 PRD、用户故事、RICE、原型假设和可点击验证 demo；设计师负责体验架构、视觉层级、设计 token、状态覆盖、设计 QA 和工程 handoff。 |
| 配置包可以用具体人物作为 advisor 名称吗? | 不可以。公开配置包、manifest、guide、catalog、install.sh 和安装产物只能使用能力中性的 advisor 身份；历史人物、作者名、个人署名只能留在非配置包历史文档或外部第三方 catalog 元数据中。 |
| 为什么不能只删除 Pages 中的受保护 pack payload 文件? | Cloudflare Pages 删除后的旧资产可能继续在边缘保留；生产发布必须把受保护 payload 文件内容 tombstone 掉，再部署 Pages，确保旧直链只返回保护提示而不是历史配置包内容。 |
| `/packs` 是否可以隐藏还没开放安装的配置包? | 不可以。非 deprecated 的公开 catalog 包只要产物完整就应展示并可安装；`tier: stub` 只能显示为 `Basic` 成熟度，不能被当成隐藏、禁用或 `即将上线` 的理由。 |
| `/packs` 可以同时展示 canonical 包和它的 `spellbook-*` alias 吗? | 不可以。若 manifest 声明 `deprecated_alias_of` 且 canonical target 存在，公开目录只展示 canonical 包；alias 目录不得进入 `packs.json`、推荐树或可见计数。 |
| `/packs` 二级方向可以直接平铺所有岗位包吗? | 不可以。二级方向必须按用户任务域分组，例如前端体验、后端平台、质量安全、基础设施运维；组内结果再展开具体配置包，并由 coverage audit 证明 26 个包没有遗漏。 |
| `tier: "stub"` 是否等于未上线? | 不等于。上线状态看 `manifest.json`、`CLAUDE.md`、`AGENTS.md`、`settings.json`、`prompts.md`、`install.sh`、`guide.html` 是否齐全，以及 `/packs` release logic 是否通过 `audit-pack-online-status.mjs`。 |
| 公开岗位包可以继续显示 `基础档` 吗? | 不可以。`Basic` 只解释旧成熟度语义；当前公开 catalog 的发布门槛已经提高到 `enriched`，必须由 `pack-spec-audit.py` 计算并由 `audit-public-pack-maturity.mjs` 阻断任何 public `stub`。 |
| R2 protected pack 上传遇到 `502` / `504` 怎么办? | 不应靠人工反复 rerun。`scripts/upload-protected-packs-to-r2.mjs` 必须有有界并发和指数退避重试，确保 Cloudflare 瞬时网关错误不会中断有效部署。 |
| GitHub Actions 出现 Node 20 deprecation annotation 怎么办? | 不要只设置临时环境开关。优先升级到 `runs.using: node24` 的 action major（checkout/setup-node/setup-python/artifact/wrangler），并通过真实 GitHub Actions deploy 与生产 smoke 证明没有回退。 |
| 怎么确认所有岗位包的 Skill 都已经通过 Git 安装链路打通? | 运行 `npm run role-packs:audit-git`。它会读取 Foundry 当前 Git URL/ref，克隆对应 `openclaw-role-packs` tag，执行 standalone validate + smoke install，并逐文件比较 Foundry 与 Git tag 的 manifest payload hash。 |
| 怎么生成本地岗位包压缩包? | 运行 `npm run role-packs:package` 生成 22 个公开 canonical 包和一个 public 总包；运行 `npm run role-packs:package:all` 生成 26 个全量包和一个 all 总包。两个命令都会生成 `SHA256SUMS.txt`、`manifest-summary.json` 并对 zip 做安装烟测。 |
| 怎么确认所有岗位包说明书里的 skill 都完成三段式美化? | 运行 `npm run role-packs:enrich-source-skills -- --check` 和 `npm run role-packs:audit-guides`。前者证明源 Markdown skill doc 已有 `是什么`、`怎么用`、`架构图`，后者证明 26 个 guide 的 182 个 guide-facing skill doc 都渲染成三段式卡片；非 Markdown skill payload 不作为说明书卡片。 |
| 角色包 Git release ref 的单一事实源是什么? | `web/public/data/role-pack-release.json`。`scripts/generate-pack-guides.mjs`、`web/lib/protected-downloads.ts`、`scripts/audit-role-pack-git-release.mjs` 和 standalone `catalog/role-pack-release.json` 都必须从这个 JSON 派生，不能再硬编码 release ref。 |
| `/api/packs/:id` 可以返回合并后的 `CLAUDE.md` / `AGENTS.md` / `settings.json` / `prompts.md` 吗? | 不可以。公开 detail API 只返回 pack metadata；payload body 只能通过注册态或短期 download token 访问 `GET /api/packs/:id/file?path=...`。 |
| Worker 生成的 `install.sh` 可以把浏览器 bearer session 写进脚本吗? | 不可以。生成脚本只能嵌短期 D1 download token；如果用户用 bearer session 请求 `install.sh`，Worker 必须先 mint 一个短期 token 再写入脚本。 |
| 登录、邮箱 callback、微信 callback 的 `return` / `return_to` 如何处理? | 只接受安全本地相对路径；协议相对 URL、反斜杠、控制字符或解码后不安全的值全部回退到 `/packs#wall`。 |
| 受保护文件下载遇到 401 时可以手写 `/login?return=...` 吗? | 不可以。必须复用 `loginRedirect(returnPath)`，由共享 helper 统一做 return-path 归一化与编码。 |
| 如何让 postmortem 真正参与发布守门? | 运行 `npm run postmortem:scan`。根 `npm run build` 和 `web` prebuild 已自动执行 `scripts/scan-postmortems.mjs --strict`；命中历史 PM 且没有同步更新该 PM 时会失败。 |
| 如何防止 postmortem 发布守门本身静默漂移? | 运行 `node --import tsx --test tests/postmortem-scan.test.ts`。该测试锁定 root/web/deploy 接入点、PM machine trigger 可解析性、regex 可编译性，以及 strict/untracked safeguards。 |
| UI Skills 应该如何进入设计基建包? | 作为 `designer` 包内的 `ui-skills-directory` 路由技能进入。它按当前任务选择 3-5 个 UI Skills 候选，并输出 owner、sequence、stop condition；不得把 `ui-skills.com` 当成产品需求来源或一次性全量安装清单。 |

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
40. `scripts/sanitize-pack-person-names.mjs`
41. `scripts/prune-public-pack-downloads.mjs`
42. `scripts/audit-packs-page-coverage.mjs`
43. `web/app/packs/page.tsx`
44. `https://github.com/FoundationAgents/MetaGPT`
45. `https://github.com/crewAIInc/crewAI`
46. `https://github.com/OpenHands/OpenHands`
47. `https://arxiv.org/abs/2602.14690`
48. `scripts/enrich-public-pack-maturity.mjs`
49. `scripts/audit-public-pack-maturity.mjs`
50. `.github/workflows/deploy.yml`
51. `.github/workflows/skill-catalog-drift.yml`
52. `scripts/audit-role-pack-git-release.mjs`
53. `scripts/package-role-packs.mjs`
54. `scripts/audit-pack-guide-skill-sections.mjs`
55. `scripts/enrich-pack-skill-sections.mjs`
56. `web/public/data/role-pack-release.json`
57. `scripts/scan-postmortems.mjs`
58. `tests/postmortem-scan.test.ts`
59. `https://www.ui-skills.com/`
60. `https://github.com/ibelick/ui-skills`
