# Backlog — Header Initiative

Tracks upcoming slices for the marketing header. Update status as each slice lands; keep acceptance criteria crisp so QA and Codex stay aligned.

---

## Slice 0 — Documentation & Guardrails ✅
- Inventory existing header, consent, ribbon, and theme components.
- Document requirements in `/CONTEXT/header.md` plus supporting files (`i18n`, `seo`, `accessibility`, `performance`, `analytics_privacy`).
- Decision log updated with keep/adjust/delete notes.

---

## Slice 1 — Header Scaffold & Desktop IA
- Replace `components/features/header-nav/Header.tsx` with the documented layout (brand, desktop nav, CTA, locale switcher).
- Implement sticky + shrink behavior on scroll using intersection observer sentinel.
- Add skip link, ensure CTA scrolls to `#waitlist-form` and focuses first input.
- Accessibility: tab order matches spec; axe checks pass.
- Tests: unit tests for scroll helper, Playwright desktop scenario, axe run.

## Slice 2 — Mobile Drawer & Theme/Locale Controls ✅ (skeleton)
- Introduce accessible mobile drawer with focus trap and body scroll lock.
- Consolidate theme + contrast controls into single popover/dropdown alongside locale select.
- Persist locale via `NEXT_LOCALE` and ensure query params survive switching.
- Tests: Playwright mobile coverage (drawer open/close, locale switch), unit test for locale helper, axe mobile scan.

_Current status:_ structural drawer + responsive shell landed; future slices still need full focus-trap implementation and theme/consent control wiring.

## Slice 3 — Locale Switcher & i18n ✅
- Implement progressive enhancement locale switcher using `HeaderLocaleSwitcher` (client handler + `/locale/switch` fallback).
- Preserve path and query when changing locales; set `NEXT_LOCALE` cookie for SSR parity.
- Localize skip link and ensure every header page exposes `<main id="main-content">`.
- Tests: Playwright coverage for desktop/mobile switcher, axe smoke, canonical/hreflang spot checks.

## Slice 4 — Theme Toggle ✅
- Light/Dark/System toggle in header + drawer using design tokens; preferences persisted to cookie/localStorage.
- Inline no-flash script in `ThemeInit` applies stored mode before hydration; mobile/desktop parity covered by Playwright.
- Follow-up: add contrast controls once brand guidance lands.

## Slice 5 — Consent Controls ✅
- Consent badge in header/drawer opens modal manager with Accept/Reject/Privacy link, focus trap, and ESC support.
- Consent persisted via `louhen_consent` cookie; analytics queue cleared when consent withdrawn.
- Playwright coverage ensures no `/api/track` before grant, CTA events tracked after acceptance, and state returns to denied when revoked.
- Follow-up: granular settings (analytics vs marketing) and consent audit log export.

## Slice 6 — Promo Ribbon System
- Build ribbon component with campaign config (id, copy, CTA, dismissal TTL).
- Reserve layout space to avoid CLS; integrate analytics events (`header_ribbon_*`).
- Ensure ribbon coexists with header shrink logic and mobile drawer.
- Tests: unit test for dismissal TTL, Playwright verifying no CLS regression, screenshot for ribbon state.

_Status:_ CTA/ribbon analytics now emit locale+mode+surface with normalised targets; ribbon dismissal restores focus without introducing layout shift. Follow-up: QR modal campaign (separate slice) and drawer focus trap.

## Slice 7 — Motion System ✅
- Introduce `useScrollHeaderState` to manage `default` → `shrink` → `hidden` states with transform-only motion.
- Keep the header visible while focused (skip link, controls, CTA, drawer trigger) and short-circuit everything when `prefers-reduced-motion: reduce`.
- Expose `data-header-state`/`data-motion` hooks so Tailwind variants and tests can assert the active state without new analytics events.
- Tests: Playwright coverage for scroll hide/reveal, focus lock, and reduced-motion parity.

_Status:_ Motion engine shipped with focus-aware locks and token-driven thresholds; follow-up includes finishing the drawer focus trap in its dedicated slice and monitoring GPU layers in Lighthouse after adding future motion flourishes.

## Slice 8 — Mobile Drawer ✅
- Finish drawer focus trap, ESC/backdrop handling, and ensure trigger focus is restored when closing.
- Mirror desktop content (primary/secondary nav, system controls, CTA) with token-driven spacing and analytics instrumentation.
- Implement transform-only motion with reduced-motion fallback, scroll locking, and data attributes for testing.

