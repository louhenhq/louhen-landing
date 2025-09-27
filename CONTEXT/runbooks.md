# Runbooks Index

Grab-and-go links for operations, environment setup, and governance.

## Core Runbooks
- [`email.md`](email.md) — Resend setup, DNS, and compliance headers.
- [`envs.md`](envs.md) — Environment matrix across local, preview, and production.
- [`status-monitoring.md`](status-monitoring.md) — /api/status authentication + GitHub monitoring.
- [`waitlist-ux.md`](waitlist-ux.md) — Locked waitlist funnel and acceptance criteria.
- [`i18n.md`](i18n.md) — Canonical locale strategy and notes.
- [`seo.md`](seo.md) — Pre-launch SEO guardrails and launch checklist.

## If You Only Have 10 Minutes…
1. Skim the [README Quickstart](../README.md#quickstart-waitlist--env) to configure `.env.local` and run the app.  
2. Remember production ships from `https://www.louhen.app`; the apex `https://louhen.app` is a 301 redirect only.  
3. Hit `/status` locally with Basic Auth to confirm email transport + nonce checks.  
4. Review the runbook above that matches your task (email, envs, status, or UX).

Keep this index updated as new runbooks land.
