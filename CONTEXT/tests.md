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

## Testing Principles
These principles sit alongside the [Selector Policy](#selector-policy) and are non-negotiable across unit, integration, axe, and Playwright suites. Reference them in PR descriptions and QA notes.

1. **Test pyramid & ownership** — Aim for 70–80 % unit coverage, 15–25 % integration, and ≤10 % E2E guarding business-critical journeys (waitlist, consent/analytics, locale routing, SEO metadata, security headers). Feature teams own unit tests; shared primitives own their contract suites; QA maintains a curated E2E checklist.
2. **Deterministic environments** — Run the same env matrix locally and in CI. Tests must surface `IS_PRELAUNCH`, CSP mode, default locale, analytics consent flags, and any feature toggles at start-up so parity bugs are obvious.
3. **Data & state management** — Keep tests idempotent: factory-generated data, isolated fixtures, no ordering dependencies, and zero reliance on live services. Seed local APIs deterministically and reset shared state between specs.
4. **Flake control** — Ban arbitrary `waitForTimeout`. Gate on `expect(...).toBeVisible()` or the shared `lh-page-ready` sentinel. Mark intentional long-runners with `test.slow()`. Project-level retries stay at 0; enabling a transient retry requires an open issue and removal plan. Always keep traces/videos/screenshots on failure.
5. **Accessibility (WCAG 2.2 AA)** — Automate axe scans for home, waitlist, and method routes. E2E specs must assert roles, names, focus traps, and visible focus rings for dialogs, navigation, and controls. Block merges on critical axe violations.
6. **Internationalization** — Exercise each route in the default locale (`de-de`) and at least one non-default locale. Never assert localized marketing copy by literal text—use roles, labels, or `data-testid`. Verify `<html lang>` and `hreflang`/canonical wiring inside metadata specs.
7. **SEO & metadata** — Assert title, description, canonical, robots (with prelaunch `noindex`), OG/Twitter tags, and JSON-LD presence using deterministic ids such as `lh-jsonld-organization`. Ensure no staging or preview URLs leak into structured data.
8. **Performance budgets** — Lighthouse smoke checks guard `/`, `/waitlist`, and `/method` against the budgets in [/CONTEXT/performance.md](performance.md). Deviations require a temporary waiver label plus a `/CONTEXT/decision_log.md` entry.
9. **Security headers & CSP** — E2E must check HSTS, Referrer-Policy, X-Content-Type-Options, Permissions-Policy, X-Frame-Options, COOP/CORP, and CSP nonce reuse. Fail if inline scripts lack nonces or if report-only leaks into production.
10. **Analytics & consent** — Assert analytics bootstrap occurs only after consent is granted and that no third-party trackers load pre-consent. Email unit tests (where applicable) must cover required headers such as `List-Unsubscribe`.
11. **Network & mocking policy** — Unit/integration suites mock all network IO. Playwright is restricted to the local app, `data:`, and `blob:` URLs; any new origin must be documented and allowed explicitly.
12. **Snapshot discipline** — Limit snapshots to stable, semantic content (design tokens, small HTML fragments). Avoid large DOM or marketing copy snapshots. Visual diffs remain opt-in per route and require explicit reviewer sign-off.
13. **Parallelism & isolation** — Specs must be parallel-safe: no shared ports, temporary files, or non-deterministic globals. Dev-protection headers are injected via Playwright `extraHTTPHeaders`; do not require manual toggles inside tests.
14. **Failure observability** — On failure, CI must upload traces, videos, screenshots, console output, network logs, and the security header dump so selectors and regressions are diagnosable without rerunning.

## Execution Environment
- Playwright globally sets `testIdAttribute="data-testid"`; shared primitives expose deterministic ids so selectors never fall back to CSS.
- Artifact policy: `trace='on'`, `video='retain-on-failure'`, and `screenshot='only-on-failure'`. CI uploads `artifacts/playwright/**` so every failure ships with trace/video/screenshot bundles.
- Network policy: only loopback origins (`http://127.0.0.1`, `http://localhost`, `http://0.0.0.0`, `http://[::1]`) and fixture-derived ports are allowed. All other requests abort and fail the spec; see [/CONTEXT/security.md](security.md#network-policy-for-tests) before expanding the allowlist.
- Environment echo: Playwright logs a single-line JSON containing `baseURL`, `IS_PRELAUNCH`, `CSP_REPORT_ONLY`, `DEFAULT_LOCALE`, and `ANALYTICS_ENABLED`. CI repeats the same keys up front so developers can spot drift between local and remote runs.
- Accessibility coverage runs via the `axe` project (`npm run test:axe`) across `/`, `/waitlist`, and `/method` (default + secondary locale). Treat any serious/critical violation as a merge blocker.

### Shell-agnostic execution
- Do not source Homebrew (or any user shell profile) inside npm scripts. Invoke tools via `npx`/`node_modules/.bin` so commands succeed in restricted shells and CI containers.
- Lint/test scripts must run without `/bin/ps`, `pkill`, or other process-inspection helpers. Server lifecycle is delegated to Playwright `webServer` (`reuseExistingServer: true`).
- Local and CI runs share the same scripts: `npm run lint`, `npm run test:e2e`, `npm run test:axe`. They only rely on environment variables defined in the repo or the workflow file.
- CI executes npm/Playwright commands via `bash --noprofile --norc` to avoid auto-sourcing Homebrew or custom shell profiles. Developers who see `Operation not permitted` warnings locally can grant their terminal Full Disk Access in System Settings → Privacy & Security, but the repo must not depend on `ps`.
- ESLint ignores generated artifacts (artifacts/, playwright-report/, test-results/, trace bundles, tokens output, etc.) via the top-level `ignores` block in `eslint.config.mjs`; we do not maintain a `.eslintignore`. Linting remains focused on authored app + test sources. See [/CONTEXT/security.md](security.md#network-policy-for-tests) for the network restriction that generated traces enforce.

## Selector Policy
- **Hierarchy:**  
  1. Prefer accessible queries (`getByRole`, `getByLabelText`, `getByPlaceholder`, `getByAltText`).  
  2. Fall back to `getByTestId` with `data-testid`.  
  3. Never couple specs to CSS selectors or marketing copy that can shift between locales.
- **When to add `data-testid`:** non-semantic wrappers or icons, locale-sensitive headlines, universal page-ready sentinels, JSON-LD/CSP/SEO assertions, analytics beacons, and any control whose text varies across experiments.
- **Naming convention:** `data-testid="lh-{area}-{component}-{part}"` (kebab case). Examples: `lh-nav-lang-switcher`, `lh-hero-title`, `lh-cta-join-waitlist`, `lh-jsonld-organization`, `lh-page-ready`.
- **Writing tests:** always reach interactive UI via `getByRole` when the accessible name is stable; add parallel `data-testid`s to critical flows (waitlist, login, checkout) so specs stay resilient to copy tweaks; assert localized content through test ids instead of literal text; replace manual timeouts with locator expectations or by waiting on the shared page-ready sentinel.

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
- Import `test`/`expect` from `@tests/fixtures/playwright`; the fixture blocks third-party calls (`/api/track`, hCaptcha, GA, Vercel Insights) and stubs `navigator.sendBeacon`. Combine locator auto-waiting with the selector hierarchy above—no `page.waitForTimeout`.
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
