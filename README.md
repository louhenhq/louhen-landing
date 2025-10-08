[![CI](https://github.com/Martin/louhen-landing/actions/workflows/ci.yml/badge.svg)](https://github.com/Martin/louhen-landing/actions/workflows/ci.yml)

See [BADGES.md](BADGES.md) for full project status and quality metrics.

# Louhen Landing

Louhen Landing is the official marketing site for Louhen, designed to provide a seamless user experience and showcase our brand. This project leverages modern web technologies to deliver fast, accessible, and maintainable content.

- Before you start: review [CONTRIBUTING.md](CONTRIBUTING.md).

> **Start Here**
> - Locked decisions: [/CONTEXT/decision_log.md](CONTEXT/decision_log.md)
> - Naming & structure: [/CONTEXT/naming.md](CONTEXT/naming.md)
> - Migration plan: [/CONTEXT/rename_map.md](CONTEXT/rename_map.md)
> - Workflow & QA: [CONTRIBUTING.md](CONTRIBUTING.md)

## Tech Stack

- **Framework:** Next.js (App Router)
- **Styling:** CSS Modules, Style Dictionary for design tokens
- **Fonts:** Custom font optimization using `next/font`
- **State Management & Analytics:** Custom client-side analytics with consent management
- **Backend Integrations:** Firebase, Resend, hCaptcha for waitlist and user engagement

## Local Development

To get started locally:

1. Clone the repository.
2. Install dependencies:
   ```bash
   npm install
   ```
3. Configure environment variables as per `.env.example`, including:
   - `NEXT_PUBLIC_HCAPTCHA_SITE_KEY`
   - `HCAPTCHA_SECRET`
   - `APP_BASE_URL`
   - `STATUS_USER`, `STATUS_PASS` (Basic Auth for the internal /status diagnostics)
   - `RESEND_API_KEY`, `RESEND_FROM`, `RESEND_REPLY_TO`
   - `FIREBASE_ADMIN_SA_B64`
   - `FIREBASE_PROJECT_ID`, `FIREBASE_DB_REGION`
   - `VERCEL_GIT_COMMIT_SHA` (provided by Vercel; set `COMMIT_SHA` manually if unavailable)
   - `WAITLIST_CONFIRM_TTL_DAYS` (optional)
4. Run the development server:
   ```bash
   npm run dev
   ```
5. Open [http://localhost:3000](http://localhost:3000) in your browser.

> Tokens for design system are automatically built after install and before site builds.

## Scripts Matrix

| Script | Purpose | Run When |
| --- | --- | --- |
| `npm run lint` | Lint all source files with ESLint. | Before every PR; CI default. |
| `npm run typecheck` | Type-check project via `tsc --noEmit`. | Alongside lint in PRs and CI. |
| `npm run typecheck:build` | Strict build subset (app/lib only). | Before release branches / CI debug. |
| `npm run typecheck:strict:method` | Strict pilot for method feature paths. | Use during method migration slices. |
| `npm run typecheck:strict:feature` | Run strict config after populating `tsconfig.strict.json#include`. | Ad-hoc pilots (update include globs, then revert). |
| `npm run build` | Production Next.js build. | Required before merging; CI always. |
| `npm run test:unit` | Execute Vitest suite (`--passWithNoTests`). | During feature work and CI. |
| `npm run test:e2e` | Playwright smoke pass (Chromium, 1 worker). | Local validation + CI regression. |
| `npm run test:axe` | Axe accessibility suite via Playwright. | Run after UI changes; part of `validate:local`. |
| `npm run lhci` | Lighthouse CI autorun; logs failures instead of exiting non-zero. | CI performance gate; optional local audit. |
| `npm run validate:local` | Full lint → typecheck → build → production server (`start:test`) → unit/e2e/axe → Lighthouse, then teardown. | Final local confidence check before large PRs. |

### Install Policy & Determinism

- **CI:** `npm ci --include=dev`
- **Local development:** use `npm install` only when adjusting dependencies/lockfile; otherwise prefer `npm ci` for clean states.
- `package-lock.json` is the source of truth—avoid `--force` or `--legacy-peer-deps` in CI or PR workflows.

## Structure (quick)

See [/CONTEXT/naming.md](CONTEXT/naming.md) for repository-wide naming and layout conventions.
- See [/CONTEXT/rename_map.md](CONTEXT/rename_map.md) for the source→target plan used in migration PRs.

```
app/(site)/[locale]/
components/{ui,blocks,features/…}
lib/{shared,server}
tests/{unit,e2e,axe}
```

## Quickstart: Waitlist + Env

**TL;DR**
1. `cp .env.example .env.local` and fill in dev-safe placeholders.  
2. Convert your Firebase dev service account JSON to Base64 and set `FIREBASE_ADMIN_SA_B64`.  
3. Drop in the Resend dev API key and keep `RESEND_FROM` / `RESEND_REPLY_TO` on louhen.app.  
4. Use hCaptcha universal test keys (`10000000-ffff-ffff-ffff-000000000001` / `0x000…000`).  
5. `npm run lint && npm run build && npm run dev` to boot the stack.  
6. Visit `/status`, authenticate with `STATUS_USER` / `STATUS_PASS` from `.env.local`, and expect `emailTransport=false` in dev while noop mode is active.

**Waitlist slice plan:** Slice 1 delivers UI scaffolding, Slice 2 adds API + validation, Slice 3 wires email + confirmation, Slice 5 layers pre-onboarding incentives, and Slice 6 locks in automated tests and quality gates.

**Preview vs Production:** Preview lives on `https://staging.louhen.app`, runs `WAITLIST_CONFIRM_TTL_DAYS=1`, and ships with `noindex`. Production promotes to `https://www.louhen.app` with the canonical TTL of 7 days; the apex `https://louhen.app` permanently redirects to the www host.

**Docs to bookmark:**
- [`/CONTEXT/email.md`](CONTEXT/email.md) — Resend runbook and DNS requirements.  
- [`/CONTEXT/envs.md`](CONTEXT/envs.md) — up-to-date environment matrix.  
- [`/CONTEXT/status-monitoring.md`](CONTEXT/status-monitoring.md) — /api/status protection + monitor.  

## Waitlist: env & local testing

1. Copy `.env.example` to `.env.local` and replace placeholders with local credentials or sandbox values.  
2. Run without a `RESEND_API_KEY` locally to stay in Resend sandbox mode (emails log to stdout via the noop transport).  
3. Generate hCaptcha developer keys for local testing; production keys should only live in Vercel secrets.  
4. `WAITLIST_CONFIRM_TTL_DAYS` defaults to 7 — shorten it in preview environments to exercise expiry flows faster.

### Status endpoint

- `/api/status` returns JSON fields: `noncePresent`, `emailTransport`, `emailTransportMode`, `suppressionsCount`, and `env` (with deploy metadata).  
- `emailTransport=false` is expected in development/preview when Resend credentials are not set, and `emailTransportMode` will read `noop`.  
- In production the endpoint must report `emailTransport=true` once Resend is wired, otherwise the env guard will fail before deployment.

## QA Targets

- Ensure waitlist form functions correctly with and without hCaptcha keys.
- Validate analytics events respect user consent and are dispatched properly.
- Confirm environment variables are correctly loaded and used.
- Verify design tokens are up to date and applied consistently.
- Test deployment pipelines and CI workflows for reliability.

## End-to-End Testing Modes

- **Remote mode (preview/staging)**: `PREVIEW_BASE_URL=https://staging.louhen.app npx playwright test`
  - Playwright skips starting a local server and targets the supplied host.
  - Optional protection header(s): `PROTECTION_HEADER="X-Bypass-Token: <token>" npx playwright test`
  - Optional basic auth: `BASIC_AUTH_USER=user BASIC_AUTH_PASS=pass PREVIEW_BASE_URL=... npx playwright test`
  - Optional cookie gate: `PROTECTION_COOKIE="cookie1=value; cookie2=value" PREVIEW_BASE_URL=... npx playwright test`
- **Local mode (default)**: Run `npx playwright test` with no preview env vars; Playwright automatically boots Next on `0.0.0.0:4311` and uses `http://localhost:4311`.
- `BASE_URL` is also honoured if you need a custom host; precedence is `BASE_URL` → `PREVIEW_BASE_URL` → local fallback.

## License

This project and its contents are proprietary and confidential. Unauthorized use, distribution, or reproduction is strictly prohibited. For licensing inquiries, please contact the Louhen team. See [NOTICE.md](NOTICE.md) for attributions of third-party dependencies and services used in this project.
