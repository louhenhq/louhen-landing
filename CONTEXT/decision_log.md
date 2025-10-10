# Decision Log — Louhen Landing

This file tracks **locked decisions** (do not change without explicit proposal) and the **history of changes**.  
It ensures Codex and contributors never undo critical choices or repeat past discussions.

---

## Locked Decisions

| Decision | Rationale | Date | Links |
| --- | --- | --- | --- |
| Next.js 15 App Router | Leverage server components, route groups, and streaming for marketing + waitlist flows; aligns with Vercel hosting. | 2025-10-09 | [architecture.md](architecture.md) · [naming.md](naming.md) |
| TypeScript strict mode | Catch regressions at compile time and enforce typed APIs across app/lib/tests. | 2025-10-09 | [architecture.md](architecture.md) · [coding_conventions.md](coding_conventions.md) |
| Tailwind + Style Dictionary tokens | Design tokens remain single source; Tailwind consumes generated variables to keep brand parity. | 2025-10-09 | [performance.md](performance.md) · [naming.md](naming.md) |
| BCP-47 routing & default-locale rule | Every page lives under `app/(site)/[locale]/…`; default locale must call `unstable_setRequestLocale` to avoid flashes. | 2025-10-09 | [i18n.md](i18n.md) · [naming.md](naming.md) · [rename_map.md](rename_map.md) |
| CSP nonce lifecycle | Single SSR nonce shared across scripts (ThemeInit, JSON-LD); dev-only relaxations documented. | 2025-10-09 | [security.md](security.md) · [seo.md](seo.md) |
| Consent-gated analytics | No third-party CMP; custom consent store gates analytics/marketing payloads before firing. | 2025-10-09 | [privacy_analytics.md](privacy_analytics.md) · [security.md](security.md) |
| Testing pyramid: unit / e2e / axe | Unit for logic, Playwright e2e for flows, axe for accessibility; selectors via `data-ll`. | 2025-10-09 | [testing.md](testing.md) |
| Lighthouse budgets in CI | Keep `/` and key flows ≥90/95/95/95 (P/A/SEO/BP); CI uploads artifacts and blocks regressions. | 2025-10-09 | [performance.md](performance.md) · [architecture.md](architecture.md) |
| semantic-release branches (staging/production) | Conventional commits drive prereleases on `staging` (channel `next`) and stable tags on `production`; only staging→production promotes releases. | 2025-10-09 | [release.md](release.md) |
| Environment & feature flags policy | All secrets in Vercel/GitHub; flags live under `lib/shared/env` + `lib/server/env`; no ad-hoc envs. | 2025-10-09 | [envs.md](envs.md) · [architecture.md](architecture.md) |
| Local vs remote fonts toggle | `NEXT_USE_REMOTE_FONTS` controls fallback; default to self-hosted local fonts for performance/legal review. | 2025-10-09 | [envs.md](envs.md) · [performance.md](performance.md) |
| Canonical host + DNS strategy | Production canonical `https://www.louhen.app`, apex 301 redirect, preview `https://staging.louhen.app`. | 2025-09-24 | [seo.md](seo.md) · [domains.md](domains.md) |
| Form security: hCaptcha required | Blocks bot submissions; test keys in dev, secrets per env. | 2025-09-24 | [architecture.md](architecture.md) · [envs.md](envs.md) |
| Transactional email via Resend | Domain-verified sender with noop fallback locally. | 2025-09-22 | [email.md](email.md) |
| Data writes via Firebase Admin | Server-only Firestore access; no client SDK on marketing site. | 2025-09-19 | [architecture.md](architecture.md) |

---

## History

- **2025-10-09 — Feature flag & environment matrix blueprint (Slice 15)**  
  - Documented the flag catalog in `/CONTEXT/envs.md` with defaults/owners and clarified governance expectations.  
  - Updated architecture/testing/PR checklist guidance so future code reads flags via `lib/shared/flags.ts` helpers and CI covers both states before rollout.

- **2025-10-09 — Feature flag runtime scaffold (Slice 15 implementation)**  
  - Introduced `lib/shared/flags.ts` as the typed, single-source helper and rewired OG, analytics, CSP, and waitlist urgency consumers to rely on it.  
  - Added preview-only `/api/test/flags` overrides, Playwright `flags.set/clear` fixtures, and a static OG fallback CI job so preview workflows exercise both flag states without redeploying.

