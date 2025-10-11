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
| e2e | Playwright loopback smoke test | ✅ | Verifies user-facing paths build correctly. |
| axe | Accessibility scan | ⚪ (warn-mode) | Checks WCAG 2.2 AA compliance; non-blocking until `STRICT_CI=true`. |
| lighthouse | Performance & SEO budgets | ⚪ | Validates key metrics (TTFB, LCP, CLS). |
| sbom | CycloneDX dependency manifest | ⚪ | Uploads SBOM artifact; non-blocking. |
| policy-guards | CSP, secrets, checklist | ⚪ | Greps inline scripts, forbidden paths, `PRELAUNCH_CHECKLIST` status. |

- Env toggle:
  - `STRICT_CI=false` → warn-mode; jobs report warnings only.
  - `STRICT_CI=true` → fail-mode; `axe`, `lighthouse`, `policy-guards` exit with code 1 on violation.
- Artifacts produced:
  - Playwright HTML report.
  - Lighthouse JSON reports.
  - SBOM (`cyclonedx.json`).
  - Retention: minimum 14 days.

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
