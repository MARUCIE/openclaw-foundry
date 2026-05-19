// Canonical worker API base — single source of truth (G8 from 2026-05-19 swarm audit)
//
// Resolution order:
//   1. NEXT_PUBLIC_API_BASE  (preferred for prod overrides)
//   2. NEXT_PUBLIC_API_URL   (legacy alias kept for back-compat with existing .env files)
//   3. Hard-coded fallback — only used when the build runs with no env passthrough
//
// To override at deploy time, set in CF Pages env vars:
//   NEXT_PUBLIC_API_BASE=https://api.your-domain.tld
//
// All web/* code MUST import this constant — never inline the fallback URL.

export const API_BASE =
  process.env.NEXT_PUBLIC_API_BASE ||
  process.env.NEXT_PUBLIC_API_URL ||
  'https://openclaw-foundry-api.maoyuan-wen-683.workers.dev';
