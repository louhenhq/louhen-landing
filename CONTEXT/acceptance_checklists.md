# Acceptance & QA Checklists — Louhen Landing

This file provides reusable checklists for PRs, validation, and QA.  
Every PR should include **VALIDATE**, **Manual QA**, and **REVERT** steps.  
Codex must always output them when implementing changes.

---

## 1) Standard PR Checklist

**VALIDATE (run locally or in CI):**
    npm ci
    npm run lint
    npm run build
    npx playwright test
    # optional if configured:
    npm run lhci

**Manual QA:**
- [ ] Load `/` → no console errors
- [ ] Submit waitlist with valid email + captcha → success UI, 200 response
- [ ] Submit invalid email → inline error shown
- [ ] Submit without captcha or with invalid captcha → friendly error, no Firestore write
- [ ] Lighthouse on `/` → Performance ≥ 90, Accessibility ≥ 95, SEO ≥ 95, Best Practices ≥ 95

**REVERT (if needed):**
    git revert <commit>
    # or for specific files:
    git checkout -- <path>

---

## 2) API Endpoint Changes

For any API route (e.g., `app/api/waitlist/route.ts`):

**VALIDATE:**
- Add/update Zod schema unit test.
- Run `npm run build` and `npx playwright test` for submission scenarios.

**Manual QA:**
- [ ] POST valid data → 201 CREATED, doc in Firestore
- [ ] POST invalid email → 400 INPUT_INVALID
- [ ] POST missing/invalid captcha → 400 CAPTCHA_FAILED
- [ ] Server logs redact email/token
- [ ] No secrets leaked in error messages

---

## 3) UI Changes

**Manual QA:**
- [ ] Keyboard navigation works (Tab order sane)
- [ ] Focus states visible for all inputs/buttons
- [ ] All images have `alt` text
- [ ] No layout shift (CLS) when images load
- [ ] Form accessible via screen reader labels

**VALIDATE:**
    npm run lint
    npm run build
    npx playwright test

---

## 4) Environment Variable Changes

**Checklist:**
- [ ] New env vars documented in `/CONTEXT/architecture.md` and `.env.example` (if present)
- [ ] Guard clause added if missing (`throw new Error("Missing ENV: ...")`)
- [ ] Verified in Vercel dashboard
- [ ] Added to secrets in GitHub Actions if required for CI

---

## 5) Dependency Changes

**Checklist:**
- [ ] Justification documented in PR (why, footprint, alternatives)
- [ ] Security and maintenance of package reviewed
- [ ] Lockfile committed
- [ ] No breaking changes to build/test pipeline

---

## 6) Error Code Additions

**Checklist:**
- [ ] New code added to `/CONTEXT/architecture.md` under Error Codes
- [ ] Mapped to a friendly UI message
- [ ] Playwright test added for at least one failing case
- [ ] Server logs show stable error code

---

## 7) Lighthouse & Accessibility Regression

For any UI-related PR:

**Manual QA:**
- [ ] Run Lighthouse locally or via CI; scores meet targets
- [ ] Axe/Playwright accessibility checks pass
- [ ] No new console warnings

---

## 8) Rollback / Recovery Plan

Every PR must include a quick way to roll back:

**Examples:**
    git revert <commit>  # safest rollback
    git checkout -- app/api/waitlist/route.ts lib/verifyCaptcha.ts

For releases:
- [ ] Semantic-release tags checked
- [ ] Previous stable release available for fast redeploy

---

*These checklists are living documents — update them when workflows or standards change.*