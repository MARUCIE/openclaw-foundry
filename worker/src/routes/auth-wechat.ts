// /api/auth/wechat — Enterprise WeChat (企业微信) self-built app OAuth 2.0
// Personal WeChat web login is intentionally NOT supported — it requires ICP
// filing on the callback domain, which is structurally impossible for
// `.pages.dev` Cloudflare-owned subdomains. Enterprise WeChat self-built app
// uses a trusted-domain (可信域名) verification file instead of ICP, so it
// works on openclaw-foundry.pages.dev.
//
// Cohort fit: Maurice's PMs all have personal WeChat. The setup asks Maurice
// to (a) create a free Enterprise WeChat corp, (b) create a self-built app,
// (c) invite cohort members to the corp (one-time, takes ~30s per person).
// Login UX = one scan via the cohort member's personal WeChat (corp invite
// links their personal WX to the corp).
//
// HITL provisioning (one-time):
//   wrangler secret put WECHAT_CORP_ID    # corp ID from "我的企业 → 企业信息"
//   wrangler secret put WECHAT_AGENT_ID   # self-built app ID from "应用管理 → 自建"
//   wrangler secret put WECHAT_SECRET     # app Secret from same panel
//   wrangler secret put PAGES_BASE_URL    # https://openclaw-foundry.pages.dev (no trailing slash)
// Plus: drop the WW_verify_<token>.txt file from WeChat admin into web/public/

import { Hono } from 'hono';
import type { Env } from '../index';
import { randomToken, sha256Hex } from '../lib/auth';

interface WechatEnv extends Env {
  WECHAT_CORP_ID?: string;
  WECHAT_AGENT_ID?: string;
  WECHAT_SECRET?: string;
  PAGES_BASE_URL?: string;
}

export const wechatAuth = new Hono<{ Bindings: WechatEnv }>();

function pagesBase(env: WechatEnv): string {
  return (env.PAGES_BASE_URL || 'https://openclaw-foundry.pages.dev').replace(/\/$/, '');
}

function configured(env: WechatEnv): boolean {
  return !!(env.WECHAT_CORP_ID && env.WECHAT_AGENT_ID && env.WECHAT_SECRET);
}

