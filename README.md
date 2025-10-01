[![CI](https://github.com/Martin/louhen-landing/actions/workflows/ci.yml/badge.svg)](https://github.com/Martin/louhen-landing/actions/workflows/ci.yml)

See [BADGES.md](BADGES.md) for full project status and quality metrics.

# Louhen Landing

Louhen Landing is the official marketing site for Louhen, designed to provide a seamless user experience and showcase our brand. This project leverages modern web technologies to deliver fast, accessible, and maintainable content.

## Tech Stack

- **Framework:** Next.js (App Router)
- **Styling:** CSS Modules, Style Dictionary for design tokens
- **Fonts:** Custom font optimization using `next/font`
- **State Management & Analytics:** Custom client-side analytics with consent management
- **Backend Integrations:** Firebase, Resend, hCaptcha for waitlist and user engagement

## Design System Snapshot

- Louhen Landing design is **locked** as of 2025-10-01; see [`CONTEXT/decision_log.md`](CONTEXT/decision_log.md#louhen-landing--design-system-locked-2025-10-01) and [`CONTEXT/design_system.md`](CONTEXT/design_system.md) for the canonical source of truth.
- Use semantic tokens, typography utilities, and shared CSS variables; avoid raw hex, ad-hoc radii, or bespoke shadows.
- Honor accessibility, dark-mode, i18n, and reduced-motion guardrails outlined in Slice plans and the PR checklist.
- Run existing validation commands—`npm run lint`, `npm run validate:local`, `npm run lighthouse`, etc.—to confirm design integrity before merging.

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

## Quickstart: Waitlist + Env

**TL;DR**
1. `cp .env.example .env.local` and fill in dev-safe placeholders.  
2. Convert your Firebase dev service account JSON to Base64 and set `FIREBASE_ADMIN_SA_B64`.  
3. Drop in the Resend dev API key and keep `RESEND_FROM` / `RESEND_REPLY_TO` on louhen.app.  
4. Use hCaptcha universal test keys (`10000000-ffff-ffff-ffff-000000000001` / `0x000…000`).  
5. `npm run lint && npm run build && npm run dev` to boot the stack.  
6. Visit `/status`, authenticate with `STATUS_USER` / `STATUS_PASS` from `.env.local`, and expect `emailTransport=false` in dev while noop mode is active.
7. Rate limiting defaults to 10 submissions/hour/IP and 3 resends/30m/email; override with `WAITLIST_RATE_SUBMITS_PER_HOUR_PER_IP` and `WAITLIST_RATE_RESENDS_PER_30M_PER_EMAIL` if you need different local caps.
8. After confirming an email, `/waitlist/pre-onboarding` is available for the optional family profile step. The confirmation flow drops a short-lived session cookie so drafts persist without exposing the email address.

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
### QA automation quickstart

Run the automated checks locally before pushing changes:

```bash
# axe a11y sweep across waitlist routes
npm run test:axe

# Playwright regression covering happy/expired/resend/pre-onboarding flows
npx playwright test tests/e2e/waitlist.flow.spec.ts

# Lighthouse budget guard (waitlist route must stay ≥90 across categories)
npm run lighthouse
```

### Local validation (single command)

Prefer a one-and-done run? Use the bundled validator:

```bash
npm run validate:local
```

It builds the production bundle, boots `start:test` on `localhost:4311` with
`TEST_MODE=1`, waits for `/waitlist`, runs unit + Playwright + axe + Lighthouse suites, then tears
the server down even if something fails. If the server cannot bind (port already in use) or the
readiness check times out, stop any existing Next.js process and retry.

### Sandbox validation (staging)

Need to validate from a sandbox or remote environment where ports are locked down? Target staging instead:

```bash
npm run validate:sandbox
```

This command sets `SANDBOX_VALIDATION=1` and `PREVIEW_BASE_URL=https://staging.louhen.app`, disables analytics, and runs lint, i18n parity, Playwright (smoke + accessibility), and Lighthouse directly against the preview deployment. No local Next.js server is started.

Use `validate:local` during normal development; reserve `validate:sandbox` for Codex or other non-loopback environments.

Need to point at a different preview? Override the default with `PREVIEW_BASE_URL=https://my-preview.example`.

### CI on demand

- GitHub UI: Actions → **Run Tests** → choose `unit`, `e2e`, `axe`, `lighthouse`, or `all`.
- CLI: `gh workflow run run-tests.yml -f suites=all`

Each CI job follows the same loopback flow (install with dev deps → build → start local server →
wait for readiness → run suite → upload artifacts). Optional inputs `skipE2E`, `skipAxe`, and
`skipLHCI` let you bypass individual suites when debugging infrastructure issues.

### PR slash commands

Maintainers and organization members can trigger suites directly from a pull-request comment:

```
/test all
/test unit
/test e2e
/test axe
/test lhci
```

The bot dispatches the same workflow_dispatch run and posts results back to the PR once complete.

## End-to-End Testing Modes

- **Local mode**: Run `npx playwright test` without `E2E_BASE_URL`; Playwright binds to the local dev server on loopback.
- **Remote mode**: Export `E2E_BASE_URL=https://staging.louhen.app` so tests hit the staging branch deployment. If Deployment Protection is enabled, also set `VERCEL_AUTOMATION_BYPASS_SECRET` and include the header below.

### cURL sanity check

```bash
curl -H "x-vercel-protection-bypass: $VERCEL_AUTOMATION_BYPASS_SECRET" \
  "$E2E_BASE_URL/status"
```

### Playwright auth header snippet

```ts
import { test as base } from '@playwright/test';

const test = base.extend({
  context: async ({ browser }, use) => {
    const headers = process.env.VERCEL_AUTOMATION_BYPASS_SECRET
      ? { 'x-vercel-protection-bypass': process.env.VERCEL_AUTOMATION_BYPASS_SECRET }
      : {};

    const context = await browser.newContext({
      baseURL: process.env.E2E_BASE_URL || 'http://127.0.0.1:3000',
      extraHTTPHeaders: headers,
    });
    await use(context);
    await context.close();
  },
});

export { test };
```

## License

This project and its contents are proprietary and confidential. Unauthorized use, distribution, or reproduction is strictly prohibited. For licensing inquiries, please contact the Louhen team. See [NOTICE.md](NOTICE.md) for attributions of third-party dependencies and services used in this project.
