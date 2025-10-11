# Testing Strategy — Louhen Landing

Testing follows the locked pyramid in [/CONTEXT/decision_log.md](decision_log.md): fast unit coverage, Playwright end-to-end flows, and automated axe accessibility scans. Use this guide when planning or reviewing changes.

## Responsibilities

| Layer | What it covers | Tooling | Expectations |
| --- | --- | --- | --- |
| Unit (`tests/unit/`) | Pure functions, hooks, server utilities (`lib/shared`, `lib/server`) | Vitest (JSDOM/Node) | Fast, deterministic, no network or timers. Snapshot only when meaningful. |
| End-to-End (`tests/e2e/`) | Full user journeys: waitlist submit, method flow, header/nav, legal routes, status API | Playwright | Run against local server by default (`npx playwright test`). Remote, authenticated runs against preview happen via the `e2e:preview` GitHub Action leveraging the `PREVIEW_BYPASS_TOKEN` environment secret. |
| Accessibility (`tests/axe/canonical.axe.ts`) | Axe-core audits for `/`, `/waitlist`, `/method` (default + secondary locale, desktop + mobile) | Playwright + `@axe-core/playwright` | Fail on serious/critical issues. Respect reduced-motion and theme toggles during scans. Remote coverage runs in the same preview workflow as E2E. |

- Security headers coverage lives in `tests/e2e/security/headers.e2e.ts`; it enforces CSP nonce wiring, checks that HSTS `max-age` stays ≥ 31,536,000 seconds (with `includeSubDomains`/`preload` asserted only on the canonical production host), and ensures `camera=()` plus at least one of `interest-cohort=()` or `browsing-topics=()` is present. The spec always evaluates the **final** HTML response (after locale redirects and caching) because middleware headers are attached post-routing.

## Selector Guidance
- Follow the hierarchy in [/CONTEXT/tests.md](tests.md): prefer semantic roles (`getByRole`/`getByLabelText`), fall back to `data-testid="lh-..."` for locale-sensitive or non-semantic hooks, and avoid CSS selectors tied to layout.
- `data-ll="..."` remains for analytics instrumentation; Playwright and axe specs should instead rely on the `lh-` namespace (`lh-{area}-{component}-{part}`) to keep selectors locale-agnostic.
- Keep `rename_map.md` entries up to date when a component exposes a new `data-testid`, and mirror that attribute in feature diffs so reviewers can trace changes quickly.
- **Method selectors:** `lh-hero-method-root`, `lh-hero-method-cta-primary`, `method-pillars`, `method-how`, `method-steps`, `method-trust`, `lh-method-footer-cta-primary`.
- **Header nav selectors:** `lh-nav-root`, `lh-nav-lang-switcher-desktop`, `lh-nav-lang-switcher-mobile`, `lh-nav-cta-primary`, `lh-nav-menu-toggle`.
- **Footer selectors:** `lh-footer-root`, `lh-footer-site-root`, plus contextual links (`footer-privacy-link`, `footer-terms-link`, etc.) where analytics still consumes `data-ll`.
- **Waitlist selectors:** `wl-form`, `wl-email-input`, `wl-consent-checkbox`, `wl-submit`, `wl-success`, `wl-error`, `wl-consent-copy`, `wl-referral`, `wl-resend-form`, `wl-resend-email`, `wl-resend-submit`, `wl-resend-status` — legacy WaitlistForm was removed 2025-10-07; these map to the canonical hCaptcha form.

## Preview Workflow (Remote)
- The `e2e:preview` workflow is manual (`workflow_dispatch`) and runs fully remote against `https://staging.louhen.app`. Never start a local server or print secret headers in those jobs.
- A matrix fans out four suites (`method`, `header-nav`, `footer`, `waitlist`). Each job runs both E2E (`tests/e2e/<suite>`) and the canonical axe suite (`tests/axe/canonical.axe.ts`).
- Playwright retries are set to `--retries=1` only inside CI to absorb isolated flakes; keep retries disabled locally so regressions surface during development.
- Artifacts upload per job: `playwright-<suite>-e2e`, `playwright-<suite>-axe` (10-day retention) and matching `*-quarantine` archives; all written to `artifacts/playwright/`.
- Adding a new feature suite requires updating the canonical matrix in `tests/axe/canonical.axe.ts`; do not create standalone axe runners.
- SEO add-on specs (`tests/e2e/seo/`) run alongside every matrix entry; they cover sitemap HTTP integrity and canonical uniqueness.

