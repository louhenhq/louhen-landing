# Decision Log — Louhen Landing

This file tracks **locked decisions** (do not change without explicit proposal) and the **history of changes**.  
It ensures Codex and contributors never undo critical choices or repeat past discussions.

---

## Locked Decisions

- **Framework**: Next.js App Router with TypeScript + Tailwind.  
- **Hosting**: Vercel.  
- **Data writes**: Firebase Admin SDK (server-side only).  
- **Form security**: hCaptcha required on public submissions.  
- **Emails**: Resend for transactional flows (after domain verification).  
- **Release management**: semantic-release with Conventional Commits.  
- **Testing**: Playwright E2E + Lighthouse CI.  
- **Payments**: Adyen is company-wide provider (not yet used here).  
- **i18n**: next-intl scaffolding; ready for Locize + DeepL later.  
- **Security baseline**: no client-side secrets; GDPR-first handling of PII.
- **Environment & Domains locked**: Canonical host `www.louhen.app` (production). Apex `louhen.app` issues 301 redirect to `www.louhen.app`. Preview domain `staging.louhen.app` (maps to `staging` branch). Wildcard previews `*.staging.louhen.app` CNAME to `cname.vercel-dns.com` (DNS only). Deployment Protection does not cover custom production domains without Vercel Business; mitigation is keeping production DNS dark until launch.

---

## History

- **2025-09-19**  
  Centralized parsing of `WAITLIST_CONFIRM_TTL_DAYS`; expiry deterministic across confirm + resend flows.  

- **2025-09-22**  
  CI artifacts standardized (Playwright, Lighthouse, .next traces). Release job runs `npx semantic-release --debug`.  

- **2025-09-22**  
  Added `/CONTEXT` bundle with agents.md, project_overview.md, decision_log.md, etc. Codex workflow formalized.  

- **2025-09-24**  
  Locked transactional email identity to louhen.app (`no-reply@` sender, `hello@` reply-to). Ratified `https://www.louhen.app` as the canonical production host (apex `louhen.app` 301s to `https://www.louhen.app`) and confirmed preview at `https://staging.louhen.app`. Documented hCaptcha policy (universal test keys locally; environment-specific keys in preview/prod), enforced Basic Auth on `/api/status` with hourly GitHub Action monitoring, and ratified the waitlist funnel as a 2-step flow with optional pre-onboarding.

- **2025-10-05**  
  Header inventory (Slice 0): keep `app/(site)/components/Header.tsx` but plan adjustments to align with new spec; retain `components/ThemeToggle.tsx` + `components/ThemeInit.tsx` for reuse in consolidated theme controls; mark legacy `components/SiteHeader.tsx` as unused and queued for removal once new header lands; keep consent + ribbon modules (`components/ConsentBanner.tsx`, `components/ConsentProvider.tsx`, `components/PrivacyRibbon.tsx`) with future integration notes.

- **2025-10-05 — Header Slice 1 IA Refactor 2025**  
  - Keep → `app/(site)/components/Header.tsx` (refactored to consume centralized nav data while preserving locale switcher + CTA contract).  
  - Adjust → Introduced `lib/nav/config.ts` as authoritative primary/secondary/system definition; Header renders from this model and exposes `data-nav-id` hooks.  
  - Delete → Removed unused `components/SiteHeader.tsx` to eliminate conflicting nav arrays.  
  - Notes → Nav analytics event standardized to `header_nav_click`; doc updates live in `/CONTEXT/header.md` + `/CONTEXT/analytics_privacy.md`.

- **2025-10-05 — Header Slice 2 Core Shell 2025**  
  - Keep → Existing waitlist CTA wiring via `Header` (now gated by `IS_PRELAUNCH`), `LandingExperience` layout (updated main element keeps existing content).  
  - Adjust → `app/layout.tsx` adds skip link (temporary English copy) before the header; `app/(site)/components/Header.tsx` rebuilt with three-zone desktop shell, responsive CTA slot, and mobile drawer trigger consuming `lib/nav/config.ts`; `LandingExperience` main element now `id="main-content"` for skip-link target.  
  - Add → `app/(site)/components/HeaderDrawer.tsx` (drawer skeleton with Esc/backdrop close), `tests/e2e/header.shell.spec.ts` for structural regression, plus new header translations for drawer labels.  
  - Notes → Drawer focus trap intentionally deferred (`data-focus-trap="todo"`); future slices will wire theme/consent controls into the prepared system slots.