function b64urlEncode(s: string): string {
  return btoa(s).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function b64urlDecode(s: string): string {
  const padded = s.replace(/-/g, '+').replace(/_/g, '/') + '==='.slice((s.length + 3) % 4);
  return atob(padded);
}

// GET /api/auth/wechat/start?return=<path> → 302 to Enterprise WeChat OAuth
wechatAuth.get('/start', (c) => {
  const env = c.env;
  if (!configured(env)) {
    return c.json({
      error: 'wechat oauth not configured',
      remediation: 'wrangler secret put WECHAT_CORP_ID + WECHAT_AGENT_ID + WECHAT_SECRET',
    }, 503);
  }
  const returnTo = c.req.query('return') || '/packs#wall';
  // State carries the return-URL + a nonce + timestamp; checked on callback to
  // bound CSRF window. Not signed — for a 6-person cohort the trust model is
  // "only members in the corp can complete the flow anyway".
  const state = b64urlEncode(JSON.stringify({
    r: returnTo,
    n: Math.random().toString(36).slice(2, 10),
    t: Date.now(),
  }));
  // Landing page on Pages will fetch /api/auth/wechat/exchange with ?code&state
  const redirectUri = `${pagesBase(env)}/auth/wechat-landing`;
  const oauthUrl =
    `https://open.weixin.qq.com/connect/oauth2/authorize` +
    `?appid=${encodeURIComponent(env.WECHAT_CORP_ID!)}` +
    `&redirect_uri=${encodeURIComponent(redirectUri)}` +
    `&response_type=code` +
    `&scope=snsapi_base` +
    `&agentid=${encodeURIComponent(env.WECHAT_AGENT_ID!)}` +
    `&state=${state}` +
    `#wechat_redirect`;
  return c.redirect(oauthUrl, 302);
});

// GET /api/auth/wechat/exchange?code=<>&state=<> → Bearer JSON
// Called from /auth/wechat-landing on the Pages domain after the OAuth bounce.
wechatAuth.get('/exchange', async (c) => {
  const env = c.env;
  if (!configured(env)) {
    return c.json({ error: 'wechat oauth not configured' }, 503);
  }
  const code = c.req.query('code');
  const stateRaw = c.req.query('state') || '';
  if (!code) {
    return c.json({ error: 'missing code parameter' }, 400);
  }
  let returnTo = '/packs#wall';
  try {
    const decoded = JSON.parse(b64urlDecode(stateRaw)) as { r?: string; t?: number };
    if (decoded.r && decoded.r.startsWith('/')) returnTo = decoded.r;
    // 10-minute state validity window
    if (!decoded.t || Date.now() - decoded.t > 10 * 60 * 1000) {
      return c.json({ error: 'state expired — please restart login' }, 400);
    }
  } catch {
    return c.json({ error: 'malformed state' }, 400);
  }

  // Step 1: corp access_token (5,000/day rate limit; cache later in KV if needed)
  const tokenUrl =
    `https://qyapi.weixin.qq.com/cgi-bin/gettoken` +
    `?corpid=${encodeURIComponent(env.WECHAT_CORP_ID!)}` +
    `&corpsecret=${encodeURIComponent(env.WECHAT_SECRET!)}`;
  const tokenResp = await fetch(tokenUrl);
  const tokenData = await tokenResp.json().catch(() => ({})) as {
    errcode?: number; errmsg?: string; access_token?: string;
  };
  if (tokenData.errcode || !tokenData.access_token) {
    console.error('WeChat gettoken failed:', tokenData);
    return c.json({
      error: 'wechat access_token fetch failed',
      detail: tokenData.errmsg || 'unknown',
    }, 502);
  }
  const accessToken = tokenData.access_token;

  // Step 2: getuserinfo (code → corp UserId)
  const userInfoUrl =
    `https://qyapi.weixin.qq.com/cgi-bin/auth/getuserinfo` +
    `?access_token=${encodeURIComponent(accessToken)}` +
    `&code=${encodeURIComponent(code)}`;
  const uiResp = await fetch(userInfoUrl);
  const ui = await uiResp.json().catch(() => ({})) as {
    errcode?: number; errmsg?: string; userid?: string; user_ticket?: string;
  };
  if (ui.errcode || !ui.userid) {
    console.error('WeChat getuserinfo failed:', ui);
    return c.json({
      error: 'wechat code exchange failed',
      detail: ui.errmsg || 'unknown',
    }, 401);
  }

  // Step 3: user/get for display name + email (optional but improves UX)
  const userGetUrl =
    `https://qyapi.weixin.qq.com/cgi-bin/user/get` +
    `?access_token=${encodeURIComponent(accessToken)}` +
    `&userid=${encodeURIComponent(ui.userid)}`;
  const userGetResp = await fetch(userGetUrl);
  const userGet = await userGetResp.json().catch(() => ({})) as {
    errcode?: number; name?: string; email?: string; biz_mail?: string; avatar?: string;
  };

  const displayName = userGet.name || ui.userid;
  // Prefer biz_mail (corporate email) > email > synthetic local email
  const email =
    userGet.biz_mail ||
    userGet.email ||
    `wecom-${ui.userid.toLowerCase()}@wecom.openclaw.local`;

  // Step 4: upsert user in D1
  const now = new Date().toISOString();
  const existing = await env.DB.prepare(
    `SELECT id FROM users WHERE email = ?`
  ).bind(email).first<{ id: string }>();
  let userId: string;
  if (existing) {
    userId = existing.id;
    await env.DB.prepare(
      `UPDATE users SET last_login_at = ?, display_name = COALESCE(display_name, ?) WHERE id = ?`
    ).bind(now, displayName, userId).run();
  } else {
    userId = `usr_wx_${ui.userid.toLowerCase().replace(/[^a-z0-9]/g, '_').slice(0, 24)}_${Math.random().toString(36).slice(2, 8)}`;
    await env.DB.prepare(
      `INSERT INTO users (id, email, email_verified_at, created_at, last_login_at, display_name)
       VALUES (?, ?, ?, ?, ?, ?)`
    ).bind(userId, email, now, now, now, displayName).run();
  }

  // Step 5: mint a 30-day Bearer session
  const bearer = randomToken();
  const bearerHash = await sha256Hex(bearer);
  const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
  await env.DB.prepare(
    `INSERT INTO sessions (session_token_hash, user_id, created_at, expires_at)
     VALUES (?, ?, ?, ?)`
  ).bind(bearerHash, userId, now, expiresAt).run();

  return c.json({
    bearer_token: bearer,
    expires_at: expiresAt,
    user: {
      id: userId,
      email,
      display_name: displayName,
      email_verified_at: now,
    },
    return_to: returnTo,
    provider: 'wecom',
  });
});
