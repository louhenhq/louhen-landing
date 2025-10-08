# Testing Matrix — Louhen Landing

Single source of truth for automated coverage, environments, and CI wiring. Every new suite or route must update this file so the matrix stays aligned with locked decisions.

## Canonical Coverage Matrix

| Route | Locale focus | Device targets | Automated checks | Notes |
| --- | --- | --- | --- | --- |
| `/[locale]/` (home) | Default locale (x-default) and one non-default (`de-de`) | Desktop Playwright + mobile Lighthouse | `tests/e2e/landing.spec.ts` (analytics sentinel), `tests/e2e/header-nav/*`, `tests/axe/canonical.axe.ts`, `tests/e2e/seo/home.meta.e2e.ts`, Lighthouse mobile audit | Sentinel asserts consent gating (no analytics pre-consent) and CTA instrumentation after acceptance. Header nav suite exercises both desktop and mobile drawers. |
| `/[locale]/waitlist` | Same locale pair | Desktop Playwright + mobile Lighthouse | `tests/e2e/waitlist/landing.e2e.ts`, `tests/e2e/waitlist/api.e2e.ts`, `tests/axe/canonical.axe.ts`, Lighthouse mobile audit (`/waitlist`) | API spec runs under `TEST_E2E_SHORTCIRCUIT=true` to avoid external services. |
| `/[locale]/method` | Same locale pair | Desktop Playwright + mobile Lighthouse | `tests/e2e/method/smoke.e2e.ts`, `tests/e2e/method/method.meta.e2e.ts`, `tests/e2e/seo/canonical-uniqueness.e2e.ts`, `tests/axe/canonical.axe.ts`, Lighthouse mobile audit | Metadata spec now also enforces breadcrumb JSON-LD. |

Other routes (legal, status, unsubscribe, security headers) remain covered by specialised suites documented below, but the three surfaces above define the canonical marketing funnel.

## Test Types & Commands

- **Unit (Vitest)**  
  - Location: `tests/unit/**/*` with configuration in `vitest.config.ts` and `vitest.setup.ts`.  
  - Run `npm run test:unit` (or `npm run test`) for the full suite, `npm run test:unit:watch` while developing.  
  - Focus areas: waitlist validators and TTL helpers, routing utilities, metadata builders, email headers, security primitives (hCaptcha, suppression). Typecheck scripts (`npm run typecheck`, `npm run typecheck:strict:*`) complement but do not replace Vitest.

- **Playwright E2E**  
  - Tests live under `tests/e2e/**`; the config (`playwright.config.ts`) exposes two projects: `desktop-chromium` (default) and `mobile-chromium` (runs specs tagged with `@mobile`, skips any tagged `@desktop-only`). `BASE_URL` defaults to `http://127.0.0.1:4311`, `PREVIEW_BASE_URL` targets staging.  
  - Entry points: `npm run test:e2e` (desktop + tagged mobile), `npm run e2e:local` (debug), `npm run qa:e2e` (all projects) and `npm run qa` (boots Next, runs e2e + Lighthouse). Outputs land under `PLAYWRIGHT_ARTIFACTS_DIR` (defaults to `artifacts/playwright/<run>/`).  
  - Global setup (`tests/setup/auth.setup.ts`) builds `.playwright/auth-storage.json` when `PROTECTION_COOKIE` is provided; `PROTECTION_HEADER` injects bypass headers for protected previews.  
  - Key suites: header nav (`tests/e2e/header-nav/*.e2e.ts`), analytics sentinel (`tests/e2e/landing.spec.ts`), waitlist form + API, method smoke + metadata, SEO canonical map (`tests/e2e/seo/*.e2e.ts`), security headers, consent banner, status endpoint, unsubscribe flow. Visual diffs (`tests/e2e/header-nav/visual.e2e.ts`) remain optional behind `HEADER_VISUAL=1`. Mobile coverage includes the drawer suite plus lightweight `/waitlist` and `/method` smokes (tagged `@mobile`).  
  - Sentinel details (`tests/e2e/landing.spec.ts`): clears cookies, verifies `window.__LOUHEN_ANALYTICS_READY` is false pre-consent, ensures the consent dialog is visible, confirms no `/api/track` call before acceptance, accepts consent, then asserts track payloads are emitted once the CTA is clicked.