- **2025-10-09 — Feature flag defaults finalised (Vercel alignment)**  
  - Locked Preview defaults (analytics off, CSP report-only, dynamic OG on) and Production defaults (analytics on, CSP enforced, dynamic OG on) for `NEXT_PUBLIC_ANALYTICS_ENABLED`, `NEXT_PUBLIC_BANNER_WAITLIST_URGENCY`, `OG_DYNAMIC_ENABLED`, and `SECURITY_REPORT_ONLY`.  
  - Values are synced in Vercel environment settings and mirrored in `/CONTEXT/envs.md`; CI overrides them only for targeted fallback tests.

- **2025-10-09 — Zustand onboarding store typing alignment**  
  - Adjusted `app/onboarding/[step]/page.tsx` to type the onboarding store via `persist()`/`StateCreator` (no generics on `create`) and bind it through a vanilla store hook that uses `useSyncExternalStore`.  
  - Rationale → Zustand v5 typing no longer accepts generics on `create()`, so the onboarding slice now follows the new middleware-first pattern while retaining the existing hook surface.

- **2025-10-09 — Environment Controls & Branch Protection (OG Pipeline)**  
  Introduced `NEXT_PUBLIC_CANONICAL_HOST`, `OG_DYNAMIC_ENABLED`, `OG_CACHE_MAX_AGE`, `OG_S_MAXAGE`, and `OG_SIZE_BUDGET_BYTES` (2 MB) to coordinate canonical host resolution, dynamic OG feature gating, cache tuning, and CI size enforcement across Vercel/GitHub Actions. OG Playwright specs (og-images, og-dynamic-vs-static, twitter-card) are now required status checks on the staging branch.

- **2025-10-07 — Waitlist Legacy Form Retirement**  
  Removed `components/features/waitlist/WaitlistFormLegacy.tsx`; waitlist page now renders `WaitlistForm` with existing selectors. Updated `/CONTEXT/rename_map.md` and `/CONTEXT/testing.md` to reflect the single waitlist implementation.

- **2025-09-19**  
  Centralized parsing of `WAITLIST_CONFIRM_TTL_DAYS`; expiry deterministic across confirm + resend flows.  

- **2025-09-22**  
  CI artifacts standardized (Playwright, Lighthouse, .next traces). Release job runs `npx semantic-release --debug`.  

- **2025-09-22**  
  Added `/CONTEXT` bundle with agents.md, project_overview.md, decision_log.md, etc. Codex workflow formalized.  

- **2025-09-24**  
  Locked transactional email identity to louhen.app (`no-reply@` sender, `hello@` reply-to). Ratified `https://www.louhen.app` as the canonical production host (apex `louhen.app` 301s to `https://www.louhen.app`) and confirmed preview at `https://staging.louhen.app`. Documented hCaptcha policy (universal test keys locally; environment-specific keys in preview/prod), enforced Basic Auth on `/api/status` with hourly GitHub Action monitoring, and ratified the waitlist funnel as a 2-step flow with optional pre-onboarding.

- **2025-10-05**  
  Header inventory (Slice 0): keep `components/features/header-nav/Header.tsx` but plan adjustments to align with new spec; retain `components/ThemeToggle.tsx` + `components/ThemeInit.tsx` for reuse in consolidated theme controls; mark legacy `components/SiteHeader.tsx` as unused and queued for removal once new header lands; keep consent + ribbon modules (`components/ConsentBanner.tsx`, `components/ConsentProvider.tsx`, `components/PrivacyRibbon.tsx`) with future integration notes.

- **2025-10-05 — Header Slice 1 IA Refactor 2025**  
  - Keep → `components/features/header-nav/Header.tsx` (refactored to consume centralized nav data while preserving locale switcher + CTA contract).  
  - Adjust → Introduced `lib/nav/config.ts` as authoritative primary/secondary/system definition; Header renders from this model and exposes `data-nav-id` hooks.  
  - Delete → Removed unused `components/SiteHeader.tsx` to eliminate conflicting nav arrays.  
  - Notes → Nav analytics event standardized to `header_nav_click`; doc updates live in `/CONTEXT/header.md` + `/CONTEXT/analytics_privacy.md`.

