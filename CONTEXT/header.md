# Header Specification — Louhen Landing

Authoritative playbook for the marketing header across locales, devices, and launch phases. All future slices must conform to this file plus the locked decisions in `/CONTEXT`.

---

## Purpose & Scope
- Provide instant brand recognition, trust signals, and clear paths to the primary CTA (waitlist pre-launch, product entry post-launch).
- Surface locale/theme controls, consent management, and global navigation without hurting Core Web Vitals.
- Remain the single source for promo ribbons (privacy reminder, growth campaigns) so marketing changes are controlled and measurable.

---

## Information Architecture
- **Brand block:** wordmark linked to locale-aware home (`/` for default locale, `/{locale}` otherwise). Use semantic `<h1>` only on landing hero; header brand stays a `<span>` inside the link when the page already owns the `<h1>`.
  - Implementation detail: `app/(site)/components/Header.tsx` calls `localeHomePath(locale)` for the wordmark link so locale switching keeps canonical paths intact.
- **Primary nav (desktop ≥1024px):** anchor jumps to `#how`, `#story`, `#faq` plus optional marketing destinations (Method, Press) when unlocked. Keep max 5 links to preserve spacing.
- **Utility cluster (right side):** locale switcher, theme/contrast toggle (once consolidated), consent badge (opens manager), CTA button, optional status badges (preorder/live launch), hamburger trigger on mobile.
- **Mobile drawer (<1024px):** full-screen sheet sliding from top. Contains nav links, CTA, locale/theme controls, consent badge, optional promo copy. Drawer must trap focus and restore to trigger on close.
- **Skip link:** Localized `header.skipLink` anchor targets `#main-content` to let keyboard users bypass the header quickly.
  - The visible state is absolutely positioned over the header (`focus-visible:absolute left-1/2 top-sm`) so focusing it never shifts nearby layout.

---

## Navigation Data Model (Slice 1)
- `lib/nav/config.ts` is the single source of truth. It declares `primary`, `secondary`, and `system` groups with stable `id`, `i18nKey`, analytics event (`header_nav_click`), and destination metadata (`anchor`, `internal`, `external`).
- Resolver `buildHeaderNavigation(locale)` outputs locale-aware `href`s using helpers (`methodPath`, `legalPath`, `localeHomePath`) and preserves query slots for future UTM enrichment.
- Primary defaults: `how-it-works`, `founder-story`, `faq`, `method`. Secondary defaults: `privacy`, `terms`. System controls: `locale` (available), `theme`, `consent` (planned).
- Secondary links exist in the model but stay hidden until layout + copy are approved. System controls expose a `status` flag so upstream slices can flip availability without touching header markup.
- All nav render logic in `app/(site)/components/Header.tsx` now consumes this model; the component reads `t(item.i18nKey)` for copy and adds `data-nav-id` / `data-analytics-event` hooks for testing and analytics.

---

## Layout Shell (Slice 2)
- Desktop shell: `header` landmark contains three regions — brand (left), primary nav (center, `aria-label="Primary navigation"`), system controls + CTA (right). Secondary links render in a slim bar beneath the primary row on large breakpoints (`lg` ≥ 1024px).
- Mobile shell: primary row collapses to brand + hamburger trigger (with `aria-controls="header-mobile-drawer"`). CTA reflows beneath the header as a full-width button while the system controls move into the drawer.
- Drawer skeleton lives in `app/(site)/components/HeaderDrawer.tsx`. It opens/closes via internal state, exposes `role="dialog"` + `aria-modal="true"`, includes heading + close button, and renders primary/secondary nav plus system controls. Focus trap is active (initial focus on heading, `Esc`/backdrop close) and returns focus to the trigger when appropriate.
- Skip link is rendered as the first child inside `Header`; it localizes `header.skipLink` and targets `#main-content`. All routes that surface the marketing header must expose a `<main id="main-content">` anchor.
- Sticky behaviour remains `position: sticky; top: 0` with backdrop blur only; shrink animation hooks will land in the motion slice.
- CTA slot now honours `IS_PRELAUNCH`: pre-launch renders active waitlist button; post-launch renders a disabled placeholder button with `data-cta-mode="postlaunch"` ready for future flows.
- Logged-in hint (Slice 12): server reads the boolean `LH_AUTH` cookie (values `1`/`true`/`hinted`) and, when present, treats the header as `userState='hinted'`. In this state the primary CTA renders `header.cta.dashboard` linking to `NEXT_PUBLIC_DASHBOARD_URL` (fallback `/dashboard`) and analytics mode shifts to `authenticated`. A secondary “Log out” pill (`header.auth.logout`) links to `NEXT_PUBLIC_LOGOUT_URL` (fallback `/logout`). Desktop, mobile, and drawer variants render the same pair, maintain ≥44px targets, and still respect consent + locale/theming controls. Without the hint we continue to use the existing waitlist/access/download matrix.
- CTA buttons (desktop + drawer) reserve `min-width: 12rem` so swapping between “Join the waitlist” and “Dashboard” never shifts layout; logout pills inherit `buttons.secondary` tokens and keep the same 44 px hit area.
- Primary nav items use `inline-flex` pills with `h-11` to guarantee ≥44 px height and consistent focus rings across themes. Drawer links mirror the same pill shape and spacing so pointer and keyboard targets remain identical between surfaces.

