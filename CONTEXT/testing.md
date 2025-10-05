# Testing Expectations — Legal Pages

## Automated Coverage
- **HTTP 200**: Playwright (or integration) test asserts `/[locale]/legal/terms` and `/[locale]/legal/privacy` return 200 OK in each supported locale.
- **Localized `<h1>`**: Tests confirm the heading text comes from the `legal.*` message namespaces and matches locale snapshots.
- **Robots Directives**: While pre-launch, verify `<meta name="robots" content="noindex, nofollow">` (or equivalent HTTP header) is present on every legal page.
- **Sitemap Entries**: Once sitemap generation is active, assert monthly frequency and `priority: 0.2` for legal URLs.

## Manual QA
- Validate footer links navigate to the localized legal pages without full reload issues.
- Spot-check canonical + hreflang tags align with the locale under test (`https://www.louhen.app/{locale}/legal/<slug>`).
- Confirm contact mailto links (legal@louhen.eu, privacy@louhen.eu) render and open the default email client.

## Regression Watchouts
- Translation placeholders must never leak into production copy; add fixtures for locales with pending translations.
- If the global SEO mode toggles off `noindex`, ensure legal pages update in the same deploy to avoid inconsistent crawl state.

## Accessibility Smoke Tests
- Use `AxeBuilder` from `@axe-core/playwright` (not the removed `analyze()` helper) when running axe scans in tests.
- Ensure test environment locales (e.g., Playwright `NEXT_PUBLIC_LOCALES`) mirror the BCP-47 locale codes configured in `next-intl.locales.ts` to avoid fallback/missing message issues.
- `tests/e2e/legal.a11y.spec.ts` runs axe-core against every localized Terms and Privacy route.
- Tests fail on any serious or critical violations; review CI logs for details and remediate before merge.
- Axe coverage includes color contrast, document landmarks, ARIA usage, and common structural issues.
