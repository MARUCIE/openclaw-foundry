# ROLLING_REQUIREMENTS_AND_PROMPTS

## Requirements Ledger
| Date | ID | Type | Requirement | Status | Notes |
| --- | --- | --- | --- | --- | --- |
| 2026-03-11 | REQ-001 | Governance | Project root must contain local governance entry files (`AGENTS.md`, `CLAUDE.md`, `CODEX.md`, `GEMINI.md`) | Completed | Added as thin project-local policy entrypoints |
| 2026-03-11 | REQ-002 | Documentation | Canonical project docs must live under `doc/00_project/initiative_openclaw_foundry/` | Completed | `docs/` retained as historical reference |
| 2026-03-11 | REQ-003 | Architecture | Current CLI/server/browser/bootstrap entrypoints must be mapped in architecture and UX docs | Completed | Derived from `src/` and `client/` |
| 2026-03-11 | REQ-004 | Precheck | History lookup and tooling health check should be attempted before major work | Completed | `aline search` 0 hits; `ai doctor` timed out |
| 2026-03-11 | REQ-005 | Contract | AI-generated blueprints must be normalized against trusted user inputs and the scanned catalog before being returned | Completed | Implemented in `src/analyzer.ts` |

## Prompt / Workflow Notes
| Date | Prompt Pattern | Use Case | Notes |
| --- | --- | --- | --- |
| 2026-03-11 | "先补齐 doc 基线，再进入代码" | Existing project optimization | Avoids starting code work without architecture and UX source of truth |
| 2026-03-11 | "基于仓库事实，不写空模板" | Documentation bootstrap | Keeps specs tied to actual runtime surfaces |

## Anti-Regression Q&A
| Q | A |
| --- | --- |
| 新的规范文档应该写在 `docs/` 还是 `doc/`? | 写在 `doc/`。`docs/` 现在只是历史参考目录。 |
| 项目级 PRD/架构/UX/优化计划的单一事实源在哪里? | `doc/00_project/initiative_openclaw_foundry/`。 |
| 如果 OneContext 没有历史命中怎么办? | 记录 0 命中结果，然后继续基于仓库代码与现有文档推进。 |
| 如果 `ai doctor` 卡住怎么办? | 记录超时证据，不伪造结果；在下一次实现任务中补做可复现的健康检查。 |
| 为什么 `/api/analyze` 不能直接信任模型给出的 `meta.created` 或 skill 列表? | 因为这些字段属于系统约束和 catalog 约束，必须在服务端做二次规范化，否则模型会返回错误日期或不存在的 skill。 |

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
