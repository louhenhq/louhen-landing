# Louhen Landing — Rename & Migration Map

## 1. Scope & Method
- Covers every non-framework TypeScript/TSX module, config, and test slated for re-homing under `/app`, `/components`, `/lib`, `/emails`, `/scripts`, `/tests`, `/types`, `/i18n`, and related support folders.
- Excludes Next.js framework shells (`page.tsx`, `layout.tsx`, `loading.tsx`, `error.tsx`, `route.ts`) plus generated artifacts in `public/`, `packages/design-tokens/build/`, and other binary assets; these remain untouched until Slice E.
- Source of truth for target locations is [/CONTEXT/naming.md](./naming.md); any ambiguity is marked `DECIDE` with a follow-up question.

## 2. Conventions
- Follow naming.md for PascalCase components, kebab-case utilities, and `.server`/`.client` suffix policies.
- All target paths assume alias-based imports via `@/...` once moves land.

## 3. Global Aliases & Import Updates
- Existing alias: `@/* → ./*` and `./src/*` (see `tsconfig.json`).
- After migration, convert deep relatives (`../../lib/foo`) to alias form (`@/lib/shared/foo`); ensure `@/components/...` stays the default import root.
- Add prospective aliases if needed: `@/components/ui`, `@/components/blocks`, `@/components/features/*`, `@/lib/shared`, `@/lib/server` (update `tsconfig.json` + `eslint.config.mjs` alongside moves).

## 4. Inventory Tables

_Tables sorted by `Current Path`; `Status=DECIDE` rows include the follow-up needed to unblock the move._

### Feature: home

| Current Path | Type | Target Path | New Name | Selectors Needed? | Status | Notes |
| --- | --- | --- | --- | --- | --- | --- |
| app/(site)/components/FAQ.tsx | block | components/blocks/HomeFaq.tsx | HomeFaq.tsx | yes (data-ll="home-faq") | OK | Move section-level FAQ into blocks to share between locales. |
| app/(site)/components/FounderStory.tsx | feature-comp | components/features/home/HomeFounderStory.tsx | HomeFounderStory.tsx | yes (data-ll="home-founder") | OK | Rename to avoid clash with method story variants. |
| app/(site)/components/Hero.tsx | feature-comp | components/features/home/HomeHero.tsx | HomeHero.tsx | yes (data-ll="home-hero") | OK | Add stable selector to replace class-based Playwright hooks. |
| app/(site)/components/LandingExperience.tsx | feature-comp | components/features/home/HomeExperience.tsx | HomeExperience.tsx | no | OK | Keep CTA analytics wiring; update imports accordingly. |
| app/(site)/components/PromoRibbon.tsx | feature-comp | components/features/header-nav/PromoRibbon.tsx | PromoRibbon.tsx | yes (focus fallback via nav-waitlist-cta) | MIGRATED | Ribbon now sits alongside header-nav components; shares nav CTA selector. |
| app/(site)/components/ShareButtons.tsx | ui | components/ui/HomeShareButtons.tsx | HomeShareButtons.tsx | no | OK | Stays client component; ensure exports stay named. |
| app/(site)/components/SharePanel.tsx | feature-comp | components/features/home/HomeSharePanel.tsx | HomeSharePanel.tsx | yes (data-ll="home-share-panel") | OK | Bundles share CTA; align analytics imports post-move. |
| app/(site)/components/TrustModals.tsx | feature-comp | components/features/home/HomeTrustModals.tsx | HomeTrustModals.tsx | no | OK | Confirm modal lazy loading unaffected by relocation. |
| components/FounderPhoto.tsx | ui | components/ui/FounderPhoto.tsx | same | no | OK | Already PascalCase UI atom; path-only move. |
| components/FounderStoryWithVoucher.tsx | feature-comp | components/features/home/HomeFounderStoryWithVoucher.tsx | HomeFounderStoryWithVoucher.tsx | yes (data-ll="home-founder-voucher") | OK | Keep voucher CTA instrumentation intact. |
| components/HeroTwinBadge.tsx | ui | components/ui/HeroTwinBadge.tsx | same | yes (data-ll="home-hero-badge") | OK | Provide dedicated selector for hero badge assertions. |
| components/HowItWorks.tsx | block | components/blocks/HowItWorksIllustrated.tsx | HowItWorksIllustrated.tsx | yes (data-ll="home-how-it-works") | DECIDE | Confirm we keep illustrated variant vs grid variant; OK to rename accordingly? |
| components/PodiatristBadge.tsx | ui | components/ui/PodiatristBadge.tsx | same | no | OK | Shared atom between home + footer; alias imports after move. |
| components/PodiatristBadgeCta.tsx | feature-comp | components/features/home/PodiatristBadgeCta.tsx | PodiatristBadgeCta.tsx | yes (data-ll="home-podiatrist-cta") | OK | CTA used in hero; ensure analytics stays wired. |
| components/ShareTwinVoucherButton.tsx | ui | components/ui/ShareTwinVoucherButton.tsx | same | yes (data-ll="home-share-twin") | OK | Provide consistent selector for share CTA tests. |
| components/TestimonialCards.tsx | block | components/blocks/TestimonialCards.tsx | same | yes (data-ll="home-testimonials") | OK | Lives in blocks for reuse (home + method). |

### Feature: method

| Current Path | Type | Target Path | New Name | Selectors Needed? | Status | Notes |
| --- | --- | --- | --- | --- | --- | --- |
| app/(marketing)/[locale]/method/_components/HowItWorks.tsx | block | components/blocks/MethodHowItWorks.tsx | MethodHowItWorks.tsx | yes (data-ll="method-how", method-steps) | OK | Migrated (Slice D); strict-ready. |
| app/(marketing)/[locale]/method/_components/MethodCta.tsx | feature-comp | components/features/method/MethodCta.tsx | same | yes (data-ll="method-hero-cta", method-footer-cta) | OK | Migrated (Slice D); alias + analytics wiring intact. |
| app/(marketing)/[locale]/method/_components/MethodHero.tsx | feature-comp | components/features/method/MethodHero.tsx | same | yes (data-ll="method-hero") | OK | Migrated (Slice D); uses @lib/clientAnalytics. |
| app/(marketing)/[locale]/method/_components/Pillars.tsx | block | components/blocks/MethodPillars.tsx | MethodPillars.tsx | yes (data-ll="method-pillars") | OK | Migrated (Slice D); section-level block. |
| app/(marketing)/[locale]/method/_components/TrustLayer.tsx | feature-comp | components/features/method/MethodTrustLayer.tsx | MethodTrustLayer.tsx | yes (data-ll="method-trust") | OK | Migrated (Slice D); TrustSchema via @components. |
| app/(marketing)/[locale]/method/articleSchema.ts | util | lib/shared/method/article-schema.ts | article-schema.ts | no | OK | Migrated; exported input type for strict pilot. |
| app/(marketing)/[locale]/method/metadata.ts | route | app/(marketing)/[locale]/method/metadata.ts | same | no | SKIP | Remains colocated with route; ensure imports update after alias changes. |
| components/marketing/StateCard.tsx | block | components/blocks/MethodStateCard.tsx | MethodStateCard.tsx | yes (data-ll="method-state-card") | DECIDE | Confirm card used outside method—if yes, move to shared/blocks instead? |
| lib/routing/methodPath.ts | util | lib/shared/routing/method-path.ts | method-path.ts | no | OK | Migrated; consumed via @lib/shared/routing. |
| lib/seo/methodMetadata.ts | util | lib/shared/seo/method-metadata.ts | method-metadata.ts | no | OK | Migrated; strict-friendly imports. |
| tests/e2e/method.meta.spec.ts | test:e2e | tests/e2e/method/method.meta.e2e.ts | method.meta.e2e.ts | yes (data-ll="method-hero") | OK | Migrated; uses alias + strict config. |
| tests/e2e/method-smoke.spec.ts | test:e2e | tests/e2e/method/smoke.e2e.ts | smoke.e2e.ts | yes (data-ll="method-hero", method-pillars, method-hero-cta) | OK | Migrated; selectors rely on data-ll. |
| tests/unit/method-jsonld.test.ts | test:unit | tests/unit/method/method-jsonld.spec.ts | method-jsonld.spec.ts | no | OK | Migrated; imports @lib/shared/method/article-schema. |

