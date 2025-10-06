# SEO Playbook

## Pre-launch policy
- Set `X-Robots-Tag: noindex` and serve `robots.txt` with `Disallow: /` on both preview and production domains until launch.
- Keep sitemap disabled pre-launch to prevent accidental discovery.
- Legal pages (`/[locale]/legal/terms`, `/[locale]/legal/privacy`) must also emit explicit `noindex, nofollow` directives even if other sections get temporary exceptions for QA.
- Canonical URLs in metadata must still point to `https://www.louhen.app` even while `noindex` is active.

## Launch day checklist
- Remove the `noindex` directives and update `robots.txt` to allow crawling with `Sitemap: https://www.louhen.app/sitemap.xml`.
- Enable sitemap entries for every legal route with `changefreq: monthly` and `priority: 0.2` (mirrors the low churn of legal content).
- Revalidate caches/CDN entries after toggling crawl settings.
- Ensure every `<link rel="canonical">`, `hreflang`, and `x-default` entry resolves to `https://www.louhen.app/{locale}`; never reference the apex domain.

## Legal pages (Terms & Privacy)
- Post-launch, keep canonical URLs aligned with `routing.md` (`https://www.louhen.app/{locale}/legal/<slug>`).
- Confirm localized metadata (title + description) lives in the `legal.*` translation namespaces so updates stay in sync across locales.
- When adding new jurisdictions (e.g., Impressum), inherit the same sitemap cadence and canonical rules.

## Shared metadata builders
- `lib/seo/methodMetadata.ts#buildMethodMetadata` and `lib/seo/legalMetadata.ts#buildLegalMetadata` generate the complete `Metadata` object for Method and Legal pages respectively.
- Both helpers resolve titles/descriptions from the relevant translation namespace, produce absolute canonical URLs, and emit a full `hreflang` map (including `x-default`) for every locale listed in `next-intl.locales.ts`.
- `isPrelaunch()` drives the robots policy inside each builder, keeping the pre-launch `noindex,nofollow` directive in sync with the global flag.
- Consumers must pass the active locale and (for legal pages) the `terms`/`privacy` slug; page-level `generateMetadata()` implementations should delegate directly to these builders.
- Default-locale routes (e.g., `/method`) must call `unstable_setRequestLocale(defaultLocale)` before rendering so next-intl receives locale context identical to `/${defaultLocale}/…` routes and does not emit `MISSING_MESSAGE` errors.
- Locale landing (`/[locale]`) and waitlist pages also rely on `makeCanonical` + `hreflangMapFor`; any new marketing surface exposed in the header must do the same before QA adds links.
- Waitlist stays on a single `/waitlist` path; its metadata now calls `hreflangMapFor(() => '/waitlist')` so canonical + alternate entries remain consistent across locales and still emit `x-default`.

## Header Navigation & Campaigns
- Header navigation links must never append marketing UTM parameters when pointing to internal anchors (`#how`, `#faq`) or internal routes; keep canonical URLs untouched to avoid diluting analytics and hreflang metrics.
- For campaign-driven CTAs (e.g., seasonal ribbon), attach UTMs only to external targets and define them inside the campaign config object. Document every UTM in `/CONTEXT/header.md` before launch.
- When enabling a promo ribbon, reserve vertical space equal to the ribbon height via CSS so the sticky header does not shift after hydration. CLS impact must remain <0.02; monitor Lighthouse diff whenever ribbon copy changes.
- Use `prefetch={false}` on header links that do not lead to new Next.js routes (anchors, external URLs) to prevent wasted prefetches and unnecessary network noise flagged by SEO crawlers.
- Header CTA links append `utm_source=header`, `utm_medium=cta`, and phase-specific campaigns (e.g., `download-en`). Ribbon CTAs append `utm_source=header`, `utm_medium=promo-ribbon` plus locale-specific campaign suffixes. Keep these stable for analytics dashboards.
- Analytics payloads strip UTMs when reporting `target` via `lib/url/analyticsTarget.ts`; this keeps SEO-visible URLs untouched while giving analytics stable host/path identifiers (`app-store`, `google-play`, `/download`).
- When the logged-in hint renders the Dashboard CTA + Logout link, the CTA points to `NEXT_PUBLIC_DASHBOARD_URL` (fallback `/dashboard`) and should remain a non-indexed destination (app shell / authenticated route). Logout links should target marketing/app handoff endpoints that already emit `noindex` and must not introduce new canonical entries.
- Locale switcher must redirect to the locale-specific path while preserving query parameters so canonical + hreflang mappings stay consistent. Spot-check `link[rel="canonical"]` and `link[rel="alternate"][hreflang]` after switching locales during QA.
- Header navigation/CTA/ribbon urls all pass through `lib/url/appendUtmParams.ts`; never hand-roll `?utm_*` strings. When adding a new header surface, supply `{ source: 'header', medium: 'cta' | 'promo-ribbon', campaign: <locale-aware> }` and let the helper serialise consistently.
- Method and legal pages publish `BreadcrumbJsonLd` alongside `OrganizationJsonLd`/`WebSiteJsonLd`. Reuse the shared component (`components/SeoJsonLd.tsx`) and always provide the CSP nonce from `headers()`.
- Internal tooling surfaces (e.g., `/tokens`) remain `noindex, nofollow` and are excluded from the sitemap. Enable them via env flags only when QA needs to access the playground; they must never ship as public marketing content.


## Pre-launch Robots Policy
- Server pages call `isPrelaunch()` (see `lib/env/prelaunch.ts`) which prioritises `IS_PRELAUNCH=true`/`1`, otherwise treats any `VERCEL_ENV` other than `production` as pre-launch.
- Playwright and other tests rely on the same env names to gate `noindex` checks.
- Legal pages enforce robots per-page; global layout fallback is secondary.

## Monitoring & Lighthouse Coverage
- Include at least one legal route in periodic Lighthouse runs to ensure canonical tags, robots directives, and performance budgets remain within targets. CI audits every locale's privacy page and the default locale's terms page.
- Track regressions in the Lighthouse artifact stored in CI; treat metadata drift as a launch blocker.

## Redirects

- Enforce a permanent `301` redirect from `louhen.app` (apex) to `https://www.louhen.app` to keep a single canonical host and avoid duplicate indexing.
- Preview host remains `https://staging.louhen.app`; keep it isolated with `noindex` until GA.
