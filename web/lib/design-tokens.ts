// Agent Foundry — unified design tokens
// Single source of truth for typography, color, spacing, and radii.
// Mirror these into web/app/globals.css as CSS custom properties so Tailwind
// arbitrary-value syntax (text-[var(--af-meta)]) and inline style consumers
// stay aligned.
//
// Project rule: cap font-black usage at <=30% of all weight occurrences.
// Reserve weight 900 for hero numerics and verdict badges. Headings use
// 700 (bold), sub-headings 600 (semibold), body emphasis 500 (medium).

export const typography = {
  fontSize: {
    micro: '9px',         // single tightest size, use sparingly (badges with letterforms only)
    meta: '10px',         // smallest body-row meta (replaces text-[10px], text-[11px], text-[8px], text-[9px])
    caption: '12px',      // captions, helper text (replaces text-[12px])
    body: '14px',         // default body text (Tailwind text-sm)
    bodyLg: '16px',       // emphasized body text (Tailwind text-base)
    eyebrow: '13px',      // section eyebrow / kicker
    h3: '20px',
    h2: '28px',
    h1: 'clamp(28px, 4vw, 42px)',
  },
  fontWeight: {
    regular: 400,
    medium: 500,
    semibold: 600,
    bold: 700,
    black: 900,
  },
  fontFamily: {
    sans: 'var(--font-inter), system-ui, sans-serif',
    mono: "'JetBrains Mono', ui-monospace, 'SF Mono', Menlo, monospace",
    icon: "'Material Symbols Outlined'",
  },
  lineHeight: {
    tight: 1.2,
    normal: 1.5,
    relaxed: 1.7,
  },
  tracking: {
    normal: '0',
    uppercase: '0.18em',  // canonical uppercase tag aesthetic (replaces tracking-[0.2em], tracking-[0.18em] variants)
  },
} as const;

// Color palette — re-exports the existing MD3 tokens defined in globals.css :root.
// Use these names in TS consumers; CSS consumers can use var(--<name>) directly.
export const palette = {
  surface: 'var(--surface)',
  surfaceDim: 'var(--surface-dim)',
  surfaceBright: 'var(--surface-bright)',
  surfaceContainer: 'var(--surface-container)',
  surfaceContainerLow: 'var(--surface-container-low)',
  surfaceContainerLowest: 'var(--surface-container-lowest)',
  surfaceContainerHigh: 'var(--surface-container-high)',
  surfaceContainerHighest: 'var(--surface-container-highest)',
  surfaceVariant: 'var(--surface-variant)',
  surfaceTint: 'var(--surface-tint)',
  background: 'var(--background)',

  onSurface: 'var(--on-surface)',
  onSurfaceVariant: 'var(--on-surface-variant)',
  onBackground: 'var(--on-background)',
  inverseSurface: 'var(--inverse-surface)',
  inverseOnSurface: 'var(--inverse-on-surface)',

  primary: 'var(--primary)',
  primaryContainer: 'var(--primary-container)',
  primaryFixed: 'var(--primary-fixed)',
  primaryFixedDim: 'var(--primary-fixed-dim)',
  inversePrimary: 'var(--inverse-primary)',
  onPrimary: 'var(--on-primary)',
  onPrimaryContainer: 'var(--on-primary-container)',

  secondary: 'var(--secondary)',
  secondaryContainer: 'var(--secondary-container)',
  secondaryFixed: 'var(--secondary-fixed)',
  secondaryFixedDim: 'var(--secondary-fixed-dim)',
  onSecondary: 'var(--on-secondary)',
  onSecondaryContainer: 'var(--on-secondary-container)',

  tertiary: 'var(--tertiary)',
  tertiaryContainer: 'var(--tertiary-container)',
  tertiaryFixed: 'var(--tertiary-fixed)',
  tertiaryFixedDim: 'var(--tertiary-fixed-dim)',
  onTertiary: 'var(--on-tertiary)',
  onTertiaryContainer: 'var(--on-tertiary-container)',

  error: 'var(--error)',
  errorContainer: 'var(--error-container)',
  onError: 'var(--on-error)',
  onErrorContainer: 'var(--on-error-container)',

  outline: 'var(--outline)',
  outlineVariant: 'var(--outline-variant)',

  // New tokens introduced by 2026-05-09 audit
  codeBgDark: 'var(--af-code-bg-dark)',          // #0f111a — code-block dark background
} as const;

export const radii = {
  none: '0',
  sm: '0.5rem',     // 8px — small chips
  md: '1rem',       // 16px — cards
  lg: '2rem',       // 32px — hero cards
  pill: '9999px',   // tag pills
} as const;

export const spacing = {
  // Project sticks to Tailwind's default scale; tokens here are reserved for future overrides.
  // Keep this object so consumers have a single import surface.
} as const;

export const shadow = {
  card: '0 8px 24px rgba(0, 62, 168, 0.08), 0 2px 8px rgba(0, 0, 0, 0.04)',
  pill: '0 2px 8px rgba(0, 62, 168, 0.2)',
  focus: '0 0 0 3px rgba(0, 83, 219, 0.15)',
} as const;

export const tokens = {
  typography,
  palette,
  radii,
  spacing,
  shadow,
} as const;

export type Tokens = typeof tokens;
