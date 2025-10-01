# Louhen Landing Design System (Locked 2025-10-01)

This document is the single source of truth for Louhen Landing design decisions. Updates must follow the governance process defined below and mirror entries in [`decision_log.md`](decision_log.md#louhen-landing--design-system-locked-2025-10-01).

## 1. Core Principles
- **Trust-first**: Every surface should signal credibility, privacy stewardship, and craft.
- **Visual calm**: Favor generous whitespace, limited concurrent animation, and restrained palettes.
- **Scalability**: Components and tokens translate across new landing slices without redesign.
- **Accessibility**: WCAG 2.2 AA is the floor; plan for AAA typography where feasible.

## 2. Typography
- **Families**: Fraunces (variable) for headings (`--font-fraunces`, weights 600–700); Inter for body/UI (`--font-inter`, weights 400/500/600); fallbacks `"Times New Roman", serif` and `"Inter", "SF Pro Text", system-ui`, respectively.
- **Utilities**: Type tokens expose `type.heading.*` and `type.body.*` utilities with clamp-based sizes (min ≥ 1.125rem, max ≤ 4rem) and guard rails for line-height (headings 1.2–1.32, body 1.5–1.65) and letter-spacing (≤ 0.02em).
- **CLS protections**: Preload Fraunces subset (latin) with `font-display: swap`; ensure `link rel="preload"` + `next/font` metadata land in `<head>`. Define skeleton fallback using Inter weight 600 to minimize shift.
- **Usage**: All typography must route through tokens/utility classes; no hard-coded `font-family` or raw `font-size` declarations.

## 3. Color Tokens
- **Semantic tokens**: `brand.primary`, `brand.secondary`, `accent.seasonal`, `text.default`, `text.muted`, `surface.default`, `surface.elevated`, `border.subtle`, `feedback.success|info|warning|danger`.
- **Rules**: Only reference semantic tokens; Style Dictionary owns hex mappings. Seasonal accents (`accent.spring`, `accent.autumn`, etc.) are swappable per campaign.
- **Contrast**: Minimum contrast ratio 4.5:1 for body text, 3:1 for large headings; confirm in both themes.

## 4. Layout
- **Grid**: 12-column flex grid with 16px gutter (mobile), 24px (tablet), 32px (desktop); max width 1440px.
- **Rhythm**: Section vertical padding clamps between 80–120px; use the shared spacing scale (`space.2`–`space.24`, 4px increments).
- **Constraints**: Content should respect safe-areas on mobile; hero copy spans ≤ 6 columns on desktop for readability.

## 5. Components
- **Buttons**: Primary, secondary, tertiary variants; `rounded-2xl` corners; soft elevation shadow token; focus ring uses `outline.token.focus`.
- **Inputs**: Base, inline, and textarea share 2xl radii, 1px subtle border, and 8px–16px padding scale; error/help text uses `type.body.sm`.
- **Cards**: Use elevated surface tokens, consistent padding (24px desktop, 16px mobile), and subtle motion on hover (translateY 4px max).
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

## What is locked vs adjustable

| Locked (require decision log update) | Adjustable (still guard-railed) |
| --- | --- |
| Core principles (trust, calm, scalability, a11y) | Token numeric values (within semantic structure) |
| Font families: Fraunces (headings), Inter (body/UI) | Section ordering within landing pages |
| Tokenization rule (semantic tokens only; no raw hex/radius/shadow literals) | Illustration style nuances within pastel/light constraints |
| Component primitives (Buttons, Inputs, Cards baselines) | Seasonal accent selections and campaign imagery |
| Motion governance (Framer Motion, reduced-motion behavior, hero Lottie budget) | Microcopy variations that maintain tone & trust commitments |
| Dark mode parity requirement with token mapping | Validation tooling references (command names) |
