# PM-2026-05-31 Auth Payload Boundary

## Summary

An attacker review found that the registered-user Job Pack boundary was split across public metadata, protected payload delivery, generated install scripts, and auth return redirects. Three concrete defects could leak protected configuration content or credentials: public pack detail merged payload bodies, unsafe return-path propagation, and generated Worker installers that could embed browser bearer sessions.

## Symptom

- Surface: `GET /api/packs/:id`
- Exposed fields: `claudeMd`, `agentsMd`, `settings`, `promptsMd`
- Surface: login/email/WeChat return routing
- Unsafe signatures: protocol-relative `//host`, encoded protocol-relative `/%2Fhost`, backslash/control-char return paths
- Surface: `GET /api/packs/:id/file?path=install.sh`
- Risk signature: generated `install.sh` containing a browser bearer token instead of a scoped download token

## Root Cause

The auth wall was implemented as several adjacent behaviors instead of one explicit boundary contract. Public metadata reads, protected file reads, install-script generation, and auth return redirects each had local logic, but no shared executable invariant proved that:

1. public pack detail remains metadata-only,
2. protected payload access is the only path to configuration bodies,
3. generated install scripts never serialize browser sessions, and
4. auth return destinations are safe local-relative paths.

## Fix

1. Changed public pack detail to return only `mapPack(row)` metadata after `safePackId` validation.
2. Split protected file access into session access and short-lived download-token access.
3. Changed generated `install.sh` handling so session-based installer requests mint a short-lived D1 download token, while token-based requests reuse the scoped token.
4. Added `safeReturnPath` to the web session module and wired login, email callback, WeChat landing, and Worker WeChat state handling through it.
5. Expanded `scripts/audit-auth-surfaces.sh` and added `tests/auth-boundary.test.ts` so the boundary is executable.

## Prevention

Treat Job Pack delivery as one auth boundary, not separate UI/API conveniences. Any future change touching pack detail responses, protected file routes, install command generation, login callback returns, WeChat OAuth state, or download tokens must run the auth boundary test and audit before release.

## Machine Triggers

```yaml
paths:
  - worker/src/routes/packs.ts
  - worker/src/routes/auth-wechat.ts
  - web/lib/session.ts
  - web/app/login/page.tsx
  - web/app/auth/callback/page.tsx
  - web/app/auth/wechat-landing/page.tsx
  - scripts/audit-auth-surfaces.sh
  - tests/auth-boundary.test.ts
keywords:
  - claudeMd
  - agentsMd
  - promptsMd
  - settings
  - install.sh
  - download-token
  - Authorization: Bearer
  - safeReturnPath
  - return_to
  - auth/wechat/start
regex:
  - "pack:\\s*\\{\\.\\.\\.mapPack\\("
  - "tokenForInstaller\\s*=\\s*.*bearer"
  - "Authorization:\\\\s*Bearer\\s+\\$\\{?[A-Za-z_]*token"
  - "startsWith\\('/'\\)(?![\\s\\S]{0,120}startsWith\\('//')"
  - "decodeURIComponent\\([^)]*return"
```

## Verification

- `node --import tsx --test tests/auth-boundary.test.ts` -> PASS, 4/4 tests.
- `bash scripts/audit-auth-surfaces.sh` -> PASS, 35 checks and 0 violations.
- `npm run build` -> PASS.
- `npx tsc -p worker/tsconfig.json` -> PASS.
- `node --import tsx --test tests/*.test.ts` -> PASS, 33/33 tests.
- `npm --prefix web run build` -> PASS.
- `git diff --check` -> PASS.
- `ai check` -> PASS, run dir `/Users/mauricewen/00-AI-Fleet/outputs/check/20260531-111035-3f11884f`, `ok=true`, `rounds=2`.

## Release Verification (2026-07-16)

