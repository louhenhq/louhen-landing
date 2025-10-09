# Architecture — Louhen Landing

High-level map of routes, data flow, environment setup, security, observability, and CI/CD for the landing + waitlist site. Keep this concise but exact; update when behavior or shape changes.

---

## 0) System Overview (Start Here)

- **Structure:** `app/` (routes), `components/{ui,blocks,features/…}`, `lib/shared/` (isomorphic), `lib/server/` (server-only), `tests/{unit,e2e,axe}/`, `scripts/`, `content/`, `public/`, `CONTEXT/`, `.github/`. See [/CONTEXT/naming.md](naming.md) for enforced conventions and [/CONTEXT/rename_map.md](rename_map.md) for the migration roadmap.
- **Route groups:** Marketing surfaces live under `app/(site)/[locale]/…` using lowercase BCP-47 segments; API handlers stay in `app/api/`. Default-locale pages must call `unstable_setRequestLocale` before rendering.
- **Runtime split:** Place anything with secrets, Firestore, or Node-only APIs in `lib/server/`. Keep universal utilities, hooks, and analytics helpers in `lib/shared/` so they can execute on both client and server.
- **Stack baseline:** Next.js 15 App Router, TypeScript strict mode, Tailwind + Style Dictionary tokens, consent-gated analytics, Firebase Admin, Resend, hCaptcha.
- **TypeScript configs:** `tsconfig.json` (dev superset including tests, Playwright, scripts) and `tsconfig.build.json` (app build subset) share path aliases `@app/*`, `@components/*`, `@lib/*`, `@tests/*`.

### Consent-First Analytics Modules
- `lib/shared/analytics/client.ts` — client-side queue + flush abstraction; no vendor SDK code or network calls execute until consent is `granted`.
- `lib/shared/consent/api.ts` — single source of truth for reading/updating consent state and subscribing to changes.
- `components/ConsentBanner.tsx` — exclusive entry point for users to grant or deny analytics; other surfaces (header, footer, forms) listen only.
- Data flow: `ConsentBanner` → `lib/shared/consent/api.ts` → lazy analytics bootstrap → buffered `page_view` flush.
- Error handling: analytics bootstrap treats network failures as silent; retries stay capped (document limit per vendor) and must never block UI threads or surface fatal errors.

### Tokens in the build
- Runtime CSS for tokens is imported once in `app/layout.tsx` via `./styles/tokens.css` (which in turn pulls the light/dark/high-contrast bundles emitted by `@louhen/design-tokens`). No other module should import these CSS files.
- Tailwind maps token scales through `tailwind.config.ts` by reading the generated CSS variables. The config scans `./app`, `./components`, `./pages`, and `./lib` for class usage; add new directories here if token-aware classes appear elsewhere.
- Compile-time consumers (e.g., metadata theme colors, `Sparkline`) read JSON from `@louhen/design-tokens/build/web/tokens.json`. Details on permissible usage live in [/CONTEXT/design_system.md](design_system.md).

Use this overview with the decision log to validate architecture changes before implementation.

---

## 1) Routes & Pages (App Router)

- `/`  
  Public landing page (hero + value prop + waitlist form). Renders fast, no blocking scripts, CLS-safe images.

- `/success`  
  Shown after a successful waitlist submission (or confirmation). Friendly copy, next steps.

- `/confirm?token=...`  
  Confirms email using a signed token with TTL. Returns success/failure state with clear messaging.

- `app/api/waitlist/route.ts`  
  POST endpoint for submissions. Validates input (Zod), verifies hCaptcha (server-side), writes to Firestore via Admin, optionally triggers Resend email.

- (Optional) `app/api/resend-confirm/route.ts`  
  POST endpoint to re-send confirmation email if token expired or lost (guarded by rate limit).

### Method Page — Personalisation & Flags
- Personalised copy derives from session user context; prefer SSR-safe read of child profiles (id, firstName) from the existing auth/session provider. Do not block render; if missing, fall back to generic strings.
- Feature flags: `method.stickyCta`, `method.exitNudge`. Default: enabled on staging, disabled on production until QA sign-off.
- Performance budget: do not add new client libraries beyond the already-approved Framer Motion; gate animations behind the reduced-motion media query.

---

## 2) Data Flow — Waitlist

