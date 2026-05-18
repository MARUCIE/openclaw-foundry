# AUTH_WIRING_GUIDE — Real Wire-up of Email + Enterprise WeChat Login

> Canonical English source for AI agents. Human-facing Chinese companion at `AUTH_WIRING_GUIDE.html` (routed via `html-style-router`).
> Bundles with `state/openclaw-foundry-audit/auth-deploy-manifest.md` (operational commands) + `state/openclaw-foundry-audit/verify_auth_e2e.sh` (post-deploy probe).

## Overview

openclaw-foundry supports two login providers, both fully implemented in code:

| Provider | Surface | Code path | External infra needed |
|---|---|---|---|
| Email magic-link | `/login` email form | `worker/src/routes/auth.ts` + `worker/src/lib/email.ts` + `web/app/auth/callback/page.tsx` | Resend account + API key |
| Enterprise WeChat (企业微信) self-built app | `/login` QR scan section | `worker/src/routes/auth-wechat.ts` + `web/app/auth/wechat-landing/page.tsx` | WeChat Work corp + self-built app + trusted-domain verify file |

Both providers issue Bearer tokens stored in browser `localStorage` under `openclaw_session_token`. The same Bearer flows through every subsequent API call (wall posts, pack downloads, comments). The `/api/auth/config` endpoint probes worker secrets and reports `email.enabled` + `wechat.enabled` so the UI can render disabled buttons when secrets are missing — no broken endpoints exposed to the user.

This guide describes the four operational phases. Phases 1+3 are external infra setup (one-time, manual). Phase 2 is the actual deploy (autonomous given correct secrets). Phase 4 is verification.

## Phase 1 — Enterprise WeChat self-built app

WeChat Work (企业微信) is chosen over personal WeChat web login because personal WX requires ICP filing on the callback domain. `agent-foundry.pages.dev` is a Cloudflare-owned subdomain — ICP is structurally impossible. Enterprise WeChat self-built app uses a trusted-domain (可信域名) verification file instead, which Cloudflare Pages can serve from `web/public/`.

Cohort fit: every PM in the training cohort already has a personal WeChat. The setup asks Maurice to (a) create a free Enterprise WeChat corp, (b) create a self-built app, (c) invite cohort members to the corp (one-time, ~30 s per invite). After that, "scan QR with personal WeChat" works because the invite links the member's personal WX to the corp.

### Steps

1. **Create corp** at <https://work.weixin.qq.com/> (free). Use Maurice's personal WeChat to scan-register.
2. **Get corp ID**: in admin panel, navigate "我的企业 → 企业信息". The `企业 ID` field looks like `ww...........`. This is the `WECHAT_CORP_ID` worker secret.
3. **Create self-built app**: "应用管理 → 自建 → 创建应用". Name = `OpenClaw Foundry Login`. After save, the app detail page exposes:
   - `AgentId` (numeric) → `WECHAT_AGENT_ID` worker secret
   - `Secret` (alphanumeric, click to reveal) → `WECHAT_SECRET` worker secret
4. **Configure trusted domain**: in the app page, "网页授权及 JS-SDK" panel → "可信域名" → enter `agent-foundry.pages.dev`. WeChat surfaces a verify file name like `WW_verify_<token>.txt` and a payload string.
5. **Drop verify file**: save `WW_verify_<token>.txt` (with the WeChat-supplied payload as its only content) to `web/public/WW_verify_<token>.txt`. Cloudflare Pages auto-serves files under `public/` at the root URL, so it resolves at `https://agent-foundry.pages.dev/WW_verify_<token>.txt`. Commit + push.
6. **Verify domain**: back in WeChat admin → "申请域名校验". WeChat fetches the file once and marks domain trusted (state changes to ✓ verified within seconds).
7. **Set callback domain**: same panel, "网页授权回调域" → enter `agent-foundry.pages.dev`. The OAuth flow already redirects to `/auth/wechat-landing`.
8. **Invite cohort**: "通讯录 → 添加成员" → enter member name + their personal WeChat ID. Member receives a WeChat invite that takes ≤30 s to accept.

After step 8, members can scan the QR code shown at `/login` with personal WeChat (which is now linked to the corp via membership).

## Phase 2 — Resend account + API key

Resend is the chosen email-delivery provider for the magic-link flow because of (a) zero-config sending via `onboarding@resend.dev` for the first deploy, (b) cheap pricing tier covers cohort-scale volume, (c) simple REST API with one POST per send.

