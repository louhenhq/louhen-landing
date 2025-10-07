# Security & Headers — Louhen Landing

This repo follows the locked decisions in [/CONTEXT/decision_log.md](decision_log.md). Use this page as the quick reference for HTTP headers, CSP lifecycle, and PR guardrails.

## HTTP Response Headers (must remain enabled)
- `Strict-Transport-Security: max-age=63072000; includeSubDomains; preload`
- `Referrer-Policy: strict-origin-when-cross-origin`
- `X-Content-Type-Options: nosniff`
- `Permissions-Policy: geolocation=(), microphone=(), camera=(), payment=()`
- `X-Frame-Options: DENY`
- `Cache-Control` varies by route (`no-store` for auth/status, `public, max-age=0` for marketing pages); any change must mirror the existing pattern in middleware or route handlers.

## Content Security Policy Lifecycle
- Generate a single nonce per SSR request inside `middleware.ts` and expose it via headers / React context. All inline scripts (ThemeInit, JSON-LD, analytics bootstraps) must consume that nonce.
- Default CSP (production & preview):
  - `default-src 'self'`
  - `script-src 'self' 'nonce-<value>' https://www.googletagmanager.com` (only if the consented analytics bridge is active)
  - `style-src 'self' 'unsafe-inline'` (for Tailwind/preloaded fonts)
  - `img-src 'self' data: https://www.google-analytics.com`
  - `connect-src 'self' https://api.hcaptcha.com https://hcaptcha.com`
  - `frame-src https://hcaptcha.com https://www.hcaptcha.com`
  - `font-src 'self' data:`
- Development relaxations:
  - Allow `http://localhost:*` in `script-src` and `connect-src`.
  - Permit `webpack:` URLs during local dev (Next.js overlay).
  - Never disable nonce enforcement—forward the dev nonce to JSON-LD even when running `next dev`.
- Updating CSP requires a decision-log entry plus PR approval from security/infra maintainers.

## Consent-First Analytics
- `lib/consent/state.ts` gates all analytics; do not ship third-party CMPs.
- `lib/analytics/**` modules must check consent before dispatch. Extending analytics requires updating [/CONTEXT/analytics_privacy.md](analytics_privacy.md) and adding tests as described in [/CONTEXT/testing.md](testing.md).

## PR Checklist Hooks
- Every PR touching headers, CSP, or analytics must tick the security block in `.github/pull_request_template.md` and list the commands/tests executed.
- Block merges if:
  - New inline script omits the nonce prop.
  - CSP relaxations were added without rationale + link to this doc.
  - `NEXT_PUBLIC_*` secrets creep into client code (lint rule + manual review).
  - Consent bypass is introduced (analytics firing prior to consent).

## Incident Response
- Rotate compromised secrets (Resend, Firebase, STATUS_*) via Vercel + GitHub within 15 minutes; document rotation in `/CONTEXT/status-monitoring.md`.
- Report suspected data leaks privately to security@louhen.eu and open a private GitHub issue; never discuss in public threads.

Keep this reference aligned with naming/structure docs ([naming.md](naming.md), [rename_map.md](rename_map.md)) so future slices place server-only adapters under `lib/server/` with the correct guardrails.