### Feature: waitlist

| Current Path | Type | Target Path | New Name | Selectors Needed? | Status | Notes |
| --- | --- | --- | --- | --- | --- | --- |
| app/api/unsubscribe/route.ts | route | app/api/unsubscribe/route.ts | same | no | SKIP | Waitlist unsubscribe route remains; alias updates only. |
| app/api/prefs/route.ts | route | app/api/prefs/route.ts | same | no | SKIP | Preferences endpoint stays put; ensure new imports reference relocated libs. |
| app/api/waitlist/resend/route.ts | route | app/api/waitlist/resend/route.ts | same | no | SKIP | Resend handler stays root-level; update imports post-move. |
| app/api/waitlist/route.ts | route | app/api/waitlist/route.ts | same | no | SKIP | Main waitlist API remains for Next constraints. |
| app/wl/[code]/route.ts | route | app/wl/[code]/route.ts | same | no | SKIP | Short-link route stays put; update imports when libs move. |
| app/(site)/_lib/referral.ts | util | lib/shared/waitlist/referral.client.ts | referral.client.ts | no | DECIDE | Can we adopt `.client.ts` naming for waitlist-only helpers with `use client`? |
| app/(site)/waitlist/confirm/route.ts | route | app/api/waitlist/confirm/route.ts | same | no | MIGRATED | 2025-10-09: Server redirect route lives under /api/waitlist/confirm to avoid page conflict; keep GET semantics. |
| app/(site)/waitlist/_lib/messages.ts | util | lib/shared/waitlist/messages.ts | messages.ts | no | OK | Keep locale loading centralised under shared waitlist namespace. |
| components/marketing/TrackView.tsx | feature-comp | components/features/waitlist/WaitlistViewTracker.tsx | WaitlistViewTracker.tsx | no | OK | Rename to avoid collision with analytics tracker component. |
| e2e/waitlist.spec.ts | test:e2e | tests/e2e/waitlist/landing.e2e.ts | landing.e2e.ts | yes (data-ll="wl-form") | MIGRATED | Remote Playwright suite now targets waitlist page via wl-* selectors and mocks API responses. |
| lib/firestore/waitlist.ts | server | lib/server/waitlist/firestore.server.ts | firestore.server.ts | no | MIGRATED | Server helper relocated with `.server.ts` suffix; imports updated to `@lib/server/waitlist`. |
| lib/unsubTokens.ts | util | lib/shared/waitlist/unsub-token.ts | unsub-token.ts | no | OK | Provide single named export for unsub tokens. |
| lib/waitlist.ts | util | lib/shared/api/waitlist.ts | waitlist.ts | no | MIGRATED | Lightweight client POST helper now lives under shared API namespace. |
| lib/waitlist/confirm.ts | server | lib/server/waitlist/confirm.server.ts | confirm.server.ts | no | MIGRATED | Confirm token processor moved to `lib/server/waitlist`; tests mock new path. |
| lib/waitlistConfirmTtl.ts | util | lib/shared/waitlist/confirm-ttl.ts | confirm-ttl.ts | no | OK | Update imports + unit tests to kebab-case filename. |
| scripts/strip_ip_from_waitlist.ts | util | scripts/waitlist/strip-ip-from-waitlist.ts | strip-ip-from-waitlist.ts | no | OK | Keep script under namespaced folder for clarity. |
| tests/e2e/waitlist.api.spec.ts | test:e2e | tests/e2e/waitlist/api.e2e.ts | api.e2e.ts | no | MIGRATED | REST assertions now live under waitlist folder; remains header-only without DOM selectors. |
| tests/unit/firestore.waitlist.test.ts | test:unit | tests/unit/waitlist/firestore.spec.ts | firestore.spec.ts | no | MIGRATED | Unit suite follows waitlist namespace; imports target server helpers. |
| tests/unit/referral.unit.test.ts | test:unit | tests/unit/waitlist/referral.spec.ts | referral.spec.ts | no | MIGRATED | Referral helper tests co-located with waitlist suite. |
| tests/unit/render-waitlist.test.ts | test:unit | tests/unit/waitlist/render.spec.ts | render.spec.ts | no | MIGRATED | Email renderer tests moved under waitlist namespace; import aliases updated. |
| tests/unit/validation.waitlist.test.ts | test:unit | tests/unit/waitlist/validation.spec.ts | validation.spec.ts | no | MIGRATED | Schema tests reference `@lib/shared/validation/waitlist-schema`. |
| tests/unit/waitlist.confirm.test.ts | test:unit | tests/unit/waitlist/confirm.spec.ts | confirm.spec.ts | no | MIGRATED | Server confirm mocks point at `@lib/server/waitlist/firestore.server`. |
| tests/unit/waitlistConfirmTtl.test.ts | test:unit | tests/unit/waitlist/confirm-ttl.spec.ts | confirm-ttl.spec.ts | no | MIGRATED | TTL helper tests relocated under waitlist namespace. |
| types/waitlist.ts | types | types/waitlist.types.ts | waitlist.types.ts | no | OK | Rename extension per naming spec; update exports. |

### Feature: forms

