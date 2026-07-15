# PM-2026-05-25 CI Local Skill Root Coupling

## Summary

The `Deploy to Cloudflare` workflow failed in `deploy-frontend` during `cd web && npm run build` because `web` prebuild ran `scripts/reconcile-catalog-integrity.py`, and that script required `~/.claude/skills` to exist. GitHub runners do not have Maurice's local skill root, so production deployment could not reach the Pages deploy step.

## Symptom

- Workflow: `Deploy to Cloudflare`
- Run: `26382203696`
- Job: `deploy-frontend`
- Step: `Generate packs + Build Next.js static export`
- Error signature: `ERROR: local root not found: /home/runner/.claude/skills`

## Root Cause

`reconcile-catalog-integrity.py` was designed for local catalog reconciliation against Maurice's disk, but it was included unconditionally in `web/package.json` `prebuild`. That made production static export depend on a developer-machine-only path.

## Fix

1. Added `--allow-missing-local-root` to `scripts/reconcile-catalog-integrity.py`.
2. When that flag is present and the local root is missing, the script prints a no-op report and leaves `skills.json` unchanged.
3. Updated `web/package.json` `prebuild` to pass the flag, preserving local reconciliation behavior for direct script runs.

## Prevention

Production build scripts must not require developer-home directories. Local-disk enrichment can run as an explicit local maintenance command, but CI build paths must either use committed artifacts or explicitly no-op without mutating canonical data.

## Machine Triggers

```yaml
paths:
  - web/package.json
  - scripts/reconcile-catalog-integrity.py
  - .github/workflows/deploy.yml
keywords:
  - reconcile-catalog-integrity.py
  - --allow-missing-local-root
  - ~/.claude/skills
  - /home/runner/.claude/skills
  - Generate packs + Build Next.js static export
  - ERROR: local root not found
regex:
  - "ERROR: local root not found: .*/\\.claude/skills"
  - "reconcile-catalog-integrity\\.py(?!.*--allow-missing-local-root)"
```

## Verification

- `HOME=<empty tmp> python3 scripts/reconcile-catalog-integrity.py --allow-missing-local-root --dry-run` -> PASS, no-op with catalog unchanged.
- `HOME=<empty tmp> npm run build` in `web/` -> PASS, Next.js static export completed.
- Root `npm run build` -> PASS.
- `ai check` -> PASS, run dir `/Users/mauricewen/00-AI-Fleet/outputs/check/20260525-035315-aae2b488`.

## 2026-05-31 Follow-up Verification

The postmortem pre-release scan was added to `web/package.json` `prebuild`, which touched the same line as `reconcile-catalog-integrity.py`. The original guard remains intact: `--allow-missing-local-root --dry-run` is still passed before the production static-export audits run.