---

## Locale Switcher (Slice 3)
- `HeaderLocaleSwitcher` renders a progressive enhancement flow: native `<select>` backed by a form posting to `/locale/switch` (no-JS fallback) plus a client handler that updates the URL via `router.replace` and sets the `NEXT_LOCALE` cookie.
- The switcher preserves the current path and query string. When targeting the default locale, the leading locale segment is removed; otherwise, the target BCP-47 code prefixes the existing path.
- Desktop placement sits inline beside the CTA; the mobile drawer reuses the same component and closes automatically after a locale change.
- Skip link, drawer labels, and switcher strings live in `messages/*` under the `header` namespace to ensure localization parity.

---

## Theme Toggle (Slice 4)
- `HeaderThemeToggle` offers Light, Dark, and System options using a native `<select>` so the control remains accessible without JavaScript.
- Preferences persist via cookie (`lh_theme_pref`) and localStorage to keep SSR/CSR in sync; selecting System clears storage and reverts to media-query detection.
- The toggle appears next to the locale switcher on desktop; in the drawer, both controls stack vertically and the drawer closes once a choice is made.
- All styling relies on design tokens (`rounded-pill`, `border-border`, `bg-bg`) so future brand themes can inherit the same component without code changes.

---

## CTA Zone (Slice 6)
- `lib/header/ctaConfig.ts` resolves the active CTA phase (`waitlist`, `access`, `download`) using `IS_PRELAUNCH`, `NEXT_PUBLIC_HEADER_PHASE`, `NEXT_PUBLIC_ACCESS_REQUEST_URL`, and `NEXT_PUBLIC_APP_DOWNLOAD_URL`. Tests can override via `window.__LOUHEN_HEADER_PHASE__`.
- CTA labels live under `header.cta.*`; links append UTMs (`utm_source=header`, `utm_medium=cta`, `utm_campaign` keyed by locale + phase).
- Scroll actions (waitlist) focus the `#waitlist-form` input; link actions open in the same tab unless the download URL is external.
- Events: `header_cta_click` fires with `{ ctaId, target, trigger }` (surface `header` or `drawer`) only when consent allows. Drawer CTA closes automatically when navigating.
- Navigation links, promo ribbons, and CTAs all route through `lib/url/appendUtmParams.ts` so the header uses a single UTM policy (`utm_source=header`, `utm_medium=cta|promo-ribbon`, locale-scoped campaigns) across desktop, drawer, and ribbon surfaces.
- Analytics payloads attach `{ locale, mode, surface: 'header', target }`. `lib/url/analyticsTarget.ts` normalises `target` (`#waitlist-form`, relative paths, or store hosts such as `app-store`/`google-play`) so dashboards stay consistent.
- Visual regression snapshots live in `tests/e2e/header.visual.spec.ts` (gated behind `HEADER_VISUAL=1`) and cover desktop/mobile, light/dark/system, ribbon on/off, and hinted/guest states. Standard regression specs live beside them to guard prefetch markers, focus states, and CTA sizing.

---

