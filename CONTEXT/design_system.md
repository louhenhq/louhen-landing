# Louhen Landing Design System (Locked 2025-10-01)

This document is the single source of truth for Louhen Landing design decisions. Updates must follow the governance process defined below and mirror entries in [`decision_log.md`](decision_log.md#louhen-landing--design-system-locked-2025-10-01).

## 1. Core Principles
- **Trust-first**: Every surface should signal credibility, privacy stewardship, and craft.
- **Visual calm**: Favor generous whitespace, limited concurrent animation, and restrained palettes.
- **Scalability**: Components and tokens translate across new landing slices without redesign.
- **Accessibility**: WCAG 2.2 AA is the floor; plan for AAA typography where feasible.

## 2. Typography
- **Families**: `--font-heading` locks Fraunces Variable (opsz axis on) at weights 600–700 with fallbacks `Iowan Old Style`, `Palatino Linotype`, `Palatino`, `Times New Roman`, `ui-serif`, `serif`. `--font-body` locks Inter at weights 400/500/600 with fallbacks `Inter`, `Segoe UI`, `Helvetica Neue`, `Arial`, `system-ui`, `sans-serif`.
- **Utilities**: Tailwind exports the fixed scale; do not invent alternates.
  - `text-display-xl` — Hero H1 / marquee surfaces. `clamp(2.5rem, 1.65rem + 2.8vw, 3.5rem)`, Fraunces 700, line-height 1.1, letter-spacing −0.02em, `opsz` 48.
  - `text-display-lg` — Section H2. `clamp(2rem, 1.45rem + 1.6vw, 2.75rem)`, Fraunces 600, line-height 1.18, letter-spacing −0.015em, `opsz` 40.
  - `text-h3` — Card headings / inline headlines. `clamp(1.75rem, 1.45rem + 0.6vw, 2.125rem)`, Fraunces 600, line-height 1.24, letter-spacing −0.01em, `opsz` 32.
  - `text-body` — Core paragraphs. 1rem Inter 400, line-height 1.6, letter-spacing −0.01em.
  - `text-body-sm` — Supporting copy (labels, helper text). 0.9375rem Inter 400, line-height 1.5, letter-spacing −0.005em.
  - `text-label` — Buttons, inputs, nav items. 1rem Inter 600, line-height 1.35, letter-spacing 0.015em.
  - `text-meta` — Eyebrows/meta. 0.8125rem Inter 500, line-height 1.4, letter-spacing 0.075em (safe uppercase).
- **CLS protections**: Fraunces + Inter are self-hosted via `next/font` with `font-display: swap` + build-time preload. Root fallbacks on `--font-heading` / `--font-body` mirror the live metrics, so CLS under throttled 3G stays ≈0; keep hero and CTA containers sized so fallback text cannot reflow on swap.
- **Usage rules**: All runtime typography must use the utilities above; no `text-[N]`, inline `font-family`, or font-size/weight animation. Respect `prefers-reduced-motion` by animating opacity/transform only.
- **Internationalisation**: Hero and H2 copy must read cleanly in EN + DE, allowing 1–2 lines at 320px. Never truncate; let the clamp scale and `text-balance` handle wrapping.

## 3. Color Tokens
- **Semantic tokens**: `brand.primary`, `brand.secondary`, `brand.muted`, `brand.accent`, seasonal accents (`season.spring.accent`, etc.), neutral scale (`neutral.0`–`neutral.100`), backgrounds (`background.canvas|surface|raised|overlay`), text (`text.default|muted|inverse|link`), borders (`border.subtle|strong|focus`), and feedback (`feedback.success|warning|error|info`, plus `*.surface` + `*.border`).
- **Rules**: Only reference semantic tokens; Style Dictionary owns hex mappings. Seasonal accents (`season.spring.*`, `season.autumn.*`) swap per campaign without touching component primitives.
- **Contrast**: Minimum contrast ratio 4.5:1 for body text, 3:1 for large headings; confirm in both themes.

### Token Categories

| Category | Example tokens | Notes |
| --- | --- | --- |
| Brand | `--color-brand-primary`, `--color-brand-on-primary`, `--color-brand-accent` | Use for primary CTAs, hero gradients, and trust callouts. |
| Neutrals | `--color-neutral-0` → `--color-neutral-100` | Drive backgrounds, copy, and admin UI; legacy Tailwind aliases (`slate-*`) map to this scale. |
| Backgrounds | `--color-background-canvas`, `--color-background-surface`, `--color-background-overlay` | Canvas = page, surface = cards, overlay = scrims/backdrops. |
| Text | `--color-text-default`, `--color-text-muted`, `--color-text-inverse`, `--color-text-link` | Muted copy always passes AA on both themes; inverse reserved for dark surfaces. |
| Borders | `--color-border-subtle`, `--color-border-strong`, `--color-border-focus` | Focus rings must use the focus token; no ad-hoc outlines. |
| Feedback | `--color-feedback-success`, `--color-feedback-success-surface`, `--color-feedback-success-border` (same for warning/error/info) | Pair status foreground, surface, and border tokens for alerts and badges. |
| Spacing | `--spacing-4`, `--spacing-8`, `--spacing-16`, `--spacing-24`, `--spacing-32`, `--spacing-48`, `--spacing-64`, `--spacing-gutter`, aliases `--spacing-alias-xs`…`--spacing-alias-2xl` | Scale is 4 → 64 (0.25rem → 4rem). Tailwind `px-4` etc. resolve to these CSS vars. |
| Radii | `--radii-sm`, `--radii-md`, `--radii-lg`, `--radii-xl`, `--radii-2xl`, `--radii-pill` | Buttons/inputs default to 2xl; pills for badges and CTA chips. |
| Shadows | `--shadow-card`, `--shadow-elevated`, `--shadow-focus` | `shadow-*` utilities map to these tokens; no custom box-shadow strings in runtime code. |

### Token Enforcement

- Runtime code must reference CSS variables (`var(--color-*)`, `var(--spacing-*)`, etc.) via Tailwind utilities or shared helpers—no raw hex values, pixel lengths, or box-shadow strings.
- The `guard-hex` lint step blocks commits containing hard-coded color literals; keep palette changes inside `@louhen/design-tokens`.
- Legacy classnames (`bg-slate-900`, `text-emerald-600`, etc.) are temporarily aliased to semantic tokens via Tailwind; new work should prefer the explicit semantic utilities (`bg-brand-primary`, `text-feedback-success`, `border-border`).

## 4. Layout
- **Grid**: 12-column flex grid with `spacing.gutter` (mobile), `spacing.24` (tablet), `spacing.32` (desktop); max width 1440px.
- **Rhythm**: Section vertical padding clamps between `spacing.48` (mobile) and `spacing.64` (desktop). Horizontal and vertical rhythm stick to the 4 → 64 scale; no bespoke `px` values.
- **Constraints**: Content should respect safe-areas on mobile; hero copy spans ≤ 6 columns on desktop for readability.

### Layout Shell
- **Max width & gutters**: `--layout-max-width` locks the canvas to 1440px. Containers use `px-gutter` and the 12-column grid helper (`layout.grid`) so content scales smoothly from 320px–1440px without ad-hoc margins.
- **Section rhythm**: `layout.section` applies `padding-block: clamp(80px, 6vw + 32px, 120px)` via tokens to keep vertical cadence consistent across hero, feature blocks, and footer.
- **Sticky header**: Header sits on `top: 0`, uses translucent `bg-bg/80` with backdrop blur, and promotes to `shadow.elevated` once scrollY > 8px. Locale switcher, navigation, and waitlist CTA follow the focus order `skip → logo → nav → CTA → locale`.
- **Footer**: Reuses shell helpers, surfaces, and typography tokens. Includes GDPR reassurance copy, legal links, locale switcher, and cookie preferences entry point. Must hit AA contrast in light/dark and expose focus-visible rings.
- **Accessible anchor targets**: All shell regions expose IDs (`#how`, `#story`, `#waitlist`, `#faq`) with `scroll-margin-top` tied to the header height so skipping or jumping never hides content behind the sticky nav.

## 5. Components
- **Buttons**: Primary, secondary, tertiary variants; `rounded-2xl` corners; `shadow-card` by default; focus ring uses `border.focus` + `shadow.focus`. Utilities live in `app/(site)/_lib/ui.ts`—reuse instead of inlining classes.
- **Inputs**: Base, inline, and textarea share `--radii-2xl`, `border.subtle`, and spacing tokens (`px-md`, `py-sm`). Error/help text uses `text.feedback.*` and `text-text-muted` utilities.
- **Cards**: Use elevated surface tokens (`bg-bg-card`, `bg-bg`), consistent padding (16px → 24px tokens), and `shadow-card`; hover motion stays within opacity/translate limits.
- **Micro-interactions**: Hover/focus states animate opacity/position ≤ 200ms with ease-out curves; no color transitions outside token palette.

## 6. Motion
- **Framework**: Framer Motion + tokenized easing (`motion.curve.standard`, `motion.curve.entrance`).
- **Durations**: 150–300ms; stagger ≤ 120ms.
- **Reduced motion**: Respect `prefers-reduced-motion`; fallback to fades/instant states; disable parallax.
- **Hero**: Lottie hero animations budget ≤ 250KB zipped; provide static fallback image and pause on blur/tab-switch.
- **Transitions**: Avoid font weight or size tweens to preserve readability.

## 7. Accessibility
- **Color contrast**: AA compliance; AAA for primary body copy when feasible.
- **Typography**: Minimum body size 16px; interactive targets ≥ 44px in one dimension.
- **Focus**: Always use `:focus-visible` rings aligned with token colors; no focus suppression.
- **Navigation**: Logical tab order, skip-links where sections exceed 5 components.
- **Testing**: aXe and Lighthouse a11y audits must pass with zero critical issues before merge.

## 8. Internationalization
- **Locales**: BCP-47 routing keys (`en`, `de`, etc.) aligned with `next-intl` config.
- **Copy length**: Allow +30% length for DE range; hero headlines max 3 lines on desktop, 4 lines on mobile.
- **RTL readiness**: Components should mirror gracefully; no baked-in left/right padding values—use logical properties.
- **Content ops**: Copy updates flow through `messages/**` JSON with translation notes.

## 9. Dark Mode
- **Default**: Match system preference on first load; provide in-page toggle persisting via cookie/local storage.
- **Tokens**: Define `color-scheme: light dark` pairs; map `surface`, `border`, `text`, and `feedback` tokens explicitly.
- **Imagery**: Supply dark-friendly assets where contrast drops below thresholds; avoid pure-black backgrounds.

## 10. Content & Trust Microcopy
- **Tone**: Warm, confident, human; avoid jargon.
- **LouhenFit**: Keep the “LouhenFit guarantee” line consistent across hero and CTAs.
- **Compliance**: Always pair claims with GDPR reassurance and privacy links; mention data minimization in forms.
- **Calls to action**: Prefer verbs + benefit framing (“Join the waitlist to secure onboarding priority”).

## 11. Imagery & Illustration Style
- **Photography**: Light, airy lifestyle shots with authentic families; ensure consent and usage rights documented.
- **Illustrations**: Pastel palette, soft gradients, consistent stroke weight (1.5px–2px); align with product icons.
- **Compositional rules**: Use ample negative space; avoid aggressive diagonals that conflict with calm principle.

## 12. Governance
- **Proposal path**: Open an issue outlining rationale, affected components, and metrics.  
- **Documentation**: Update this file and add a dated entry to `decision_log.md` capturing acceptance criteria, impact, and risks.  
- **Review**: Tag design, accessibility, and engineering leads; secure approval before implementation.  
- **Checklists**: Update `.github/pull_request_template.md` if new guardrails or validation steps are required.  
- **Token changes**: Any new or renamed token requires (1) an issue describing the gap, (2) updates to `@louhen/design-tokens`, this document, and the decision log, and (3) verification that guard scripts (`scripts/guard-hex.mjs`) still pass.

## 13. Exceptions
- **Emails**: Transational email templates use inline styles to satisfy ESP requirements; colors come from generated `lib/email/colors.ts` and mirror the token palette.
- **Static media**: SVG assets in `public/` keep baked-in fills/strokes; replace assets if the palette shifts.
- **Admin / internal tooling**: Admin pages still rely on legacy Tailwind aliases (`slate-*`, etc.). The aliases resolve to semantic tokens today; migrate to explicit semantic utilities during the admin polish slice.
- **Onboarding prototype**: The `/onboarding` prototype flow continues to use neutral aliases (`bg-slate-900`, `focus:ring-slate-900`). Aliases map to neutral tokens; rework once the onboarding design slice kicks off.

## What is locked vs adjustable

| Locked (require decision log update) | Adjustable (still guard-railed) |
| --- | --- |
| Core principles (trust, calm, scalability, a11y) | Token numeric values (within semantic structure) |
| Font families: Fraunces (headings), Inter (body/UI) | Section ordering within landing pages |
| Tokenization rule (semantic tokens only; no raw hex/radius/shadow literals) | Illustration style nuances within pastel/light constraints |
| Component primitives (Buttons, Inputs, Cards baselines) | Seasonal accent selections and campaign imagery |
| Motion governance (Framer Motion, reduced-motion behavior, hero Lottie budget) | Microcopy variations that maintain tone & trust commitments |
| Dark mode parity requirement with token mapping | Validation tooling references (command names) |
