# Louhen Landing Design System (Locked 2025-10-01)

This document is the single source of truth for Louhen Landing design decisions. Updates must follow the governance process defined below and mirror entries in [`decision_log.md`](decision_log.md#louhen-landing--design-system-locked-2025-10-01).

## 1. Core Principles
- **Trust-first**: Every surface should signal credibility, privacy stewardship, and craft.
- **Visual calm**: Favor generous whitespace, limited concurrent animation, and restrained palettes.
- **Scalability**: Components and tokens translate across new landing slices without redesign.
- **Accessibility**: WCAG 2.2 AA is the floor; plan for AAA typography where feasible.

## 2. Typography
- **Families**: `--typography-font-family-display` maps to Fraunces Variable (opsz axis on) at weights 600–700 with fallbacks `Iowan Old Style`, `Palatino Linotype`, `Palatino`, `Times New Roman`, `ui-serif`, `serif`. `--typography-font-family-sans` maps to Inter at weights 400/500/600 with fallbacks `Inter`, `Segoe UI`, `Helvetica Neue`, `Arial`, `system-ui`, `sans-serif`.
- **Utilities**: Tailwind exports the fixed scale; do not invent alternates.
  - `text-display-xl` — Hero H1 / marquee surfaces. `clamp(2.5rem, 1.65rem + 2.8vw, 3.5rem)`, Fraunces 700, line-height 1.1, letter-spacing −0.02em, `opsz` 48.
  - `text-display-lg` — Section H2. `clamp(2rem, 1.45rem + 1.6vw, 2.75rem)`, Fraunces 600, line-height 1.18, letter-spacing −0.015em, `opsz` 40.
  - `text-h3` — Card headings / inline headlines. `clamp(1.75rem, 1.45rem + 0.6vw, 2.125rem)`, Fraunces 600, line-height 1.24, letter-spacing −0.01em, `opsz` 32.
  - `text-body` — Core paragraphs. 1rem Inter 400, line-height 1.6, letter-spacing −0.01em.
  - `text-body-sm` — Supporting copy (labels, helper text). 0.9375rem Inter 400, line-height 1.5, letter-spacing −0.005em.
  - `text-label` — Buttons, inputs, nav items. 1rem Inter 600, line-height 1.35, letter-spacing 0.015em.
  - `text-meta` — Eyebrows/meta. 0.8125rem Inter 500, line-height 1.4, letter-spacing 0.075em (safe uppercase).
- **CLS protections**: Fraunces + Inter are self-hosted via `next/font/local` with `font-display: swap` + build-time preload. Root fallbacks on `--typography-font-family-display` / `--typography-font-family-sans` mirror the live metrics, so CLS under throttled 3G stays ≈0; keep hero and CTA containers sized so fallback text cannot reflow on swap.
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

### UI primitives (locked)
- **Button**: Variants `primary` (brand fill), `secondary` (outline), `ghost` (chromeless), `destructive` (error) share `--radii-2xl` corners and tokenised shadows. Sizes `sm` (`text-body-sm`), `md`, `lg` control vertical rhythm; `loading` toggles `aria-busy`, Spinner, and pointer lock. `as="a"` preserves focus/role rules and applies `aria-disabled` when `disabled`/`loading`.
- **Input**: Leverages semantic border/focus tokens; `invalid` sets `aria-invalid` + feedback colors. Consumers must bind visible `<label>` and pipe `aria-describedby` to helper/error copy. Works for text/email/password while keeping native autocomplete attributes.
- **Checkbox**: Enlarged 20px control with semantic border/fill, tokenised focus ring, and hidden check indicator; `invalid` mirrors feedback styling. Pair with `<label htmlFor>` for clickable copy.
- **Card**: Variants `surface`, `outline`, `ghost` replace bespoke radius/shadow usage. `interactive` (or `as="button"|"a"`) enables subtle lift via `motion.cardLift`, respects `prefers-reduced-motion`, and retains focus ring coverage.
- **Motion helpers**: `motion.interactive` and `motion.cardLift` live in `app/(site)/_lib/ui.ts` and gate hover/entrance translations behind reduced-motion checks; no bespoke `transition-*` combos outside these helpers.

### Hero
- Composition locks to the 12-column shell: text column spans 5–6 columns, media column spans the remainder with tokenised gutter spacing and `layout.section` rhythm.
- Headline uses `text-display-xl` (Fraunces) with `text-balance`; subline stays in `text-body` muted; CTA stack uses primary + secondary button primitives.
- A micro-trust line (`text-meta`, neutral tokens) sits directly under the CTA stating “Covered by LouhenFit — free returns, guaranteed.”
- Media area reserves explicit aspect ratio (`>= 4/5`) and min-height to avoid CLS; ship a Lottie container with gradient fallback until the animation is ready.
- Honor `prefers-reduced-motion`: fade/translate entrance only when motion is allowed, no size/weight animation.
- i18n guardrail: EN + DE copy must wrap in ≤2 lines at 320px; allow soft-break hints rather than shrinking type.

### Trust Bar
- Sits directly beneath the hero and reuses `layout.section` (with optional `pt-0`) plus `layout.container`/`layout.grid` to stay on the 12-column rhythm.
- Exactly four reassurance tiles: podiatrist approved, GDPR/data safety, free returns with LouhenFit, and payments handled by Adyen.
- Tiles use neutral surfaces (`bg-bg-card`, `border-border`, `shadow-card`), 24px monochrome line icons, and `text-label` + `text-body-sm` copy; no brand gradients or loud colours.
- Each tile exposes an `aria-label` covering the full statement, opens the relevant trust modal on click, and keeps visible focus via the tokenised outline/shadow.
- Responsive behaviour: single column on narrow screens, 2x2 grid from >=480px, 4-up row on desktop; no horizontal overflow.
- Motion budget mirrors the hero: opacity/translate entrance only when motion is allowed; modals fade in without parallax. EN/DE strings must stay within two lines at 320px.

### How-it-Works
- Lives after the trust bar on landing, sharing the 12-column shell with `layout.section` + `layout.grid` (heading column + 3-up card grid).
- Exactly three steps (Scan, Match, Happy feet) with `text-h3` titles and `text-body` muted copy; supplementary link uses button/link primitives with visible focus.
- Illustration slot per card reserves a fixed aspect ratio (>= 4/3) with neutral placeholder graphics to prevent CLS until real art ships.
- Cards reuse `layout.card` tokens, keep gap-based spacing, and animate entrance with opacity/translate only when motion is allowed (prefer-reduced-motion skips animation).
- Accessibility: section labelled via visible H2, cards expose semantic headings plus optional descriptive `sr-only` text for the illustration; links meet focus + AA contrast requirements.
- Copy guardrails: EN/DE titles ≤ ~35 characters; body text ≤ two lines at 320px; link labels short verbs + nouns (no truncation).

### Waitlist CTA
- Section uses the shell grid (form spans 6–7 columns, reassurance aside spans the remainder) with `layout.section` rhythm and semantic heading tied to the skip link.
- Form stack order: email input, consent checkbox, inline hCaptcha container (declares min-height to prevent CLS), primary CTA button.
- Inputs/checkboxes must use the shared primitives; attach labels + `aria-describedby` so helpers/errors are announced, and keep consent copy inside the same block.
- Client validation surfaces a `role="alert"` summary plus field-level errors; focus jumps to the first invalid control. Success places focus on the confirmation heading and offers resend guidance.
- hCaptcha honours theme (light/dark) and `prefers-reduced-motion`; avoid scroll jumps by resetting tokens only after acknowledged states.
- EN/DE copy fits at 320px; no raw hex/spacing; all colors, radii, and shadows come from tokens.

## 6. Motion
- **Framework**: Framer Motion + tokenized easing (`motion.curve.standard`, `motion.curve.entrance`).
- **Durations**: 150–300ms; stagger ≤ 120ms.
- **Reduced motion**: Respect `prefers-reduced-motion`; fallback to fades/instant states; disable parallax.
- **Hero**: Lottie hero animations budget ≤ 250KB zipped; provide static fallback image and pause on blur/tab-switch.
- **Transitions**: Avoid font weight or size tweens to preserve readability.

## 7. Accessibility
- **Color contrast**: AA compliance; AAA for primary body copy when feasible.
- **Typography**: Minimum body size 16px; interactive targets >= 44px in one dimension.
- **Focus**: Always use `:focus-visible` rings aligned with token colors; no focus suppression.
- **Navigation**: Logical tab order, skip-links where sections exceed 5 components.
- **Testing**: aXe and Lighthouse a11y audits must pass with zero critical issues before merge.

## 8. Internationalization
- **Locales**: BCP-47 routing keys (`en`, `de`, etc.) aligned with `next-intl` config.
- **Copy length**: Allow +30% length for DE range; hero headlines max 3 lines on desktop, 4 lines on mobile.
- **RTL readiness**: Components should mirror gracefully; no baked-in left/right padding values—use logical properties.
- **Content ops**: Copy updates flow through `messages/**` JSON with translation notes.

## 9. Dark Mode
- **Mechanics**: `<html>` carries `data-theme-mode="system|light|dark"` and `data-theme="dark"` when the dark palette is active. A `<script>` in the document head runs before hydration to apply the correct mode using the `lh_theme`/`lh_contrast` cookies + `prefers-color-scheme`, eliminating FOUC.
- **Tokens**: `globals.css` remaps semantic tokens under `[data-theme="dark"]` so components stay token-driven (backgrounds, text, borders, focus rings, button colors, status surfaces). No runtime hex overrides.
- **Toggle**: `ThemeToggle` lives in the header, offering System → Light → Dark. Selections persist via cookies (180-day TTL) and update `data-theme-mode`; “System” always defers to the OS on reload.
- **Accessibility**: Dark theme must keep AA contrast for body copy, controls, borders, and focus outlines. The toggle announces changes via `aria-live` and respects `prefers-reduced-motion`.
- **Browser hints**: `<meta name="color-scheme" content="light dark">` and `document.documentElement.style.colorScheme` ensure form controls follow the active theme.
- **Imagery**: Keep photography/illustrations neutral; never invert assets via CSS. Prefer adding neutral surfaces if additional contrast is required.

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

## 12a. i18n & Locale Chrome (Locked 2025-10-10)

- **Pathing**: All localized routes use lowercase BCP-47 prefixes (`/{language}-{region}/…`). The root `/` is x-default and renders the market-default locale (`de-de`). Legacy slugs (`/en/`, `/de/`, `/method`) must 301 to their canonical prefixes, and middleware normalizes uppercase segments.
- **Switcher UX**: The header/footer switcher keeps focus, announces changes politely, and preserves the current path/query/hash. Switching writes the `louhen_locale` cookie (TTL 365d, scope `/`, SameSite=Lax) before navigating; scroll position is retained when no hash is present.
- **Locale detection**: `/` never auto-redirects bots. Humans see a suggestion banner prioritising `louhen_locale`, then `Accept-Language`. Suggestions must be dismissible and copy sourced from translations.
- **SEO**: Canonical + hreflang tags are generated via shared helpers. Every page emits alternates for all supported locales plus `x-default`, and Open Graph URLs are canonical. `robots.txt` disallows crawling unless `VERCEL_ENV=production` *and* `NEXT_PUBLIC_ALLOW_INDEXING=true`.
- **Sitemaps**: `app/sitemap.ts` enumerates every localized URL with alternates. Adding a locale in `SUPPORTED_LOCALES` automatically expands sitemap and metadata outputs—no manual duplication.
- **Content governance**: EN/DE strings must fit hero/H2 wrappers at 320px. New locales ship with placeholder markers (`[FR]`) until copy review. Run `npm run i18n:check` and mobile audits before merging.
- **Bot policy**: No geo redirects or Accept-Language auto-handoffs for crawlers (`bot`, `crawler`, `spider`, etc.). Unknown agents fall back to human suggestion flow.

## 12b. Performance & Accessibility Budgets (Locked 2025-10-10)

- **Core metrics**: CLS ≤ 0.05 (target ≈0), LCP ≤ 2.5s on throttled mobile (3G/4× CPU). Hero/media containers require explicit aspect ratios and min-heights; fonts preload once with `display: swap` and fallback metrics set.
- **Lighthouse gates**: Mobile runs must score Performance ≥ 90, Accessibility = 100, SEO ≥ 95, Best Practices ≥ 90. Budgets enforced via `lighthouserc.cjs`; do not lower thresholds.
- **Automation**: `npm run validate:local` builds, runs unit + Playwright + axe, and captures Lighthouse artifacts (`lighthouse-report/`, `playwright-report/`). Attach artifacts to PRs touching marketing routes.
- **Motion & focus**: All smooth scrolling and staged animations honour `prefers-reduced-motion` with instant fallbacks. Focus rings remain visible; no `outline: none`.
- **Media hygiene**: Use `next/image` or explicit `width`/`height`; lazy-load non-critical assets. Lottie/JSON animation payloads ≤150 KB and gated behind intersection observers; disable under reduced motion.
- **Network hints**: Preconnect only critical origins (fonts, hCaptcha). Avoid new third-party scripts without perf review. Static assets must ship with long-lived immutable caching.

## 12c. Trust Microcopy (Locked 2025-10-10)

- **Canonical keys**: Use `trustCopy.fitGuarantee` (hero micro-trust), `trustCopy.fitDetail` (supporting copy), `trustCopy.gdpr`/`gdprDetail`, `trustCopy.payment`, and `trustCopy.coverage.*` for coverage states. Never hardcode LouhenFit/GDPR/payment reassurance in components.
- **Surfaces**: Hero micro-trust, waitlist reassurance cards, privacy ribbon, waitlist success/confirmation flows, and future checkout/returns banners all read from these keys. Payment reassurance must mention Adyen.
- **Tone**: Warm, parent-first, calm. Keep lines ≤2 on 320px, use `text-meta`/`text-body-sm`, neutral tokens only. No jargon or fear-based language; emphasise support and transparency.
- **Coverage messaging**: Show whether each profile is covered by LouhenFit. Use named variants (`coverage.coveredNamed`, `coverage.notCoveredNamed`) when a child’s name is available; default to generic keys otherwise.
- **Accessibility**: Make reassurance copy screen-reader friendly (no duplicate announcements). Links to Privacy/Terms/Adyen must be focusable with visible rings.
- **Ops note**: When running builds/tests in offline environments, set `NEXT_USE_REMOTE_FONTS=false` to fall back to system fonts before capturing baselines.

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
