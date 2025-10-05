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
