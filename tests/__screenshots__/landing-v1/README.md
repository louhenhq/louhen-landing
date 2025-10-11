# Landing v1 baseline screenshots

Baseline screenshots for key landing sections (hero, trust bar, how-it-works, waitlist CTA, footer, method hero) live in this directory.

Generate or refresh baselines with:

```
npm run build:test
npx playwright test tests/e2e/landing.screenshots.spec.ts --project=chromium --update-snapshots
```

If the middleware or locale prefix changes (for example, adjusting the canonical test path for `/de-de/*` or the alternate locales), refresh these baselines after capturing the new localized URLs.

The Playwright test `tests/e2e/landing.screenshots.spec.ts` compares new runs against these files during `npm run validate:local`.
