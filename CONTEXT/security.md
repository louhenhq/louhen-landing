# Security & Headers — Louhen Landing

This repo follows the locked decisions in [/CONTEXT/decision_log.md](decision_log.md). Use this page as the quick reference for HTTP headers, CSP lifecycle, and PR guardrails.

## HTTP Response Headers (must remain enabled)
- `Strict-Transport-Security: max-age=31536000; includeSubDomains; preload` — **production only** and skipped for localhost/preview so local TLS remains opt-in.
- `Referrer-Policy: strict-origin-when-cross-origin`.
- `X-Content-Type-Options: nosniff`.
- `Permissions-Policy: accelerometer=(), autoplay=(), camera=(), clipboard-read=(), clipboard-write=(), display-capture=(), document-domain=(), encrypted-media=(), fullscreen=(), geolocation=(), gyroscope=(), magnetometer=(), microphone=(), midi=(), payment=(), screen-wake-lock=(), sync-xhr=(), usb=(), xr-spatial-tracking=(), interest-cohort=(), browsing-topics=()` — explicitly deny unused sensors/APIs. Both `interest-cohort=()` (legacy FLoC opt-out) and `browsing-topics=()` (Topics API opt-out) are sent; unknown directives are ignored by browsers, making this redundancy safe. The security E2E suite asserts that at least one of these tracking opt-outs is present.
- `X-Frame-Options: DENY` (mirrors CSP `frame-ancestors 'none'`).
- `Cross-Origin-Opener-Policy: same-origin`.
- `Cross-Origin-Resource-Policy: same-site`.
- `Cache-Control` varies by route (`no-store` for auth/status, `public, max-age=0` for marketing pages); any change must mirror the existing pattern in middleware or route handlers.

## Content Security Policy Lifecycle
- `middleware.ts` generates a single nonce per request, forwards it via the incoming request header (`x-csp-nonce`) and injects it into the rendered response. Downstream layouts call `headers().get('x-csp-nonce')` and hydrate the React `NonceProvider`, which freezes the first SSR nonce so client re-renders cannot mutate it. Client components call `useNonce()` for inline scripts.
- **Production / preview defaults**:
  - `default-src 'self'`.
  - `script-src 'self' 'nonce-<value>'` (no `unsafe-inline` or remote CDNs).
  - `style-src 'self' 'unsafe-inline'` (Tailwind runtime injection; revisit once hashed styles are viable).
  - `img-src 'self' data:`.
  - `font-src 'self'`.
  - `connect-src 'self'` (add domains only when servers are self-hosted or consented).
  - `frame-ancestors 'none'`.
  - `base-uri 'self'`.
  - `form-action 'self'`.
- **Development-only relaxations** (scoped by `NODE_ENV !== 'production'`):
  - `script-src` gains `'unsafe-eval'` for Next.js fast refresh.
  - `connect-src` allows `ws:`, `wss:`, and `http(s)://localhost:*` for dev servers.
  - No additional origins are permitted without updating this doc and the middleware.
- **Report Only toggle**: set `CSP_REPORT_ONLY=1` (or `NEXT_PUBLIC_CSP_REPORT_ONLY=1`) in preview to serve `Content-Security-Policy-Report-Only`. Production always enforces.
- Updating CSP allowances requires a `/CONTEXT/decision_log.md` entry and security/infra approval. Prefer adding a nonce or self-hosting assets over widening directives.

## Consent-First Analytics
- `lib/consent/state.ts` gates all analytics; no third-party CMPs.
- `lib/analytics/**` modules must check consent before dispatch. Extending analytics requires updating [/CONTEXT/analytics_privacy.md](analytics_privacy.md) and adding tests as described in [/CONTEXT/testing.md](testing.md).
- CSP does **not** whitelist third-party analytics origins by default. When consented scripts are introduced, add them via a nonced `<script>` element and update the CSP/connect-src lists in middleware + this doc with the justification.

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
- Local/preview QA: run the Playwright header check (`tests/e2e/security/headers.e2e.ts`) once added, and review any CSP report-only findings before switching preview back to enforce mode.
