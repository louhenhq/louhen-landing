# Environment Matrix (Local / Preview / Production)

Canonical reference for environment configuration across stages. Update this matrix whenever a variable is added, renamed, or its contract changes.

| Variable | Local (`.env.local`) | Vercel (Preview / Production) | GitHub Actions (var / secret) | Owner | Notes |
| --- | --- | --- | --- | --- | --- |
| **APP_BASE_URL** | `http://localhost:3000` | Preview: `https://staging.louhen.app`<br>Production: `https://www.louhen.app` | workflow env (`ci.yml` -> `http://localhost:4311`) | Platform | Must mirror `NEXT_PUBLIC_SITE_URL`; Playwright overrides to loopback for determinism. |
| **NEXT_PUBLIC_SITE_URL** | `http://localhost:3000` | Preview: `https://staging.louhen.app`<br>Production: `https://www.louhen.app` | workflow env (`ci.yml`) | Platform | Keep in sync with `APP_BASE_URL` to avoid canonical/link drift. |
| **NEXT_PUBLIC_ENV** | `development` | Preview: `preview` | workflow env (`ci.yml` -> `ci`) | Platform | Drives runtime guard rails; production is set to `production` via Vercel. |
| **IS_PRELAUNCH** | `true` for local QA | Preview: `true` | workflow env (`ci.yml`) | Platform | Forces noindex + staging copy in CI/preview; set `false` only in production. |
| **NEXT_PUBLIC_ALLOW_INDEXING** | `false` | Preview: `false` | workflow env (`ci.yml`) | Platform | Production flips to `true` once public launch is approved. Guard enforced by CI. |
| **EMAIL_TRANSPORT** | `noop` | Preview: `noop` | workflow env (`ci.yml`) | Platform | Production switches to `resend`; CI guard rejects accidental upgrades. |
| **ANALYTICS_STORE_IP** | `false` | Preview: `false` | workflow env (`ci.yml`) | Platform | Production toggles to `true` only if privacy review approves. |
| **NEXT_PUBLIC_ANALYTICS_DISABLED** | `1` | Preview: `1` | workflow env (`ci.yml`) | Platform | Keeps analytics off in tests; production sets `0`. |
| **NEXT_PUBLIC_ANALYTICS_DEBUG** | `0` | Preview: `0` | workflow env (`ci.yml`) | Platform | Enable (`1`) manually only when diagnosing client analytics. |
| **NEXT_PUBLIC_HCAPTCHA_SITE_KEY** | Universal test key (`10000000-ffff-ffff-ffff-000000000001`) | Preview: staging key | workflow env (`ci.yml`) | Platform | Production uses live site key provided by hCaptcha. |
| **HCAPTCHA_SECRET** | Test secret (`0x000...000`) | Preview: staging secret | secret: `CI_HCAPTCHA_SECRET` | Platform | Production secret stored as Vercel encrypted env. |
| **FIREBASE_ADMIN_SA_B64** | Dev service account (Base64) | Preview: preview SA | secret: `CI_FIREBASE_ADMIN_SA_B64` | Platform | Rotate via Google IAM; never commit JSON. |
| **FIREBASE_PROJECT_ID** | `louhen-dev` | Preview: `louhen-staging` | secret: `CI_FIREBASE_PROJECT_ID` | Platform | Ensure ID aligns with the active service account. |
| **FIREBASE_DB_REGION** | `eur3` | Preview: `eur3` | secret: `CI_FIREBASE_DB_REGION` | Platform | Region locked; update only with a migration plan. |
| **RESEND_API_KEY** | Optional dev key (omit to stay noop) | Preview: preview key | secret: `CI_RESEND_API_KEY` | Platform | Production key held in Vercel; rotate quarterly. |
| **RESEND_FROM** | `no-reply@louhen.app` | Same as local | workflow env (`ci.yml`) | Growth Ops | Sender identity is fixed; update DNS before changing. |
| **RESEND_REPLY_TO** | `hello@louhen.app` | Same as local | workflow env (`ci.yml`) | Growth Ops | Customer-facing reply channel; coordinate with support before edits. |
| **WAITLIST_CONFIRM_TTL_DAYS** | `7` | Preview: `1` | workflow env (`ci.yml`) | Growth Ops | Preview shortens expiry for QA; production returns to `7`. |
| **WAITLIST_RATE_HASH_SECRET** | `rate-limit-secret` | Preview: same | - (falls back to hCaptcha/Resend secrets) | Platform | Supply explicitly if hCaptcha/Resend rotate simultaneously. |
| **SUPPRESSION_SALT** | `unsubscribe-secret` | Preview: preview salt | secret: `CI_SUPPRESSION_SALT` | Platform | Required to generate deterministic unsubscribe tokens. |
| **STATUS_USER / STATUS_PASS** | `status-ops` / `status-secret` | Preview: strong random | secret: `CI_STATUS_USER` / `CI_STATUS_PASS` | Platform | Used by `/status`; rotate with every credential change. |
| **PREVIEW_BYPASS_TOKEN** | - (set via GitHub secret only) | Vercel Protection Token | secret: `PREVIEW_BYPASS_TOKEN` | Platform | Required for preview Playwright runs; never echo in logs. |
| **NEXT_PUBLIC_LOCALES / NEXT_PUBLIC_DEFAULT_LOCALE** | `en-de,de-de,fr-fr,nl-nl,it-it` / `de-de` | Preview: same as production | workflow env (`ci.yml`) | Localization | Update alongside locale additions in `next-intl`. |