- **2025-10-05 — Header Slice 3 i18n & Switcher 2025**  
  - Keep → Central nav model (`lib/nav/config.ts`) and existing Playwright shell tests remain authoritative.  
  - Adjust → `Header` now renders a localized skip link, delegates locale switching to `HeaderLocaleSwitcher`, and ensures every route using the header exposes `<main id="main-content">`; `/locale/switch` handles no-JS fallback and sets `NEXT_LOCALE`.  
  - Add → `lib/intl/localePath.ts` helper for path/locale transformations, `HeaderLocaleSwitcher.tsx`, server route `app/locale/switch/route.ts`, and Playwright coverage `tests/e2e/header.i18n.spec.ts`.  
  - Delete → Removed layout-level skip link; locale select logic embedded in `Header` replaced with dedicated component.  
  - Notes → Drawer focus trap still pending; theme/consent controls will plug into the prepared system slot in future slices.

- **2025-10-05 — Header Slice 4 Theme Toggle 2025**  
  - Keep → Existing design tokens and `ThemeInit` meta updates remain the canonical source of palette values.  
  - Adjust → `ThemeInit` now emits a nonce-aware inline script to apply saved theme/contrast preferences pre-hydration; `app/layout.tsx` seeds `data-theme`/`data-contrast` from cookies so SSR matches CSR.  
  - Add → `HeaderThemeToggle` wired into desktop + drawer system controls, `app/theme-client.ts` cookie handling, shared constants in `lib/theme/constants.ts`, Playwright coverage (`tests/e2e/header.theme.spec.ts`), and new i18n strings for theme labels.  
  - Delete → Removed layout-level skip link from Slice 2 remains; no deprecated theme components left (legacy `components/ThemeToggle.tsx` slated for future cleanup).  
  - Notes → Theme preference persists via cookie + localStorage, supports Light/Dark/System, and remains multi-brand ready through tokenized styling. Drawer focus trap still outstanding for a later slice.

- **2025-10-05 — Header Slice 5 Consent 2025**  
  - Keep → Existing consent state management; analytics gating already centralised in `lib/clientAnalytics.ts`.  
  - Adjust → `ConsentProvider` now renders modal-style manager, header + drawer expose consent button, analytics queue clears when consent revoked.  
  - Add → `HeaderConsentButton`, updated strings, Playwright coverage for consent flows, docs refreshed.  
  - Notes → Focus trap TODO for drawer persists; granular consent categories to follow.  

- **2025-10-05 — Header Slice 6 CTA & Ribbon 2025**  
  - Keep → Existing nav model and waitlist scroll logic; analytics gating remains via `lib/clientAnalytics.ts`.  
  - Adjust → `Header` CTA now driven by `lib/header/ctaConfig.ts`, drawer and desktop share the same CTA rendering, and new `PromoRibbon` surfaces flag-driven campaigns with CLS-safe reserved space. Analytics payloads attach locale/mode/surface plus normalised targets and ribbon dismissal now restores focus to the CTA/skip link without shifting layout.  
  - Add → CTA/ribbon translations, `lib/url/appendUtmParams.ts`, `lib/header/ribbonConfig.ts`, analytics helper `recordHeaderEvent`, Playwright CTA/ribbon suites, docs covering UTMs + performance notes, and `lib/url/analyticsTarget.ts` for stable analytics targets.  
  - Delete → Legacy placeholder CTA text (`ctaPostlaunch`) scheduled for cleanup alongside future copy update.  
  - Notes → QR modal deferred; ribbon dismissal persists in localStorage but keeps reserved height to avoid layout shifts. Drawer focus trap still TODO.  