| Current Path | Type | Target Path | New Name | Selectors Needed? | Status | Notes |
| --- | --- | --- | --- | --- | --- | --- |
| app/(site)/components/ConfirmAnalytics.tsx | feature-comp | components/features/waitlist/ConfirmAnalytics.tsx | same | no | MIGRATED | Analytics helper now exported from waitlist barrel. |
| app/(site)/components/ConfirmResendForm.tsx | feature-comp | components/features/waitlist/ConfirmResendForm.tsx | same | yes (data-ll="wl-resend-form") | MIGRATED | Resend form exposes wl-resend-* selectors for Playwright coverage. |
| app/(site)/components/ReferralAttribution.tsx | feature-comp | components/features/waitlist/ReferralAttribution.tsx | same | yes (data-ll="wl-referral") | MIGRATED | Referral toast now under waitlist features; import via `@components/features/waitlist`. |
| app/(site)/components/WaitlistForm.tsx | feature-comp | components/features/waitlist/WaitlistFormLegacy.tsx | WaitlistFormLegacy.tsx | yes (data-ll="wl-form") | REMOVED | 2025-10-07: Legacy form retired; canonical WaitlistForm now the sole implementation. |
| components/waitlist/ResendConfirmForm.tsx | feature-comp | components/features/waitlist/ResendConfirmForm.tsx | same | yes (data-ll="wl-resend-form") | MIGRATED | Marketing resend card uses shared wl-resend-* selectors. |
| components/waitlist/WaitlistForm.tsx | feature-comp | components/features/waitlist/WaitlistForm.tsx | same | yes (data-ll="wl-form") | MIGRATED | Canonical hCaptcha form with wl-* anchors; exported via feature barrel. |
| lib/validation/waitlist.ts | util | lib/shared/validation/waitlist-schema.ts | waitlist-schema.ts | no | MIGRATED | Shared schema relocated under validation namespace. |

### Feature: header-nav

| Current Path | Type | Target Path | New Name | Selectors Needed? | Status | Notes |
| --- | --- | --- | --- | --- | --- | --- |
| app/(site)/components/Header.tsx | feature-comp | components/features/header-nav/Header.tsx | same | yes (data-ll="nav-root") | MIGRATED | Header lives under `components/features/header-nav`; barrel export enabled for alias imports. |
| app/(site)/components/HeaderConsentButton.tsx | feature-comp | components/features/header-nav/HeaderConsentButton.tsx | same | no (test ids retained) | MIGRATED | Consent toggle stays feature-local; analytics wiring unchanged. |
| app/(site)/components/HeaderDrawer.tsx | feature-comp | components/features/header-nav/HeaderDrawer.tsx | same | yes (data-ll="nav-menu-button") | MIGRATED | Drawer trigger now exposes `nav-menu-button`; other attrs unchanged. |
| app/(site)/components/HeaderLocaleSwitcher.tsx | feature-comp | components/features/header-nav/HeaderLocaleSwitcher.tsx | same | yes (data-ll="nav-locale-switcher") | MIGRATED | Adds shared selector for desktop + mobile locale forms. |
| app/(site)/components/HeaderThemeToggle.tsx | feature-comp | components/features/header-nav/HeaderThemeToggle.tsx | same | no | MIGRATED | Theme toggle moved with feature; existing test ids kept. |
| app/(site)/components/PromoRibbon.tsx | feature-comp | components/features/header-nav/PromoRibbon.tsx | same | yes (focus fallback via nav-waitlist-cta) | MIGRATED | Ribbon co-located with header; CTA focus lookup uses new data-ll selector. |
| components/ThemeInit.tsx | ui | components/ui/ThemeInit.tsx | same | no | OK | Shared atom across header + layout; path-only move. |
| components/ThemeToggle.tsx | ui | components/ui/ThemeToggle.tsx | same | yes (data-ll="ui-theme-toggle") | OK | Provide selector for accessibility smoke tests. |
| lib/header/ctaConfig.ts | util | lib/shared/header/cta-config.ts | cta-config.ts | no | OK | Convert to kebab-case util with named export. |
| lib/header/ribbonConfig.ts | util | lib/shared/header/ribbon-config.ts | ribbon-config.ts | no | OK | Align with shared header namespace. |
| lib/header/useScrollHeaderState.ts | hook | lib/shared/header/use-scroll-header-state.ts | use-scroll-header-state.ts | no | OK | Hook stays shared; update barrel if added later. |
| lib/nav/config.ts | util | lib/shared/nav/config.ts | config.ts | no | OK | Keep named export; update header + footer imports. |
| tests/e2e/header.consent.spec.ts | test:e2e | tests/e2e/header-nav/consent.e2e.ts | consent.e2e.ts | yes (data-ll="nav-waitlist-cta") | MIGRATED | CTA interactions now rely on nav data selectors. |
| tests/e2e/header.cta.spec.ts | test:e2e | tests/e2e/header-nav/cta.e2e.ts | cta.e2e.ts | yes (data-ll="nav-waitlist-cta") | MIGRATED | Primary CTA assertions use new selector; locale utils path updated. |
| tests/e2e/header.drawer.spec.ts | test:e2e | tests/e2e/header-nav/drawer.e2e.ts | drawer.e2e.ts | yes (data-ll="nav-menu-button") | MIGRATED | Drawer suite exercises new menu button selector. |
| tests/e2e/header.ia.spec.ts | test:e2e | tests/e2e/header-nav/ia.e2e.ts | ia.e2e.ts | yes (data-ll="nav-locale-switcher") | MIGRATED | Locale switcher assertions leverage nav data attr. |
| tests/e2e/header.i18n.spec.ts | test:e2e | tests/e2e/header-nav/i18n.e2e.ts | i18n.e2e.ts | yes (data-ll="nav-locale-switcher") | MIGRATED | Desktop/mobile locale forms selected via data-ll. |
| tests/e2e/header.motion.spec.ts | test:e2e | tests/e2e/header-nav/motion.e2e.ts | motion.e2e.ts | yes (data-ll="nav-root") | MIGRATED | Motion suite references header shell via nav-root selector. |
| tests/e2e/header.regressions.spec.ts | test:e2e | tests/e2e/header-nav/regressions.e2e.ts | regressions.e2e.ts | yes (data-ll="nav-waitlist-cta") | MIGRATED | CTA width + drawer analytics assertions leverage nav selectors. |
| tests/e2e/header.ribbon.spec.ts | test:e2e | tests/e2e/header-nav/ribbon.e2e.ts | ribbon.e2e.ts | yes (data-ll="nav-waitlist-cta") | MIGRATED | Ribbon CTA/checks reuse nav CTA selector. |
| tests/e2e/header.seo.spec.ts | test:e2e | tests/e2e/header-nav/seo.e2e.ts | seo.e2e.ts | yes (data-ll="nav-waitlist-cta") | MIGRATED | SEO UTM checks use nav CTA selector; imports updated. |
| tests/e2e/header.shell.spec.ts | test:e2e | tests/e2e/header-nav/shell.e2e.ts | shell.e2e.ts | yes (data-ll="nav-root") | MIGRATED | Primary shell spec reads nav-root and menu button selectors. |
| tests/e2e/header.theme.spec.ts | test:e2e | tests/e2e/header-nav/theme.e2e.ts | theme.e2e.ts | yes (data-ll="nav-menu-button") | MIGRATED | Mobile theme coverage exercises menu selector before toggling. |
| tests/e2e/header.userstate.spec.ts | test:e2e | tests/e2e/header-nav/userstate.e2e.ts | userstate.e2e.ts | yes (data-ll="nav-waitlist-cta") | MIGRATED | CTA rewrites and analytics hooks rely on nav CTA selector. |
| tests/e2e/header.visual.spec.ts | test:e2e | tests/e2e/header-nav/visual.e2e.ts | visual.e2e.ts | yes (data-ll="nav-root") | MIGRATED | Visual snapshots capture nav-root, remote auth scenario. |

