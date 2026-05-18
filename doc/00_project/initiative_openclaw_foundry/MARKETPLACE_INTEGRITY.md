# Marketplace Integrity Invariants

> Cross-cycle structural contract for the openclaw-foundry marketplace.
> Generated 2026-05-18 after 4-advisor parallel swarm audit (Hickey · Munger · Meadows · Hara) surfaced 3 convergent P0 cores + 10 ranked findings. 3 rounds of optimization closed the immediate gaps; this document encodes the invariants that prevent recurrence.

## 1. The 3-Axis Marketplace Contract

For every item rendered in the marketplace (skill / MCP server / config pack), the platform makes 3 promises that MUST be jointly verifiable:

| Axis | Promise | Verifier |
|---|---|---|
| **Download** | The link or curl command resolves to a fetchable artifact for any internet-reachable user, not just Maurice's source machine | `curl -sfI <url>` returns 2xx for every non-`local/` entry in `web/public/data/skills.json` |
| **Install** | The install command, when run on a fresh machine with Claude Code present, produces a usable agent surface (files in `~/.claude/skills/<slug>` or equivalent CLI path) with no silent failures | Mortality preflight in `install.sh` warns when `$HOME/.claude` absent; sha256/manifest match on installed artifacts |
| **Sync** | The catalog (`web/public/data/skills.json`) reflects the actual on-disk state of source skills at the time of the most recent build, with no phantom entries and no missing skeletons | `scripts/reconcile-catalog-integrity.py --strict` exits 0; `meta.reconciledAt` within last 24h on every deploy |

A skill that satisfies only 2 of the 3 axes is **operationally broken** even if every UI surface looks healthy. The marketplace MUST NOT promise affordance (Install button, copy command, view-details link) on the third axis when it cannot verify all three.

## 2. Forbidden Schema Lies (Hickey + Munger convergence)

The following surface patterns are banned because they make claims the system cannot honor:

### 2.1 Hardcoded headline counts that diverge from `skills.json.total`
- Any visible number > `skills.json.total` (e.g. "37,000+ skills" against actual 748) is a lie that compounds with every visit.
- Banned strings in `web/messages/*.json`, `web/app/**/page.tsx`, `web/lib/landing.ts`, `web/lib/api.ts`: `37,000+`, `30,000+`, `100,000+`, any literal headline count that is not computed from `data.total`.
- Default fallback in `useLandingPageData()` is `0` (honest absence), never an aspirational number.

### 2.2 Source-type filters for empty catalogs
- The marketplace top tabs (`SOURCE_KEYS = ['all', 'Skills', 'MCP Servers']`) MUST be filtered dynamically by the corresponding catalog count.
- `'MCP Servers'` only renders when `allSkills.filter(s => s.source === 'mcp-registry').length > 0`.
- Same gate applies to IDE-extension install rows (`category: 'ide'` in `INSTALL_TARGETS`): they MUST NOT promise MCP-IDE integration when 0 MCP entries exist.

### 2.3 Install affordance for unpublished local skills
- Skills with `source: 'local'` AND no derivable external source (`!deriveExternalSource(skill)`) MUST display a private-local banner inside the install modal: "本地私有 · 此 skill 仅在源机器可装。下方命令仅供参考。"
- The card-level button label MUST swap from "Install" to "View Commands" / "查看命令" for the same case.
- These are unpublished skills visible only to Maurice's environment; their install commands route to a `local/<slug>` namespace that fails silently on every other machine.

### 2.4 Synthetic telemetry on `source: 'local'` skills
- `CurationBadges` MUST NOT render deploy% / downloads chips when `source === 'local'` because those numbers are LLM-enriched, not measured telemetry.
- The stale-data warning chip + permission-disclosure chip remain because they're factual (timestamp + JSON inspection).

### 2.5 "Synced" wording for static export
- The marketplace catalog is a static export (`web/public/data/skills.json` snapshot at build time), not a live sync.
- The timestamp label MUST read "Snapshot" / "快照", never "Synced" / "同步" — the latter implies a live bidirectional pipeline that does not exist.

