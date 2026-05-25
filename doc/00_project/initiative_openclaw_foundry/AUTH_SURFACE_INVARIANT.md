# Auth-Surface Invariant — Job Pack Gate Contract

## Current Contract (v12, 2026-05-18)

1. The whole site stays browseable.
2. Skill, MCP, API documentation, and browser-wizard copy actions are public.
3. Only Job Pack payload delivery requires registration/login:
   - `/packs` install command copy
   - `/packs` generated config/file download buttons
   - Worker-served pack files and install scripts
4. Registration/login is provided through email magic-link and WeChat OAuth.
5. Public Pages output may contain Job Pack `guide.html` only. Install scripts, manifests, generated config files, and other pack payloads must be uploaded to R2 and served by Worker auth/token routes.

## Decision Log

| Date | Version | Surface | Lesson |
|---|---|---|---|
| 2026-05-17 | pre-v6 | `components/site-guard.tsx` route-layer wrap | Route guards are too coarse; they break browse transparency |
| 2026-05-18 | v6-v11 | `/packs` PackCard and pack payload delivery | Job Pack install/download payloads need action-level auth plus Worker/R2 protection |
| 2026-05-18 | v12 | Skill/MCP/API copy buttons | These are discovery/onboarding actions, not Job Pack payload delivery; locking them makes logged-out and logged-in UX look identical |

## Enforcement Mechanism

```
scripts/audit-auth-surfaces.sh   ← job-pack boundary audit
scripts/pre-commit-hook.sh       ← thin wrapper invoked by git
scripts/install-hooks.sh         ← idempotent symlink installer
```

The audit no longer scans every clipboard call. It checks the Job Pack boundary:

1. `web/lib/protected-downloads.ts` imports `@/lib/session` and calls `requireRegistered`.
2. `web/app/packs/page.tsx` uses `copyProtectedPackInstallCommand` and `downloadProtectedPackFile`.
3. `web/public/_headers` caches only `/packs/*/guide.html`, not all `/packs/*`.
4. `.github/workflows/deploy.yml` uploads protected pack payloads to R2, tombstones `web/out/packs`, and deploys Pages only after Worker deploy plus D1 migrations.

## Canonical Job Pack Gate

```tsx
import { copyProtectedPackInstallCommand, downloadProtectedPackFile } from '@/lib/protected-downloads';

await copyProtectedPackInstallCommand(pack.id, `/packs#install-${pack.id}`);
await downloadProtectedPackFile(pack.id, filename, `/packs#install-${pack.id}`);
```

`web/lib/protected-downloads.ts` performs the registered-session check and redirects to `/login?return=...` when needed. Do not duplicate this logic in Skill/MCP/API copy surfaces.

## Public Copy Surfaces

These actions are intentionally open:

1. Skill install command copy in `web/components/marketplace-shell.tsx`
2. Skill detail sticky install command copy in `web/app/skill/page.tsx`
3. MCP install command copy in `web/app/explore/mcp/page.tsx`
4. API docs example copy in `web/app/api-docs/page.tsx`
5. Legacy browser-wizard blueprint/install copy in `client/index.html`

If one of these starts showing `登录后复制` / lock icons, that is a regression against v12.

## Protected Payload Delivery

1. Pack `guide.html` pages may remain public static assets.
2. Pack install scripts, manifests, zip/json payloads, and generated config files must not ship as public static Pages files.
3. CI uploads protected pack payloads to R2 via `scripts/upload-protected-packs-to-r2.mjs`.
4. Static export payload content is tombstoned via `scripts/prune-public-pack-downloads.mjs` before Pages deploy.
5. Registered users receive payloads through Worker routes:
   - `POST /api/packs/:id/download-token`
   - `GET /api/packs/:id/file?path=...`

## Install + Run

```bash
# One-time per fresh clone:
bash scripts/install-hooks.sh

# Ad-hoc audit:
bash scripts/audit-auth-surfaces.sh

# Bypass (use sparingly, log reason in commit message):
git commit --no-verify -m "..."
```

## verify_by 2026-06-18

1. `bash scripts/audit-auth-surfaces.sh` exits 0 on `origin/main`.
2. Logged-out Skill install modal shows direct copy buttons, not login-lock buttons.
3. Logged-out `/packs` install/download actions redirect to `/login?return=/packs#install-<pack>`.
4. Deployed Pages output does not expose `/packs/<pack>/install.sh` as a public static file.

---

Maurice | maurice_wen@proton.me