### Playwright guardrails
- Always import `test`/`expect` from `@tests/fixtures/playwright`; the fixture blocks third-party calls (`/api/track`, hCaptcha, GA, Vercel Insights) and stubs `sendBeacon`.
- New interactive UI must ship with a stable `data-testid`; prefer `getByTestId`/locator queries over `getByText`.
- No `page.waitForTimeout` or manual sleeps — rely on locator auto-waiting (`expect(...).toBeVisible()` etc.).
- Tag mobile-specific coverage with `@mobile`; use `@desktop-only` when a spec intentionally excludes mobile. Mark flakes with `@quarantine` and open a tracking issue linking the failure URL + artifact.
- Never allow tests to reach external networks; add new intercepts to the fixture when features depend on third parties.
- Accessibility scans must use `tests/fixtures/axe.ts`; standalone axe runners are forbidden.

- **Playwright + Axe**  \n  - Accessibility scans live in `tests/axe/canonical.axe.ts` and rely on the shared helper in `tests/fixtures/axe.ts`. The suite covers `/`, `/waitlist`, and `/method` for the default locale and one secondary locale on both desktop and mobile viewports.\n  - Run via `npm run test:axe` (also invoked inside `validate:local`). Results serialize to `artifacts/playwright/<run>/a11y/*.json` and attach to the Playwright report.\n\n- **API smoke**  
  - Request-context tests (`tests/e2e/waitlist/api.e2e.ts`, parts of `tests/e2e/unsubscribe.spec.ts`) assert error handling and successful responses with `TEST_E2E_SHORTCIRCUIT=true` and `TEST_E2E_BYPASS_TOKEN` to avoid real hCaptcha / Firestore / Resend interactions.

- **Lighthouse CI**  \n  - `npm run lhci` (or `npm run lighthouse`) delegates to `scripts/run-lighthouse.mjs`. The script reuses the production server, runs separate mobile + desktop passes against `lighthouserc.cjs`, asserts thresholds, and writes JSON/HTML outputs alongside `summary.md` in `artifacts/lighthouse/`.  \n  - Coverage mirrors the canonical matrix: routes `/`, `/waitlist`, `/method` for the default locale and one secondary locale, on both mobile (emulated 360×640) and desktop (real form factor).  \n  - Thresholds: Performance ≥ 0.90, Accessibility ≥ 0.95, SEO ≥ 0.95, Best Practices ≥ 0.90. Budgets (`lighthouse-budgets.json`) cap CLS ≤ 0.02, LCP ≤ 3000 ms (slightly higher for `/method`), TBT ≤ 200 ms, and keep total/script/image weight in check.  \n  - To update budgets, run `npm run lhci`, review `artifacts/lighthouse/summary.md`, adjust `lighthouse-budgets.json`, and document the change (include before/after metrics and reasoning). Only raise thresholds after at least five consecutive green runs with headroom.\n
- **Validate local**  
  - `npm run validate:local` orchestrates the canonical flow (lint → typecheck → build → production server → unit → Playwright e2e + axe → LHCI) against a single base URL. It forces `IS_PRELAUNCH=true` / `TEST_E2E_SHORTCIRCUIT=true`, writes Playwright outputs to `artifacts/playwright/<run>/` (`html/index.html` for the report) and Lighthouse bundles to `artifacts/lighthouse/`, then tears the server down.

## Environments & Flags

| Variable | Purpose | Where configured |
| --- | --- | --- |
| `APP_BASE_URL` / `BASE_URL` | Primary origin for Playwright + LHCI (`http://localhost:4311` locally). | `.env.example`, `validate:local`, `ci.yml`, `e2e-preview.yml`. |
| `HOST` / `PORT` / `PW_HEALTH_PATH` | Control Playwright managed server health probes. | `playwright.config.ts`, `ci.yml`. |
| `TEST_E2E_SHORTCIRCUIT` / `TEST_E2E_BYPASS_TOKEN` | Disable external integrations during tests. | Defaulted in `playwright.config.ts`, overridden in `ci.yml`, `validate:local`. |
| `PROTECTION_HEADER` / `PROTECTION_COOKIE` | Auth for protected previews. | `e2e-preview.yml`, manual local runs. |
| `BASIC_AUTH_USER` / `BASIC_AUTH_PASS` | Optional for `/api/status` coverage. | Manual when hitting protected status route. |
| `IS_PRELAUNCH` | Forces robots/noindex assertions. | Explicit in CI when running legal axe suite; defaults to detected environment otherwise. |
| `HEADER_VISUAL` | Enables header visual snapshots. | Manual / future CI opt-in. |
| `NEXT_PUBLIC_LOCALES` / `NEXT_PUBLIC_DEFAULT_LOCALE` | Drives locale fallback for tests. | `ci.yml`, preview workflow, fallback to `[defaultLocale, 'de-de']` when unset. |
| Public env mirrors (`NEXT_PUBLIC_ANALYTICS_DISABLED`, `NEXT_PUBLIC_HCAPTCHA_SITE_KEY`, etc.) | Provide deterministic client behaviour. | `playwright.config.ts` fallback values, `.env.example`, CI workflows. |
| Server env mirrors (`HCAPTCHA_SECRET`, `FIREBASE_*`, `RESEND_*`, `STATUS_USER/PASS`, `SUPPRESSION_SALT`) | Dummy credentials for API smoke + status tests. | `.env.example`, CI workflows, `validate:local`. |
| `PLAYWRIGHT_ARTIFACTS_DIR` (optional) | Overrides where Playwright stores HTML/JSON/results (`artifacts/playwright/<run>/`). | Set per command when isolating runs (CI sets unique folders per suite). |