UI (client)  
→ POST `app/api/waitlist/route.ts`  
→ Zod validate (email, locale, utm, captcha token)  
→ Verify hCaptcha using `HCAPTCHA_SECRET`  
→ Create doc in Firestore (collection: `waitlist`) with fields:
  - email (string, lowercased, trimmed)
  - locale (string, e.g., `de`, `en`)
  - utm: { source, medium, campaign, term, content } (strings, optional)
  - createdAt (server timestamp)
  - confirmToken (opaque, random or signed)
  - confirmExpiresAt (timestamp; NOW + TTL days)
  - confirmedAt (nullable timestamp)
  - ipHash (optional, salted hash for abuse monitoring)
→ (Optional) Send confirmation email via Resend (once domain is verified)
→ UI shows success; on email click, user hits `/confirm?token=...`

Confirm flow (`/confirm`)  
→ Validate token (signature/random lookup), check TTL  
→ If valid: set `confirmedAt = now`, clear token/expiry  
→ Redirect to `/success` with confirmed state and friendly copy  
→ If expired/invalid: render helpful error + link to request re-send

---

## 3) API Contracts

POST `app/api/waitlist/route.ts`  
- Request JSON:
  - email: string (required)
  - locale: string (optional, defaults from headers)
  - utm: object (optional: source, medium, campaign, term, content)
  - captchaToken: string (required)
- Success (201):
  - `{ status: "ok", code: "CREATED", id?: "<docId>" }`
- Errors:
  - 400 `{ status: "error", code: "INPUT_INVALID", issues: [...] }`
  - 400 `{ status: "error", code: "CAPTCHA_FAILED" }`
  - 409 `{ status: "error", code: "ALREADY_EXISTS" }` (optional if dedup by email)
  - 500 `{ status: "error", code: "INTERNAL_ERROR" }`

GET `/confirm?token=...` (Server Component)  
- Success: marks confirmed and renders success UX  
- Failure: shows expired/invalid copy with CTA to re-send

(If implemented) POST `app/api/resend-confirm/route.ts`  
- Request JSON: `{ email: string }`  
- Success: `{ status: "ok", code: "RESENT" }`  
- Errors: 400 `INPUT_INVALID`, 404 `NOT_FOUND`, 429 `RATE_LIMITED`

---

## 4) Firestore Structure (Admin-only)

Project: `louhen-mvp`  
Collection: `waitlist` (document ID may be random or email-hash)

Document fields:
- email: string
- locale: string
- utm: { source?, medium?, campaign?, term?, content? }
- createdAt: Timestamp (server)
- confirmToken: string (opaque) or null (after confirmation)
- confirmExpiresAt: Timestamp
- confirmedAt: Timestamp or null
- ipHash: string (optional; salted)
- metadata: { userAgent?, referrer? } (optional)

Indexes: not required for simple writes/reads; add if querying on `email` or `confirmedAt`.

Security rules: not applicable here (Admin SDK only), but keep the project’s rules clean and least-privileged for other clients.

---

## 5) Environment & Configuration (Vercel)

Required env vars (all set in Vercel):
- FIREBASE_ADMIN_SA_B64 (base64 of Service Account JSON)
- FIREBASE_PROJECT_ID
- FIREBASE_DB_REGION
- NEXT_PUBLIC_HCAPTCHA_SITE_KEY
- HCAPTCHA_SECRET
- RESEND_API_KEY
- RESEND_FROM
- RESEND_REPLY_TO
- APP_BASE_URL (e.g., `https://louhen-landing.vercel.app`)
- WAITLIST_CONFIRM_TTL_DAYS (e.g., `7`)

Fail fast on missing envs with clear server-side error logs (no secrets echoed).

### DNS / Environment Addendum

- Apex `louhen.app` must point to `76.76.21.21` (A record, DNS only) once production goes live.
- `www.louhen.app` stays a CNAME to `cname.vercel-dns.com` (DNS only).
- Wildcard previews `*.staging.louhen.app` stay CNAME records to `cname.vercel-dns.com` (DNS only).
- If Vercel validator lags, provision explicit subdomains (e.g., `tmp.staging.louhen.app`) as fallbacks.
- Keep production DNS dark prior to launch; only preview domains remain exposed.

### Feature Flags & Environment Helpers

- `lib/shared/flags.ts` owns `getFlags()`, `isPreview()`, `isProduction()`, and `getSiteOrigin()`. Read flags through these helpers instead of `process.env` to keep behaviour auditable and type-safe.
- Serverside modules pull a fresh `getFlags()` per request (or during build for static paths); client components receive flags via props or the public `NEXT_PUBLIC_*` surface.
- Example:

```ts
import { getFlags } from '@/lib/shared/flags';

export function OgRoute() {
  const { OG_DYNAMIC_ENABLED } = getFlags();
  return OG_DYNAMIC_ENABLED ? renderDynamicOg() : renderStaticOg();
}
```