## Promo Ribbon (Slice 6)
- `PromoRibbon` reads config from env (`NEXT_PUBLIC_PROMO_RIBBON_ENABLED`, `NEXT_PUBLIC_PROMO_RIBBON_ID`, optional `NEXT_PUBLIC_PROMO_RIBBON_LINK`) or test override `window.__LOUHEN_PROMO_RIBBON__`.
- Copy comes from `header.ribbon.<id>.*` with fallback to `header.ribbon.default.*`.
- Height (`min-h-[2.5rem]`) is reserved regardless of state to avoid CLS; dismissal persists via `localStorage` (`lh_ribbon_dismissed_<locale>_<id>`). Dismiss keeps the reserved space to avoid layout shifts.
- Events: `header_ribbon_view`, `header_ribbon_click`, `header_ribbon_dismiss` gated by consent. Ribbon CTA appends UTMs (`utm_medium=promo-ribbon`) and reports analytics targets using the same normaliser as the CTA button.
- Dismissal restores focus to the next logical control (desktop CTA → mobile CTA → skip link) while leaving placeholder space in place for CLS safety.
- Drawer controls stack Locale → Theme → Consent after the ribbon to maintain consistent ordering.

---

## Motion System (Slice 7)
- `useScrollHeaderState` drives the scroll state machine (`default` → `shrink` → `hidden`) using requestAnimationFrame-batched scroll reads. The hook emits `{ y, direction, state }` and applies `data-header-state` / `data-motion` attributes for styling hooks.
- Thresholds reference spacing tokens: shrink engages when `scrollY > (2 × --spacing-xxxl)` (~64 px) and hide when `scrollY > shrink + --spacing-xxl` (~88 px). Returning above the shrink threshold or reversing scroll direction immediately reveals the header.
- Motion is transform-only. Hiding uses `translateY(-100%)` so layout remains reserved; `will-change: transform` is applied only while the header is in `shrink`/`hidden` states and removed once it returns to `default`.
- Focus integrity: the hook receives a `lockVisibility` flag so the header never hides while any header child (skip link, CTA, locale/theme/consent controls, drawer trigger) holds focus or while the drawer is open. Focus changes are tracked with native `focusin`/`focusout` listeners.
- Reduced motion: when `(prefers-reduced-motion: reduce)` matches, the hook short-circuits to `default`, sets `data-motion="disabled"`, and Tailwind data variants drop the transitions.

---

## Mobile Drawer (Slice 8)
- `HeaderDrawer` renders the mobile menu sheet (`lg` breakpoint and below). It carries primary and secondary navigation, the locale/theme/consent system controls, and the CTA so parity with the desktop header is preserved. Section containers expose `data-nav-section="primary|secondary|system|cta"`.
- Accessibility contract: the drawer owns `role="dialog"`, `aria-modal="true"`, and a heading referenced via `aria-labelledby`. Opening focuses the heading, a focus trap cycles `Tab`/`Shift+Tab`, and closing through escape/backdrop returns focus to `[data-nav-drawer-trigger]` unless the action intentionally redirects focus (CTA scroll, locale change, consent modal).
- Motion + performance: transforms only (`translateX` + opacity), `data-motion="enabled|disabled"` mirrors the header’s reduced-motion handling, and the body is scroll-locked (`overflow: hidden`) while the drawer is mounted.
- Data attributes: backdrop surfaces `data-drawer="open|closed"` + `data-drawer-dismiss="backdrop"`; the sheet adds `data-surface="drawer"` and `data-motion`. Links retain `data-nav-id` / `data-analytics-event`, and drawer CTAs override analytics surface to `'drawer'`.
- Analytics: `recordHeaderEvent` standardises every header interaction — brand (`header_brand_click`), nav (`header_nav_click`), CTA (`header_cta_click`), locale (`header_locale_switch`), theme (`header_theme_toggle`), consent manager (`header_consent_open`), drawer open/close (`header_open_drawer` / `header_close_drawer`), and ribbon events (`header_ribbon_view`/`click`/`dismiss`). Each payload carries `{ locale, mode, surface, target, trigger }`, queues until consent is granted, and relies on normalised targets for consistent dashboards.

---