- **2025-10-05 — Header Slice 2 Core Shell 2025**  
  - Keep → Existing waitlist CTA wiring via `Header` (now gated by `IS_PRELAUNCH`), `LandingExperience` layout (updated main element keeps existing content).  
  - Adjust → `app/layout.tsx` adds skip link (temporary English copy) before the header; `components/features/header-nav/Header.tsx` rebuilt with three-zone desktop shell, responsive CTA slot, and mobile drawer trigger consuming `lib/nav/config.ts`; `LandingExperience` main element now `id="main-content"` for skip-link target.  
  - Add → `components/features/header-nav/HeaderDrawer.tsx` (drawer skeleton with Esc/backdrop close), `tests/e2e/header-nav/shell.e2e.ts` for structural regression, plus new header translations for drawer labels.  
  - Notes → Drawer focus trap intentionally deferred (`data-focus-trap="todo"`); future slices will wire theme/consent controls into the prepared system slots.

- **2025-10-05 — Header Slice 3 i18n & Switcher 2025**  
  - Keep → Central nav model (`lib/nav/config.ts`) and existing Playwright shell tests remain authoritative.  
  - Adjust → `Header` now renders a localized skip link, delegates locale switching to `HeaderLocaleSwitcher`, and ensures every route using the header exposes `<main id="main-content">`; `/locale/switch` handles no-JS fallback and sets `NEXT_LOCALE`.  
  - Add → `lib/intl/localePath.ts` helper for path/locale transformations, `HeaderLocaleSwitcher.tsx`, server route `app/locale/switch/route.ts`, and Playwright coverage `tests/e2e/header-nav/i18n.e2e.ts`.  
  - Delete → Removed layout-level skip link; locale select logic embedded in `Header` replaced with dedicated component.  
  - Notes → Drawer focus trap still pending; theme/consent controls will plug into the prepared system slot in future slices.

- **2025-10-05 — Header Slice 4 Theme Toggle 2025**  
  - Keep → Existing design tokens and `ThemeInit` meta updates remain the canonical source of palette values.  
  - Adjust → `ThemeInit` now emits a nonce-aware inline script to apply saved theme/contrast preferences pre-hydration; `app/layout.tsx` seeds `data-theme`/`data-contrast` from cookies so SSR matches CSR.  
  - Add → `HeaderThemeToggle` wired into desktop + drawer system controls, `app/theme-client.ts` cookie handling, shared constants in `lib/theme/constants.ts`, Playwright coverage (`tests/e2e/header-nav/theme.e2e.ts`), and new i18n strings for theme labels.  
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
  - Adjust → `components/features/header-nav/Header.tsx` now applies `data-header-state` and `data-motion` attributes, shrink/hide classes, and focus-aware visibility locks while continuing to respect CTA touch targets.  
  - Add → `lib/header/useScrollHeaderState.ts` (rAF-batched scroll hook), `lib/hooks/usePrefersReducedMotion.ts`, Tailwind data-variant styling for shrink states, and forthcoming Playwright coverage (`tests/e2e/header-nav/motion.e2e.ts`) plus documentation updates for motion thresholds and reduced-motion behaviour.  
  - Delete → None.  
  - Notes → Shrink threshold ties to `2 × --spacing-xxxl`; hide threshold adds `--spacing-xxl`. Hook removes `will-change` when idle and disables motion entirely for `prefers-reduced-motion`. Drawer focus trap remains on backlog.  

- **2025-10-05 — Header Slice 8 Mobile Drawer 2025**  
  - Keep → Existing nav config, locale/theme/consent controls, and CTA config continue to power drawer content without duplication.  
  - Adjust → `Header` now records drawer open/close analytics (surface `drawer`) and keeps the header visible while the drawer owns focus; CTA helper accepts a `surface` override.  
  - Add → `HeaderDrawer` focus trap + scroll lock implementation, drawer transform transitions with reduced-motion fallback, `lib/hooks/usePrefersReducedMotion` reuse, Playwright coverage (`tests/e2e/header-nav/drawer.e2e.ts`), and context updates covering data attributes + event payloads.  
  - Delete → Legacy `data-focus-trap="todo"` placeholder removed; drawer now enforces accessible focus cycling.  
  - Notes → Drawer analytics include `{ trigger?: 'button' | 'escape' | 'backdrop' | 'nav' | 'cta' | 'system' }`; CTA interactions inside the drawer reuse `header_cta_*` with `surface: 'drawer'`. Future slice will layer per-link analytics if needed.  