### Feature: footer

| Current Path | Type | Target Path | New Name | Selectors Needed? | Status | Notes |
| --- | --- | --- | --- | --- | --- | --- |
| app/(site)/components/Footer.tsx | feature-comp | components/features/footer/Footer.tsx | Footer.tsx | yes (data-ll="footer-root") | MIGRATED | Relocated footer shell, added feature barrel, updated consent + legal imports. |
| components/PrivacyRibbon.tsx | feature-comp | components/features/footer/PrivacyRibbon.tsx | same | yes (data-ll="footer-privacy-ribbon") | OK | Works with consent feature; maintain SSR boundary. |
| components/PrivacyRibbonLink.tsx | ui | components/ui/PrivacyRibbonLink.tsx | same | no | OK | Shared atom for footer + legal pages. |
| components/TrustBar.tsx | block | components/blocks/TrustBar.tsx | same | yes (data-ll="footer-trust-bar") | OK | Data attr ensures Playwright trust coverage. |
| components/TrustLogoLink.tsx | ui | components/ui/TrustLogoLink.tsx | same | no | OK | Update imports from home + footer after move. |

### Feature: seo-jsonld

| Current Path | Type | Target Path | New Name | Selectors Needed? | Status | Notes |
| --- | --- | --- | --- | --- | --- | --- |
| app/manifest.ts | route | app/manifest.ts | same | no | SKIP | Next manifest must stay at root; ensure metadata util imports update. |
| app/robots.ts | route | app/robots.ts | same | no | SKIP | Robots handler remains root-level per Next requirements. |
| app/sitemap.ts | route | app/sitemap.ts | same | no | SKIP | Keep sitemap at root; update imports to alias after moves. |
| components/FaqTwinsVoucherSchema.tsx | feature-comp | components/features/seo/FaqTwinsVoucherSchema.tsx | same | no | OK | Schema component stays server-safe; add named export. |
| components/SeoJsonLd.tsx | feature-comp | lib/shared/seo/json-ld.tsx | json-ld.tsx | no | OK | Moved into shared runtime to keep helpers isomorphic; keep named exports and continue to pass CSP nonce from layouts. |
| components/TrustSchema.tsx | feature-comp | components/features/seo/TrustSchema.tsx | same | no | OK | Shared trust schema between home + method. |
| lib/seo/legalMetadata.ts | util | lib/shared/seo/legal-metadata.ts | legal-metadata.ts | no | OK | Kebab-case util; ensure named export. |
| lib/seo/shared.ts | util | lib/shared/seo/shared.ts | same | no | OK | Houses helpers consumed by metadata builders. |
| tests/e2e/seo.spec.ts | test:e2e | tests/e2e/seo/home.meta.e2e.ts | home.meta.e2e.ts | no | RETIRED | Slice 2 replaced the legacy catch-all with modular home/method metadata specs; no selectors required. |
| tests/unit/metadata.ref.test.ts | test:unit | tests/unit/seo/metadata-ref.spec.ts | metadata-ref.spec.ts | no | OK | Update import to shared metadata util after move. |

### Feature: i18n-core

| Current Path | Type | Target Path | New Name | Selectors Needed? | Status | Notes |
| --- | --- | --- | --- | --- | --- | --- |
| i18n/de/waitlist.json | util | content/i18n/de/waitlist.json | same | no | OK | Move locale JSON under content namespace per spec. |
| i18n/en/waitlist.json | util | content/i18n/en/waitlist.json | same | no | OK | Content folder becomes source for message sync scripts. |
| i18n/request.ts | util | lib/shared/i18n/request.ts | request.ts | no | OK | Normalize to kebab-case path; update imports. |
| lib/intl/getLocale.ts | util | lib/shared/i18n/get-locale.ts | get-locale.ts | no | OK | Align with kebab-case naming. |
| lib/intl/loadMessages.ts | util | lib/shared/i18n/load-messages.ts | load-messages.ts | no | OK | Update next-intl loader references. |
| lib/intl/localePath.ts | util | lib/shared/i18n/locale-path.ts | locale-path.ts | no | OK | Rename to kebab-case; adjust routing util imports. |
| next-intl.config.mjs | util | config/next-intl.config.mjs | next-intl.config.mjs | no | DECIDE | Prefer co-locating intl config under config/? Bundler happy with this move? |
| next-intl.config.ts | util | config/next-intl.config.ts | next-intl.config.ts | no | DECIDE | Can we consolidate to a single config file (ts vs mjs)? |
| next-intl.locales.ts | util | lib/shared/i18n/locales.ts | locales.ts | no | OK | Export SupportedLocale type from shared i18n namespace. |
| tests/unit/i18n.keys.test.ts | test:unit | tests/unit/i18n/keys.spec.ts | keys.spec.ts | no | OK | Update import paths to new content folder. |

### Feature: csp-headers

| Current Path | Type | Target Path | New Name | Selectors Needed? | Status | Notes |
| --- | --- | --- | --- | --- | --- | --- |
| lib/csp/nonce-context.tsx | feature-comp | lib/shared/csp/nonce-context.tsx | same | no | OK | Keep provider under shared namespace; update barrel if needed. |
| lib/env/guard.ts | server | lib/server/env/guard.ts | guard.ts | no | OK | Server-only env snapshot; ensure tests updated to new path. |
| lib/env/prelaunch.ts | util | lib/shared/env/prelaunch.ts | prelaunch.ts | no | OK | Provide alias-based import for shared prelaunch checks. |
| lib/env/site-origin.ts | util | lib/shared/url/get-site-origin.ts | get-site-origin.ts | no | OK | Centralises site origin helper for OG builders and metadata. |
| middleware.ts | server | middleware.ts | same | no | SKIP | Middleware must remain at repo root per Next. |
| tests/e2e/security/headers.e2e.ts | test:e2e | tests/e2e/csp/security-headers.e2e.ts | security-headers.e2e.ts | no | OK | Uses response header assertions; no selectors required. |

### Feature: status-api

