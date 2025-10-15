# Security & Headers — Louhen Landing

This repo follows the locked decisions in [/CONTEXT/decision_log.md](decision_log.md). Use this page as the quick reference for HTTP headers, CSP lifecycle, and PR guardrails.

## HTTP Response Headers (must remain enabled)
- `Strict-Transport-Security: max-age=31536000; includeSubDomains; preload` — **production only** and skipped for localhost/preview so local TLS remains opt-in.
- `Referrer-Policy: strict-origin-when-cross-origin`.
- `X-Content-Type-Options: nosniff`.
- `Permissions-Policy: accelerometer=(), autoplay=(), camera=(), clipboard-read=(), clipboard-write=(), display-capture=(), document-domain=(), encrypted-media=(), fullscreen=(), geolocation=(), gyroscope=(), magnetometer=(), microphone=(), midi=(), payment=(), screen-wake-lock=(), sync-xhr=(), usb=(), xr-spatial-tracking=(), interest-cohort=(), browsing-topics=()` — explicitly deny unused sensors/APIs. Both `interest-cohort=()` (legacy FLoC opt-out) and `browsing-topics=()` (Topics API opt-out) are sent; unknown directives are ignored by browsers, making this redundancy safe. The security E2E suite asserts that at least one of these tracking opt-outs is present.
- `X-Frame-Options: DENY` (mirrors CSP `frame-ancestors 'none'`).
- `Cross-Origin-Opener-Policy: same-origin`.
- `Cross-Origin-Embedder-Policy: require-corp`.
- `Cross-Origin-Resource-Policy: same-site`.
- `Report-To: {"group":"csp-endpoint", ...}` — points at `/api/security/csp-report` so CSP violations surface in observability pipelines.
- `Cache-Control` varies by route (`no-store` for auth/status, `public, max-age=0` for marketing pages); any change must mirror the existing pattern in middleware or route handlers.

