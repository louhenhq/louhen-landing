# Testing Matrix - Louhen Landing

Single source of truth for automated coverage, environments, and CI wiring. Every new suite or route must update this file so the matrix stays aligned with locked decisions.

> **At a glance**
> - **Canonical coverage:** `/[locale]/`, `/[locale]/waitlist`, `/[locale]/method` x `{de-de (default), en-de}`. Desktop Playwright covers interactivity; mobile Lighthouse covers performance & SEO. Screenshot baselines extend to `fr-fr`, `nl-nl`, `it-it`.  
> - **CI jobs:** `policy-guards` -> `build-and-test` mirror `npm run validate:local`; `e2e-fallback` (rerun on failure) and `e2e:preview` (staging smoke) extend the matrix.  
> - **Artifacts:** Playwright (`artifacts/playwright/<suite>/`), axe JSON next to the Playwright reports, Lighthouse (`artifacts/lighthouse/`), server traces (`server.log` uploaded when present).

## Canonical Coverage Matrix

| Route | Locale focus | Device targets | Automated checks | Notes |
| --- | --- | --- | --- | --- |
| `/[locale]/` (home) | `de-de` (x-default) + alternate (`en-de`) | Desktop Playwright + mobile Lighthouse | `tests/e2e/landing.spec.ts` (analytics sentinel), `tests/e2e/header-nav/*`, `tests/axe/canonical.axe.ts`, `tests/e2e/seo/home.meta.e2e.ts`, Lighthouse mobile audit | Sentinel enforces consent gating and CTA instrumentation. Header-nav suite covers desktop and mobile drawer UX; visual baselines also cover `fr-fr`, `nl-nl`, `it-it`. |
| `/[locale]/waitlist` | Same locale pair | Desktop Playwright + mobile Lighthouse | `tests/e2e/waitlist/landing.e2e.ts`, `tests/e2e/waitlist/api.e2e.ts`, `tests/axe/canonical.axe.ts`, Lighthouse mobile audit (`/waitlist`) | API suite runs under `TEST_E2E_SHORTCIRCUIT=true` so no external services fire. |
| `/[locale]/method` | Same locale pair | Desktop Playwright + mobile Lighthouse | `tests/e2e/method/smoke.e2e.ts`, `tests/e2e/method/method.meta.e2e.ts`, `tests/e2e/seo/canonical-uniqueness.e2e.ts`, `tests/axe/canonical.axe.ts`, Lighthouse mobile audit | Metadata spec enforces breadcrumb JSON-LD and canonical uniqueness across locales; JSON-LD asserts `de-DE` as the default language code. |

Other routes (legal, security headers, status API, unsubscribe) are covered by targeted suites listed later, but the three surfaces above define the locked marketing funnel.

## When to add or change tests

1. **What changed?**
   - Pure logic/utilities -> add/extend **Vitest** (`tests/unit/**`).
   - DOM flows, routing, analytics, consent, status -> add/extend **Playwright**.
   - Accessibility regressions -> update **axe** suite (`tests/axe/canonical.axe.ts`).
   - Metadata, performance budgets, structured data -> update **SEO/Lighthouse** specs (`tests/e2e/seo/*.e2e.ts`, `lighthouserc.cjs`).
2. **New route or locale?** Update the matrix table above and ensure all three layers (Playwright, axe, Lighthouse) cover it. Add locale helpers in `tests/e2e/_utils/url.ts` if needed.
3. **Behaviour change on an existing surface?** Modify the existing spec/fixture rather than adding a duplicate. Pull shared logic into `@tests/fixtures` so other suites get the guardrails for free.
4. **Unsure whether to add a test?** File a QA gap ticket using `.github/ISSUE_TEMPLATE/qa-gap.md` or raise it in #louhen-dev before merging.

## Test types & commands

### Unit (Vitest)
- Location: `tests/unit/**/*` configured via `vitest.config.ts` and setup files under `tests/unit/` (for example `tests/unit/vitest.setup.ts`).
- Run `npm run test:unit` (or `npm run test`) for CI parity, `npm run test:unit:watch` while developing.
- Focus: waitlist validation, TTL helpers, routing utilities, metadata builders, email headers, security primitives. Typecheck scripts (`npm run typecheck`, strict configs) complement but do not replace unit coverage.

### Playwright end-to-end
- Location: `tests/e2e/**`; configuration in `playwright.config.ts` exposes `desktop-chromium` (default) and `mobile-chromium` (runs specs tagged `@mobile`, skips `@desktop-only`).
- Commands:
  - `npm run test:e2e` - desktop + tagged mobile.
  - `npm run e2e:local` - local debug with extra logging.
  - `npm run qa:e2e` / `npm run qa` - orchestration commands used in CI.