- **2025-10-05 — Header Slice 7 Motion 2025**  
  - Keep → Existing header layout, nav data model, CTA analytics wiring, and PromoRibbon placeholder spacing.  
  - Adjust → `app/(site)/components/Header.tsx` now applies `data-header-state` and `data-motion` attributes, shrink/hide classes, and focus-aware visibility locks while continuing to respect CTA touch targets.  
  - Add → `lib/header/useScrollHeaderState.ts` (rAF-batched scroll hook), `lib/hooks/usePrefersReducedMotion.ts`, Tailwind data-variant styling for shrink states, and forthcoming Playwright coverage (`tests/e2e/header.motion.spec.ts`) plus documentation updates for motion thresholds and reduced-motion behaviour.  
  - Delete → None.  
  - Notes → Shrink threshold ties to `2 × --spacing-xxxl`; hide threshold adds `--spacing-xxl`. Hook removes `will-change` when idle and disables motion entirely for `prefers-reduced-motion`. Drawer focus trap remains on backlog.  

- **2025-10-05 — Header Slice 8 Mobile Drawer 2025**  
  - Keep → Existing nav config, locale/theme/consent controls, and CTA config continue to power drawer content without duplication.  
  - Adjust → `Header` now records drawer open/close analytics (surface `drawer`) and keeps the header visible while the drawer owns focus; CTA helper accepts a `surface` override.  
  - Add → `HeaderDrawer` focus trap + scroll lock implementation, drawer transform transitions with reduced-motion fallback, `lib/hooks/usePrefersReducedMotion` reuse, Playwright coverage (`tests/e2e/header.drawer.spec.ts`), and context updates covering data attributes + event payloads.  
  - Delete → Legacy `data-focus-trap="todo"` placeholder removed; drawer now enforces accessible focus cycling.  
  - Notes → Drawer analytics include `{ trigger?: 'button' | 'escape' | 'backdrop' | 'nav' | 'cta' | 'system' }`; CTA interactions inside the drawer reuse `header_cta_*` with `surface: 'drawer'`. Future slice will layer per-link analytics if needed.  

- **2025-10-05 — Header Slice 9 SEO 2025**  
  - Keep → Metadata builders for Method/Legal remain authoritative; CTA and ribbon UTM logic stays centralised in `lib/url/appendUtmParams.ts`.  
  - Adjust → Landing + waitlist metadata now use `makeCanonical`/`hreflangMapFor`, header navigation reuses the shared UTM normaliser, and Method/Legal pages emit breadcrumb JSON-LD with the CSP nonce.  
  - Add → Playwright coverage (`tests/e2e/header.i18n.spec.ts`, `tests/e2e/header.seo.spec.ts`) for canonical/hreflang + UTM assertions, documentation updates (header/seo/backlog), and `common.breadcrumb.home` translations.  
  - Delete → Removed the duplicate `appendUtmParams` helper that lived inside `lib/nav/config.ts`.  
  - Notes → `/tokens` remains dynamic/noindex; long-term static export requires refactoring the root layout’s header/cookie access.  

- **2025-10-06 — Header Slice 9 SEO 2025 Audit**  
  - Keep → `lib/seo/shared.ts`, `lib/seo/methodMetadata.ts`, and `lib/seo/legalMetadata.ts` already generate locale-aware canonical + hreflang maps; `components/SeoJsonLd.tsx` stays the nonce-aware JSON-LD helper; `lib/header/ctaConfig.ts`, `lib/header/ribbonConfig.ts`, and `lib/nav/config.ts` consistently route header links through `appendUtmParams`.  
  - Adjust → `app/(site)/components/Header.tsx` needs the brand link to reuse `localeHomePath` so locale switching preserves the path; `app/(site)/waitlist/page.tsx` should call `hreflangMapFor(() => '/waitlist')` to keep alternates aligned with the shared helper.  
  - Delete → None.  
  - Notes → Verified header surfaces share analytics targets and promo ribbon preserves nonce-safe structured data context.  

- **2025-10-06 — Header Slice 10 Performance 2025**  
  - Keep → `lib/header/useScrollHeaderState.ts` already batches `scroll` work via `requestAnimationFrame` with a passive listener; `app/(site)/components/PromoRibbon.tsx` reserves height (`min-h-[2.5rem]`) and defers focus shifts with `requestAnimationFrame`, avoiding CLS.  
  - Adjust → `app/(site)/components/Header.tsx` will adopt intent-based prefetch handlers and an absolute-position skip link so focus reveal never shifts layout; `app/(site)/components/HeaderDrawer.tsx` mirrors the intent prefetch helper for mobile nav/CTA.  
  - Delete → None.  
  - Notes → Prefetch remain disabled by default until user intent; drawer focus trap already restores scroll lock without additional timers.  

