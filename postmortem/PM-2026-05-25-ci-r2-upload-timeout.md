# PM-2026-05-25 CI R2 Upload Timeout

## Summary

The `Deploy to Cloudflare` workflow reached the protected-pack R2 upload step but was cancelled by the `deploy-frontend` job timeout before Pages deployment. The upload itself was making progress; the bottleneck was spawning one `npx wrangler r2 object put` process for every protected pack payload.

## Symptom

- Workflow: `Deploy to Cloudflare`
- Run: `26382381162`
- Job: `deploy-frontend`
- Step: `Upload protected pack files to R2`
- Error signature: `##[error]The operation was canceled.`
- Last observed object: `packs/spellbook-frontend-engineer/lint/typescript/.prettierrc`

## Root Cause

`scripts/upload-protected-packs-to-r2.mjs` uploaded 437 payload files serially and invoked `npx wrangler` for each file. That repeated npm/Wrangler startup hundreds of times, consuming the 10-minute job budget before the workflow could prune static payloads and deploy Pages.

## Fix

1. Replaced serial `spawnSync('npx', ['wrangler', ...])` uploads with an async upload pool.
2. Required the local `worker/node_modules/.bin/wrangler` binary installed from the worker lockfile, avoiding `npx` startup and version drift.
3. Added `R2_UPLOAD_CONCURRENCY=8` to the workflow.
4. Increased `deploy-frontend` timeout from 10 to 20 minutes so Pages deployment still has budget after large payload batches.
5. Added `--dry-run` planning support for local verification without Cloudflare credentials.

## Prevention

Deployment jobs that upload many small protected artifacts must avoid one package-manager invocation per object. Use the committed lockfile-installed CLI binary, bounded concurrency, and progress logging. Any future expansion of `web/public/packs/` should verify upload count and runtime budget before merging.

## Machine Triggers

```yaml
paths:
  - scripts/upload-protected-packs-to-r2.mjs
  - .github/workflows/deploy.yml
  - web/public/packs/**
keywords:
  - Upload protected pack files to R2
  - npx wrangler r2 object put
  - The operation was canceled
  - R2_UPLOAD_CONCURRENCY
  - protected pack file(s)
regex:
  - "spawnSync\\('npx'.*wrangler"
  - "timeout-minutes: 10"
  - "The operation was canceled"
  - "Uploading [0-9]+ protected pack file\\(s\\) to R2"
```

## Verification

- `node --check scripts/upload-protected-packs-to-r2.mjs` -> PASS.
- `R2_UPLOAD_CONCURRENCY=8 node scripts/upload-protected-packs-to-r2.mjs --dry-run` -> PASS, planned 437 protected pack payloads with local Wrangler binary.
- `bash scripts/audit-auth-surfaces.sh` -> PASS, 18 checks and 0 violations.
- `cd web && npm run build` -> PASS.
- Root `npm run build` -> PASS.
- `ai check` -> PASS, run dir `/Users/mauricewen/00-AI-Fleet/outputs/check/20260525-041513-3ebbd355`.
- Remote GitHub Actions verification is required after pushing because real R2 upload needs Cloudflare Actions secrets.
