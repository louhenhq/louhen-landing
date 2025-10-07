# Environment Matrix (Local / Preview / Production)

Canonical reference for environment configuration across stages. Update this matrix whenever a variable is added, renamed, or its contract changes.

| Variable | Local (`.env.local`) | Preview (`staging.louhen.app`) | Production (`www.louhen.app`) | Notes |
|----------|----------------------|--------------------------------|---------------------------|-------|
| **FIREBASE_ADMIN_SA_B64** | Base64-encoded dev service account JSON | Preview service account | Production service account | Server-only; rotate via Firebase if leaked. |
| **FIREBASE_PROJECT_ID** | Dev project ID (e.g., `louhen-dev`) | `louhen-staging` | `louhen-prod` | Must align with Firestore instance in each stage. |
| **FIREBASE_DB_REGION** | `eur3` | `eur3` | `eur3` | Region locked; do not change without migration plan. |
| **RESEND_API_KEY** | `louhen-dev` key; optional (omit to use noop transport) | `louhen-preview` key | `louhen-prod` key | Manage in Resend; rotate quarterly. |
| **RESEND_FROM** | `no-reply@louhen.app` | `no-reply@louhen.app` | `no-reply@louhen.app` | Locked sender identity. |
| **RESEND_REPLY_TO** | `hello@louhen.app` | `hello@louhen.app` | `hello@louhen.app` | Locked reply channel. |
| **NEXT_PUBLIC_HCAPTCHA_SITE_KEY** | `10000000-ffff-ffff-ffff-000000000001` (universal test key) | Staging key scoped to `staging.louhen.app` | Production key scoped to `louhen.app` | Test key always succeeds; never ship to preview/prod. |
| **HCAPTCHA_SECRET** | `0x0000000000000000000000000000000000000000` (test secret) | Secret tied to staging key | Secret tied to production key | Keep server-side only. |
| **WAITLIST_CONFIRM_TTL_DAYS** | `7` | `1` | `7` | Preview uses shorter TTL for expiry QA. |
| **NEXT_PUBLIC_WAITLIST_URGENCY** | `true` (default) | toggle per experiment | toggle per experiment | Surface urgency copy flag; coordinate with growth. |
| **APP_BASE_URL** | `http://localhost:3000` | `https://staging.louhen.app` | `https://www.louhen.app` | Always matches deployment origin (apex redirects to canonical www). |
| **NEXT_PUBLIC_SITE_URL** | `http://localhost:3000` | `https://staging.louhen.app` | `https://www.louhen.app` | Must mirror `APP_BASE_URL` for link canonicalisation. |
| **STATUS_USER** | Simple dev credential (e.g., `status-ops`) | Strong random secret (Vercel + GitHub) | Strong random secret (Vercel + GitHub) | Required for `/status` and status GitHub Action. |
| **STATUS_PASS** | Simple dev credential (e.g., `status-secret`) | Strong random secret (Vercel + GitHub) | Strong random secret (Vercel + GitHub) | Rotate alongside STATUS_USER. |
| **NEXT_USE_REMOTE_FONTS** | `false` (self-hosted) | `false` unless experiment approved | `false` (default); enable only with legal sign-off | Toggles between bundled fonts and remote providers. |
| **FEATURE_* / FLAG_* vars** | Scoped to `lib/shared/env/flags.ts`; default `false` | Configure per rollout | Configure per rollout | All flags must be documented below; no ad-hoc env names. |

## Operational Notes
- Maintain parity between `APP_BASE_URL` and `NEXT_PUBLIC_SITE_URL` within each environment to avoid mismatched redirects and metadata.
- Any environment change requires a redeploy for Next.js serverless functions and static output to pick up new values.
- The waitlist env guard caches public/server snapshots; restart `next dev` after editing `.env*` files so updates are recognised.
- CI build job runs with public `NEXT_PUBLIC_*` vars only; the Playwright e2e job injects dummy analytics + server envs (never real secrets) so runtime guards and feature tests can execute (including a non-sensitive `HCAPTCHA_SECRET` so schema validation is exercised).
- Manage preview/production secrets exclusively in Vercel + GitHub; never commit secrets to the repository.
- Mirror the dummy `NEXT_PUBLIC_*` variables configured in CI within Vercel preview env settings to keep builds passing without server secrets.
- When rotating STATUS_* credentials, update Vercel, GitHub Secrets, and re-run the status monitor workflow to confirm success.
- Apex `https://louhen.app` must continue issuing a 301 redirect to `https://www.louhen.app`; never point application URLs to the bare domain.

## Feature Flag Policy
- All flags live in `lib/shared/env/flags.ts` (isomorphic) or `lib/server/env/guard.ts` (server-only). Do not introduce new env names outside these modules without updating this doc.
- Flag naming: `FEATURE_<CAPS>` for temporary launches; `FLAG_<CAPS>` for persistent toggles. Mirror names in tests when asserting behaviour.
- Default values must keep production safe (usually `false`). CI and local development should exercise both code paths via unit/e2e tests.
- Remove stale flags within two weeks of launch; update [/CONTEXT/rename_map.md](rename_map.md) if directory moves affect flag consumers.

## Fonts Toggle Strategy
- `NEXT_USE_REMOTE_FONTS=false` self-hosts all fonts (default). Keep this setting unless legal signs off on remote providers.
- When set to `true`, remote fonts load via `next/font` using Google Fonts. Must ship alongside:
  - Performance verification (`npm run lhci`) recorded in PR.
  - CSP updates reviewed via [/CONTEXT/security.md](security.md).
  - Communication to design/legal teams documenting the change.
