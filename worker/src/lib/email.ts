// Email delivery — Resend API integration for passwordless magic-link auth.
// Falls back to console.log when RESEND_API_KEY env binding is missing so dev
// and first-deploy work without a secret; production cohort use requires
// Maurice to provision the secret via `wrangler secret put RESEND_API_KEY`.

export interface SendMagicLinkInput {
  to: string;                  // recipient email
  link: string;                // full https://openclaw-foundry.pages.dev/auth/callback?token=...
  expires_minutes: number;     // for display in the email body
  apiKey: string | undefined;  // Worker env binding c.env.RESEND_API_KEY
  fromOverride?: string;       // optional sender; defaults to onboarding@resend.dev (Resend's shared dev sender)
}

export interface SendMagicLinkResult {
  ok: boolean;
  delivered_via: 'resend' | 'console_fallback';
  message_id?: string;
  error?: string;
}

const SUBJECT = 'OpenClaw Foundry · 登陆链接（15 分钟有效）';

function renderHtml(link: string, expiresMinutes: number): string {
  // Minimal email-safe HTML — no external CSS, table-based for client compat.
  return `<!DOCTYPE html>
<html><body style="margin:0;padding:0;background:#F3F0E9;font-family:-apple-system,Segoe UI,Helvetica,Arial,sans-serif;color:#1c1917;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#F3F0E9;padding:48px 24px;">
<tr><td align="center">
<table width="540" cellpadding="0" cellspacing="0" style="max-width:540px;background:#ffffff;border-radius:16px;padding:40px;">
<tr><td>
<h1 style="font-size:24px;line-height:1.3;margin:0 0 16px;color:#1c1917;">OpenClaw Foundry</h1>
<p style="font-size:16px;line-height:1.6;margin:0 0 24px;color:#44403c;">点击下面的链接登陆 — 链接 ${expiresMinutes} 分钟内有效，仅限单次使用：</p>
<p style="margin:0 0 24px;"><a href="${link}" style="display:inline-block;background:#D67052;color:#ffffff;text-decoration:none;padding:14px 28px;border-radius:10px;font-weight:bold;font-size:15px;">立即登陆 →</a></p>
<p style="font-size:13px;line-height:1.5;margin:0 0 12px;color:#78716c;">如果按钮无法点击，请复制以下链接到浏览器：</p>
<p style="font-size:12px;line-height:1.5;margin:0 0 24px;color:#a8a29e;word-break:break-all;">${link}</p>
<p style="font-size:12px;line-height:1.5;margin:24px 0 0;color:#a8a29e;border-top:1px solid #e7e5e4;padding-top:16px;">如果不是你本人请求，请忽略此邮件。链接不会被复用。</p>
</td></tr>
</table>
</td></tr>
</table>
</body></html>`;
}

function renderText(link: string, expiresMinutes: number): string {
  return `OpenClaw Foundry 登陆链接
=====

点击链接登陆（${expiresMinutes} 分钟内有效，仅限单次使用）：

${link}

如果不是你本人请求，请忽略此邮件。`;
}

export async function sendMagicLink(input: SendMagicLinkInput): Promise<SendMagicLinkResult> {
  const { to, link, expires_minutes, apiKey, fromOverride } = input;

  // Dev / first-deploy path: no secret yet → log instead of send so the auth
  // flow can still be exercised end-to-end (the token is in the URL).
  if (!apiKey) {
    console.warn(`[email] RESEND_API_KEY not set; logging magic link instead of sending. to=${to} link=${link}`);
    return { ok: true, delivered_via: 'console_fallback' };
  }

  const from = fromOverride || 'onboarding@resend.dev';
  const body = {
    from,
    to: [to],
    subject: SUBJECT,
    html: renderHtml(link, expires_minutes),
    text: renderText(link, expires_minutes),
  };

  try {
    const r = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify(body),
    });
    const json = await r.json() as { id?: string; message?: string };
    if (!r.ok) {
      console.error(`[email] resend ${r.status}: ${JSON.stringify(json)}`);
      return { ok: false, delivered_via: 'resend', error: json.message || `HTTP ${r.status}` };
    }
    return { ok: true, delivered_via: 'resend', message_id: json.id };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error(`[email] resend exception: ${msg}`);
    return { ok: false, delivered_via: 'resend', error: msg };
  }
}
