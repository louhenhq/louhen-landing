# Architecture — Louhen Landing

High-level map of routes, data flow, environment setup, security, observability, and CI/CD for the landing + waitlist site. Keep this concise but exact; update when behavior or shape changes.

---

## 1) Routes & Pages (App Router)

- `/`  
  Public landing page (hero + value prop + waitlist form). Renders fast, no blocking scripts, CLS-safe images.

- `/success`  
  Shown after a successful waitlist submission (or confirmation). Friendly copy, next steps.

- `/confirm?token=...`  
  Confirms email using a signed token with TTL. Returns success/failure state with clear messaging.

- `app/api/waitlist/route.ts`  
  POST endpoint for submissions. Validates input (Zod), verifies hCaptcha (server-side), writes to Firestore via Admin, optionally triggers Resend email.

- (Optional) `app/api/resend-confirm/route.ts`  
  POST endpoint to re-send confirmation email if token expired or lost (guarded by rate limit).

---

## 2) Data Flow — Waitlist

UI (client)  
→ POST `app/api/waitlist/route.ts`  
→ Zod validate (email, locale, utm, captcha token)  
→ Verify hCaptcha using `HCAPTCHA_SECRET`  
→ Create doc in Firestore (collection: `waitlist`) with fields:
  - email (string, lowercased, trimmed)
  - locale (string, e.g., `de`, `en`)
  - utm: { source, medium, campaign, term, content } (strings, optional)
  - createdAt (server timestamp)
  - confirmToken (opaque, random or signed)
  - confirmExpiresAt (timestamp; NOW + TTL days)
  - confirmedAt (nullable timestamp)
  - ipHash (optional, salted hash for abuse monitoring)
→ (Optional) Send confirmation email via Resend (once domain is verified)
→ UI shows success; on email click, user hits `/confirm?token=...`

Confirm flow (`/confirm`)  
→ Validate token (signature/random lookup), check TTL  
→ If valid: set `confirmedAt = now`, clear token/expiry  
→ Redirect to `/success` with confirmed state and friendly copy  
→ If expired/invalid: render helpful error + link to request re-send

---

## 3) API Contracts

POST `app/api/waitlist/route.ts`  
- Request JSON:
  - email: string (required)
  - locale: string (optional, defaults from headers)
  - utm: object (optional: source, medium, campaign, term, content)
  - captchaToken: string (required)
- Success (201):
  - `{ status: "ok", code: "CREATED", id?: "<docId>" }`
- Errors:
  - 400 `{ status: "error", code: "INPUT_INVALID", issues: [...] }`
  - 400 `{ status: "error", code: "CAPTCHA_FAILED" }`
  - 409 `{ status: "error", code: "ALREADY_EXISTS" }` (optional if dedup by email)
  - 500 `{ status: "error", code: "INTERNAL_ERROR" }`

GET `/confirm?token=...` (Server Component)  
- Success: marks confirmed and renders success UX  
- Failure: shows expired/invalid copy with CTA to re-send

(If implemented) POST `app/api/resend-confirm/route.ts`  
- Request JSON: `{ email: string }`  
- Success: `{ status: "ok", code: "RESENT" }`  
- Errors: 400 `INPUT_INVALID`, 404 `NOT_FOUND`, 429 `RATE_LIMITED`

---

## 4) Firestore Structure (Admin-only)

Project: `louhen-mvp`  
Collection: `waitlist` (document ID may be random or email-hash)

Document fields:
- email: string
- locale: string
- utm: { source?, medium?, campaign?, term?, content? }
- createdAt: Timestamp (server)
- confirmToken: string (opaque) or null (after confirmation)
- confirmExpiresAt: Timestamp
- confirmedAt: Timestamp or null
- ipHash: string (optional; salted)
- metadata: { userAgent?, referrer? } (optional)

Indexes: not required for simple writes/reads; add if querying on `email` or `confirmedAt`.

Security rules: not applicable here (Admin SDK only), but keep the project’s rules clean and least-privileged for other clients.