## SEO Touchpoints (Slice 9)
- `lib/url/appendUtmParams.ts` is the single helper applied by nav, CTA, and ribbon links. Do not hand-roll UTM strings; set `{ source: 'header', medium: 'cta' | 'promo-ribbon', campaign: <phase|locale> }` and let the helper handle absolute vs relative URLs.
- Method and legal pages emit nonce-aware `BreadcrumbJsonLd` so search engines see Home → Section relationships without duplicating Organization/WebSite JSON-LD.
- Canonical and hreflang tags come from `lib/seo/shared.ts` helpers (`makeCanonical`, `hreflangMapFor`). Whenever a new header-linked page ships, wire its metadata through these builders before exposing the link in the nav/ribbon/CTA.

---

## Visual Variants
- **Transparent/overlay:** used when hero imagery extends under header (home hero). Background transitions from transparent to solid once user scrolls 48px. CTA uses outline style until solid state.
- **Solid/sticky:** default on method/legal/thanks routes. Background color = `--semantic-color-surface-elevated`, border-bottom `--semantic-color-border-subtle`.
- **Shrink on scroll:** vertical padding steps from `var(--spacing-sm)` to `var(--spacing-xs)` (≈8 px delta) once the shrink threshold fires. Logo scales to `scale-95` while CTA sizing stays ≥44 px high to satisfy touch targets.
- **Promo ribbon:** optional layer above header. Supports privacy reminders, campaigns, or service alerts. Text max 2 lines, includes dismiss/track controls. Ribbon height accounted for in sticky offset.

---

## CTA Mode Matrix
| Mode | Trigger | Primary CTA | Secondary CTA | Notes |
|------|---------|-------------|---------------|-------|
| Pre-launch (default) | `IS_PRELAUNCH=true` or non-production env | `Join the waitlist` scrolls to `#waitlist-form` | `Learn more` (Method) optional | Emit `header_cta_click` with `ctaId='waitlist'` (consent-gated). |
| Launch (waitlist sunset) | `IS_PRELAUNCH=false` and app invite active | `Request access` → `/onboarding/account` | `Method` outline button | Add tooltip clarifying beta capacity. |
| Post-launch (app available) | `NEXT_PUBLIC_APP_DOWNLOAD_URL` set | `Download the app` opens store URL in new tab | `Sign in` (future) | Respect locale-specific store links (BCP-47). |
| Logged-in placeholder | `HEADER_USER_SIGNED_IN` flag (future) | Avatar button → account menu | CTA replaced by `Open app` | Do not ship until auth story lands; keep stubbed state documented. |

Switch between modes via feature flags only; never infer from route alone. Provide TypeScript enum for clarity before implementation.

---

## Locale & Theme Controls
- Locale switcher, theme toggle, and consent badge share the system-control slot (desktop) and stack vertically inside the drawer. Maintain order: Locale → Theme → Consent.
- Default locale renders without prefix but still updates `<html lang>` via `unstable_setRequestLocale` on every route that uses the header.
- Theme persistence lives in `theme-client` (`lh_theme_pref` cookie + localStorage). `ThemeInit` must stay in the tree so the inline script applies saved preferences pre-hydration and the effect keeps `meta[name="theme-color"]` in sync.
- Locale + theme + consent controls rely on localized labels (`header.locale.*`, `header.theme.*`, `header.consent.*`) and emit no analytics until consent is granted.

---

## Consent & Privacy
- Consent badge/icon lives beside locale/theme controls. Label `Privacy choices` and opens consent manager (banner modal). Mirror state (`Granted` vs `Limited`) for quick scan.
- Promo ribbon variant `privacy` links to `legalPath(locale, 'privacy')`; use `PrivacyRibbon` component, ensure analytics event `privacy_ribbon_click` remains consent-gated.
- No analytics events may fire from header interactions until consent `analytics=true`.

---

## SEO & Hreflang Considerations
- Header links must use canonical helpers (`legalPath`, `methodPath`) and mark anchor `rel="nofollow"` only when legally required (e.g., consent manager). Avoid query strings on internal nav anchors.
- Locale switcher updates URL to BCP-47 path while preserving `?utm_*` and `?source`. Trigger `router.replace` when locale change initiated during SSR-sourced requests to avoid duplicate history entries post-hydration.
- Ensure `hreflang` map remains unchanged when switching locale; header must not inject duplicate `<link>` tags.
- Promo ribbon copy must not push content vertically on load (reserve space) to guard CLS budget in Lighthouse.