- When introducing a new flag: update `/CONTEXT/envs.md`, add an owner entry in `/CONTEXT/decision_log.md`, and ensure tests exercise both flag states.
- **Environment Mapping:** Preview and Production deployments load different defaults for analytics, CSP, and OG behaviour (see `/CONTEXT/envs.md`). These values live in Vercel Project → Settings → Environment Variables and are mirrored in documentation to keep parity. Preview builds default to analytics-off, CSP report-only, and dynamic OG enabled; Production enables analytics and full CSP enforcement.

---

## 6) CSP & Inline Scripts

- Middleware issues a strict CSP with per-request nonces. All inline scripts **must** set `nonce={nonce}` from the request headers and render via helpers like `SeoJsonLd`.
- Do not add raw `<script>` tags or inline event handlers; encapsulate logic in React components or external modules so the nonce is applied automatically.
- JSON-LD helpers (`OrganizationJsonLd`, `BreadcrumbJsonLd`, `TechArticleJsonLd`, etc.) already inject the correct nonce — reuse them instead of hand-writing `<script>` blocks.

### DNS / Environment Addendum

- Apex `louhen.app` must point to `76.76.21.21` (A record, DNS only) once production goes live.
- `www.louhen.app` stays a CNAME to `cname.vercel-dns.com` (DNS only).
- Wildcard previews `*.staging.louhen.app` stay CNAME records to `cname.vercel-dns.com` (DNS only).
- If Vercel validator lags, provision explicit subdomains (e.g., `tmp.staging.louhen.app`) as fallbacks.
- Keep production DNS dark prior to launch; only preview domains remain exposed.

---

## 6) Security Model

- No client-side secrets. All privileged operations happen in API routes or Server Components.
- hCaptcha server verification mandatory on public forms.
- Minimal PII stored: email (lowercased), locale, UTM, timestamps. No names/addresses.
- Logging: redact emails (`ma***@example.com`), never log tokens or raw headers containing PII.
- Optional rate limiting on resend/submit endpoints (IP hash + short window).
- Token TTL enforced via centralized helper (e.g., `lib/waitlistConfirmTtl.ts`).

---

## 7) Observability & Logging

- Use structured console logs on server with event codes, e.g.:
  - `WAITLIST_CREATE_OK`, `WAITLIST_CREATE_FAIL_INPUT`, `WAITLIST_CREATE_FAIL_CAPTCHA`, `CONFIRM_OK`, `CONFIRM_EXPIRED`
- Redact sensitive fields; attach a short `reqId` for correlation.
- Consider Sentry (optional) for production error alerts; if added, scrub PII tags.

---

## 8) Performance & Accessibility

- Image assets with width/height or `sizes` to prevent CLS; use `next/image`.
- Keep JS light on `/`; avoid client-side heavy libs.
- Target Lighthouse (on `/`):
  - Performance ≥ 90
  - Accessibility ≥ 95
  - SEO ≥ 95
  - Best Practices ≥ 95
- Form elements fully labeled; keyboard navigation first-class.

---

## 9) Internationalization (next-intl)

- No hardcoded user-visible copy. Use message catalogs.
- Language detection: accept-language and explicit locale; keep simple until Locize/DeepL is wired.
- Keep keys stable and human-readable.

---

## 10) CI/CD

GitHub Actions:
- Job: build & verify
  - `npm ci`
  - `npm run lint`
  - `npm run build`
  - `npx playwright test`
  - Lighthouse run; upload artifacts (Playwright HTML, Lighthouse report, `.next` traces)
- Job: release (on push to `main`)
  - `npx semantic-release --debug` (updates GitHub Release + CHANGELOG)

**CI / E2E note**: Playwright resolves `BASE_URL` → `PREVIEW_BASE_URL` → `http://localhost:4311`. When either env var is present, the suite hits that remote host and skips starting the local Next.js server. Local runs fall back to auto-starting Next on `0.0.0.0:4311`. If the remote environment is protected, supply `PROTECTION_HEADER="x-vercel-protection-bypass: <token>"` so requests include the required header.

Branching:
- `main` (stable)  
- `next` / `beta` if needed for pre-releases (already configured in `.releaserc.json`)

---

## 11) Color Policy & Design Tokens