### Network Policy for Tests
- Playwright aborts any network request that is not a loopback origin. Allowed origins are limited to `http://127.0.0.1`, `http://localhost`, `http://0.0.0.0`, and `http://[::1]` (plus the ports derived from `BASE_URL`). Data and blob URLs remain permitted for fixtures.
- The allowlist lives in `tests/fixtures/playwright.ts`; expanding it requires updating this section and documenting the rationale in [/CONTEXT/tests.md](tests.md#shell-agnostic-execution).
- Blocked requests cause the spec to fail and attach `blocked-requests.json` so CI surfaces the offending URL immediately.
- ESLint ignores generated Playwright artifacts (trace bundles, reports) so linting stays focused on authored code; see [/CONTEXT/tests.md](tests.md#shell-agnostic-execution) for tooling scope.

## Content Security Policy Lifecycle
- `middleware.ts` generates a single nonce (`crypto.randomUUID`) per request, mirrors it on the request (`content-security-policy(*)` + `x-csp-nonce`) and response, and delegates directive construction to `lib/security/csp.ts`. This keeps Next.js’ server renderer aligned with the nonce: `render.js` extracts it from the incoming CSP header so all framework scripts inherit the same value. Downstream layouts call `headers().get('x-csp-nonce')` and hydrate the React `NonceProvider`, which freezes the first SSR nonce so client re-renders cannot mutate it. Client components call `useNonce()` for inline scripts.
- `lib/security/csp.ts` centralises directive assembly. Defaults for strict/preview flows:
  - `default-src 'self'`.
  - `script-src 'self' 'nonce-<value>' 'strict-dynamic' https:` (no `unsafe-inline`; chained scripts must inherit trust from the nonce-bearing bootstrap).
  - `style-src 'self' 'unsafe-inline' https:` (Tailwind runtime injection; revisit once hashed styles are viable).
  - `img-src 'self' data: https:`.
  - `font-src 'self' https: data:`.
  - `connect-src 'self' https:` (dev/test inject loopback + ws/wss allowances).
  - `frame-ancestors 'none'`.
  - `base-uri 'self'`.
  - `form-action 'self'`.
  - `report-to csp-endpoint` and `report-uri /api/security/csp-report`.
- `lib/security/headers.ts` applies the resolved CSP header, attaches `Report-To`, HSTS (strict in production only), COOP/COEP/CORP, and the shared Permissions-Policy. No other module should set or mutate these headers directly.
- **Environment switch**: `CSP_MODE=strict|report-only|off` controls enforcement. `resolveCspMode()` defaults to `strict` whenever `VERCEL_ENV=production`, otherwise `report-only`. Set `CSP_MODE=report-only` for E2E/preview diagnostics; `off` is an emergency-only escape hatch and requires security sign-off.
- **Development relaxations** (applicable when `allowDevSources` is true: loopback host or non-production): `connect-src` adds loopback + ws/wss endpoints, while client-side Fast Refresh still requires `'unsafe-eval'`. No other origins are permitted without updating this doc, `lib/security/csp.ts`, and the middleware.
- `/app/api/security/csp-report/route.ts` accepts CSP violation samples (`application/csp-report` or JSON), strips query fragments, logs a redacted payload, and retains a capped in-memory buffer (`getStoredCspReports()`) for observability.
- Updating CSP allowances or changing the directive set requires a `/CONTEXT/decision_log.md` entry and security/infra approval. Prefer adding a nonce, using `'strict-dynamic'`, or self-hosting assets over widening directives.
- Analytics endpoints follow runtime opt-in: `connect-src` stays `'self'` until consent is `granted`, at which point a nonced helper widens the directive (e.g., appending `https://analytics.louhen.app`) for the active session only.

## Consent-First Analytics
- `lib/shared/consent/api.ts` is the single read/write surface for consent state; no third-party CMPs.
- `lib/shared/analytics/client.ts` owns queueing and bootstrap. Extending analytics requires updating [/CONTEXT/privacy_analytics.md](privacy_analytics.md) and adding tests as described in [/CONTEXT/testing.md](testing.md).
- Inline bootstrap snippets obtain `nonce` via `useNonce()` (provided by middleware through the `x-csp-nonce` header). Never inject analytics without passing that nonce down to the `<script>` element.
- CSP does **not** whitelist third-party analytics origins by default. When consent transitions to `granted`, the analytics bootstrap widens `connect-src` at runtime using the same nonce and only for the approved endpoints.

## PR Checklist Hooks
- Every PR touching headers, CSP, or analytics must tick the security block in `.github/pull_request_template.md` and list the commands/tests executed.
- Block merges if:
  - New inline script omits the nonce prop or skips `useNonce`.
  - CSP relaxations were added without rationale + link to this doc.
  - `NEXT_PUBLIC_*` secrets creep into client code (lint rule + manual review).
  - Consent bypass is introduced (analytics firing prior to consent).

## Incident Response
- Rotate compromised secrets (Resend, Firebase, STATUS_*) via Vercel + GitHub within 15 minutes; document rotation in `/CONTEXT/status-monitoring.md`.
- Report suspected data leaks privately to security@louhen.eu and open a private GitHub issue; never discuss in public threads.

Keep this reference aligned with naming/structure docs ([naming.md](naming.md), [rename_map.md](rename_map.md)) so future slices place server-only adapters under `lib/server/` with the correct guardrails.

## Testing & Verification
- Manual spot-check: `curl -I https://<host>` (or preview URL) should show the headers listed above; production responses include HSTS.
- Browser devtools: inspect `<script>` tags (ThemeInit, JSON-LD) and confirm `nonce` attributes match the middleware value with no CSP violations in the console.
- Local/preview QA: run the Playwright header check (`tests/e2e/security/headers.e2e.ts`). The spec attaches a JSON dump of the inspected headers to `test.info()` so CI artifacts surface the exact directives on failure.
- Automated suites must assert:
  - `lh-csp-nonce` + JSON-LD nonces exist and match the server-provided value.
  - No inline script executes without a nonce and CSP forbids `'unsafe-inline'`.
  - Analytics bootstrap remains blocked until consent rewrites `connect-src`.
- When CSP relaxations or new hosts are introduced, update the security tests + this doc in the same PR and link the `/CONTEXT/decision_log.md` entry.
