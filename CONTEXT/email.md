# Email Transport (Resend) Runbook

Authoritative playbook for transactional email on louhen.app using Resend. Keep this document in sync with DNS, Vercel, and app code changes.

## Domain Strategy (LOCKED)
- Transactional mail sends from `no-reply@louhen.app` with `Reply-To: hello@louhen.app`.
- Marketing (Phase 2+) will move to a dedicated subdomain, e.g., `mail.louhen.app`, to preserve sender reputation.
- All transactional flows must remain on louhen.app; do not introduce third-party senders without a new governance decision.

## DNS Setup (Cloudflare)
- Add Resend-provided DKIM CNAMEs; set to **DNS only** (proxy disabled).
- SPF: create `louhen.app TXT` with `v=spf1 include:resend.com ~all`.
- DMARC: create `_dmarc.louhen.app TXT` with `v=DMARC1; p=none; rua=mailto:postmaster@louhen.app`.
- Return-Path: add Resend bounce/return records exactly as issued; also DNS only.
- Verify records propagate before enabling production sends; use tools like `dig` or Resend’s dashboard to confirm.

## Resend Setup
- Add domain `louhen.app` inside Resend and complete verification (DKIM/SPF/Return-Path).
- Create API keys scoped by environment:
  - `louhen-dev` — developer/local testing
  - `louhen-preview` — Vercel preview/staging deployments
  - `louhen-prod` — production traffic only
- Rotation policy: rotate keys quarterly or immediately after any leak; revoke old keys in Resend and update Vercel secrets + `.env.local` templates.
- Restrict dashboard roles so only release managers can generate production keys.

## Environment Variables Map
| Environment | Variables | Notes |
|-------------|-----------|-------|
| Local (`.env.local`) | `RESEND_API_KEY` = dev key, `RESEND_FROM=no-reply@louhen.app`, `RESEND_REPLY_TO=hello@louhen.app` | Enables optional real sends; omit `RESEND_API_KEY` to stay in noop mode. |
| Preview (Vercel) | `RESEND_API_KEY` = preview key, `RESEND_FROM`, `RESEND_REPLY_TO`, `WAITLIST_CONFIRM_TTL_DAYS=1` | TTL shortened for expiry testing; emails still from louhen.app. |
| Production (Vercel) | `RESEND_API_KEY` = prod key, `RESEND_FROM`, `RESEND_REPLY_TO`, `WAITLIST_CONFIRM_TTL_DAYS=7` | Only production key may deliver to customers; `APP_BASE_URL` resolves to `https://www.louhen.app`. |

Keep `RESEND_FROM`/`RESEND_REPLY_TO` identical across environments unless governance changes.

<<<<<<< HEAD
## Visual System & Palette
- Colours for HTML emails are generated from design tokens. Run `npm run -w @louhen/design-tokens build` to refresh `lib/email/colors.ts` (light + optional dark).
- Templates must import `emailColors` (and optionally `emailColorsDark`) and derive styles through helpers in `emails/emailTheme.ts`. Never inline hex values or CSS variables in template markup — palette changes flow through the generator.
- Palette updates require design sign-off and a short changelog showing light/dark previews before merging.
- The generated palette module (`lib/email/colors.ts`) is the **only** file permitted to contain raw hex. It begins with the header `// GENERATED FILE - DO NOT EDIT. Generated from design tokens.` and ESLint ignores the hex rule there. Any new exception requires design + engineering approval.

=======
>>>>>>> f7d7592 (Waitlist env split: build uses NEXT_PUBLIC only (#2))
## Compliance Headers (to be enforced in code)
- `List-Unsubscribe`: both mailto and HTTPS one-click URLs.
- `List-Unsubscribe-Post: List-Unsubscribe=One-Click`.
- `Auto-Submitted: auto-generated` for transactional notifications.
- `Reply-To: hello@louhen.app` (or flow-specific address approved by governance).
- Audit headers quarterly; add unit tests when templates ship.

## Test Procedure
1. From Resend dashboard, send a test email using the intended template.
2. Inspect headers via mail client or tools like Gmail “Show original”:
   - SPF, DKIM, DMARC must all read **PASS**.
   - Confirm `Reply-To` and compliance headers exist.
3. Trigger the same email via the app (local or preview) to verify runtime configuration (confirmation CTAs must point to `https://www.louhen.app` in production; apex redirects only).
4. Log results in QA notes for the release.

## Troubleshooting
- `emailTransport=false` on `/api/status`: verify domain verification status and ensure the correct API key is present in Vercel/`.env.local`.
- DKIM or SPF failing: re-check Cloudflare records for typos or proxy mode; all Resend records must be DNS-only.
- Spam placement: reduce HTML payload size, include a plain-text part, keep total message under ~150 KB, and monitor engagement metrics.
- Unexpected from/reply-to: confirm ENV overrides and review recent commits touching `lib/email`.

Keep this runbook updated whenever DNS or provider settings change.