- Key suites:
  - Analytics sentinel (`tests/e2e/landing.spec.ts`) - canonical example enforcing consent gating and tracked CTA payloads.
  - SEO metadata (`tests/e2e/seo/*.e2e.ts`) - covers Open Graph, canonical uniqueness, breadcrumbs.
  - Waitlist (`tests/e2e/waitlist/*.e2e.ts`) - form UX + API contract.
  - Method experience (`tests/e2e/method/*.e2e.ts`) - smoke, metadata, sticky CTA.
  - Security headers (`tests/e2e/security/headers.e2e.ts`), status admin, unsubscribe, consent.
- Global setup writes `.playwright/auth-storage.json` when `PROTECTION_COOKIE` is provided; preview workflows feed `PROTECTION_HEADER`.

#### Selectors & stability policy
- Import `test`/`expect` from `@tests/fixtures/playwright`; the fixture blocks third-party calls (`/api/track`, hCaptcha, GA, Vercel Insights) and stubs `navigator.sendBeacon`.
- Drive interactions via `data-testid` (`locator.getByTestId`) or explicit role queries. Avoid brittle text selectors.
- Never use `page.waitForTimeout`. Rely on locator auto-waiting (`expect(locator).toBeVisible()`, `toHaveAttribute`, etc.).
- Mark mobile-specific specs with `@mobile`; use `@desktop-only` when intentionally excluded.
- Quarantine flaky specs with `@quarantine`, file a tracking issue (use the QA gap template), and link the failure URL plus artifacts. Remove the tag once stabilised.
- Extend `tests/fixtures/playwright.ts` if new network intercepts or environment shims are required.

### Playwright + axe accessibility
- Main suite: `tests/axe/canonical.axe.ts` (covers `/`, `/waitlist`, `/method` desktop + mobile viewports for default and secondary locale).
- Run `npm run test:axe` (also called inside `npm run validate:local`).
- Results live under `artifacts/playwright/<run>/` next to the e2e report (`axe/html/index.html`, JSON summary).

### API smoke & utilities
- Request-context tests (e.g. `tests/e2e/waitlist/api.e2e.ts`, `tests/e2e/unsubscribe.spec.ts`) exercise API contracts under `TEST_E2E_SHORTCIRCUIT=true` so external services remain stubbed.
- Status endpoint coverage lives in `tests/e2e/status.spec.ts` and relies on `STATUS_USER/PASS`.

### Lighthouse (performance/SEO)
- Configuration: `lighthouserc.cjs` with budgets pinned in `lighthouse-budgets.json`.
- Run via `npm run lhci` (inside CI) or `npm run lighthouse` locally.
- Audits target `/`, `/waitlist`, `/method` on both desktop and emulated mobile. Thresholds stay Performance >= 90, Accessibility >= 95, SEO >= 95, Best Practices >= 90 unless approved in `/CONTEXT/decision_log.md`.

## Artifacts & troubleshooting
- `npm run validate:local` mirrors CI (lint -> typecheck -> build -> prod server -> unit -> Playwright e2e + axe -> Lighthouse). Reports live under `artifacts/playwright/` and `artifacts/lighthouse/`. Delete the `artifacts/` directory between runs if you need a clean slate.
- Playwright HTML: `artifacts/playwright/<suite>/html/index.html`. JSON summary: `.../report.json`.
- Axe violations: `artifacts/playwright/<suite>/axe/` (one JSON per locale/device).
- Lighthouse summary: `artifacts/lighthouse/summary.md` (plus `*.html` and `*.json` for raw runs).
- Server traces: `.next/test-server.log` (uploaded as artifact when present) plus `server.log` emitted by Lighthouse.
- Common pitfalls:
  - Missing `BASE_URL` / server not healthy -> ensure `npm run validate:local` finished the build and health check; confirm port 4311 available.
  - Analytics sentinel failures -> ensure consent dialog is rendered; check `window.__LOUHEN_ANALYTICS_READY` remains false pre-consent.
  - Indexing flags -> `NEXT_PUBLIC_ALLOW_INDEXING` must be `false` in CI/preview; update Vercel only when launching publicly.

## References
- Analytics sentinel reference implementation: `tests/e2e/landing.spec.ts`.
- SEO canonical examples: `tests/e2e/seo/home.meta.e2e.ts`, `tests/e2e/seo/canonical-uniqueness.e2e.ts`.
- Axe helper: `tests/fixtures/axe.ts`.
- Playwright fixture: `tests/fixtures/playwright.ts`.
- Preview workflow mirror: `.github/workflows/e2e-preview.yml` (staging smoke matrix).