### Steps

1. Sign up at <https://resend.com/signup> with Maurice's primary mailbox.
2. Verify the signup email (one-click).
3. In dashboard: "API Keys → Create API Key". Name = `openclaw-foundry-prod`. Permission = `Sending access` (NOT `Full access` — least-privilege).
4. Copy the `re_…` token immediately. Resend shows it exactly once. This is the `RESEND_API_KEY` worker secret.
5. (Optional, post-launch) verify a custom sending domain. Resend gives 3-4 DNS records to add at the domain registrar. Once verified, set `RESEND_FROM=login@<your-domain>` so emails come from the brand instead of `onboarding@resend.dev`. Skip until cohort grows past 10 users.

## Phase 3 — Deploy execution

The full command sheet lives in `state/openclaw-foundry-audit/auth-deploy-manifest.md`. Summary order:

1. `npx wrangler whoami` — confirm wrangler is authenticated. Re-login via `npx wrangler login` if `code: 10000` appears.
2. `npx wrangler secret put RESEND_API_KEY` — paste the `re_…` token.
3. `npx wrangler secret put WALL_PEPPER` — paste an `openssl rand -hex 32` value (cryptographic salt for wall anon hashing).
4. `npx wrangler secret put WECHAT_CORP_ID` — paste corp ID from Phase 1 step 2.
5. `npx wrangler secret put WECHAT_AGENT_ID` — paste app agent ID from Phase 1 step 3.
6. `npx wrangler secret put WECHAT_SECRET` — paste app secret from Phase 1 step 3.
7. `npx wrangler d1 execute openclaw-foundry --remote --file=src/migration-v8.sql` (and v9, v10) — idempotent, applies user/session/auth_token tables if missing.
8. `npx wrangler deploy` — ships the worker. Returns a new deployment ID + URL.
9. `git push origin main` — Pages auto-deploys from main branch. Watch the Pages dashboard for build success.

Reversibility: every secret has `wrangler secret delete`, every deployment has `wrangler rollback`, every migration in v8/v9/v10 is `CREATE TABLE IF NOT EXISTS` so re-running is safe.

## Phase 4 — Verification

```bash
bash state/openclaw-foundry-audit/verify_auth_e2e.sh
```

The script probes:

- `GET /api/health` returns 200
- `GET /api/auth/config` returns 200 with `email.enabled=true` + `wechat.enabled=true`
- `POST /api/auth/request {email}` returns 200 with `sent:true` (delivered_via=resend in production)
- `GET /api/auth/wechat/start?return=/packs` returns 302 to `open.weixin.qq.com` or `login.work.weixin.qq.com`
- `GET /api/auth/me` without Authorization header returns 401

The two probes the script cannot fully automate (inbox click + WeChat scan) require Maurice to do once. Both should land on `/packs#wall` signed in.

Once all five autonomous probes plus both manual flows pass, write the receipt:

```bash
{
  echo "deploy_completed_at=$(date -u +%Y-%m-%dT%H:%M:%SZ)"
  echo "email_e2e=PASS"
  echo "wechat_e2e=PASS"
} > state/openclaw-foundry-audit/auth-deploy-receipt.txt
```

The goal-gate `T10` verify checks for this file before allowing `/goal complete`.

## Failure modes + remediation

| Symptom | Likely cause | Fix |
|---|---|---|
| `wrangler secret put` returns `code: 10000` | Token scope or session expired | `npx wrangler login` (interactive OAuth) |
| `wrangler d1 execute` returns `code: 7403` | Token lacks D1:Edit | Same — `wrangler login` |
| `/login` still shows "未配置" after deploy | Pages build not yet deployed | Check <https://dash.cloudflare.com/?to=/:account/pages> for build state |
| `/api/auth/request` returns 502 | RESEND_API_KEY wrong or revoked | `wrangler secret put RESEND_API_KEY` again with a fresh key |
| `/api/auth/wechat/start` returns 503 | One of CORP_ID/AGENT_ID/SECRET missing | `wrangler secret list` to confirm; re-put any that show absent |
| WeChat OAuth landing returns 400 "state expired" | User waited >10 min between QR scan and exchange | Restart the flow; this is a security feature, not a bug |
| WeChat OAuth landing returns `code: 60011` from Tencent | Cohort member not in corp | Add them via "通讯录 → 添加成员"; ask them to re-scan |

---

Maurice | maurice_wen@proton.me