### Analytics Consent Coverage
- **No consent (default)**: assert zero requests to the analytics host and that the consent banner remains visible. Monitor `connect-src` violations to ensure CSP stays clean.
- **Accept flow**: accepting the banner yields exactly one bootstrap request followed by queued events (e.g., `page_view`); no CSP errors should appear.
- **Decline flow**: deny consent, reload, and confirm no analytics requests occur across the session; stored state persists across reloads.
- **Accessibility**: axe coverage includes the consent banner (focus trap, ARIA roles/labels, Escape-to-dismiss). Treat failures here as blocking.
- **Playwright fixtures**: `consentUnknown`, `consentGranted`, and `consentDenied` manage the `ll_consent` cookie (`v1:granted|denied`) before navigation. Cookie domains derive from `PREVIEW_BASE_URL` (falling back to localhost/127.0.0.1) so the suite runs unchanged in remote preview mode.

### Feature Flag Matrix
- Playwright provides a `flags` fixture (see `tests/fixtures/playwright.ts`) with `set(overrides)` / `clear()` helpers. It calls the preview-only `/api/test/flags` endpoint (non-production) to override public flags such as `NEXT_PUBLIC_ANALYTICS_ENABLED` or `NEXT_PUBLIC_BANNER_WAITLIST_URGENCY` before navigation.
- The override cookie is short-lived and scoped to Preview/CI; local runs can also use it but must clear overrides after assertions (`flags.clear()` handles this automatically).
- Critical suites (OG metadata, analytics-consent, security headers) should run twice when the flag impacts behaviour. For costly suites, target a sampled matrix (e.g., the preview workflow runs an extra SEO pass with `OG_DYNAMIC_ENABLED=false`).
- When adding a flag, document the fixtures it needs, ensure default coverage exists, and update this section plus `/CONTEXT/envs.md`.
- Preview test runs assume the default flag matrix documented in `/CONTEXT/envs.md`; CI overrides may simulate production analytics/CSP behaviour or static OG fallbacks.

## SEO add-ons
- `sitemap-http.e2e.ts` samples up to five URLs per locale sitemap (first, middle, last, plus newest additions when available). Override the sample via `SEO_SITEMAP_SAMPLE` if a hotfix needs tighter bounds.
- HTTP expectations: prefer `200 OK`; allow `401`/`403` only when the preview environment legitimately enforces auth and the bypass header is unavailable (the test logs a warning annotation in that case).
- OG image integrity: checks representative pages (`/method`, `/waitlist`, `/legal/privacy`) for live `og:image` / `twitter:image` assets returning `200`.
- `canonical-uniqueness.e2e.ts` asserts a single `<link rel="canonical">` per page, normalising hosts to lowercase and trimming trailing slashes before comparison.
- Hreflang validation uses `hreflangMapFor(...)`; every supported locale plus `x-default` must match the canonical map even when the canonical URL is locale-invariant (e.g., `/waitlist`).

### OG & media tests
- New specs under `tests/e2e/seo/` fetch OG/Twitter images directly from the rendered DOM, assert absolute URLs (including `locale` + `key` params), `200` responses without redirects, content type starting with `image/`, and `Content-Length` ≤ 2 MB.
- Sample at least two locales per surface (default + secondary) with pages covering method, waitlist, and imprint/legal.
- A companion spec toggles the dynamic OG feature flag to ensure pages fall back to static assets while still satisfying the assertions above.
- Budget failures must log the offending URL plus response headers for quick diagnosis; keep this behaviour when extending coverage.