---

## 5) Environment & Configuration (Vercel)

Required env vars (all set in Vercel):
- FIREBASE_ADMIN_SA_B64 (base64 of Service Account JSON)
- FIREBASE_PROJECT_ID
- FIREBASE_DB_REGION
- NEXT_PUBLIC_HCAPTCHA_SITE_KEY
- HCAPTCHA_SECRET
- RESEND_API_KEY
- RESEND_FROM
- RESEND_REPLY_TO
- APP_BASE_URL (e.g., `https://louhen-landing.vercel.app`)
- WAITLIST_CONFIRM_TTL_DAYS (e.g., `7`)

Fail fast on missing envs with clear server-side error logs (no secrets echoed).

---

## 6) Security Model

- No client-side secrets. All privileged operations happen in API routes or Server Components.
- hCaptcha server verification mandatory on public forms.
- Minimal PII stored: email (lowercased), locale, UTM, timestamps. No names/addresses.
- Logging: redact emails (`ma***@example.com`), never log tokens or raw headers containing PII.
- Optional rate limiting on resend/submit endpoints (IP hash + short window).
- Token TTL enforced via centralized helper (e.g., `lib/waitlistConfirmTtl.ts`).

---

## 7) Observability & Logging

- Use structured console logs on server with event codes, e.g.:
  - `WAITLIST_CREATE_OK`, `WAITLIST_CREATE_FAIL_INPUT`, `WAITLIST_CREATE_FAIL_CAPTCHA`, `CONFIRM_OK`, `CONFIRM_EXPIRED`
- Redact sensitive fields; attach a short `reqId` for correlation.
- Consider Sentry (optional) for production error alerts; if added, scrub PII tags.

---

## 8) Performance & Accessibility

- Image assets with width/height or `sizes` to prevent CLS; use `next/image`.
- Keep JS light on `/`; avoid client-side heavy libs.
- Target Lighthouse (on `/`):
  - Performance ≥ 90
  - Accessibility ≥ 95
  - SEO ≥ 95
  - Best Practices ≥ 95
- Form elements fully labeled; keyboard navigation first-class.

---

## 9) Internationalization (next-intl)

- No hardcoded user-visible copy. Use message catalogs.
- Language detection: accept-language and explicit locale; keep simple until Locize/DeepL is wired.
- Keep keys stable and human-readable.

---

## 10) CI/CD

GitHub Actions:
- Job: build & verify
  - `npm ci`
  - `npm run lint`
  - `npm run build`
  - `npx playwright test`
  - Lighthouse run; upload artifacts (Playwright HTML, Lighthouse report, `.next` traces)
- Job: release (on push to `main`)
  - `npx semantic-release --debug` (updates GitHub Release + CHANGELOG)

Branching:
- `main` (stable)  
- `next` / `beta` if needed for pre-releases (already configured in `.releaserc.json`)

---

## 11) Error Codes (canonical)

- INPUT_INVALID — Zod validation failed
- CAPTCHA_FAILED — hCaptcha verification failed
- ALREADY_EXISTS — email already in waitlist (optional behavior)
- TOKEN_INVALID — confirm token not found or malformed
- TOKEN_EXPIRED — confirm token past `confirmExpiresAt`
- INTERNAL_ERROR — unexpected server error

UI should map these to friendly messages; server logs should include the code for grepability.

---

## 12) Future Extensions (scoped and optional)

- Add Edge Middleware for lightweight bot heuristics.
- Add KV/Upstash for per-IP rate limiting on submit/resend.
- Add Sentry with PII scrubbing and environment tagging.
- Hook Resend templates for branded confirmation emails (DKIM/SPF complete).
- Add basic analytics events (privacy-safe) for conversion funnels.

---

## 13) Architectural Constraints

- Keep API handlers tiny; delegate logic to `lib/` functions (testable, composable).
- Do not couple UI components to Firestore/Admin SDK.
- No drive-by refactors; minimal diffs and stable interfaces.
- Document non-obvious trade-offs here when they become policy.

---