### 2.6 Stub packs in public listing
- `web/public/data/packs.json` entries with `tier: 'stub'` MUST NOT render install buttons or PackCards in `web/app/packs/page.tsx`.
- Aggregate count surfaces as a single static notice: `packs.upcomingNotice` ("另有 N 个配置包即将上线（验证中，暂未开放）").

## 3. The L → C → P → U → I Pipeline (Meadows feedback loops)

```
Local skills (L)        ←→        Catalog snapshot (C)        ←→        Pages export (P)        ←→        User install (U)        ←→        Installed artifact (I)
        |                                |                                       |                                    |                                       |
        ~/.claude/skills/<slug>          web/public/data/skills.json             /data/skills.json (CF Pages)         curl | bash from install.sh            ~/.claude/skills/<slug> on user machine
```

The pipeline MUST satisfy 3 conservation properties:

1. **L→C parity**: every directory under `~/.claude/skills/` either appears in `skills.json` OR is explicitly tagged `phantom: true` (with `phantomDetectedAt` timestamp). Drift is allowed but must be visible. `scripts/reconcile-catalog-integrity.py` enforces this.
2. **C→P determinism**: the catalog JSON at build time IS the catalog served from Pages. No mid-flight transformation. Verifiable by hash equality between `web/public/data/skills.json` and `https://agent-foundry.pages.dev/data/skills.json` post-deploy.
3. **I→L round-trip**: a user who runs `install.sh` and then inspects their `~/.claude/skills/<slug>` MUST see the same files (modulo `sha256`) that Maurice would see in his source directory. The pack manifest (`manifest.json`) declares this contract; CI MUST validate it for all `tier: 'certified'` packs.

When any of the 3 properties is violated, the marketplace is in **drift mode** and the public surface should not advertise install affordance for the affected items.

## 4. Mortality Pre-flight (Munger inversion)

Every `install.sh` MUST include a pre-flight check that detects the "Claude Code not installed" failure mode:

```bash
if [ -z "${INSTALL_DEST:-}" ] && [ ! -d "$HOME/.claude" ]; then
  echo "  WARN: $HOME/.claude does not exist (Claude Code not detected)"
  echo "        Install Claude Code first: https://claude.com/code"
  echo "        Or set INSTALL_DEST=/your/agent/dir and re-run"
  echo ""
fi
```

- Soft-fail (warning, not exit 1) because some users intentionally install to non-standard paths via `INSTALL_DEST`.
- Located in the canonical template at `scripts/generate-packs.mjs` (both v4.0 and v4.1 manifest-driven templates) so regeneration preserves the check across all packs.
- Live install.sh files for non-stub packs carry the patched template inline; stub packs are not exposed by `web/app/packs/page.tsx` so they're not user-reachable today.

## 5. Verify_by Signals (falsifiable, 30-day Lindy review)

This invariant doc is on a 30-day quarantine per the cognitive-reflection promotion gate. Re-evaluate on **2026-06-18** against these 4 falsifiable signals:

