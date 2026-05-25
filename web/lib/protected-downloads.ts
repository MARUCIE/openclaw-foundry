import { clearSession, requireRegistered } from '@/lib/session';
import { API_BASE } from '@/lib/api-base';

export const PROTECTED_API_BASE = API_BASE;
export const ROLE_PACKS_GIT_URL =
  process.env.NEXT_PUBLIC_ROLE_PACKS_GIT_URL || 'https://github.com/MARUCIE/openclaw-role-packs.git';
export const ROLE_PACKS_GIT_REF = process.env.NEXT_PUBLIC_ROLE_PACKS_GIT_REF || 'v2026.05.25.4';

const PACK_ID_PATTERN = /^[a-z0-9][a-z0-9-]{1,80}$/;

function apiRoot(): string {
  const base = PROTECTED_API_BASE.startsWith('http')
    ? PROTECTED_API_BASE
    : `${window.location.origin}${PROTECTED_API_BASE.startsWith('/') ? '' : '/'}${PROTECTED_API_BASE}`;
  const trimmed = base.replace(/\/$/, '');
  return trimmed.endsWith('/api') ? trimmed : `${trimmed}/api`;
}

function shellQuote(value: string): string {
  return `'${value.replace(/'/g, `'\\''`)}'`;
}

function assertPackId(packId: string): void {
  if (!PACK_ID_PATTERN.test(packId)) {
    throw new Error('无效的配置包 ID');
  }
}

function packInstallCommand(packId: string): string {
  assertPackId(packId);
  const refArg = ROLE_PACKS_GIT_REF ? ` --branch ${shellQuote(ROLE_PACKS_GIT_REF)}` : '';
  return [
    'tmp="$(mktemp -d)"',
    `git clone --depth 1${refArg} ${shellQuote(ROLE_PACKS_GIT_URL)} "$tmp/openclaw-role-packs"`,
    `"$tmp/openclaw-role-packs/install.sh" ${shellQuote(packId)} --agent=claude`,
  ].join('\n');
}

function packFileUrl(packId: string, filename: string): string {
  assertPackId(packId);
  const url = new URL(`${apiRoot()}/packs/${encodeURIComponent(packId)}/file`);
  url.searchParams.set('path', filename);
  return url.toString();
}

export async function copyProtectedPackInstallCommand(packId: string, returnPath?: string): Promise<void> {
  if (!requireRegistered(returnPath)) return;
  await navigator.clipboard.writeText(packInstallCommand(packId));
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
