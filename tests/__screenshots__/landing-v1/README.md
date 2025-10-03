# Landing v1 baseline screenshots

Baseline screenshots for key landing sections (hero, trust bar, how-it-works, waitlist CTA, footer, method hero) live in this directory.

Generate or refresh baselines with:

```
npm run build:test
npx playwright test tests/e2e/landing.screenshots.spec.ts --project=chromium --update-snapshots
```

The Playwright test `tests/e2e/landing.screenshots.spec.ts` compares new runs against these files during `npm run validate:local`.
