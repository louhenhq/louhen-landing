# Coding Conventions — Louhen Landing

These rules keep the codebase consistent, fast, and safe. If you must deviate, document why in the PR description and update this file if the exception becomes a rule.

---

## 1) Language, Tooling, Formatting

- TypeScript in strict mode. Prefer explicit types on exported functions/components.
- ESLint + Prettier are the source of truth. Do not hand-format code.
- No unused exports, avoid `any` unless justified (prefer `unknown` + refinement).
- Import order: node core → third-party → internal aliases.
- Default exports: allowed for React components; utilities prefer named exports.

---

## 2) Folder Layout (App Router)

    app/                       # Route groups, pages, API routes
      (public)/...             # Public-facing routes
      api/<name>/route.ts      # API endpoints (server only)
    components/                # Pure UI components (no data fetch)
    lib/                       # Shared logic (no React), server/client-safe by file
      validators/              # Zod schemas
      firestore.ts             # Admin helpers (server only)
      verifyCaptcha.ts         # hCaptcha server check
    styles/                    # Tailwind setup (globals.css, etc.)
    tests/                     # Playwright + any unit tests
    .github/                   # CI and templates
    CONTEXT/                   # Repo operating rules (this folder)

Rules:
- UI components must not do server work (no Admin SDK). Perform side effects in Server Components or API routes.
- Keep files small and focused. Prefer feature folders over mega files.

---

## 3) Patterns & Contracts

- Validation: All API inputs validated with Zod (`lib/validators/...`). Return typed errors `{ code, message }`.
- Side-effects: Centralize Firestore Admin writes in `lib/firestore.ts` (server-only). Never call Admin from client code.
- Error handling:
  - Catch and map to clear HTTP status + JSON code (e.g., `CAPTCHA_FAILED`, `INPUT_INVALID`).
  - Never leak secrets or PII in error messages.
- Logging: Minimal server logs; redact emails (e.g., `ma***@example.com`). Use stable error codes for grepability.
- Utilities: Pure functions in `lib/`. No React in `lib/`.

---

## 4) Security & Privacy (GDPR-first)

- No client-side secrets. Admin credentials and `HCAPTCHA_SECRET` live server-side only.
- Minimize PII; store only what’s required (email, locale, UTM, timestamps).
- Don’t log full emails or tokens. Redact and hash where appropriate.
- Rate-limit public endpoints if abuse appears (simple in-memory or Edge approach acceptable).

---

## 5) Accessibility & Performance

- Semantic HTML, labelled inputs, keyboard navigation works.
- Images: include `alt`, width/height (or `sizes`) to prevent CLS.
- Tailwind: prefer design tokens / CSS vars; keep custom CSS minimal.
- Lighthouse targets on `/`: Performance ≥ 90, Accessibility ≥ 95, SEO ≥ 95, Best Practices ≥ 95.

---

## 6) Styling (Tailwind)

- Use utility classes over custom CSS; extract to components when patterns repeat.
- Colours must come from design tokens: use CSS variables/Tailwind utilities on web and the generated `emailColors` palette in emails. `npm run guard:hex` enforces this; violations should never merge.
- The generated palette at `lib/email/colors.ts` is exempt (ESLint override + guard allowlist) because it is produced by the token build. Do not add further exceptions without design/engineering approval.
- Avoid deep nesting; prefer composition via components.

---

## 7) i18n (next-intl)

- Never hardcode user-visible copy. Use message keys; keep keys stable.
- Strings should be short, neutral, and translatable. Avoid concatenation that breaks grammar.
- Prepare messages for future Locize/DeepL pipelines (no complex inline HTML in translations unless necessary).

---

## 8) API Routes

- Location: `app/api/<name>/route.ts` using Web Request/Response.
- Flow: parse → validate (Zod) → verify security (e.g., hCaptcha) → perform action → return JSON.
- Error JSON includes `{ code, message }`; message is safe, code is stable.
- Tests must cover at least: valid request, invalid input, captcha fail.

---

## 9) Testing

- Playwright for E2E: happy path + at least one negative path per critical form.
- Add unit tests for Zod validators as logic grows.
- Keep tests deterministic; mock network where needed.

Local/CI validation commands:
    npm ci
    npm run lint
    npm run build
    npx playwright test
    # optional: npm run lhci

---

## 10) Commits & PRs

- Conventional Commits (semantic-release):
  - feat(waitlist): …
  - fix(ci): …
  - chore(deps): …
  - docs(context): …
  - refactor(i18n): …
  - test(playwright): …
- One logical change per PR, minimal diff, include screenshots for UI changes.

PR must include:
- VALIDATE commands, a short Manual QA checklist, and a REVERT snippet.
- Assumptions and risk areas called out explicitly.

---

## 11) Dependencies

- No new deps without a brief justification (why, footprint, alternatives).
- Prefer small, well-maintained libs. Avoid kitchen-sink packages.
- Keep devDependencies lean; remove unused packages.

---

## 12) Environment Variables (Vercel)

Required:
- FIREBASE_ADMIN_SA_B64, FIREBASE_PROJECT_ID, FIREBASE_DB_REGION
- NEXT_PUBLIC_HCAPTCHA_SITE_KEY, HCAPTCHA_SECRET
- RESEND_API_KEY, RESEND_FROM, RESEND_REPLY_TO
- APP_BASE_URL, WAITLIST_CONFIRM_TTL_DAYS

Guard missing envs at runtime with explicit errors (fail fast with friendly messages).

---

## 13) CI/CD

- Build → lint → tests (Playwright) → Lighthouse. Upload artifacts on every PR.
- Merges to `main` trigger semantic-release to tag and update CHANGELOG.
- Keep CI noise low; fast-fail on critical errors.

---

## 14) Housekeeping

- Delete dead code and unused files promptly.
- Prefer clear names over comments; comment only when intent isn’t obvious.
- Document any new conventions here; this file is the living standard.