- Source of truth: `packages/design-tokens/tokens/` (human-edited). Regenerate all outputs with `npm run -w @louhen/design-tokens build` — this refreshes web CSS variables, the public `tokens.css` bundle, Dart bindings, and the generated email palette at `lib/email/colors.ts`.
- Web UI: consume semantic CSS variables or Tailwind utilities that map to tokens (`tailwind.config.ts`). No raw hex literals in `*.ts(x)/.js(x)/.css/.scss/.md(x)` code paths.
- Email: templates in `emails/**` import the generated `emailColors` (and optional `emailColorsDark`) and derive any additional styles from that palette. Inline hex is forbidden; use palette values or helper utilities that wrap them.
- Guardrails:
  - Pre-commit (`lint-staged`): `npm run guard:hex` scans staged files and blocks commits containing disallowed hex colours.
  - CI: `npm run ci:color-policy` scans the entire repo, enforces email palette imports, and writes `ci-artifacts/color-policy-report.txt` for PR visibility.
- Exceptions (allowlist): generated outputs only — `packages/design-tokens/**`, `public/tokens/**`, and the single `lib/email/colors.ts` module. Any new exception requires design-engineering approval and an update to the guard script.
- Governance: new colours come via the design weekly. Designers propose token additions/changes, engineering reviews build impact, and the change ships with screenshots + changelog. Tokens are versioned by semver tags on the design-tokens package for traceability.
- Playground route: `/tokens` renders the playground dynamically (`dynamic = 'force-dynamic'`, `runtime = 'nodejs'`) because the root layout reads request headers/cookies. The page never ships to production marketing traffic (robots noindex) and serves as an internal QA surface only.

## 12) Error Codes (canonical)

- INPUT_INVALID — Zod validation failed
- CAPTCHA_FAILED — hCaptcha verification failed
- ALREADY_EXISTS — email already in waitlist (optional behavior)
- TOKEN_INVALID — confirm token not found or malformed
- TOKEN_EXPIRED — confirm token past `confirmExpiresAt`
- INTERNAL_ERROR — unexpected server error

UI should map these to friendly messages; server logs should include the code for grepability.

---

## 12) Future Extensions (scoped and optional)

- Add Edge Middleware for lightweight bot heuristics.
- Add KV/Upstash for per-IP rate limiting on submit/resend.
- Add Sentry with PII scrubbing and environment tagging.
- Hook Resend templates for branded confirmation emails (DKIM/SPF complete).
- Add basic analytics events (privacy-safe) for conversion funnels.

---

## 13) Architectural Constraints

- Keep API handlers tiny; delegate logic to `lib/` functions (testable, composable).
- Do not couple UI components to Firestore/Admin SDK.
- No drive-by refactors; minimal diffs and stable interfaces.
- Document non-obvious trade-offs here when they become policy.

---

## 14) Release Process (Staging → Production)

We use a two-branch model:

- **staging** is the default branch. All feature work and PRs should target `staging`.  
  Preview deployments (`staging.louhen.app` and `*.staging.louhen.app`) are built from this branch.

- **production** is the release branch. The production site (`www.louhen.app`) deploys from this branch.

### How to release
1. Merge feature branches into `staging` via pull requests.
2. Once `staging` is validated (QA, e2e, approvals), open a pull request from `staging` into `production`.
3. The CI job **`enforce-release-source`** is a required status check: it blocks PRs into `production` unless the head branch is `staging`.
4. The `production` ruleset requires 2 approvals, up-to-date checks, and blocks force pushes/deletions.
5. Reviewers must confirm every item in `.github/pull_request_template_release.md` before approving the `staging` → `production` PR.
6. In emergencies, add the `skip-checklist` label to bypass enforcement **only** with justification in the PR description and Release Manager approval.
7. The **Enforce Release PR Checklist** workflow status check must stay marked Required in the `production` branch ruleset.

### Why this guard exists
- Ensures production deployments are only promoted from a validated staging branch.
- Prevents accidental direct merges from feature branches into production.
- Keeps the release flow auditable and consistent.
- Make the matrix-based `e2e:preview` workflow a required status on `staging` so remote Playwright coverage (method, header-nav, footer, waitlist) must pass before merge; leave local retries at the default (0) to expose flakes during development.
- Preview CI jobs execute remotely (no local server) with explicit permissions (`actions:read`, `contents:read`), a 30-minute timeout, and concurrency group `e2e-preview-${ref}-${suite}` to cancel stale runs. Secrets arrive via masked env vars; never echo them in logs.
- npm (`~/.npm`) and Playwright (`~/.cache/ms-playwright`) caches reduce cold-start times. Cache keys derive from `npm-${os}-${hash(package-lock)}` / `pw-${os}-${hash(package-lock)}` with OS restore keys so fallback hits remain fast.

---