- **2025-10-06 — Header Slice 11 Analytics 2025**  
  - Keep → `lib/clientAnalytics.ts` remains the authoritative queue/flush layer for consent gating; `lib/header/ctaConfig.ts` continues to resolve CTA phase and targets.  
  - Adjust → `lib/analytics.schema.ts` + `lib/analytics/header.ts` define the unified header event catalogue (`header_brand_click`, `header_nav_click`, `header_cta_click`, etc.) while `app/(site)/components/Header*.tsx` and `PromoRibbon.tsx` emit those events with normalised targets/triggers via `resolveInteractionTrigger`.  
  - Delete → Legacy per-phase CTA event names (`header_cta_waitlist`, `header_cta_request_access`, `header_cta_download`) replaced by `header_cta_click`.  
  - Notes → Pre-consent interactions now enqueue and flush post-grant; surfaces cover `'header'`, `'drawer'`, and `'ribbon'` so dashboards can segment behaviour precisely.  

- **2025-10-05 — /tokens prerender triage**
  - Keep → Design tokens playground remains an internal tooling page served at `/tokens`; design tokens continue to originate from `packages/design-tokens`.
  - Adjust → Route now opts into `dynamic = 'force-dynamic'` and `runtime = 'nodejs'`, plus `robots` noindex metadata. This avoids the prerender crash caused by the root layout’s use of `headers()`/request cookies during SSG.
  - Add → Documentation updates (architecture/performance/seo) memorialising the dynamic rendering decision, and CI build now succeeds because `/tokens` no longer participates in static export.
  - Delete → No content removed; the playground UI stays intact.
  - Notes → If we ever want to statically export `/tokens`, the root layout must stop reading request-bound headers at build time or the playground must move behind a dev-only segment. Follow-up logged in backlog.

- **2025-10-07 — Header Slice 12 Auth Awareness 2025**
  - Keep → Existing header/component structure, CTA analytics contracts, and consent-gated event queue remain in place.
  - Adjust → `lib/header/ctaConfig.ts` now accepts a `userState` hint to emit the authenticated dashboard CTA; `app/(site)/components/Header*.tsx` render Dashboard/Logout pairs when hinted and propagate the context to drawer/mobile surfaces; analytics helpers (`lib/analytics/header.ts`, `lib/analytics.schema.ts`) append `'user_state'` to every header payload.
  - Add → `lib/auth/userState.ts` + `.server.ts` read the boolean `LH_AUTH` cookie on the server, new env-driven targets (`NEXT_PUBLIC_DASHBOARD_URL`, `NEXT_PUBLIC_LOGOUT_URL` with safe fallbacks), and i18n strings for `header.cta.dashboard` + `header.auth.logout`.
  - Notes → The hint stays boolean-only (no IDs/PII) and defaults to `'guest'`; when `'hinted'` the header reports analytics mode `'authenticated'` and still respects consent gates. Follow-up captured in backlog to replace the cookie with real session data once auth ships and to confirm the final logout destination.

- **2025-10-07 — Header Slice 13 Final Polish 2025**
  - Keep → `buttons.primary` / `buttons.secondary` remain the canonical token bundles for CTA and secondary actions; drawer analytics instrumentation stays unchanged.
  - Adjust → `app/(site)/components/Header.tsx` updates nav/CTA/logout controls to tokenised pill classes with reserved CTA width; `app/(site)/components/HeaderDrawer.tsx` aligns drawer links with the same pill + focus styling; regression suites (`tests/e2e/header.regressions.spec.ts`, `tests/e2e/header.visual.spec.ts`) lock CTA width, focus behaviour, and optional screenshot coverage.
  - Delete → None.
  - Notes → Visual snapshots run when `HEADER_VISUAL=1` once CI baselines exist; regression spec enforces guest/hinted CTA widths to keep CLS at ~0.

---