| Current Path | Type | Target Path | New Name | Selectors Needed? | Status | Notes |
| --- | --- | --- | --- | --- | --- | --- |
| app/api/status/route.ts | route | app/api/status/route.ts | same | no | SKIP | Next API handler stays put; document alias updates in PR. |
| lib/status/auth.ts | server | lib/server/status/auth.ts | auth.ts | no | OK | Server-only basic auth; keep named exports. |
| lib/status/collect.ts | server | lib/server/status/collect.ts | collect.ts | no | OK | Lives beside auth to share secret imports. |
| tests/e2e/status.spec.ts | test:e2e | tests/e2e/status/status.e2e.ts | status.e2e.ts | no | OK | HTTP assertions only; no selectors needed. |
| tests/unit/status-auth.spec.ts | test:unit | tests/unit/status/auth.spec.ts | auth.spec.ts | no | OK | Update imports to new server path. |

### Feature: auth

| Current Path | Type | Target Path | New Name | Selectors Needed? | Status | Notes |
| --- | --- | --- | --- | --- | --- | --- |
| lib/auth/userState.server.ts | server | lib/server/auth/user-state.server.ts | user-state.server.ts | no | OK | Server helper for header analytics; rename to kebab-case. |
| lib/auth/userState.ts | util | lib/shared/auth/user-state.ts | user-state.ts | no | OK | Shared client helper consumed by header + analytics. |

### Feature: shared-ui

| Current Path | Type | Target Path | New Name | Selectors Needed? | Status | Notes |
| --- | --- | --- | --- | --- | --- | --- |
| app/(site)/_lib/ui.ts | util | lib/shared/ui.ts | ui.ts | no | OK | Centralize layout tokens for reuse across features. |
| app/theme-client.ts | util | lib/shared/theme/theme-client.ts | theme-client.ts | no | DECIDE | Keep `'use client'` util in lib/? Any bundler issues? |
| lib/hooks/useIntentPrefetch.ts | hook | lib/shared/hooks/use-intent-prefetch.ts | use-intent-prefetch.ts | no | OK | Kebab-case hook filename; update imports. |
| lib/hooks/usePrefersReducedMotion.ts | hook | lib/shared/hooks/use-prefers-reduced-motion.ts | use-prefers-reduced-motion.ts | no | OK | Shared hook used by header + hero animations. |
| lib/theme/constants.ts | util | lib/shared/theme/constants.ts | constants.ts | no | OK | Keep exported const maps; update theme client references. |
| lib/tokens.ts | util | lib/shared/theme/tokens.ts | tokens.ts | no | OK | Houses design tokens adapter; move under theme namespace. |
| lib/utils/deepMerge.ts | util | lib/shared/utils/deep-merge.ts | deep-merge.ts | no | OK | Kebab-case util; ensure tests reference new path. |

### Feature: analytics

| Current Path | Type | Target Path | New Name | Selectors Needed? | Status | Notes |
| --- | --- | --- | --- | --- | --- | --- |
| app/api/track/route.ts | route | app/api/track/route.ts | same | no | SKIP | Next API route stays put; update imports after alias migration. |
| components/SectionViewTracker.tsx | feature-comp | components/features/analytics/SectionViewTracker.tsx | same | yes (data-ll="analytics-section") | OK | Add attr for deterministic viewport tracking tests. |
| lib/ab.ts | util | lib/shared/analytics/ab.ts | ab.ts | no | OK | Lives with analytics utilities; export remains named. |
| lib/analytics.ts | server | lib/server/analytics/log.ts | log.ts | no | OK | Server logging to Firestore; update imports + tests. |
| lib/analytics/header.ts | util | lib/shared/analytics/header.ts | header.ts | no | OK | Co-locate header analytics helpers with shared schema. |
| lib/analytics/init.ts | util | lib/shared/analytics/init.ts | init.ts | no | OK | Provide central bootstrap for analytics runtime. |
| lib/analytics/interaction.ts | util | lib/shared/analytics/interaction.ts | interaction.ts | no | OK | Update re-export from header tests if needed. |
| lib/analytics.schema.ts | types | lib/shared/analytics/schema.ts | schema.ts | no | OK | Maintains shared types between client + server analytics. |
| lib/clientAnalytics.ts | util | lib/shared/analytics/client.ts | client.ts | no | OK | Keeps `track` helper accessible to components. |
| lib/url/analyticsTarget.ts | util | lib/shared/analytics/analytics-target.ts | analytics-target.ts | no | OK | Kebab-case util; update all imports. |
| lib/url/appendUtmParams.ts | util | lib/shared/analytics/append-utm-params.ts | append-utm-params.ts | no | OK | Lives alongside analytics URL helpers. |
| tests/e2e/landing.spec.ts | test:e2e | tests/e2e/analytics/landing.e2e.ts | landing.e2e.ts | yes (data-ll="home-hero") | OK | Uses hero selector to assert analytics events. |
| tests/unit/analytics.spec.ts | test:unit | tests/unit/analytics/analytics.spec.ts | analytics.spec.ts | no | OK | Update imports to new shared analytics namespace. |

### Feature: consent

| Current Path | Type | Target Path | New Name | Selectors Needed? | Status | Notes |
| --- | --- | --- | --- | --- | --- | --- |
| app/(site)/components/ConsentNotice.tsx | feature-comp | components/features/consent/ConsentNotice.tsx | same | yes (data-ll="consent-notice") | OK | Ensure notice attaches to consent provider after move. |
| components/ConsentBanner.tsx | feature-comp | components/features/consent/ConsentBanner.tsx | same | yes (data-ll="consent-banner") | OK | Banner will expose stable selector for Playwright. |
| components/ConsentProvider.tsx | feature-comp | components/features/consent/ConsentProvider.tsx | same | no | OK | Remains app-level context provider; update root layout import. |
| lib/consent/cookie.ts | util | lib/shared/consent/cookie.ts | cookie.ts | no | OK | Shared cookie helpers for consent; update imports. |
| lib/consent/state.ts | util | lib/shared/consent/state.ts | state.ts | no | OK | Keeps store logic under shared namespace. |
| tests/e2e/consent.spec.ts | test:e2e | tests/e2e/consent/consent.e2e.ts | consent.e2e.ts | yes (data-ll="consent-banner") | OK | Align spec with new attr + alias paths. |

### Feature: email