## Required Environment Variables

| Variable | Value | Purpose | Notes |
| --- | --- | --- | --- |
| `NEXT_PUBLIC_LOCALES` | `en-de,de-de,fr-fr,nl-nl,it-it` | Static locale list for client/runtime; must match hardcoded locales in source so Next.js static analysis stays in sync. | Parity rule: set identically in Vercel (Preview + Production) and GitHub Actions Variables to keep CI in lockstep. Change control: requires docs update + full redeploy of Preview and Production. |
| `NEXT_PUBLIC_DEFAULT_LOCALE` | `de-de` | Default locale for Germany; drives SSR locale negotiation, canonical URLs, `hreflang`, and JSON-LD language codes. | Same parity + change control rules as `NEXT_PUBLIC_LOCALES`. |
| **NEXT_PUBLIC_WAITLIST_URGENCY** | `true` default | Preview: experiment-specific | workflow env (`ci.yml`) | Growth Ops | Legacy toggle; superseded by `NEXT_PUBLIC_BANNER_WAITLIST_URGENCY` when Slice 15 lands. Document interim changes in release notes. |
| **TEST_MODE** | `0` (set manually for local unit tests) | Preview: `0` | workflow env (`ci.yml` -> `1`) | Platform | CI forces `1` to stub external integrations. |
| **TEST_E2E_SHORTCIRCUIT** | `true` | Preview: `true` | workflow env (`ci.yml`) | Platform | Ensures Playwright bypasses third-party services. |
| **NEXT_PUBLIC_ALLOW_INDEXING** | `false` | Preview: `false` | workflow env (`ci.yml`) | Platform | Production toggles to `true`; CI guard prevents accidental enablement. |

## Feature Flags

Codify flags in code via `lib/shared/flags.ts`. Every addition/modification must update this table, `/CONTEXT/decision_log.md`, and the PR checklist. Defaults below assume no environment variable overrides.

| Flag | Scope | Type | Preview Default | Production Default | Owner | Notes |
| --- | --- | --- | --- | --- | --- | --- |
| `NEXT_PUBLIC_ANALYTICS_ENABLED` | Public | boolean | `false` | `true` | Privacy & Analytics | Enables analytics bootstrapping after consent; disabled in Preview to avoid noisy telemetry. |
| `NEXT_PUBLIC_BANNER_WAITLIST_URGENCY` | Public | boolean | `true` | `true` | Growth Ops | Controls urgency badge visibility on the waitlist experience. |
| `OG_DYNAMIC_ENABLED` | Server | boolean | `true` (CI toggles to `false` for OG fallback validation) | `true` | Platform | Gates dynamic OG image rendering; static assets serve when disabled. |
| `SECURITY_REPORT_ONLY` | Server | boolean | `true` | `false` | Security | Runs CSP in report-only mode on Preview for safe experimentation; production enforces. |

## Operational Notes
- CI enforces secret hygiene (`jobs.policy-guards`) via a regex scanner and fails any run that finds suspicious secret-like literals outside `.env.example`.
- The same guard ensures `EMAIL_TRANSPORT` remains `noop` and `NEXT_PUBLIC_ALLOW_INDEXING` stays `false` across CI workflows. Do not override without updating the guard.
- All CI secrets use the `CI_*` naming convention. Store dummy values (not production credentials) to keep runs deterministic.
- Preview workflows (`e2e-preview.yml`) run against staging with `TEST_MODE=1`, `IS_PRELAUNCH=true`, `EMAIL_TRANSPORT=noop`, and must source bypass headers from `secrets.PREVIEW_BYPASS_TOKEN`.
- Never commit real credentials. `.env.example` documents placeholders only and mirrors the values required in Vercel / GitHub Actions.
- When adjusting environment variables, update this matrix, `.env.example`, and README simultaneously to avoid drift.

