# Pull Request

> Please review /CONTEXT/decision_log.md before merging. Keep diffs surgical and follow PLAN -> DIFF -> VALIDATE.
> For release PRs (`staging -> production`), please use `.github/pull_request_template_release.md`.

## Summary
- What changed & why (1-2 lines):

## Checklist
- [ ] Tests updated/added follow the canonical matrix in `/CONTEXT/tests.md` (routes, locales, devices).
- [ ] No automated test makes external network requests (fixtures/mocks intercept new calls).
- [ ] New interactive UI exposes stable `data-testid` selectors.
- [ ] Lighthouse budgets unaffected or justified (attach before/after numbers if adjusted).
- [ ] `.env.example` and `/CONTEXT/envs.md` updated when new environment variables are introduced.
- [ ] Feature flags added/changed are documented in `/CONTEXT/envs.md` with owner + scope (Preview/Production).
- [ ] Components/routes use `getFlags()` (or provided helpers) instead of reading `process.env` directly.
- [ ] Tests cover new/changed flag states (or rationale documented when a single state suffices).
- [ ] **Consent**: No analytics initialised before explicit opt-in; no unexpected trackers added.
- [ ] No preconnect/preload to analytics domains before consent.
- [ ] Inline analytics init (if present) uses the SSR nonce.
- [ ] Analytics events use snake_case names with minimal payload fields.
- [ ] **CSP / Security**: Inline scripts carry the SSR nonce, security headers remain intact.
- [ ] **Email compliance**: List-Unsubscribe (mailto + one-click), Auto-Submitted, Reply-To headers confirmed.
- [ ] **Status endpoint**: `/api/status` still requires Basic Auth and returns expected keys.
- [ ] **SEO/i18n**: hreflang, canonicals, sitemap entries remain correct; preview stays `noindex`.
- [ ] **Media/OG**: `og:*` + `twitter:card` present with absolute URLs.
- [ ] **Media/OG**: OG image returns 200 (no redirect) on default + localized pages.
- [ ] **Media/OG**: Dynamic OG route sets cache headers and correct `Content-Type`.
- [ ] Preview workflow artifacts reviewed on failures (Playwright HTML, traces).
- [ ] Secret scanner (`policy-guards`) passes or the block has been resolved.

## Design System
- [ ] No raw hex/rgb/hsl values added in components.
- [ ] No arbitrary Tailwind color/shadow utilities (`bg-[...]`, `text-[...]`, `shadow-[...]`).
- [ ] Semantic utilities or token-mapped scales used for new styling.

## Validation
- Commands run (lint/build/test/e2e/lighthouse) + brief results:
- Link to latest artifacts (Playwright/Lighthouse) if applicable:
- Manual QA notes (if any):

## Risk & Rollback
- Risk level: [ ] Low [ ] Medium [ ] High  
- Rollback plan: `git revert <commit>` or re-deploy previous build.