- **2025-10-05 — Header Slice 9 SEO 2025**  
  - Keep → Metadata builders for Method/Legal remain authoritative; CTA and ribbon UTM logic stays centralised in `lib/url/appendUtmParams.ts`.  
  - Adjust → Landing + waitlist metadata now use `makeCanonical`/`hreflangMapFor`, header navigation reuses the shared UTM normaliser, and Method/Legal pages emit breadcrumb JSON-LD with the CSP nonce.  
  - Add → Playwright coverage (`tests/e2e/header-nav/i18n.e2e.ts`, `tests/e2e/header-nav/seo.e2e.ts`) for canonical/hreflang + UTM assertions, documentation updates (header/seo/backlog), and `common.breadcrumb.home` translations.  
  - Delete → Removed the duplicate `appendUtmParams` helper that lived inside `lib/nav/config.ts`.  
  - Notes → `/tokens` remains dynamic/noindex; long-term static export requires refactoring the root layout’s header/cookie access.  

- **2025-10-06 — Header Slice 9 SEO 2025 Audit**  
  - Keep → `lib/seo/shared.ts`, `lib/shared/seo/method-metadata.ts`, and `lib/seo/legalMetadata.ts` already generate locale-aware canonical + hreflang maps; `components/SeoJsonLd.tsx` stays the nonce-aware JSON-LD helper; `lib/header/ctaConfig.ts`, `lib/header/ribbonConfig.ts`, and `lib/nav/config.ts` consistently route header links through `appendUtmParams`.
  - Adjust → `components/features/header-nav/Header.tsx` needs the brand link to reuse `localeHomePath` so locale switching preserves the path; `app/(site)/waitlist/page.tsx` should call `hreflangMapFor(() => '/waitlist')` to keep alternates aligned with the shared helper.  
  - Delete → None.  
  - Notes → Verified header surfaces share analytics targets and promo ribbon preserves nonce-safe structured data context.  

- **2025-10-06 — Header Slice 10 Performance 2025**  
  - Keep → `lib/header/useScrollHeaderState.ts` already batches `scroll` work via `requestAnimationFrame` with a passive listener; `components/features/header-nav/PromoRibbon.tsx` reserves height (`min-h-[2.5rem]`) and defers focus shifts with `requestAnimationFrame`, avoiding CLS.  
  - Adjust → `components/features/header-nav/Header.tsx` will adopt intent-based prefetch handlers and an absolute-position skip link so focus reveal never shifts layout; `components/features/header-nav/HeaderDrawer.tsx` mirrors the intent prefetch helper for mobile nav/CTA.  
  - Delete → None.  
  - Notes → Prefetch remain disabled by default until user intent; drawer focus trap already restores scroll lock without additional timers.  

- **2025-10-06 — Header Slice 11 Analytics 2025**  
  - Keep → `lib/clientAnalytics.ts` remains the authoritative queue/flush layer for consent gating; `lib/header/ctaConfig.ts` continues to resolve CTA phase and targets.  
  - Adjust → `lib/analytics.schema.ts` + `lib/analytics/header.ts` define the unified header event catalogue (`header_brand_click`, `header_nav_click`, `header_cta_click`, etc.) while `components/features/header-nav/Header*.tsx` and `PromoRibbon.tsx` emit those events with normalised targets/triggers via `resolveInteractionTrigger`.  
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
  - Adjust → `lib/header/ctaConfig.ts` now accepts a `userState` hint to emit the authenticated dashboard CTA; `components/features/header-nav/Header*.tsx` render Dashboard/Logout pairs when hinted and propagate the context to drawer/mobile surfaces; analytics helpers (`lib/analytics/header.ts`, `lib/analytics.schema.ts`) append `'user_state'` to every header payload.
  - Add → `lib/auth/userState.ts` + `.server.ts` read the boolean `LH_AUTH` cookie on the server, new env-driven targets (`NEXT_PUBLIC_DASHBOARD_URL`, `NEXT_PUBLIC_LOGOUT_URL` with safe fallbacks), and i18n strings for `header.cta.dashboard` + `header.auth.logout`.
  - Notes → The hint stays boolean-only (no IDs/PII) and defaults to `'guest'`; when `'hinted'` the header reports analytics mode `'authenticated'` and still respects consent gates. Follow-up captured in backlog to replace the cookie with real session data once auth ships and to confirm the final logout destination.

