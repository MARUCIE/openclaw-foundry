import { clearSession, requireRegistered } from '@/lib/session';
import { API_BASE } from '@/lib/api-base';

// Back-compat alias — new code should import API_BASE from '@/lib/api-base' directly.
export const PROTECTED_API_BASE = API_BASE;

interface DownloadTokenResponse {
  token: string;
  expires_at: string;
}

function apiRoot(): string {
  const base = PROTECTED_API_BASE.startsWith('http')
    ? PROTECTED_API_BASE
    : `${window.location.origin}${PROTECTED_API_BASE.startsWith('/') ? '' : '/'}${PROTECTED_API_BASE}`;
  const trimmed = base.replace(/\/$/, '');
  return trimmed.endsWith('/api') ? trimmed : `${trimmed}/api`;
}

function packFileUrl(packId: string, filename: string, token?: string): string {
  const url = new URL(`${apiRoot()}/packs/${encodeURIComponent(packId)}/file`);
  url.searchParams.set('path', filename);
  if (token) url.searchParams.set('token', token);
  return url.toString();
}

async function createPackDownloadToken(packId: string, bearer: string): Promise<DownloadTokenResponse> {
  const res = await fetch(`${apiRoot()}/packs/${encodeURIComponent(packId)}/download-token`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${bearer}` },
  });
  const data = await res.json().catch(() => ({}));
  if (res.status === 401) {
    clearSession();
    throw new Error('登录已失效，请重新登录');
  }
  if (!res.ok || !data.token) {
    throw new Error(data.error || `下载授权失败：HTTP ${res.status}`);
  }
  return data as DownloadTokenResponse;
}

export async function copyProtectedPackInstallCommand(packId: string, returnPath?: string): Promise<void> {
  const session = requireRegistered(returnPath);
  if (!session) return;
  const { token } = await createPackDownloadToken(packId, session.token);
  const installUrl = packFileUrl(packId, 'install.sh', token);
  await navigator.clipboard.writeText(`curl -fsSL '${installUrl}' | bash`);
}

export async function downloadProtectedPackFile(packId: string, filename: string, returnPath?: string): Promise<void> {
  const session = requireRegistered(returnPath);
  if (!session) return;
  const res = await fetch(packFileUrl(packId, filename), {
    headers: { Authorization: `Bearer ${session.token}` },
  });
  if (res.status === 401) {
    clearSession();
    window.location.assign(returnPath ? `/login?return=${encodeURIComponent(returnPath)}` : '/login');
    return;
  }
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error || `下载失败：HTTP ${res.status}`);
  }
  const blob = await res.blob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename.split('/').pop() || filename;
  a.click();
  URL.revokeObjectURL(url);
}