1. **No new headline-count lies merged to main in 30 days**: `git log --since='2026-05-18' --diff-filter=A -p web/ | grep -E '"[0-9]{1,3}(,?[0-9]{3})+\+?"' | wc -l` returns 0. _(OPEN — re-check 2026-06-18)_
2. **`reconcile-catalog-integrity.py` runs on every CF Pages deploy**: wired as `npm run prebuild` step in `web/package.json` so `next build` cannot skip it. _(✓ CLOSED 2026-05-18 commit `7cc7560` — 30 days ahead of deadline. Re-evaluation now upgrades to: ≥5 of next 10 deploys carry fresh `meta.reconcileSummary` block. Strict-mode gate remains opt-in `--strict --phantom-threshold N` for future CI hardening.)_
3. **Live fresh-clone install verification across all non-stub packs**: `state/openclaw-foundry-audit/verify_e2e_marketplace_pipeline.sh` confirms N-of-N pack install via live `agent-foundry.pages.dev` curl-pipe-bash in /tmp sandbox with manifest parity. _(✓ CLOSED 2026-05-18 — 8-of-8 non-stub packs verified, 167 total manifest items installed with parity: backend-engineer 22/22 · compliance-expert 21/21 · frontend-engineer 22/22 · product-manager 24/24 · scenario-planner 20/20 · test-engineer 22/22 · research-analyst 21/21 · prototype-designer 15/15. Skill axis remains structural N/A until catalog gains publicly-installable entries; MCP axis remains structural N/A until first mcp-registry entry exists.)_
4. **Zero re-opens of audit findings F1–F10 in 30 days**: scan `outputs/reports/auto-visual-swarm-review/` for follow-up audits citing the same F-IDs. _(OPEN — re-check 2026-06-18)_

Status 2026-05-18: **2 of 4 signals closed early**; signals #1 and #4 remain on 30-day Lindy clock. If signals #1 + #4 fail by 2026-06-18, the doc-only invariants in §2 + §3 are not load-bearing as written — escalate to a programmatic gate (PreToolUse hook on `Write|Edit` matching the banned patterns, or pre-commit hook on `web/public/data/skills.json` validating `meta.reconcileSummary`).

## 6. Round 1–3 Audit Trail

| Round | Commit | Scope | Verifier |
|---|---|---|---|
| R1 (P0 blockers) | `a156bd3` (deploy.yml + lie-removal) + reconciler run | F1 + F3 + F4 + earlier install-link fix | `state/openclaw-foundry-audit/verify_round1_marketplace.sh` (12/12 PASS) |
| R2 (P0 semantic + P1) | `53e2128` | F2 + F6 + F7 + F8 (local-private banner + verb honesty + 同步→快照 + synthetic telemetry strip) | `state/openclaw-foundry-audit/verify_round2_marketplace.sh` (15/15 PASS) |
| R3 (P1 carryover + P2 + closeout) | `0810705` | F5 + F9 + F10 + this invariant doc | `state/openclaw-foundry-audit/verify_round3_marketplace.sh` (25/25 PASS) |
| T5 (E2E fresh-clone install) | n/a | 3-axis live verification: skill (N/A — 0 publicly-installable), MCP (N/A — mcpCount=0), pack (real curl-pipe-bash on `agent-foundry.pages.dev/packs/backend-engineer/install.sh` in /tmp sandbox, 22/22 manifest items installed with parity confirmed) | `state/openclaw-foundry-audit/verify_e2e_marketplace_pipeline.sh` (6/6 PASS, 3 SKIP for structural N/A) |

Full audit report: `outputs/reports/auto-visual-swarm-review/2026-05-18-marketplace-integrity-audit.md` (20 raw findings → 7 deduped ranked → 3 convergent P0 cores).

## 7. Out-of-Scope (Explicitly Deferred)

These were considered during the 3 rounds and NOT pursued, with the reason documented to prevent rediscovery:

- **Server-side cryptographic gating of install.sh content** — UX gate (banner + verb swap) is sufficient for current threat model; cryptographic gating adds operational burden disproportionate to the actual risk (Maurice's source-machine fiction is not a security claim, it's a discovery-time honesty claim).
- **Auto-publishing of `local/` skills via CI to a Maurice-hosted CDN** — would technically resolve the 87% failure rate but contradicts the "Maurice's curated, locally verified" positioning. Local-private IS the product, not a bug.
- **Deleting the 295 phantom catalog entries** — would lose history of what existed and when; flagging `phantom: true` is the right structural answer per Hickey "values over places."
- **MCP catalog expansion** — out of scope for an integrity audit; if/when MCP entries are added, the §2.2 gate auto-flips the tab on, no code change needed.

---

Maurice | maurice_wen@proton.me
