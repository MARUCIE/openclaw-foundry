# Auth-Surface Invariant — Design Contract

> openclaw-foundry shipped the v6 design contract on 2026-05-18:
> **整个网站可以打开，但是如果要下载任何内容需要完整注册登陆**
> (whole site browseable, install/copy/download requires login).
>
> This document defines the contract, why it kept breaking, and the
> mechanical gate that now enforces it.

## The contract (one sentence)

Every UI surface that delivers an install / copy / download payload to the
user MUST adjoin a session check from `@/lib/session` — either an active
auth-gate (`loginRedirect` on the action when `!isLoggedIn`) or an explicit
`@auth-surface-allowlist: <reason>` opt-out comment.

## Why the contract exists

| Date | Commit | Surface that broke | Lesson |
|---|---|---|---|
| 2026-05-17 | `0d2d1b8` | `components/site-guard.tsx` route-layer wrap (whole-site auth wall) | Route guards are too coarse — they break browse transparency |
| 2026-05-18 | `28c0356` (v6) | `/packs` PackCard install button | Component-level gate works ; this became the canonical pattern |
| 2026-05-18 | `1ddf40e` (v8) | Removed SiteGuard from v6 pivot | Route-guard from previous cycle survived pivot — Maurice screenshot triggered fix |
| 2026-05-18 | `960b5e7` (v9) | Marketplace `InstallModal` copy button | Same v6 design intent, different component, not covered by v6 decomposition |
| 2026-05-18 | v10 (this) | `skill/page.tsx` + `explore/mcp/page.tsx` copy buttons | Found by `audit-auth-surfaces.sh` BEFORE Maurice screenshot — promotion to hook closes the recurrence class |

Pattern: three regressions in six hours, all root-caused to *v6 cycle
decomposition scope < design intent demanded*. The hook makes the audit
mechanical so the next regression is caught at `git commit`, not at user
screenshot.

## The mechanism

```
scripts/audit-auth-surfaces.sh   ←  the audit logic (single source of truth)
scripts/pre-commit-hook.sh       ←  thin wrapper invoked by git
scripts/install-hooks.sh         ←  idempotent symlink installer
```

### What the audit scans

| Surface pattern | Where it appears |
|---|---|
| `navigator.clipboard.writeText` | copy install commands |
| `clipboard.writeText` | same, with destructured/aliased clipboard |
| `a.download = …` (programmatic) | `<a>` download attribute set in JS |
| `<a … download …>` (JSX) | static download links |

Scanned directories: `web/components/`, `web/app/`, `web/lib/`. Extensions:
`.ts`, `.tsx`, `.js`, `.jsx`.

### What the audit demands

For every match above, the SAME file must satisfy BOTH:

1. `import … from '@/lib/session'` — single source of truth for session state
2. Reference at least one of `loginRedirect` / `isLoggedIn` / `readSession`

OR the matching line carries `@auth-surface-allowlist: <reason>` on the
same line or the line immediately above.

### The canonical gate pattern

Lifted from `web/app/packs/page.tsx` PackCard (v6 commit `28c0356`):

```tsx
import { readSession, loginRedirect, type SessionUser } from '@/lib/session';

// inside the component:
const [user, setUser] = useState<SessionUser | null>(null);
const [authReady, setAuthReady] = useState(false);
useEffect(() => {
  setUser(readSession().user);
  setAuthReady(true);
  const onStorage = (e: StorageEvent) => {
    if (e.key === 'openclaw_session_token' || e.key === 'openclaw_session_user') {
      setUser(readSession().user);
    }
  };
  window.addEventListener('storage', onStorage);
  return () => window.removeEventListener('storage', onStorage);
}, []);
const isLoggedIn = authReady && user !== null;

const copy = useCallback((text: string) => {
  if (!isLoggedIn) {
    window.location.assign(loginRedirect());
    return;
  }
  navigator.clipboard.writeText(text);
  // …
}, [isLoggedIn]);
```

Optional UI swap when `!isLoggedIn`: lock icon + `登录后获取安装命令` label
(consistent with PackCard + InstallModal so users recognize the gate
across surfaces).

### When to allowlist

Public documentation that intentionally shows payload BEFORE signup:

```tsx
const copy = useCallback(() => {
  // @auth-surface-allowlist: api-docs example with placeholder API key, shown before signup
  navigator.clipboard.writeText(text);
  // …
}, [text]);
```

Hard rule: every allowlist must carry a one-sentence reason. Bare
`@auth-surface-allowlist` with no reason is rejected by the audit (future
extension).

## Install + run

```bash
# One-time per fresh clone:
bash scripts/install-hooks.sh

# Ad-hoc audit:
bash scripts/audit-auth-surfaces.sh

# Bypass (use sparingly, log reason in commit message):
git commit --no-verify -m "…"
```

The hook is a symlink — pulling a `scripts/audit-auth-surfaces.sh` update
takes effect on the next commit without re-running the installer.

## Why this lives in the project (not the harness)

| Layer | Coverage | Limitation |
|---|---|---|
| AI-Fleet harness PreToolUse hook | Only Claude Code edits | Misses Maurice's manual cursor/iTerm/VS Code edits |
| GitHub Actions CI | All PRs | Lag — only catches after push |
| `.git/hooks/pre-commit` in project (this) | All commits from any tool by any contributor | Local — installer must run once |

The pre-commit layer is the only one that protects all three vectors
(manual edits + AI agent edits + future contributor edits) at the
earliest possible moment.

## verify_by 2026-06-18

Falsifiable signals (any failure = re-evaluate the mechanism, not the discipline):

1. Zero new v6-class regressions reach `origin/main` over 30 days (auditable
   via `git log --grep='auth-gate'` count = 0)
2. `bash scripts/audit-auth-surfaces.sh` exits 0 on `origin/main` HEAD at
   any time during the 30-day window
3. At least one developer (Maurice or future contributor) successfully
   uses the allowlist comment for a legitimate public surface
4. Any new copy/download/share surface added during the window is either
   gated or allowlisted — no surface ships bare

If 0/4 satisfied by 2026-06-18 → strengthen audit (stricter pattern set,
require non-empty allowlist reason, extend to `postMessage`/`window.open`).

---

Maurice | maurice_wen@proton.me
