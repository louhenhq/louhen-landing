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
<<<<<<< HEAD
- **Reliability:** Duplicate submissions safe (idempotent); hashed tokens single-use; TTL observed in confirm + resend flows; rate limiting on form + resend endpoints; pre-onboarding drafts persist against a session cookie rather than raw email.
- **Privacy:** No PII beyond scoped fields; analytics events gated by consent; logs redact emails and IPs; maintain consent ledger for audits.
- **Email:** Confirmation templates include compliance headers and unsubscribe metadata.

## Pre-onboarding implementation notes
- `/waitlist/pre-onboarding` is unlocked after confirmation. The confirm handler sets a short-lived `waitlist_session` cookie (doc UUID, HttpOnly) that the API route uses to locate the Firestore document.
- Draft saves land in `profileDraft` on the waitlist document and toggle `preOnboarded=true`. Re-saves overwrite the draft; Firestore timestamps `updatedAt` + `profileDraftUpdatedAt`.
- Client form supports up to five children (name, ISO birthday, optional weight + shoe size), inline validation, and idempotent messaging when a draft already exists.
- Analytics: the client emits `preonboarding_completed { hadChildData, locale }` after a successful save, gated by consent.

=======
- **Reliability:** Duplicate submissions safe (idempotent); hashed tokens single-use; TTL observed in confirm + resend flows; rate limiting on form + resend endpoints.
- **Privacy:** No PII beyond scoped fields; analytics events gated by consent; logs redact emails and IPs; maintain consent ledger for audits.
- **Email:** Confirmation templates include compliance headers and unsubscribe metadata.

>>>>>>> f7d7592 (Waitlist env split: build uses NEXT_PUBLIC only (#2))
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