_Status:_ Drawer focuses the heading on open, traps keyboard navigation, records `header_open_drawer`/`header_close_drawer` (with `trigger` detail), and unlocks scroll + focus intelligently after close. Follow-up: instrument per-link analytics if dashboards need drawer vs header attribution.

## Slice 9 — SEO & Structured Data ✅
- Align header-linked routes (landing, method, legal, waitlist) on canonical + hreflang helpers and ensure breadcrumbs emit with nonce.
- Normalize header UTMs across nav/CTA/ribbon by reusing `lib/url/appendUtmParams.ts`.
- Add Playwright coverage that validates canonical/hreflang entries and UTM-normalised links.

_Status:_ Metadata and JSON-LD follow the documented policy; header wordmark now uses `localeHomePath` and the waitlist page reuses the shared hreflang helper. Follow-up captured below to explore static export for `/tokens`.

## Slice 10 — Performance Hardening
- Lock header/ribbon dimensions, ensure skip link reveal is overlay-only, and keep CLS ~0 even during shrink transitions.
- Enforce intent-based prefetch for nav, drawer, and CTA links with explicit `data-prefetch-policy="intent"`.
- Keep motion hooks rAF-batched and honour `prefers-reduced-motion` before registering listeners; document perf budgets + testing expectations.

_Status:_ Intent-prefetch hooks and skip-link layout guard shipped; follow-up to run Lighthouse regression with ribbon variants.

## Slice 11 — Analytics Events ✅
- Standardise header analytics on `recordHeaderEvent` with a single event catalogue (brand, nav, CTA, locale, theme, consent, drawer, ribbon).
- Ensure events carry `{ locale, mode, surface, target, trigger }`, derive IDs (`ctaId`, `navId`, `ribbonId`), and enqueue until consent.
- Update header surfaces to emit the new events with normalised targets and reduced duplication.

_Status:_ Unified emitter + schema land with queue-aware events; follow-up to extend Playwright coverage for pre-consent queue/flush flows.

## Slice 11 — Logged-in Placeholder & Post-launch Modes
- Implement mode resolver (prelaunch, launch, postlaunch, authenticated) using feature flags.
- Stub authenticated state with avatar button + menu placeholder (no real auth yet).
- Ensure CTA text updates per mode and analytics event names align.
- Tests: unit tests for mode resolver, Playwright asserting CTA text per env flag, visual regression for authenticated header.

## Slice 12 — Logged-in Awareness ✅
- Read the SSR-only `LH_AUTH` cookie (boolean hint) and expose `userState` to header components without shipping auth logic to the client.
- When hinted, swap the primary CTA label to `Dashboard` targeting `NEXT_PUBLIC_DASHBOARD_URL` (fallback `/dashboard`) and render a secondary “Log out” pill targeting `NEXT_PUBLIC_LOGOUT_URL` (fallback `/logout`).
- Emit `user_state: 'guest' | 'hinted'` alongside locale/mode/surface on every header analytics event; hinted sessions use the `authenticated` mode for dashboards.
- Keep parity between desktop, drawer, and mobile surfaces while preserving localisation, consent gating, and ≥44px hit areas.

_Status:_ Hint-aware CTA + logout links ship with analytics + docs updates; follow-up to replace the cookie flag with real session state once the app’s auth stack is live and to confirm the final marketing logout URL.

## Slice 13 — Final Polish ✅
- Tokenise any remaining header spacing/focus styles, guarantee ≥44 px clicks on nav/logout/CTA, and reserve CTA width so guest ↔ hinted swaps remain CLS-free.
- Align nav/drawer hover and focus treatments, keep reduced-motion path free of transitions, and ensure drawer parity with secondary/logout actions.
- Introduce regression specs (`header.regressions.spec.ts`) plus opt-in screenshot coverage (`header.visual.spec.ts`) spanning themes, locales, ribbon on/off, and hinted/guest states.
- Update CONTEXT docs with final rules and document the skip-gated visual suite (`HEADER_VISUAL=1`).

_Status:_ Token and focus polish shipped with new regression coverage; follow-ups limited to finalising branded iconography and enabling the screenshot matrix in CI when infrastructure allows.

---

Revisit this backlog after each slice; add migration notes in PRs if files move or delete.

### Follow-ups
- Investigate long-term static-generation strategy for `/tokens` (requires refactoring `app/layout.tsx` to avoid request-bound header access during build or moving the playground behind a dev-only segment).
- Replace the temporary `LH_AUTH` cookie hint with the real session/auth signal once available and confirm the production logout handoff route.
