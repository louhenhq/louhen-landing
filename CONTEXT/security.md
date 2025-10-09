# Security Posture — Louhen Landing

Security guardrails codify how the landing stack meets Louhen's baseline and slice deliverables. Update this document as controls evolve.

---

## Controls

### Headers (Locked)

- Content-Security-Policy applies per response with nonce support for scripts and styles; directives include `base-uri 'none'`, `object-src 'none'`, `upgrade-insecure-requests`, and `frame-ancestors 'none'`.
- Permissions-Policy remains minimal: `geolocation=()`, `camera=()`, `microphone=()`, `interest-cohort=()`.
- Keep optional CSP reporting stubs disabled; future enablement requires privacy review.
  Status: (Locked) — Last updated: 2025-10-09, Owner: Martin

### Secrets (Locked)

- Staging and production secrets stay isolated; no cross-environment reuse (Resend, captcha, Firebase, status auth).
- Rotate secrets quarterly or immediately when triggered by an incident or dependency advisory.
- Manage secrets in Vercel and GitHub only; never commit `.env` files with sensitive values.
  Status: (Locked) — Last updated: 2025-10-09, Owner: Martin

### Dependency Hygiene (Locked)

- `package-lock.json` remains pinned and reviewed in PRs; no ad-hoc `npm install` commits.
- Renovate runs on a weekly cadence to surface dependency updates with grouped PRs.
- Generate a CycloneDX SBOM artifact on CI builds to track transitive risk.
  Status: (Locked) — Last updated: 2025-10-09, Owner: Martin

## Evidence in CI (Locked)

- CycloneDX SBOM upload.
- axe accessibility report.
- Lighthouse report (performance + best practices + SEO).
- CSP grep report confirming nonce usage and absence of inline scripts/styles without authorization.
  Status: (Locked) — Last updated: 2025-10-09, Owner: Martin
