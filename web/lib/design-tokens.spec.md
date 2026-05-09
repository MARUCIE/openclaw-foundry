# Agent Foundry Design Tokens — Spec

> Canonical single source of truth for typography, color, spacing, radii, and shadow.
> TS module: `web/lib/design-tokens.ts` · CSS mirror: `web/app/globals.css :root`

## Scope

Every page in `web/app/**` must reference these tokens for any visible decoration. Drift inventory dated 2026-05-09 (`outputs/design-token-audit/2026-05-09/token-inventory.md`) found 105 raw hex colors and 248 arbitrary Tailwind values; this spec is the contract that closes that drift.

## Typography

### Font sizes (8 tokens, replacing 5 ad-hoc tiny-text variants)

| Token | Value | Tailwind utility | Use |
|---|---|---|---|
| `micro` | 9px | `text-[9px]` (kept) | Single tightest size — only badges with letterforms |
| `meta` | 10px | `text-meta` | Default tiny meta text (replaces 8/10/11px) |
| `caption` | 12px | `text-caption` (= text-xs) | Captions, helper text |
| `body` | 14px | `text-sm` | Default body |
| `bodyLg` | 16px | `text-base` | Emphasized body |
| `eyebrow` | 13px | `text-eyebrow` | Section eyebrow / kicker |
| `h3` | 20px | `text-xl` | Section titles |
| `h2` | 28px | `text-2xl-tight` | Page sub-headers |
| `h1` | clamp(28px, 4vw, 42px) | `text-h1-fluid` | Hero titles only |

### Font weights (5 levels, distribution rule)

| Weight | Value | Use | Cap |
|---|---|---|---|
| regular | 400 | Body text | unlimited |
| medium | 500 | Emphasized body, table headers | unlimited |
| semibold | 600 | Sub-headings, button labels | unlimited |
| bold | 700 | Section headings | unlimited |
| **black** | **900** | Hero numerics, verdict badges only | **<=30% of weighted nodes per page** |

Distribution rule: `font-black` count must be <= 30% of the sum of all font-weight modifiers per page. The 2026-05-09 baseline shows 76% — T6 sweep will bring it under 30%.

### Tracking (1 token)

| Token | Value | Use |
|---|---|---|
| `uppercase` | 0.18em | All uppercase tag/badge letter-spacing |

Banned: negative tracking, `tracking-[0.2em]`, `tracking-[0.3em]`, `tracking-[0.5em]`, `tracking-[-0.04em]`, `leading-[0.98]`.

## Color

47 MD3 tokens already defined in `globals.css :root` (see audit for full list). T2 adds:

| New CSS var | Value | Use |
|---|---|---|
| `--af-code-bg-dark` | `#0f111a` | Code block dark background (replaces 6 inline uses) |

Banned in `web/app/**`:
- Raw hex literals (`color: #0053db` etc) — must use `var(--primary-container)` or `palette.primaryContainer`
- Net-new colors not in the palette without first appending to this spec
- Inline rgba override of token-defined colors (use `surfaceContainer` etc instead)

T6 hard cap: < 5 raw hex literals total in `web/app/`.

## Radii

| Token | Value | Use |
|---|---|---|
| `none` | 0 | Borders, dividers |
| `sm` | 0.5rem (8px) | Small chips |
| `md` | 1rem (16px) | Cards |
| `lg` | 2rem (32px) | Hero cards |
| `pill` | 9999px | Tags, pills |

## Spacing

Keep Tailwind default scale. `spacing` token surface reserved for future override.

## Shadow

| Token | Use |
|---|---|
| `card` | Default card hover |
| `pill` | Active pill shadow |
| `focus` | Focus ring inner |

## Adoption path (T6)

1. Tailwind config extension (`web/tailwind.config.ts`, to be created if absent) maps token names to first-class utilities (`text-meta`, `text-caption`, `text-eyebrow`, `text-h1-fluid`, `tracking-uppercase`).
2. globals.css `:root` mirrors typography + new color tokens as `--af-*` CSS vars.
3. Per-route sweep replaces `text-[10px]` -> `text-meta`, etc.

## Verification

| Gate | Command | Pass criterion |
|---|---|---|
| Token module exists | `test -f web/lib/design-tokens.ts` | exit 0 |
| Has typography + palette exports | `grep -q "typography\|palette" web/lib/design-tokens.ts` | exit 0 |
| Hex hard cap | grep raw hex literals in web/app/ | < 5 |
| Arbitrary tw cap | grep `text-\[[0-9]+px\]` in web/app/ | < 10 |
| Font-black cap | grep font-black count in web/app/ | < 100 (down from 346) |

---

Maurice | maurice_wen@proton.me
