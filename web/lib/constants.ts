// Shared constants — single source of truth for the OCF frontend
// Eliminates duplicated definitions across 6+ page files

import type { ClawHubSkill } from './api';

// ── Rating Colors (raw hex, for inline style={{}} usage) ──

export const RATING_COLORS: Record<string, { bg: string; text: string }> = {
  S: { bg: '#fef3c7', text: '#92400e' },
  A: { bg: '#dbeafe', text: '#1e40af' },
  B: { bg: '#f1f5f9', text: '#475569' },
  C: { bg: '#f3f4f6', text: '#6b7280' },
  D: { bg: '#fef2f2', text: '#dc2626' },
};

// Rating badge classes (Tailwind, for listing cards)
export const RATING_BADGE_CLASSES: Record<string, string> = {
  S: 'bg-amber-100 text-amber-700',
  A: 'bg-blue-100 text-blue-700',
  B: 'bg-slate-100 text-slate-600',
  C: 'bg-gray-100 text-gray-500',
  D: 'bg-red-50 text-red-400',
};

// ── Provider Type Icons (Material Symbols) ──

export const TYPE_ICONS: Record<string, string> = {
  desktop: 'desktop_windows',
  cloud: 'cloud',
  saas: 'language',
  mobile: 'smartphone',
  remote: 'router',
};

// ── Provider Type Colors ──

export const TYPE_COLORS: Record<string, string> = {
  desktop: 'var(--surface-tint)',
  saas: 'var(--secondary)',
  cloud: '#e65100',
  mobile: 'var(--on-tertiary-container)',
  remote: '#616161',
};

// ── Tier Configuration ──

export const TIER_CONFIG: Record<string, {
  bg: string; color: string; dot: string; icon: string; labelKey: string;
}> = {
  'full-auto': { bg: 'var(--tertiary-fixed)', color: 'var(--on-tertiary-fixed)', dot: '#22c55e', icon: 'bolt', labelKey: 'tier.fullAuto' },
  'semi-auto': { bg: 'var(--secondary-fixed)', color: 'var(--on-secondary-fixed)', dot: '#f59e0b', icon: 'auto_awesome_motion', labelKey: 'tier.semiAuto' },
  'guided': { bg: 'var(--surface-container-high)', color: 'var(--on-surface)', dot: '#94a3b8', icon: 'menu_book', labelKey: 'tier.guided' },
};

// ── Permission Severity Styles ──

export const SEVERITY_STYLES: Record<string, { bg: string; color: string }> = {
  safe: { bg: '#dcfce7', color: '#166534' },
  warn: { bg: '#fef9c3', color: '#854d0e' },
  danger: { bg: '#fee2e2', color: '#991b1b' },
};

// ── Install Targets (verified March 2026) ──

export interface InstallTarget {
  id: string;
  name: string;
  icon: string;
  cmdSkill: ((slug: string) => string) | null;
  cmdMcp: ((slug: string, repo: string) => string) | null;
}

export const INSTALL_TARGETS: InstallTarget[] = [
  { id: 'claude', name: 'Claude Code', icon: 'terminal',
    cmdSkill: (s) => `claude plugin install ${s}`,
    cmdMcp: (s, repo) => `claude mcp add ${s} -- npx -y ${repo}` },
  { id: 'openclaw', name: 'OpenClaw / Lobster', icon: 'smart_toy',
    cmdSkill: (s) => `clawhub install ${s}`,
    cmdMcp: null },
  { id: 'cursor', name: 'Cursor', icon: 'edit',
    cmdSkill: null,
    cmdMcp: (s, repo) => `# .cursor/mcp.json\n{\n  "mcpServers": {\n    "${s}": {\n      "command": "npx",\n      "args": ["-y", "${repo}"]\n    }\n  }\n}` },
  { id: 'vscode', name: 'VS Code / Copilot', icon: 'code',
    cmdSkill: null,
    cmdMcp: (s, repo) => `# .vscode/mcp.json\n{\n  "servers": {\n    "${s}": {\n      "command": "npx",\n      "args": ["-y", "${repo}"]\n    }\n  }\n}` },
  { id: 'windsurf', name: 'Windsurf', icon: 'air',
    cmdSkill: null,
    cmdMcp: (s, repo) => `# ~/.codeium/windsurf/mcp_config.json\n{\n  "mcpServers": {\n    "${s}": {\n      "command": "npx",\n      "args": ["-y", "${repo}"]\n    }\n  }\n}` },
  { id: 'cline', name: 'Cline', icon: 'psychology',
    cmdSkill: null,
    cmdMcp: (s, repo) => `# cline_mcp_settings.json\n{\n  "mcpServers": {\n    "${s}": {\n      "command": "npx",\n      "args": ["-y", "${repo}"]\n    }\n  }\n}` },
  { id: 'cli', name: 'skills.directRun', icon: 'play_arrow',
    cmdSkill: null,
    cmdMcp: (_s, repo) => `npx -y ${repo}` },
];

// ── Utility Functions ──

export function formatNum(n: number): string {
  if (n >= 100000) return (n / 1000).toFixed(0) + 'k';
  if (n >= 1000) return (n / 1000).toFixed(1) + 'k';
  return String(n);
}

export function getInstallId(skill: ClawHubSkill): string {
  if (skill.source === 'mcp-registry') return skill.slug || skill.name;
  return `${skill.author}/${skill.slug || skill.name}`;
}

export function getRepoName(skill: ClawHubSkill): string {
  if (skill.repositoryUrl) {
    const m = skill.repositoryUrl.match(/github\.com\/([^/]+\/[^/]+)/);
    if (m) return m[1];
  }
  return skill.slug || skill.name;
}