- Released to production in commit `5973201` via deploy run `29474644027` (all jobs green; `seed-db` skipped by its own known issue).
- Pre-push release gate on the exact release tree: boundary tests 5/5 PASS; audit script 0 violations (now 37 checks).
- Production probes: Pages `/packs` HTTP 200; public pack detail for `compliance-expert` returned metadata keys only with none of the four protected payload fields present; unauthenticated protected file route returned HTTP 401.
- Scanner enforcement observed live: the follow-up docs-only commit `c5594fd` was BLOCKED by this postmortem's strict scanner in run `29475065778` because its documentation mentioned this PM's trigger terms without updating this file. That is the scanner working as designed. Standing note: any commit whose diff mentions this boundary's trigger terms — including documentation — must update this PM file in the same commit to record acknowledgment.

## Known Product Contracts

1. Pinned GitHub tag install after registration remains the product-approved distribution path.
2. Open email magic-link self-registration remains the current acquisition contract. Enterprise allowlists or approval-gated onboarding require a new business requirement.

## 2026-07-16 (b) Follow-up Verification — cosmetic 登陆→登录 auth-copy fix

Commit `065a971` ("fix(ux): 登陆 -> 登录 across auth surface") touched three trigger
paths — `web/app/login/page.tsx`, `web/app/auth/callback/page.tsx`,
`web/app/auth/wechat-landing/page.tsx` — and correctly tripped this PM's strict
scanner in deploy run `29497870025` (deploy-frontend BLOCK), because the commit
did not update this file. This follow-up records the acknowledgment.

Change classification: PURELY a Chinese UI-copy correction — the misspelling 登陆
("make landfall") → 登录 ("log in") — in visible strings only. Verified by
`git show 065a971` on the three files filtered to auth-boundary terms
(`token|payload|consume|request|fetch|body|json|bearer|sha256|hash`): the filter
returned EMPTY. No `/api/auth/request` or `/api/auth/consume` call shape, no token
handling, no request/response payload field, and no bearer/hash logic was altered.
The auth payload boundary this PM guards (public surfaces never expose the four
protected payload fields; unauthenticated protected routes return 401) is
unchanged. The boundary audit script and its 401/field-omission contract remain
in force.

## 2026-07-17 Follow-up Verification — Round-5 mobile CSS layout fix (min-w-0)

The Round-5 mobile acceptance commit touched this PM's trigger path
`web/app/login/page.tsx`, so this PM's strict scanner correctly flagged the diff.
This section records the acknowledgment.

Change classification: PURELY a CSS layout fix, no auth-boundary logic altered.
The single edit adds the Tailwind utility `min-w-0` to the WeChat sign-in card's
text column (`<div className="space-y-1">` -> `<div className="min-w-0 space-y-1">`)
so its CJK heading can shrink and wrap, resolving a 390px mobile horizontal
overflow (document scrollWidth 418 -> <=390). Verified by `git show` on
`web/app/login/page.tsx` filtered to auth terms
(`token|payload|consume|fetch|body|json|bearer|safeReturnPath|config|api/auth`):
every matched line is pre-existing and unchanged; the sole added characters are
the `min-w-0 ` class prefix on one presentational div. No request/response payload
field, no return-path handling, no magic-link delivery gate, and no session token
logic was modified. The auth payload boundary this PM guards (public surfaces
never expose the four protected payload fields; unauthenticated protected routes
return 401) is unchanged.

## 2026-07-18 Acknowledgment — Round-7b font self-hosting (keyword false positive)

Round-7b commit self-hosts the Material Symbols icon font (`web/app/globals.css`,
`web/app/layout.tsx`, `web/public/fonts/`) and wires three nav/footer strings
through i18n. The strict scanner matched this PM's `settings` keyword because the
diff contains the CSS property `font-variation-settings` / the React style key
`fontVariationSettings` — typography, not auth. No auth route, session, payload,
or login/callback surface is touched (the i18n edit in `top-nav.tsx` only replaces
two hardcoded label strings with `t()` calls). Boundary contracts unchanged; this
entry records the acknowledgment per the standing note above.