- **2025-10-07 — Header Slice 13 Final Polish 2025**
  - Keep → `buttons.primary` / `buttons.secondary` remain the canonical token bundles for CTA and secondary actions; drawer analytics instrumentation stays unchanged.
  - Adjust → `components/features/header-nav/Header.tsx` updates nav/CTA/logout controls to tokenised pill classes with reserved CTA width; `components/features/header-nav/HeaderDrawer.tsx` aligns drawer links with the same pill + focus styling; regression suites (`tests/e2e/header-nav/regressions.e2e.ts`, `tests/e2e/header-nav/visual.e2e.ts`) lock CTA width, focus behaviour, and optional screenshot coverage.
  - Delete → None.
  - Notes → Visual snapshots run when `HEADER_VISUAL=1` once CI baselines exist; regression spec enforces guest/hinted CTA widths to keep CLS at ~0.

- **2025-10-08 — CI/Playwright Server Lifecycle 2025**
  - Adjust → Playwright now owns the e2e server lifecycle via `webServer.command`; CI builds once, then runs `npx playwright test` without manual `npm run start:test` calls.
  - Add → `start:test` enforces `NODE_ENV=production`, binds to `127.0.0.1:4311`, and captures output in `.next/test-server.log`; Playwright config now writes to `artifacts/playwright/<run>/` with a JSON summary per run. Managed run waits on `/icon.svg` (overridable via `PW_HEALTH_PATH`) for readiness, and a conditional fallback job pre-starts the server and reuses it when the managed path fails so CI still runs coverage.
  - Notes → CI always tails `.next/test-server.log` and uploads `artifacts/playwright/**`. Local developers run `npm run validate:local` or `npm run test:e2e` post-build for equivalent coverage.

- **2025-10-08 — Tokens Guardrails (Slice 3)**
  - Keep → `@louhen/design-tokens` remains the canonical source; `app/layout.tsx` continues to import `./styles/tokens.css` once at the root.
  - Adjust → `/CONTEXT/design_system.md`, `/CONTEXT/architecture.md`, `/CONTEXT/testing.md`, `/CONTEXT/performance.md`, and the PR template now codify that web styling must rely on token-backed utilities; arbitrary Tailwind color/shadow utilities and raw hex/rgb/hsl values are disallowed. Dark/high-contrast variants stay attribute-driven (`data-theme`, `data-contrast`).
  - Add → Future automation planned for linting arbitrary utilities; reviewers must tick the new design-system checklist before merge.
  - Notes → Implementation slices must extend Tailwind with token-backed entries when new surfaces appear; theme switching must never re-import token CSS.
- **2025-10-09 — Analytics Consent Policy (Owner: Privacy & Analytics)**  
  - Finalised consent storage: `ll_consent=v1:<state>` first-party cookie with 12-month max-age; revocation deletes storage immediately.  
  - Default remains analytics-off: no network calls, cookies, or preconnect/preload to analytics domains before consent is `granted`.  
  - Documented runtime `connect-src` opt-in and nonce requirements in `/CONTEXT/privacy_analytics.md`, `/CONTEXT/security.md`, `/CONTEXT/testing.md`, and the PR checklist to enforce validation coverage.
- **2025-10-09 — Waitlist confirm route + theme client dedupe**  
  - Keep → `/waitlist/confirm` stays a page-level redirector; UI logic remains in `app/(site)/waitlist/confirm/page.tsx`.  
  - Adjust → Legacy GET handler moved to `app/api/waitlist/confirm/route.ts` with tests pointing to the new API path; `rename_map.md` notes the relocation.  
  - Adjust → `app/theme-client.ts` now has a single set of helpers sourced from `@/lib/theme/constants`, eliminating duplicate `getSavedTheme`/`setTheme` definitions.  
  - Notes → Home/locale root pages import `ReferralAttribution` via `@components/features/waitlist` to match the feature barrel; build no longer reports duplicate identifiers or missing modules.

- **2025-10-10 — Default locale switch to de-de (Owner: Localization & SEO)**  
  - Keep → Locale routing stays under `app/(site)/[locale]/…`, middleware negotiates via cookies/`Accept-Language`, and `buildPathForLocale` continues to handle prefixed navigation.  
  - Adjust → `defaultLocale` now resolves to `de-de`; env defaults, Playwright helpers, sitemap generation, and SEO builders emit German canonicals (`/method`, `/legal/*`) with hreflang/x-default pointing to `de-de`. Additional markets (`fr-fr`, `nl-nl`, `it-it`) ship as alternates with English fallback until localized copy lands.  
  - Notes → English for Germany (`en-de`) remains available for support/QA. Update localized content before removing `[[TODO-translate]]` markers and ensure campaign links honour the expanded locale list.

---