| Current Path | Type | Target Path | New Name | Selectors Needed? | Status | Notes |
| --- | --- | --- | --- | --- | --- | --- |
| emails/WaitlistConfirm.tsx | feature-comp | emails/waitlist/WaitlistConfirmLegacy.tsx | WaitlistConfirmLegacy.tsx | no | DECIDE | Merge with WaitlistConfirmEmail.tsx or keep legacy template? |
| emails/WaitlistConfirmEmail.tsx | feature-comp | emails/waitlist/WaitlistConfirmEmail.tsx | same | no | OK | Canonical confirm template; update imports to new folder. |
| emails/WaitlistResendEmail.tsx | feature-comp | emails/waitlist/WaitlistResendEmail.tsx | same | no | OK | Move under waitlist namespace. |
| emails/WaitlistWelcome.tsx | feature-comp | emails/waitlist/WaitlistWelcomeEmail.tsx | WaitlistWelcomeEmail.tsx | no | OK | Rename to clarify template purpose. |
| emails/emailTheme.ts | util | emails/theme.ts | theme.ts | no | OK | Keep close to templates; update import paths. |
| lib/email/colors.ts | util | lib/shared/email/colors.ts | colors.ts | no | OK | Shared email palette. |
| lib/email/headers.ts | util | lib/shared/email/headers.ts | headers.ts | no | OK | Provide shared header builder for tests + scripts. |
| lib/email/renderWaitlist.tsx | server | lib/server/email/render-waitlist.tsx | render-waitlist.tsx | no | OK | Server rendering helper; keep default export named. |
| lib/email/sendWaitlistConfirm.ts | server | lib/server/email/send-waitlist-confirm.ts | send-waitlist-confirm.ts | no | OK | Rename to kebab-case; update tests + API handlers. |
| lib/email/suppress.ts | util | lib/shared/email/suppress.ts | suppress.ts | no | OK | Shared suppression utilities for tests + scripts. |
| lib/email/tokens.ts | util | lib/shared/email/tokens.ts | tokens.ts | no | OK | Houses token helpers consumed by templates. |
| lib/email/transport.ts | server | lib/server/email/transport.ts | transport.ts | no | OK | Lives beside send helper; ensure secrets usage stays server-side. |
| lib/resendClient.ts | server | lib/server/email/resend-client.ts | resend-client.ts | no | OK | Centralize Resend client; update API + job imports. |
| scripts/email-headers-preview.ts | util | scripts/email/headers-preview.ts | headers-preview.ts | no | OK | Group email scripts under dedicated folder. |
| scripts/email-preview.ts | util | scripts/email/preview.ts | preview.ts | no | OK | Align script names with folder structure. |
| tests/unit/email-headers.test.ts | test:unit | tests/unit/email/headers.spec.ts | headers.spec.ts | no | OK | Update imports to new shared/email path. |
| tests/unit/email.sendWaitlistConfirm.test.ts | test:unit | tests/unit/email/send-waitlist-confirm.spec.ts | send-waitlist-confirm.spec.ts | no | OK | Rename to `.spec.ts` and update server path. |
| tests/unit/suppress.test.ts | test:unit | tests/unit/email/suppress.spec.ts | suppress.spec.ts | no | OK | Ensure path change matches shared/email namespace. |

### Feature: security

| Current Path | Type | Target Path | New Name | Selectors Needed? | Status | Notes |
| --- | --- | --- | --- | --- | --- | --- |
| lib/crypto/emailHash.ts | util | lib/shared/security/crypto/email-hash.ts | email-hash.ts | no | OK | Keep pure util shared between waitlist + unsub flows. |
| lib/crypto/ipHash.ts | util | lib/shared/security/crypto/ip-hash.ts | ip-hash.ts | no | OK | Move under security namespace; update tests. |
| lib/crypto/token.ts | util | lib/shared/security/crypto/token.ts | token.ts | no | OK | Houses token hashing; ensure server imports adjust. |
| lib/security/hcaptcha.ts | server | lib/server/security/hcaptcha.ts | hcaptcha.ts | no | OK | Lives server-side; update API handlers + tests. |
| lib/security/tokens.ts | util | lib/shared/security/tokens.ts | tokens.ts | no | OK | Shared constant-time helpers; adjust imports. |
| tests/unit/security.hcaptcha.test.ts | test:unit | tests/unit/security/hcaptcha.spec.ts | hcaptcha.spec.ts | no | OK | Update path to new server helper. |
| tests/unit/security.tokens.test.ts | test:unit | tests/unit/security/tokens.spec.ts | tokens.spec.ts | no | OK | Align with shared/security namespace. |

### Feature: routing

| Current Path | Type | Target Path | New Name | Selectors Needed? | Status | Notes |
| --- | --- | --- | --- | --- | --- | --- |
| app/opengraph-image/route.ts | route | app/opengraph-image/route.ts | same | no | SKIP | Next image route stays root-level; document alias updates only. |
| app/locale/switch/route.ts | route | app/locale/switch/route.ts | same | no | SKIP | Locale switcher remains in place pending Slice E routing overhaul. |
| lib/http/errors.ts | util | lib/shared/http/errors.ts | errors.ts | no | OK | Shared HTTP helper; update API handlers after move. |
| lib/routing/legalPath.ts | util | lib/shared/routing/legal-path.ts | legal-path.ts | no | MIGRATED | Helper moved to shared routing; aliases updated across footer + legal flows. |
| tests/e2e/legal.a11y.spec.ts | test:axe | tests/axe/canonical.axe.ts | canonical.axe.ts | no | RETIRED | Slice 6 replaced per-page legal scan with canonical axe coverage (/, /waitlist, /method). |
| tests/e2e/legal.spec.ts | test:e2e | tests/e2e/legal/legal.e2e.ts | legal.e2e.ts | yes (data-ll="footer-shell") | OK | Legal nav assertions rely on footer shell attr. |
| tests/e2e/unsubscribe.spec.ts | test:e2e | tests/e2e/unsubscribe/unsubscribe.e2e.ts | unsubscribe.e2e.ts | yes (data-ll="unsubscribe-form") | DECIDE | Need explicit selector on unsubscribe form—where to add `data-ll`? |

### Feature: infrastructure

| Current Path | Type | Target Path | New Name | Selectors Needed? | Status | Notes |
| --- | --- | --- | --- | --- | --- | --- |
| lib/firebaseAdmin.ts | server | lib/server/firebase/admin.ts | admin.ts | no | OK | Move to server namespace; update Firestore helpers. |
| lib/flags.ts | util | lib/shared/env/flags.ts | flags.ts | no | OK | Centralize environment feature flags. |
| lib/nextTypes.ts | types | types/next.types.ts | next.types.ts | no | OK | Relocate Next augmentation types. |
| lib/testMode.ts | util | lib/shared/env/test-mode.ts | test-mode.ts | no | OK | Shared util powering analytics + status flows. |

### Feature: admin

| Current Path | Type | Target Path | New Name | Selectors Needed? | Status | Notes |
| --- | --- | --- | --- | --- | --- | --- |
| app/admin/events/export/route.ts | route | app/admin/events/export/route.ts | same | no | SKIP | File export remains a Next route; rely on relocated server libs. |
| app/api/admin/backfill-unsub/route.ts | route | app/api/admin/backfill-unsub/route.ts | same | no | SKIP | Admin API stays root-level; update imports only. |
| app/admin/_lib/metrics.ts | server | lib/server/admin/metrics.ts | metrics.ts | no | OK | Move shared queries out of app directory. |
| app/admin/components/Sparkline.tsx | ui | components/features/admin/Sparkline.tsx | same | no | OK | Ensure admin dashboard imports update. |
| lib/admin/eventsQuery.ts | server | lib/server/admin/events-query.ts | events-query.ts | no | OK | Rename to kebab-case; keep named exports. |

