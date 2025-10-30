# A11y & LHCI Notes — 2025-10-30

## Updates
- Unified skip-link and landmark structure across landing, waitlist, and confirm routes; `/waitlist` now renders the marketing header/footer via `SiteShell` to preserve landmarks and tokens.
- Rebuilt consent UX: lightweight banner (`role="region" aria-label="Privacy & consent"`) with focus-managed manager dialog; banner buttons expose programmatic names and restore focus on close.
- Hardened header navigation: external links append an SR-only “opens in a new tab” hint, CTA mirrors the behavior, and logout/menu semantics remain unchanged.
- Waitlist flows: ensured resend form and share panel expose `role="status"` updates, added `aria-busy`/`aria-disabled` while submitting, and removed legacy raw color utilities in favor of semantic tokens.
- Trust modals now trap focus, support `Esc`, suppress background scroll, and return users to the invoking control.

## Critical E2E coverage (current)
- `tests/e2e/security/csp.e2e.ts` — locale-paired CSP audit that fails on console violations, missing/non-matching nonces, or inline handlers.
- `tests/e2e/security/network-policy.e2e.ts` — deterministic cross-origin probe that confirms the Playwright network guard records and blocks external navigations.
- `tests/e2e/core/consent.e2e.ts` — keyboard-first consent acceptance with cookie persistence plus SR/rel checks for new-tab links.
- `tests/e2e/core/waitlist-happy.e2e.ts` — mocked waitlist submission covering status semantics, focus landing, axe scan on success, and external link hardening.

## Validation
- `npm run lint`
- `npm run build`
- ⛔ `IS_PRELAUNCH=true npx playwright test tests/axe --project=desktop-chromium --workers=1` (blocked by sandbox in the current environment; rerun locally when available)

Manual keyboard / screen-reader sweeps on `/` and `/waitlist` still recommended post-merge.