## CI Hardening
- Preview workflow jobs run with a 30-minute timeout and concurrency guard `e2e-preview-${ref}-${suite}` that cancels superseded entries per branch/suite.
- Preview CI runs an additional `og-static-fallback` job with `OG_DYNAMIC_ENABLED=false` to exercise the static OG path while keeping the main suites on the default dynamic configuration.
- Caching: npm cache at `~/.npm` keyed by `npm-${os}-${hash(package-lock)}` with `${os}` restore key; Playwright browsers cached at `~/.cache/ms-playwright` keyed `pw-${os}-${hash(package-lock)}` with `${os}` restore key.
- CI forces `--retries=1`; local runs stay flake-free (no retries). Playwright keeps `trace: on-first-retry`, `screenshot: only-on-failure`, and `video: retain-on-failure` so artifacts surface only when needed.
- Expected artifacts per suite: `playwright-<suite>-{e2e,axe}` (retained 10 days). Missing folders fail the job.
- Each job writes a summary (`GITHUB_STEP_SUMMARY`) with totals, pass/fail counts, and quick references to the artifact names; reports never contain secrets.
- Staging branch protection requires the OG Playwright specs (`tests/e2e/seo/og-images.e2e.ts`, `og-dynamic-vs-static.e2e.ts`, `twitter-card.e2e.ts`) to pass before merge.

## Flaky Quarantine Lane
- Tag flaky specs by including `@quarantine` in the test title (e.g., `test('@quarantine waitlist social share', ...)`). Keep the tag until the spec produces two green preview runs, then remove it.
- Preview workflow adds a non-blocking `Playwright (quarantine — <suite>)` job that filters on `@quarantine`, runs with `--retries=2`, and uploads artifacts suffixed with `-quarantine` (retention 7 days). These jobs are `continue-on-error`; red runs flag attention without blocking merges.
- Quarantined specs must be triaged and deflaked within 7 calendar days. Options: fix the regression, rewrite the test, or delete it if redundant. Long-lived flakes should not stay in quarantine—open a tracked issue and skip the test with context if a fix is not immediate.
- When a spec stabilises, remove the `@quarantine` tag and verify the main preview lane passes twice consecutively before deleting any quarantine artefacts from backlog notes.
- Do not promote `staging → production` while the quarantine suite is red; resolve or remove the tag before releasing.

## Style Guardrails (Tokens)
- During code review ensure components rely on semantic Tailwind utilities or token-backed helpers—no raw `#hex`, `rgb()`, or arbitrary `bg-[...]` / `text-[...]` / `shadow-[...]` utilities. Details in [/CONTEXT/design_system.md](design_system.md).
- Verify that any new scale required by a feature is added to `tailwind.config.ts` (token backed) instead of ad-hoc utilities scattered throughout components.
- Confirm no additional imports of `app/styles/tokens.css` or the generated token bundles exist outside `app/layout.tsx`.
- **Future automation**: a lint rule will block arbitrary color/shadow utilities and raw color literals. Once landed, exercise it by introducing a throwaway arbitrary class on a branch to confirm CI fails, then remove it before merge.

## Flake Policy
- Playwright tests may use `retries: 1` globally; additional retries require an issue link and temporary `test.fixme`.
- Tag quarantined tests with `_legacy` folder or `test.describe.skip` plus backlog issue. Remove skip tags within the next slice.
- Use `--workers=1 --reporter=line` locally when reproducing flakes. Capture HAR traces (`npx playwright test --trace on`) for debugging.

## Adding or Changing Tests
- Follow PLAN → DIFF → VALIDATE → REVERT (documented in [/CONTRIBUTING.md](../CONTRIBUTING.md)).
- Include validation commands in the PR checklist (unit, build, Playwright, axe as needed).
- Provide fixtures/knobs to simulate consent states (`granted`, `denied`, `unknown`) so e2e and unit suites can exercise transitions deterministically.
- For new journeys, ensure analytics assertions respect consent (see [/CONTEXT/privacy_analytics.md](privacy_analytics.md)).

## CI Expectations
- GitHub Actions runs `npm run lint`, `npm run build`, `npx playwright test`, and Lighthouse. Failing tests block merge.
- Upload Playwright HTML + trace reports and axe logs; link them in PRs when investigating failures.
- Treat consistent flakes as blocking issues—open a ticket in `/CONTEXT/backlog.md` with reproduction steps.
