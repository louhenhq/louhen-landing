# Privacy Baseline — Louhen Landing

Privacy handling aligns with GDPR-first principles and prepares the landing stack for ISO-27001 evidence.

---

## Consent Categories (Locked)

- Only analytics is offered as an opt-in category. No advertising, retargeting, or social tracking pixels are permitted.
- Consent records must persist per locale and respect revocation.
  Status: (Locked) — Last updated: 2025-10-09, Owner: Martin

## Environment Behaviour (Locked)

- Consent banner renders only on production deployments; preview environments hide the UI to avoid false telemetry.
- Analytics integrations stay disabled in preview (including Vercel previews and staging domain) regardless of banner state.
- Production analytics loads only after explicit opt-in; opt-out clears existing identifiers.
  Status: (Locked) — Last updated: 2025-10-09, Owner: Martin

## Transactional Email Standards (Locked)

- All waitlist or transactional emails include `List-Unsubscribe` and `List-Unsubscribe-Post` headers, plus `Auto-Submitted: auto-generated`.
- `Reply-To` remains `hello@louhen.app` for human follow-up while `From` stays `no-reply@louhen.app`.
- Test sends must match header policy even when originating from non-production environments.
  Status: (Locked) — Last updated: 2025-10-09, Owner: Martin