---

## Accessibility Notes
- Provide `role="navigation"` with `aria-label="Primary"` on desktop nav and `aria-label="Mobile"` inside drawer.
- Drawer uses `focus-trap` pattern: first/last focusable cycling, closes on `Esc`, disables background scroll (`overflow: hidden` on `<body>`).
- CTA buttons maintain ≥44×44px click area in all states. Ensure shrink state retains accessible name via `aria-label` when icon-only.
- Use `prefers-reduced-motion` query to disable sticky shrink animations; header should snap instead of animate.
- Add `data-testid` hooks: `data-testid="header-locale"`, `header-theme`, `header-consent`, `header-cta` for testing.

---

## Performance Targets
- Budget ≤ 12 KB gzip client JS attributable to header bundle (excludes shared theme utilities). Keep nav interactions server driven where possible.
- CSS critical path ≤ 4 KB for header (Tailwind classes + tokens). Use `prefetch={false}` on internal links that do not require streaming to reduce unused flight chunks.
- Internal navigation, drawer, and CTA links expose `data-prefetch-policy="intent"` and rely on `useIntentPrefetch` to call `router.prefetch` only after pointer/focus intent instead of eagerly on first paint.
- Avoid layout thrash: header motion must keep the rAF-batched `scroll` handler in `useScrollHeaderState` (single passive listener → `requestAnimationFrame`). Do not add additional synchronous `scroll` work.
- Remove `will-change: transform` once the header returns to `default`; the component already toggles this via `data-motion`, and future changes should respect the same hygiene to prevent lingering GPU layers.
- Defer mobile drawer logic until invoked (dynamic import for motion libraries if needed).

---

## Analytics & Event Naming
- `header_brand_click`, `header_nav_click`, `header_cta_click`, `header_locale_switch`, `header_theme_toggle`, `header_consent_open`, `header_open_drawer`, `header_close_drawer`, `header_ribbon_view`, `header_ribbon_click`, `header_ribbon_dismiss`.
- Events are enqueued until consent is granted; once allowed they flush FIFO with payload `{ locale, mode, surface, target, trigger }` plus event-specific fields (`ctaId`, `navId`, `ribbonId`, etc.).
- Ribbon dismiss records `header_ribbon_dismiss` with `{ ribbonId, trigger }` and keeps the placeholder height to avoid CLS.
- Every header event automatically attaches `'user_state'` (`'guest' | 'hinted'`) from the SSR cookie hint so analytics dashboards can segment hinted sessions without introducing identifiers.

---

## Testing Matrix
- **Unit:** locale switching helper preserves path; CTA mode resolver respects env flags; scroll observer toggles classes deterministically.
- **Playwright (desktop & mobile):**
  - CTA scrolls to waitlist form and focuses first input.
  - Drawer open/close maintains focus trap and body scroll lock.
  - Locale switcher keeps query params and updates `<html lang>`.
  - Ribbon presence toggles header offset without CLS >0.02.
- **Axe (desktop & mobile):** zero critical violations; focus order validated.
- **Visual regression:** capture desktop (transparent + sticky) and mobile (drawer open) states.
- **Lighthouse watch:** header interactions must keep CLS <0.02, TBT delta <20 ms compared to baseline.

---

## Implementation Guardrails
- Consume design tokens via Tailwind semantic utilities (`buttons.primary`, `layout.*`). No raw hex.
- Keep CSP nonce flow intact: scripts inserted by header (if any) must use provided nonce context.
- Avoid client-side feature flag branching that duplicates markup; prefer server-evaluated flags in layout.
- Document future mutations (e.g., logged-in menu) in `/CONTEXT/header.md` before coding changes.

---

## Open Questions (track in backlog)
- Finalize copy for consent badge states (`Granted` vs `Limited`).
- Define authenticated header layout and data source once session management lands.
- Confirm promo ribbon governance (who sets `promoId`, how long stored). To be resolved before implementation slice.

Update this document whenever header behavior, flags, or dependencies change.