### Feature: ops-tooling

| Current Path | Type | Target Path | New Name | Selectors Needed? | Status | Notes |
| --- | --- | --- | --- | --- | --- | --- |
| eslint.config.mjs | util | config/eslint.config.mjs | eslint.config.mjs | no | OK | Move configs under central `config/` folder. |
| lighthouserc.cjs | util | config/lighthouserc.cjs | lighthouserc.cjs | no | OK | Align lighthouse config with other tooling files. |
| next.config.ts | util | config/next.config.ts | next.config.ts | no | OK | Update Next CLI references after relocation. |
| playwright.config.ts | util | config/playwright.config.ts | playwright.config.ts | no | OK | Adjust `npx playwright` invocation path. |
| postcss.config.mjs | util | config/postcss.config.mjs | postcss.config.mjs | no | OK | Ensure next/tailwind build picks new location. |
| scripts/check-i18n-placeholders.mjs | util | scripts/i18n/check-placeholders.mjs | check-placeholders.mjs | no | OK | Namespaced under `scripts/i18n`. |
| scripts/guard-hex.mjs | util | scripts/guards/guard-hex.mjs | guard-hex.mjs | no | OK | Keep guard scripts grouped. |
| scripts/guard-louhenfit.mjs | util | scripts/guards/guard-louhenfit.mjs | guard-louhenfit.mjs | no | OK | Same folder as other guards. |
| scripts/run-lighthouse.mjs | util | scripts/qa/run-lighthouse.mjs | run-lighthouse.mjs | no | OK | QA scripts under dedicated folder. |
| scripts/summarize_playwright_failures.mjs | util | scripts/qa/summarize-playwright-failures.mjs | summarize-playwright-failures.mjs | no | OK | Works with new config/playwright location. |
| tailwind.config.ts | util | config/tailwind.config.ts | tailwind.config.ts | no | OK | Update build scripts to new config path. |
| vitest.config.ts | util | config/vitest.config.ts | vitest.config.ts | no | OK | Ensure `vitest` CLI picks relocated config. |
| vitest.setup.ts | util | tests/unit/vitest.setup.ts | vitest.setup.ts | no | OK | Lives alongside unit test setup helpers. |

### Feature: types-constants

| Current Path | Type | Target Path | New Name | Selectors Needed? | Status | Notes |
| --- | --- | --- | --- | --- | --- | --- |
| constants/site.ts | util | lib/shared/constants/site.ts | site.ts | no | OK | Move constants under shared namespace for alias imports. |
| next-env.d.ts | types | next-env.d.ts | same | no | SKIP | Managed by Next CLI; leave at repo root. |
| types/shims-zustand.d.ts | types | types/shims/zustand.d.ts | zustand.d.ts | no | OK | Nest shims for better grouping; update tsconfig include. |

### Feature: tests-support

| Current Path | Type | Target Path | New Name | Selectors Needed? | Status | Notes |
| --- | --- | --- | --- | --- | --- | --- |
| tests/e2e/__skip__.spec.ts | test:e2e | tests/e2e/_legacy/__skip__.spec.ts | __skip__.spec.ts | no | DECIDE | Retire skip spec or keep as legacy reference? |
| tests/e2e/_utils/url.ts | util | tests/e2e/utils/url.ts | url.ts | no | OK | Move helper under utils folder; adjust imports. |
| tests/setup.server-mocks.ts | util | tests/unit/setup.server-mocks.ts | setup.server-mocks.ts | no | OK | Align unit test helper with new folder structure. |

### Feature: design-tokens

| Current Path | Type | Target Path | New Name | Selectors Needed? | Status | Notes |
| --- | --- | --- | --- | --- | --- | --- |
| packages/design-tokens/build/web/tokens.ts | util | packages/design-tokens/build/web/tokens.ts | same | no | SKIP | Generated output; ensure tooling regenerates after moves. |
| packages/design-tokens/sd.config.cjs | util | packages/design-tokens/config/sd.config.cjs | sd.config.cjs | no | OK | Move config into `config/` folder inside package. |

## 5. Test Files Mapping

Pending moves use new `tests/{unit,e2e,axe}/<feature>/` layout; selectors noted where migration to `data-ll` is mandatory.

| Feature | Existing Tests | Target Path(s) | Selector Migration |
| --- | --- | --- | --- |
| home (covered via analytics) | `tests/e2e/landing.spec.ts` | `tests/e2e/analytics/landing.e2e.ts` | Add `data-ll="home-hero"` + re-use share CTA attrs. |
| method | `tests/e2e/method.meta.spec.ts`, `tests/e2e/method-smoke.spec.ts`, `tests/unit/method-jsonld.test.ts` | `tests/e2e/method/*.e2e.ts`, `tests/unit/method/method-jsonld.spec.ts` | Ensure hero/CTA/trust selectors exist (`method-hero`, `method-cta`, `method-trust`). |
| waitlist | `e2e/waitlist.spec.ts`, `tests/e2e/waitlist.api.spec.ts`, `tests/unit/waitlist*.test.ts`, `tests/unit/referral.unit.test.ts`, `tests/unit/validation.waitlist.test.ts` | `tests/e2e/waitlist/*.e2e.ts`, `tests/unit/waitlist/*.spec.ts` | Add `data-ll="waitlist-form"`, `data-ll="waitlist-resend-form"`, `data-ll="waitlist-referral"`. |
| forms | Reuses waitlist specs above | Same as waitlist | Same selectors as waitlist features; ensure legacy form flagged if retained. |
| header-nav | `tests/e2e/header.*.spec.ts` (12 specs) | `tests/e2e/header/*.e2e.ts` | Provide `data-ll` for analytics + `data-testid="lh-nav-*"` (root, CTA, consent, drawer, locale, theme). |
| footer / routing | `tests/e2e/legal.spec.ts`, `tests/e2e/unsubscribe.spec.ts` | `tests/e2e/legal/legal.e2e.ts`, `tests/e2e/unsubscribe/unsubscribe.e2e.ts` | Add `data-ll="footer-shell"`, `data-testid="unsubscribe-root"`, and ensure canonical axe coverage remains in `tests/axe/canonical.axe.ts`. |
| seo-jsonld | `tests/e2e/seo/home.meta.e2e.ts`, `tests/e2e/seo/canonical-uniqueness.e2e.ts`, `tests/e2e/method/method.meta.e2e.ts`, `tests/unit/metadata.ref.test.ts` | `tests/e2e/seo/*.e2e.ts`, `tests/unit/seo/metadata-ref.spec.ts` | JSON-LD assertions now split across modular specs; no additional selectors required. |
| i18n-core | `tests/unit/i18n.keys.test.ts` | `tests/unit/i18n/keys.spec.ts` | No selectors; update imports to `content/i18n`. |
| csp-headers | `tests/e2e/security/headers.e2e.ts` | `tests/e2e/csp/security-headers.e2e.ts` | No DOM selectors. |
| status-api | `tests/e2e/status.spec.ts`, `tests/unit/status-auth.spec.ts` | `tests/e2e/status/status.e2e.ts`, `tests/unit/status/auth.spec.ts` | No selectors; ensure server mocks updated. |
| analytics | `tests/unit/analytics.spec.ts` (plus landing e2e above) | `tests/unit/analytics/analytics.spec.ts` | Hero selector reused from home. |
| consent | `tests/e2e/consent.spec.ts` | `tests/e2e/consent/consent.e2e.ts` | Add `data-ll="consent-banner"` attr. |
| email | `tests/unit/email-headers.test.ts`, `tests/unit/email.sendWaitlistConfirm.test.ts`, `tests/unit/suppress.test.ts` | `tests/unit/email/{headers,suppress,send-waitlist-confirm}.spec.ts` | No selectors. |
| security | `tests/unit/security.hcaptcha.test.ts`, `tests/unit/security.tokens.test.ts` | `tests/unit/security/{hcaptcha,tokens}.spec.ts` | No selectors. |
| tests-support | `tests/e2e/_utils/url.ts`, `tests/setup.server-mocks.ts`, `tests/e2e/__skip__.spec.ts` | `tests/e2e/utils/url.ts`, `tests/setup/server-mocks.ts`, `tests/e2e/_legacy/__skip__.spec.ts` | No selectors; confirm whether legacy skip spec is still needed. |