## Media & Open Graph Environment Variables

| Name | Scope | Example Value | Purpose / Effect | Default Behavior |
| --- | --- | --- | --- | --- |
| `NEXT_PUBLIC_CANONICAL_HOST` | Production only (Vercel) | `www.louhen.app` | Defines the canonical production host consumed by `getSiteOrigin()` when constructing absolute OG/Twitter URLs. | Required in Production; left unset in Preview/local. |
| `OG_DYNAMIC_ENABLED` | Preview + Production (Vercel) | `true` | Feature flag gating dynamic OG image generation. When `false`, metadata falls back to static assets and SEO tests expect static URLs. | Defaults to `true`. |
| `OG_CACHE_MAX_AGE` | Preview + Production (Vercel) | `300` | Overrides browser-facing `Cache-Control: max-age` for dynamic OG responses. | 300 s when unset. |
| `OG_S_MAXAGE` | Preview + Production (Vercel) | `86400` | Controls CDN/Edge `s-maxage` for dynamic OG responses. | 86 400 s (1 day) when unset. |
| `OG_SIZE_BUDGET_BYTES` | GitHub Actions (testing only) | `2000000` | Playwright SEO specs read this to enforce an OG image size ceiling in CI (≈ 2 MB). Not used at runtime. | 2 MB ceiling. |

**Notes**
- Variables without the `NEXT_PUBLIC_` prefix remain server-only.
- Updating Vercel values requires redeploying the affected environment.
- Preview inherits the `OG_*` cache and feature flags; Production normally overrides only the canonical host.

## Rotation Playbook
1. **Resend**: create new API key in Resend, update Vercel (Preview + Production) secrets, rotate GitHub secret `CI_RESEND_API_KEY`, then remove the old key. Validate by running `/status` and sending a waitlist confirmation from staging.
2. **Firebase Admin**: generate a new service account JSON in Google Cloud, encode to Base64, update Vercel secrets and `CI_FIREBASE_ADMIN_SA_B64`, then revoke the old key in IAM. Confirm Firestore writes via the waitlist API smoke test.
3. **hCaptcha**: provision a new secret/site key pair; deploy to staging first, update GitHub `CI_HCAPTCHA_SECRET`, then swap production. Monitor error rate and revert if verification fails.
4. **Waitlist hash + suppression salts**: generate cryptographically random strings, update `SUPPRESSION_SALT` and (optionally) `WAITLIST_RATE_HASH_SECRET` in Vercel and GitHub, then re-run `npm run validate:local` to ensure deterministic hashes.

## Feature Flag Governance
- Centralise reads in `lib/shared/flags.ts`. Components and routes consume the typed `getFlags()` helper instead of `process.env`.
- `getFlags()` surfaces `isPreview()`, `isProduction()`, and `getSiteOrigin()` utilities so behaviour differences stay auditable.
- Server-only toggles (no `NEXT_PUBLIC_` prefix) must be enforced on the server boundary (API routes, Server Components). Public flags must use the `NEXT_PUBLIC_` prefix and be wired through Playwright fixtures.
- Document flag owner, scope, and retirement criteria at creation time in this file and `/CONTEXT/decision_log.md`.
- Remove stale flags within two weeks of launch; update [/CONTEXT/rename_map.md](rename_map.md) if directory moves affect flag consumers.
- Preview-only tooling (`app/api/test/flags/route.ts`) lets CI override public flags via cookies; the endpoint hard-fails in production environments.
- Flag defaults are mirrored in Vercel Project → Settings → Environment Variables for both Preview and Production; update the table and `/CONTEXT/decision_log.md` whenever those values change.

## Fonts Toggle Strategy
- `NEXT_USE_REMOTE_FONTS=false` self-hosts all fonts (default). Keep this setting unless legal signs off on remote providers.
- When set to `true`, remote fonts load via `next/font` using Google Fonts. Must ship alongside:
  - Performance verification (`npm run lhci`) recorded in PR.
  - CSP updates reviewed via [/CONTEXT/security.md](security.md).
  - Communication to design/legal teams documenting the change.
