Louhen Landing CI/CD — Consolidated Workflows & Protection
Last updated: 2025-10-10

## Overview
Louhen’s GitHub Actions stack is composed of three workflows:
1. `ci.yml` → Continuous Integration for PRs (staging + production).
2. `release.yml` → Semantic-release automation on push to production.
3. `status-check.yml` → Scheduled uptime monitor for `/api/status`.

Runtime environment: Node.js 22.x, Next.js 15.5.x, Playwright, Lighthouse, Axe, CycloneDX.

Security and monitoring coverage aligns with the team’s ISO 27001 readiness posture by enforcing build integrity, accessibility/performance checks, and external uptime verification.

## CI Workflow (`ci.yml`)
- Trigger: `on: pull_request` → branches `[staging, production]`; optional `workflow_dispatch`.
- Core required jobs:

| Job ID | Purpose | Required | Description |
| --- | --- | --- | --- |
| setup | Install deps, cache, seed tokens | ✅ | Prepares environment for all jobs. |
| lint-and-types | ESLint + TypeScript check | ✅ | Guarantees code health; tests excluded. |
| build | Next.js production build | ✅ | Confirms app compiles and bundles. |
| e2e | Playwright loopback smoke + @critical suites | ✅ | Builds once, starts `npm run start:e2e` in test mode, waits for `curl $BASE_URL/` to succeed, asserts the waitlist hCaptcha bypass (`grep -c 'waitlist-form-captcha' == 0`), then runs smoke + @critical suites with deterministic mocks. HTML reports and traces upload on every run, and the background server is killed in a cleanup step. |
| axe | Accessibility scan | ⚪ (warn-mode) | Checks WCAG 2.2 AA compliance; non-blocking until `STRICT_CI=true`. |
| lighthouse | Performance & SEO budgets | ⚪ | Validates key metrics (TTFB, LCP, CLS). |
| sbom | CycloneDX dependency manifest | ⚪ | Uploads SBOM artifact; non-blocking. |
| policy-guards | CSP, secrets, checklist | ⚪ | Greps inline scripts, forbidden paths, `PRELAUNCH_CHECKLIST` status, and blocks new prefixless marketing routes. |

- Env toggle:
  - `STRICT_CI=false` → warn-mode; jobs report warnings only.
  - `STRICT_CI=true` → fail-mode; `axe`, `lighthouse`, `policy-guards` exit with code 1 on violation.
- Artifacts produced:
  - Playwright HTML report.
  - Lighthouse JSON reports.
  - SBOM (`cyclonedx.json`).
  - Retention: minimum 14 days.

## Repository Variables
Loopback CI settings live under **Settings → Secrets and variables → Actions → Variables**. These defaults drive the Playwright, Axe, Lighthouse, and Lighthouse-adjacent smoke flows.

| Variable | Purpose | Default |
| --- | --- | --- |
| `HOST` | Loopback host that the Next.js server binds to. | `127.0.0.1` |
| `PORT` | Port exposed for curl health checks and Playwright. | `4311` |
| `BASE_URL` | Canonical base URL used by curl, Playwright, and Lighthouse. | `http://127.0.0.1:4311` |
| `DEFAULT_LOCALE` | Default locale injected into E2E runs. | `de-de` |
| `CSP_MODE` | Controls CSP enforcement (`report-only` in CI, `strict` in production release jobs). | `report-only` |
| `ANALYTICS_ENABLED` | Toggles analytics pipeline during tests. | `0` |
| `NEXT_PUBLIC_TEST_MODE` | Front-end switch for test-mode UI shortcuts. | `1` |
| `TEST_MODE` | Back-end switch for mock integrations and bypasses. | `1` |
| `PLAYWRIGHT_BROWSERS_PATH` | Forces Playwright to use the ephemeral cache directory. | `0` |

- Job-level `env` entries override the repository variable for one-off runs. Remove any overrides once the repo variable is updated to avoid drift.
- Change the loopback host or port by editing the repository variables instead of touching `ci.yml`; the workflow will pick up the new values on the next run.
- `NEXT_PUBLIC_TEST_MODE` and `TEST_MODE` are CI-only flags. Do not mirror them in Vercel or production runtime configurations.

## Release Workflow (`release.yml`)
- Trigger: `on: push` → branch `production`.
- Jobs:
  1. `smoke` (build) → runs a minimal smoke build to verify integrity.
  2. `semantic-release` → publishes new tag + GitHub Release.
- Permissions: `contents: write` (plus issue and PR write for release notes).
- Safeguards: never triggered on PRs; runs only on the protected `production` branch.

## Status Workflow (`status-check.yml`)
- Trigger: `on: schedule` (hourly cron) and optional `workflow_dispatch`.
- Behavior:
  - Curl `/api/status` for preview and production, assert JSON keys (`env`, `noncePresent`, `emailTransport`).
  - Fails and uploads logs if checks are missing.
- Purpose: external uptime and reliability evidence for audits.

## Branch Protection Rules (as of 2025-10-10)

| Branch | Required Checks | Optional Checks | Notes |
| --- | --- | --- | --- |
| staging | `setup`, `lint-and-types`, `build`, `e2e` | `axe`, `lighthouse`, `sbom`, `policy-guards` | Default PR target; mirrors production env. |
| production | Same required set | Same optional set | Release triggered post-merge. |

## Using `STRICT_CI`
- Enable strict mode locally or in CI:
  - CLI: `STRICT_CI=true gh workflow run CI` or `STRICT_CI=true npm run build-ci`.
  - GitHub UI: add repository variable `STRICT_CI` with value `true`.
- When strict mode is on, the warn-mode jobs become blocking and fail the workflow on violations.
- Revert to `false` after launch if necessary.

## Versioning & Governance
- Semantic-release automates tagging and GitHub Releases on production pushes.
- `policy-guards` enforces `PRELAUNCH_CHECKLIST.md` and CSP/secrets policies before launch.
- All CI/CD logic is auditable under `/CONTEXT/ci_cd.md` and must be updated whenever new jobs or triggers are added.
