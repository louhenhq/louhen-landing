# Waitlist Funnel (2-Step) — UX & Acceptance

Reference for the locked waitlist experience. Align copy, analytics, and engineering tasks with this funnel.

## 2-Step Funnel (LOCKED)
1. **Signup:** Collect email, consent, and hCaptcha in a low-friction form. On submit, issue a double opt-in email with a hashed, single-use token and TTL enforcement.
2. **Pre-onboarding:** After confirmation, present optional profile boosters (e.g., parent/child context, shoe size). Incentivise completion with clear benefits (priority access, tailored updates).

## Enhancements Backlog (priority order)
- Urgency copy (`NEXT_PUBLIC_WAITLIST_URGENCY` flag) to highlight limited early access.
- Gamified progress indicators to motivate completing optional steps.
- Referral CTA with personalized share links.
- Nurture stream that adapts to profile signals.
- Launch-day surprise/delight moment for confirmed users.

## Acceptance Criteria Snapshot
- **Accessibility:** AA colour contrast, focus management, semantic labels, and keyboard-only completion.
- **Reliability:** Duplicate submissions safe (idempotent); hashed tokens single-use; TTL observed in confirm + resend flows; rate limiting on form + resend endpoints.
- **Privacy:** No PII beyond scoped fields; analytics events gated by consent; logs redact emails and IPs; maintain consent ledger for audits.
- **Email:** Confirmation templates include compliance headers and unsubscribe metadata.

## Related Backlog Slices
- Slice 1 — UI scaffold + hCaptcha wiring
- Slice 2 — API + validation + Firestore write
- Slice 3 — Email confirmation + TTL logic
- Slice 5 — Pre-onboarding incentives
- Slice 6 — Automated tests & regression hardening

## Cross-References
- [`/CONTEXT/email.md`](email.md) for Resend transport and compliance.
- [`/CONTEXT/envs.md`](envs.md) for environment defaults.
- Product backlog: see Notion board “Waitlist Funnel” (team access required).
