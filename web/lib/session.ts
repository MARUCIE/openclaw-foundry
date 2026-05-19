// Shared session state — extracted from wall-board.tsx so packs page,
// breakthroughs page, and future components can gate UI by auth state
// without duplicating the localStorage protocol.
//
// Source of truth for the magic-link v8 session keys:
//   openclaw_session_token   — Bearer token sent on POST/protected endpoints
//   openclaw_session_user    — JSON-serialized SessionUser snapshot
//   openclaw_session_expires — UNIX timestamp (ms) when token expires
//
// Both keys live in localStorage (cross-subdomain cookies infeasible because
// CF Pages + Worker host on different subdomains).

export interface SessionUser {
  id: string;
  email: string;
  display_name: string | null;
  email_verified_at: string;
}

export interface SessionState {
  token: string;
  user: SessionUser | null;
}

export function readSession(): SessionState {
  if (typeof window === 'undefined') return { token: '', user: null };
  let token = '';
  let user: SessionUser | null = null;
  try {
    const expiresRaw = window.localStorage.getItem('openclaw_session_expires');
    if (expiresRaw) {
      const expiresAt = Date.parse(expiresRaw);
      if (Number.isFinite(expiresAt) && expiresAt <= Date.now()) {
        clearSession();
        return { token: '', user: null };
      }
    }
    token = window.localStorage.getItem('openclaw_session_token') || '';
    const raw = window.localStorage.getItem('openclaw_session_user');
    if (raw) user = JSON.parse(raw) as SessionUser;
  } catch {
    // localStorage unavailable — treat as signed out
  }
  return { token, user };
}

export function clearSession(): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.removeItem('openclaw_session_token');
    window.localStorage.removeItem('openclaw_session_user');
    window.localStorage.removeItem('openclaw_session_expires');
  } catch {
    // ignore
  }
}

export function isLoggedIn(): boolean {
  const session = readSession();
  return !!(session.token && session.user);
}

// Helper for components that need to gate an action behind login.
// Returns a return-url-encoded /login path that bounces back to the
// caller's current page+hash post-auth.
export function loginRedirect(returnPath?: string): string {
  if (typeof window === 'undefined') return '/login';
  const r =
    returnPath ||
    window.location.pathname + window.location.search + window.location.hash;
  return `/login?return=${encodeURIComponent(r)}`;
}

export function requireRegistered(returnPath?: string): SessionState | null {
  const session = readSession();
  if (session.token && session.user) return session;
  if (typeof window !== 'undefined') {
    window.location.assign(loginRedirect(returnPath));
  }
  return null;
}
