# Legal Pages — Terms & Privacy

## Purpose & Scope
- Provide transparent Terms of Service and Privacy Policy for the landing experience.
- Current phase covers `Terms of Service` and `Privacy Policy`; `Impressum`/company imprint remains optional until Louhen GmbH registration completes.
- All legal pages follow the `/[locale]/legal/<slug>` routing pattern documented in `routing.md`.

## Pre-launch Visibility
- Every legal page must ship with `noindex, nofollow` meta/HTTP directives while the site remains pre-launch (mirrors the global SEO posture in `seo.md`).
- Remove the `noindex` directives only after launch approval; retain localized canonical links to `https://www.louhen.app/{locale}/legal/<slug>`.

## Company Identity Placeholders
- Use placeholder entries for company name, legal entity number, and registered address until the GmbH formation is finalized.
- Annotate placeholders clearly (e.g., `[[Company legal name pending GmbH registration]]`) so localization teams do not translate the stubs.

## GDPR & Data Processing Commitments
- Analytics load **only after explicit consent** (no pre-checked boxes; consent stored per locale).
- Transactional email flows run exclusively through **Resend** (see `email.md`), adhering to the locked sender/reply-to policy.
- Bot protection relies on **hCaptcha**; legal copy must mention the hCaptcha Privacy Policy & Terms in each locale.
- **Firebase Admin** operates solely inside API routes for waitlist operations; no client-side access or data writes.

## EU Data-Subject Rights & Contacts
- Summarize rights in clear language: access, rectification, erasure, restriction, portability, objection, and lodging a complaint with a supervisory authority.
- Provide contact placeholders:
  - General legal inquiries → `legal@louhen.eu`
  - Privacy/Data Protection requests → `privacy@louhen.eu`
- Note response SLA once the DPO workflow is confirmed; until then, mark as `[[SLA pending]]`.


## Placeholder Swap Checklist (post-registration)
- Replace `legal.common.companyName` and `legal.common.companyAddress` in `messages/*.json` with the registered GmbH details.
- Update any localized overlays (`messages/*-*.json`) only if market-specific legal text diverges.
- Verify Terms and Privacy pages render the updated identity, including the footer block.
- Re-run the sitemap build and confirm legal routes reference the new entity.
- When Impressum goes live, mirror the same identity updates there.

## LouhenFit Guarantee Disclosure Policy
- Reference the **partial-disclosure** rule from `glossary.md`: the landing site may describe LouhenFit as a trust guarantee, but detailed tier logic remains in-app only.
- Ensure Terms & Privacy acknowledge the guarantee at a high level without exposing the internal criteria.

## Maintenance Checklist
- Whenever the legal entity details, consent tooling, or data processors change, update this file and the localized legal copy.
- Coordinate with localization to keep placeholders synchronized across locales and message catalogs.