## 6. Batch Plan (One-Feature-Per-PR)

| Order | Feature | Touch Points | Import Updates | Validation |
| --- | --- | --- | --- | --- |
| 1 | shared-ui | Move `app/(site)/_lib/ui.ts`, theme hooks, shared utils to `lib/shared/**` | Update all component imports to `@/lib/shared/*` | `npm run lint`, smoke build |
| 2 | header-nav | Relocate header components + nav configs | Switch header imports to `@/components/features/header/*` and new shared hooks | `npm run lint`, `npm run build`, run header Playwright suite |
| 3 | home | Move landing sections & supporting atoms | Update home imports + analytics tracker references | `npm run lint`, `npm run build`, targeted `npm run test -- landing` |
| 4 | analytics | Shift analytics libs + section tracker | Update `track` callers to new alias; adjust env imports | `npm run lint`, unit analytics spec, landing e2e |
| 5 | method | Relocate method components + routing utils | Replace imports with `@/components/features/method/*` & `lib/shared/seo` | `npm run lint`, `npm run build`, method e2e suite |
| 6 | consent | Move consent components + cookie/state utils | Update layout/header to import from consent feature | `npm run lint`, consent e2e |
| 7 | waitlist | Server libs, referral util, waitlist tests | Update API routes + emails to new shared/server paths | `npm run lint`, waitlist e2e/api + unit suite |
| 8 | forms | Consolidate form components & validation schema | Update pages to import canonical form(s) | `npm run lint`, waitlist e2e (form focus) |
| 9 | email | Move templates + email libs/scripts | Update waitlist + cron jobs to new email paths | `npm run lint`, unit email specs |
|10 | footer | Relocate footer components + trust UI | Update layout/footer imports; add footer selectors | `npm run lint`, legal e2e + axe |
|11 | routing | Move legal/unsubscribe helpers & tests | Update routing util imports & selectors | `npm run lint`, unsubscribe e2e, legal suites |
|12 | seo-jsonld | Move schema components + metadata helpers | Update page metadata imports; decide JSON-LD selector | `npm run lint`, SEO e2e, metadata unit |
|13 | i18n-core | Relocate locale JSON + loaders + config | Update import paths in pages + tests | `npm run lint`, i18n unit, header i18n e2e |
|14 | status-api | Move status server helpers | Update API route + tests to new path | `npm run lint`, status e2e, unit auth |
|15 | security | Move crypto + hCaptcha helpers | Update waitlist/email imports | `npm run lint`, security unit tests |
|16 | infrastructure | Move env/flags/firebase/test-mode helpers | Update server modules depending on admin client | `npm run lint`, targeted unit tests (waitlist/status) |
|17 | admin | Relocate admin components + queries | Update admin routes to new paths | `npm run lint`, `npm run build` (admin) |
|18 | ops-tooling | Relocate configs + scripts | Update npm scripts referencing moved configs | `npm run lint`, `npm run build`, Playwright smoke |
|19 | tests-support | Move setup + utils + legacy spec | Update import paths across tests | `npm run lint`, run representative jest/vitest subset |
|20 | design-tokens | Re-home sd.config + document generated outputs | Update npm scripts referencing config | `npm run lint`, run design token build script |

## 7. Risk & Owners

| Risk | Mitigation | Owner |
| --- | --- | --- |
| Import alias churn causing broken builds | Land shared-ui + alias PR first, run `npm run lint && npm run build` each slice | @martin |
| Missing `data-ll` selectors breaking Playwright | Add selectors during component move, update specs immediately | @qa-sam |
| Route grouping conflicts (locale/i18n folders) | Confirm locale path structure before moving files; run i18n unit + header i18n e2e | @localization-ivy |
| Shared component coupling (home vs method) | Use DECIDE prompts to confirm duplicates before merging variants | @design-owen |
| Config relocation breaking tooling | Update npm scripts + CI references in same PR, rerun affected command (`npm run lint`, `npx playwright test`) | @ops-lee |

## 8. Acceptance Criteria

- Inventory tables populated with OK/DECIDE/SKIP decisions and prompt questions for undecided paths.
- Target paths align with [/CONTEXT/naming.md](./naming.md); no off-spec barrels proposed.
- Tests mapped for every feature touching components, routes, or APIs.
- `Selectors Needed?` column lists required `data-ll` additions for each relevant move.
- Batch plan executed feature-by-feature with lint/build + targeted specs green before merge.

## 9. Appendix: Example Row Set

Representative transformations covering util → `lib/shared`, server adapter → `lib/server`, UI → `components/ui`, block → `components/blocks`, feature composite → `components/features/<feature>`.

| Current Path | Type | Target Path | New Name | Status |
| --- | --- | --- | --- | --- |
| lib/utils/deepMerge.ts | util | lib/shared/utils/deep-merge.ts | deep-merge.ts | OK |
| lib/firestore/waitlist.ts | server | lib/server/waitlist/firestore.ts | firestore.ts | OK |
| components/ThemeToggle.tsx | ui | components/ui/ThemeToggle.tsx | same | OK |
| components/HowItWorks.tsx | block | components/blocks/HowItWorksIllustrated.tsx | HowItWorksIllustrated.tsx | DECIDE |
| app/(marketing)/[locale]/method/_components/MethodHero.tsx | feature-comp | components/features/method/MethodHero.tsx | same | OK |
