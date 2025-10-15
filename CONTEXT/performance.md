# Performance & Lighthouse Budgets — Louhen Landing

The marketing site must stay fast, stable, and accessible across locales and environments. These budgets are enforced via CI Lighthouse runs (see [/CONTEXT/decision_log.md](decision_log.md) and [/CONTEXT/architecture.md](architecture.md)).

## Target Pages & Metrics

| Route | Why we measure it | Lighthouse thresholds (P/A/SEO/BP) | Notes |
| --- | --- | --- | --- |
| `/` (default locale) | Primary marketing & waitlist funnel | 90 / 95 / 95 / 95 | Run on every PR/merge. |
| `/[locale]/` | Locale-specific hero & consent copy | 90 / 95 / 95 / 95 | Rotate locale under test weekly. |
| `/[locale]/legal/privacy` | High-content page, hreflang critical | 85 / 95 / 95 / 95 | Ensures structured data & noindex alignment. |
| `/de-de/method` | Rich media and JSON-LD heavy | 88 / 95 / 95 / 95 | Watch CLS when campaigns change. |
| `/status` | Auth-gated diagnostics | n/a / 95 / 95 / 95 | Performance uncapped; focus on security headers. |

Budgets tighten post-launch; update this table as new routes ship. When a page is below target, treat the regression as a release blocker.

## Tooling & Artifacts
- CI runs `npm run lhci` (Lighthouse CI). Artifacts live under `ci-artifacts/lighthouse/` and are uploaded per PR.
- Use `npm run analyze` locally when dependency or UI changes risk bundle bloat.
- Keep `@next/font` usage behind the `NEXT_USE_REMOTE_FONTS` toggle (default `false` → self-hosted). When enabling remote fonts for experiments, document the change in `/CONTEXT/envs.md` and verify CLS remains within budget.
- Tailwind consumes generated tokens (`packages/design-tokens/`). Regenerate via `npm run -w @louhen/design-tokens build` when tokens change.

## Performance Guardrails
- **JavaScript:** incremental bundles for header/drawer/consent ≤12 KB gzip per feature slice.
- **CSS:** prefer Tailwind utilities; avoid route-specific global CSS unless justified.
- **Tokens CSS:** `app/styles/tokens.css` must be imported once at the root. Do not re-import or lazy-load token bundles from feature modules, and theme switches (`data-theme`, `data-contrast`) must reuse the already-loaded CSS variables.
- **Images:** serve via Next Image or optimized static assets in `public/`. Preload hero images only when they are above the fold across locales.
- **CSP & Nonce:** inline scripts (ThemeInit, JSON-LD) must stay <1 KB and reuse the SSR nonce (`/CONTEXT/security.md`).
- **Analytics:** consent-gated scripts must lazy load when consent flips; no eager third-party fetches before consent.

## Review Checklist
- Add a `Performance Impact` note to PRs touching layout, fonts, analytics, or large dependencies.
- Run Lighthouse locally (`npm run lhci -- collect --url http://localhost:3000`) before approving big UI changes.
- For regressions >5% in any metric, open an issue and attach the artifact diff.
- Confirm any structural changes place components/utilities in directories defined by [/CONTEXT/naming.md](naming.md); update [/CONTEXT/rename_map.md](rename_map.md) if new assets require budget tracking.
- Temporary budget waivers require the `perf-waiver` label and an accompanying entry in `/CONTEXT/decision_log.md` with owner + expiry.