Keep `/CONTEXT/envs.md` and `.env.example` in sync whenever new variables or defaults land.

## CI Workflow Map

| Workflow | Trigger(s) | Jobs & Responsibilities | Artifacts |
| --- | --- | --- | --- |
| `.github/workflows/ci.yml` | PRs to `staging`, pushes to `staging`/`production`, manual dispatch | `policy-guards` → `build-and-test` (shared server: lint → typecheck → build → Playwright e2e/axe → Lighthouse), fallback rerun if needed, release job only on production pushes. Concurrency cancels superseded staging runs. | `color-policy-report`, `artifacts/playwright/**`, `artifacts/lighthouse/**`, `.next/test-server.log`, `next-traces`. |
| `.github/workflows/e2e-preview.yml` | `workflow_dispatch` | Matrix `{method, header-nav, footer, waitlist}` hits `https://staging.louhen.app` with bypass header. Each suite runs e2e + SEO add-ons, then resets artifacts and runs the matching axe suite. Quarantine lane reruns specs tagged `@quarantine` with `--retries=2` and posts a summary. | `playwright-<suite>-{e2e,axe}` (and `*-quarantine`) under `artifacts/playwright/`, JSON summaries in `summary/`. |
| `.github/workflows/release-pr-checklist.yml` | PRs targeting `production` | Ensures release checklist is complete unless the `skip-checklist` label is present. | None |
| `.github/workflows/status-check.yml` | Hourly cron + manual | Polls `/api/status` on preview + production with Basic Auth, validates schema via `jq`. | None |


Required status checks: `policy-guards` (fast doc/policy guard) and `build-and-test` (full pipeline). Release PRs into `production` also require `enforce-release-source` and `Enforce Release PR Checklist`.
## Accessibility Allowlist (2025-10-09)

- None — all axe violations must be addressed immediately.

## Removed (Slice 3/4 — 2025-10-09..10, commit TBD)

- `tests/e2e/seo.spec.ts` → replaced by `tests/e2e/seo/home.meta.e2e.ts` (home metadata + JSON-LD) and `tests/e2e/method/method.meta.e2e.ts` (breadcrumb JSON-LD).  
- `CI_SKIP_LANDING` env toggle → superseded by the deterministic analytics sentinel in `tests/e2e/landing.spec.ts`.  - `.github/workflows/ci-guards.yml` → duties merged into the `policy-guards` job in `.github/workflows/ci.yml`.  - `tests/e2e/legal.a11y.spec.ts` → consolidated into the canonical axe suite `tests/axe/canonical.axe.ts`.

## Ownership & Update Rules

- Keep this document in sync with `/CONTEXT/testing.md` and any new suites. When adding or moving tests, update:  
  1. The canonical matrix (route, locale, device, test type).  
  2. Any environment requirements.  
  3. CI workflow descriptions and artifact paths.  
  4. Retirements if older specs/workflows are decommissioned.
- Feature owners ensure their surfaces maintain desktop + mobile coverage via Playwright or Lighthouse as documented. QA owns the preview workflow matrix and resolves quarantined specs within the 7-day SLA captured in `/CONTEXT/testing.md`.
- Before pruning a legacy suite, migrate any unique assertions into the canonical tests and list the retirement here to preserve historical traceability.
