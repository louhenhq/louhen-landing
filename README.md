[![CI](https://github.com/Martin/louhen-landing/actions/workflows/ci.yml/badge.svg)](https://github.com/Martin/louhen-landing/actions/workflows/ci.yml)

See [BADGES.md](BADGES.md) for full project status and quality metrics.

# Louhen Landing

Louhen Landing is the official marketing site for Louhen, designed to provide a seamless user experience and showcase our brand. This project leverages modern web technologies to deliver fast, accessible, and maintainable content.

## Tech Stack

- **Framework:** Next.js (App Router)
- **Styling:** CSS Modules, Style Dictionary for design tokens
- **Fonts:** Custom font optimization using `next/font`
- **State Management & Analytics:** Custom client-side analytics with consent management
- **Backend Integrations:** Firebase, Resend, hCaptcha for waitlist and user engagement

## Design System Snapshot

- Louhen Landing design is **locked** as of 2025-10-01; see [`CONTEXT/decision_log.md`](CONTEXT/decision_log.md#louhen-landing--design-system-locked-2025-10-01) and [`CONTEXT/design_system.md`](CONTEXT/design_system.md) for the canonical source of truth.
- All color/spacing/radius/shadow values come from `@louhen/design-tokens`; use the semantic utilities (`bg-bg`, `text-text`, `border-border`, `spacing.*`) instead of bespoke values.
- The `scripts/guard-hex.mjs` pre-commit hook blocks raw hex codes—route palette updates through the tokens package and re-run `npm run build --workspace @louhen/design-tokens`.
- Honor accessibility, dark-mode, i18n, and reduced-motion guardrails outlined in Slice plans and the PR checklist.
- Run existing validation commands—`npm run lint`, `npm run validate:local`, `npm run lighthouse`, etc.—to confirm design integrity before merging.

## Adding a locale

> Current production locales: `/en-de/*` (default, English content for the German market) and `/de-de/*` (German copy). Short segments (`/en`, `/de`) are auto-redirected to the canonical variant, and loopback hosts bypass HTTPS/HSTS to keep automation green.

1. Register the locale in `lib/i18n/locales.ts` with its BCP-47 code, native label, region, and `hrefLang` (use lowercase `language-region`).
2. Add the translation bundle under `messages/{locale}.json` and fill any route-specific namespaces (`i18n/{language}/**` for waitlist flows). Use placeholder markers (`[FR]`) until copy is confirmed.
3. Run `npm run i18n:check` to ensure required keys exist and keep EN/DE parity for locked slices.
4. Validate copy length at 320px viewport—hero H1/H2 must stay within two lines; adjust strings or token clamps if necessary.
5. Confirm sitemap/hreflang output includes the new locale (helpers read `SUPPORTED_LOCALES`) and update docs/QA notes if any locale-specific exceptions apply.
6. Update product/support teams about cookie precedence: the `louhen_locale` cookie wins over `Accept-Language`; document launch timing before enabling indexing.

## Performance & accessibility budgets

- **Targets**: CLS ≤ 0.05, LCP ≤ 2.5s (mobile 3G/4× CPU), Lighthouse mobile scores ≥90 Performance / 100 Accessibility / ≥95 SEO / ≥90 Best Practices.
- **Automation**: `npm run validate:local` builds the app, runs unit + Playwright + axe suites, and produces Lighthouse/Playwright artifacts (stored in `lighthouse-report/` and `playwright-report/`). Attach them to PRs that touch landing flows.
- **Animation hygiene**: All smooth scrolling and entrance animations must respect `prefers-reduced-motion`. Use `behavior: 'auto'` fallbacks, keep focus rings visible, and avoid new JS-driven animation on the critical path.
- **Media**: Size all hero/section media explicitly (`next/image` or width/height), lazy-load non-critical assets, and keep Lottie/JSON payloads under 150 KB (defer + disable for reduced motion).
- **Tooling**: Lighthouse assertions live in `lighthouserc.cjs`; do not relax thresholds. Update that file (and this README) if budgets change via the governance process.
- Variable fonts (Inter + Fraunces) are bundled in `public/fonts`; `npm run build` runs `scripts/check-fonts.mjs` to ensure they are present.

## Trust copy usage

- Centralise reassurance strings under `trustCopy.*` (fit guarantee, GDPR, payment security, LouhenFit coverage). Do not hardcode them in components.
- Hero, waitlist, privacy ribbon, confirmation/success views, and future checkout/returns flows must read from those keys. Mention Adyen for payment security.
- Keep tone calm, parent-friendly, and transparent; limit to ≤2 lines at 320 px. Use semantic tokens and existing text utilities (`text-meta`, `text-body-sm`).
- Coverage messaging should call out whether a profile is covered by LouhenFit (use named variants when a child name is available).

### Using the type scale
- `text-display-xl` powers hero H1s (Fraunces 700, clamp with `opsz` 48); keep hero wrappers around `max-w-3xl` so EN/DE copy sits on 1–2 lines.
- `text-display-lg` is the section H2 / method hero size; `text-h3` covers card and inline headings.
- `text-body` is default paragraph copy; `text-body-sm` is for helper text, secondary labels, and captions.
- `text-label` is the only interactive text size (≥16px) for buttons, nav, inputs; `text-meta` handles eyebrows/meta with uppercase tracking.
- All typography must use these utilities—no `text-[N]`, inline `font-family`, or font-weight/size animations.

### UI primitives quick-start
- Import Button/Input/Card from `@/components/ui` and lean on their variants instead of bespoke classes; the primitives already handle tokenized colors, elevation, and focus rings.
- **Button** variants: `primary` (brand fill), `secondary` (outline), `ghost` (chromeless), `destructive` (error). Sizes: `sm` (labels at `text-body-sm`), `md` (default CTA), `lg` (hero CTAs). Pass `loading` to lock interactions and expose `aria-busy`.
- **Input** accepts `invalid` to swap into feedback styling and pipes `aria-invalid` automatically. Always pair with a `<label>` and point `aria-describedby` at helper/error copy.
- **Checkbox** ships with a large hit-area, focus ring, and checked styling tied to brand tokens. Wrap with a `<label>` via `htmlFor` so the accompanying text remains clickable.
- **Card** variants: `surface`, `outline`, `ghost`; set `interactive` (or render as `button`/`a`) for subtle hover lift that respects `prefers-reduced-motion`.

### Theme & toggle
- The `<html>` element owns `data-theme` / `data-theme-mode`; dark theme activates through `[data-theme="dark"]` with semantic tokens swapped in `globals.css`.
- Preferences persist via the `lh_theme` cookie (180d TTL) and initialise pre-hydration to avoid flashes; “System” defers to `prefers-color-scheme` on every load.
- `ThemeToggle` (in the header) cycles System → Light → Dark; call `setTheme` in client code for bespoke flows.

### Using the layout shell
- Wrap landing pages in the `SiteShell` component; pass the sticky `Header`, `Footer`, and `layout.skipToMain` copy so skip links always work.
- Containers come from `layout.container`/`layout.grid`; never hand-roll `max-w` or gutter spacing. Section padding comes from `layout.section` (80–120px clamp).
- Keep hero, story, trust, and waitlist blocks on the 12-column grid—use column spans like `md:col-span-7` instead of bespoke margins.
- Header stays translucent with shadow on scroll; footer uses the trust copy + legal links in the README/CONTEXT spec. Adjustments must preserve AA contrast and focus-visible rings.
- Anchor targets (`#how`, `#story`, `#waitlist`, `#faq`) should land on elements with our shell helpers so the sticky nav never obscures content.

### Hero usage
- `Hero.tsx` locks the text/media split, CTA stack, and LouhenFit micro-trust line—follow [`CONTEXT/design_system.md#hero`](CONTEXT/design_system.md#hero) before adjusting layout or copy.
- Keep the media container’s aspect ratio and reduced-motion guardrails intact so LCP/CLS stay stable; swap in the Lottie once it meets the <=150KB budget.

### Trust Bar usage
- `components/TrustBar.tsx` anchors reassurance directly under the hero using the 12-col shell—do not duplicate it elsewhere on the landing route.
- Tiles stay neutral (`bg-bg-card`, `border-border`, monochrome line icons) and map to the four locked claims; extend copy/modals via [`CONTEXT/design_system.md#trust-bar`](CONTEXT/design_system.md#trust-bar).

### How-it-Works usage
- `components/HowItWorks.tsx` delivers the three-step scan → match → happy feet story with illustration placeholders. Follow [`CONTEXT/design_system.md#how-it-works`](CONTEXT/design_system.md#how-it-works) for card anatomy, motion, and copy limits.
- Deep links inside each step should route to the Method page anchors using locale-aware paths (e.g., `/${locale}/method#engine`).

### Waitlist CTA usage
- `components/waitlist/WaitlistForm.tsx` powers the landing CTA and adapts to embedded contexts—wrap it in a 12-col grid with reassurance cards per [`CONTEXT/design_system.md#waitlist-cta`](CONTEXT/design_system.md#waitlist-cta).
- Keep the email → consent → hCaptcha → submit order intact, surface error summaries on submit, and let the success panel focus itself while offering resend guidance.

## Local Development

To get started locally:

1. Clone the repository.
2. Install dependencies:
   ```bash
   npm install
   ```
3. Configure environment variables as per `.env.example`, including:
   - `NEXT_PUBLIC_HCAPTCHA_SITE_KEY`
   - `HCAPTCHA_SECRET`
   - `APP_BASE_URL`
   - `STATUS_USER`, `STATUS_PASS` (Basic Auth for the internal /status diagnostics)
   - `RESEND_API_KEY`, `RESEND_FROM`, `RESEND_REPLY_TO`
   - `FIREBASE_ADMIN_SA_B64`
   - `FIREBASE_PROJECT_ID`, `FIREBASE_DB_REGION`
   - `VERCEL_GIT_COMMIT_SHA` (provided by Vercel; set `COMMIT_SHA` manually if unavailable)
   - `WAITLIST_CONFIRM_TTL_DAYS` (optional)
4. Run the development server:
   ```bash
   npm run dev
   ```
5. Open [http://localhost:3000](http://localhost:3000) in your browser.

> Tokens for design system are automatically built after install and before site builds.

## Quickstart: Waitlist + Env

**TL;DR**
1. `cp .env.example .env.local` and fill in dev-safe placeholders.  
2. Convert your Firebase dev service account JSON to Base64 and set `FIREBASE_ADMIN_SA_B64`.  
3. Drop in the Resend dev API key and keep `RESEND_FROM` / `RESEND_REPLY_TO` on louhen.app.  
4. Use hCaptcha universal test keys (`10000000-ffff-ffff-ffff-000000000001` / `0x000…000`).  
5. `npm run lint && npm run build && npm run dev` to boot the stack.  
6. Visit `/status`, authenticate with `STATUS_USER` / `STATUS_PASS` from `.env.local`, and expect `emailTransport=false` in dev while noop mode is active.
<<<<<<< HEAD
7. Rate limiting defaults to 10 submissions/hour/IP and 3 resends/30m/email; override with `WAITLIST_RATE_SUBMITS_PER_HOUR_PER_IP` and `WAITLIST_RATE_RESENDS_PER_30M_PER_EMAIL` if you need different local caps.
8. After confirming an email, `/waitlist/pre-onboarding` is available for the optional family profile step. The confirmation flow drops a short-lived session cookie so drafts persist without exposing the email address.
=======
>>>>>>> f7d7592 (Waitlist env split: build uses NEXT_PUBLIC only (#2))

**Waitlist slice plan:** Slice 1 delivers UI scaffolding, Slice 2 adds API + validation, Slice 3 wires email + confirmation, Slice 5 layers pre-onboarding incentives, and Slice 6 locks in automated tests and quality gates.

**Preview vs Production:** Preview lives on `https://staging.louhen.app`, runs `WAITLIST_CONFIRM_TTL_DAYS=1`, and ships with `noindex`. Production promotes to `https://www.louhen.app` with the canonical TTL of 7 days; the apex `https://louhen.app` permanently redirects to the www host.

**Docs to bookmark:**
- [`/CONTEXT/email.md`](CONTEXT/email.md) — Resend runbook and DNS requirements.  
- [`/CONTEXT/envs.md`](CONTEXT/envs.md) — up-to-date environment matrix.  
- [`/CONTEXT/status-monitoring.md`](CONTEXT/status-monitoring.md) — /api/status protection + monitor.  

## Waitlist: env & local testing

1. Copy `.env.example` to `.env.local` and replace placeholders with local credentials or sandbox values.  
2. Run without a `RESEND_API_KEY` locally to stay in Resend sandbox mode (emails log to stdout via the noop transport).  
3. Generate hCaptcha developer keys for local testing; production keys should only live in Vercel secrets.  
4. `WAITLIST_CONFIRM_TTL_DAYS` defaults to 7 — shorten it in preview environments to exercise expiry flows faster.

### Status endpoint

- `/api/status` returns JSON fields: `noncePresent`, `emailTransport`, `emailTransportMode`, `suppressionsCount`, and `env` (with deploy metadata).  
- `emailTransport=false` is expected in development/preview when Resend credentials are not set, and `emailTransportMode` will read `noop`.  
- In production the endpoint must report `emailTransport=true` once Resend is wired, otherwise the env guard will fail before deployment.

## QA Targets

- Ensure waitlist form functions correctly with and without hCaptcha keys.
- Validate analytics events respect user consent and are dispatched properly.
- Confirm environment variables are correctly loaded and used.
- Verify design tokens are up to date and applied consistently.
- Test deployment pipelines and CI workflows for reliability.
### QA automation quickstart

Run the automated checks locally before pushing changes:

```bash
# axe a11y sweep across waitlist routes
npm run test:axe

# Playwright regression covering happy/expired/resend/pre-onboarding flows
npx playwright test tests/e2e/waitlist.flow.spec.ts

# Lighthouse budget guard (waitlist route must stay ≥90 across categories)
npm run lighthouse
```

`npm run lighthouse` expects a production server to be listening on `http://localhost:4311`.
Start it in another terminal with `PORT=4311 NODE_ENV=production npx next start -p 4311` and
then run the command above. The helper script waits until the chosen URL responds with `200`
before launching LHCI. By default it targets `http://localhost:4311/en-de/method`; override the
target with `LHCI_URL=http://localhost:4311/de-de/method npm run lighthouse` when you need the
alternate locale. Routing runs with `localePrefix = "always"`, so `/en-de/*` remains the canonical
segment even for the default locale. Middleware bypasses HTTPS/HSTS enforcement on loopback hosts,
so there are no Chrome interstitials during local audits. The script sets `LH_ALLOW_INDEX=true`
for its child process so preview-era `noindex` directives are lifted (middleware + robots.txt allow
crawling), and it exercises Lighthouse in a desktop profile with provided throttling for repeatable
local scores.
When robots.txt is requested locally, it derives the sitemap URL from the incoming protocol/host
headers (falling back to `BASE_URL` or `http://localhost:4311`), so Lighthouse sees
`http://localhost:4311/sitemap.xml` while remote environments produce the correct absolute origin.

#### Playwright run modes
- **Local webServer mode** (default): in one terminal run `npm run serve:prod` (the script first frees port 4311 via `kill -9 $(lsof -tiTCP:4311)` on macOS, then launches `next start`). With `BASE_URL` unset, run `npm run test:e2e` and Playwright will boot the local server for you when needed.
- **External target mode**: when the environment cannot bind to port 4311, point Playwright at an already-running deployment with `BASE_URL=http://localhost:4311/en-de/ npm run test:e2e:external`. Any fully-qualified origin works (preview URLs, staging hosts, etc.) as long as it already serves the `/en-de/*` routes.

For manual local smoke testing you can still hit `npm run serve:prod` directly; the kill-and-restart line keeps the experience idempotent.

### Local validation (single command)

Prefer a one-and-done run? Use the bundled validator:

```bash
npm run validate:local
```

It builds the production bundle, boots `start:test` on `localhost:4311` with
`TEST_MODE=1`, waits for `/waitlist`, runs unit + Playwright + axe + Lighthouse suites, then tears
the server down even if something fails. If the server cannot bind (port already in use) or the
readiness check times out, stop any existing Next.js process and retry.

### Sandbox validation (staging)

Need to validate from a sandbox or remote environment where ports are locked down? Target staging instead:

```bash
npm run validate:sandbox
```

This command sets `SANDBOX_VALIDATION=1` and `PREVIEW_BASE_URL=https://staging.louhen.app`, disables analytics, and runs lint, i18n parity, Playwright (smoke + accessibility), and Lighthouse directly against the preview deployment. No local Next.js server is started.

Use `validate:local` during normal development; reserve `validate:sandbox` for Codex or other non-loopback environments.

Need to point at a different preview? Override the default with `PREVIEW_BASE_URL=https://my-preview.example`.

### Reviewer checklist
- [ ] Playwright supports BASE_URL external mode (no webServer spawn when set).
- [ ] Local mode passes: serve:prod + test:e2e green.
- [ ] Lighthouse runs on /en-de/method (or LHCI_URL override), no interstitials.
- [ ] Docs updated for the two modes and port-free one-liner.
- [ ] E2E tests and SEO/unit specs assume full-locale prefixes only.
- [ ] Fonts load from /fonts/** only; no Google Fonts requests.

### CI on demand

- GitHub UI: Actions → **Run Tests** → choose `unit`, `e2e`, `axe`, `lighthouse`, or `all`.
- CLI: `gh workflow run run-tests.yml -f suites=all`

Each CI job follows the same loopback flow (install with dev deps → build → start local server →
wait for readiness → run suite → upload artifacts). Optional inputs `skipE2E`, `skipAxe`, and
`skipLHCI` let you bypass individual suites when debugging infrastructure issues.

### PR slash commands

Maintainers and organization members can trigger suites directly from a pull-request comment:

```
/test all
/test unit
/test e2e
/test axe
/test lhci
```

The bot dispatches the same workflow_dispatch run and posts results back to the PR once complete.

## End-to-End Testing Modes

- **Local mode**: Run `npx playwright test` without `E2E_BASE_URL`; Playwright binds to the local dev server on loopback.
- **Remote mode**: Export `E2E_BASE_URL=https://staging.louhen.app` so tests hit the staging branch deployment. If Deployment Protection is enabled, also set `VERCEL_AUTOMATION_BYPASS_SECRET` and include the header below.

### cURL sanity check

```bash
curl -H "x-vercel-protection-bypass: $VERCEL_AUTOMATION_BYPASS_SECRET" \
  "$E2E_BASE_URL/status"
```

### Playwright auth header snippet

```ts
import { test as base } from '@playwright/test';

const test = base.extend({
  context: async ({ browser }, use) => {
    const headers = process.env.VERCEL_AUTOMATION_BYPASS_SECRET
      ? { 'x-vercel-protection-bypass': process.env.VERCEL_AUTOMATION_BYPASS_SECRET }
      : {};

    const context = await browser.newContext({
      baseURL: process.env.E2E_BASE_URL || 'http://127.0.0.1:3000',
      extraHTTPHeaders: headers,
    });
    await use(context);
    await context.close();
  },
});

export { test };
```

## End-to-End Testing Modes

- **Local mode**: Run `npx playwright test` without `E2E_BASE_URL`; Playwright binds to the local dev server on loopback.
- **Remote mode**: Export `E2E_BASE_URL=https://staging.louhen.app` so tests hit the staging branch deployment. If Deployment Protection is enabled, also set `VERCEL_AUTOMATION_BYPASS_SECRET` and include the header below.

### cURL sanity check

```bash
curl -H "x-vercel-protection-bypass: $VERCEL_AUTOMATION_BYPASS_SECRET" \
  "$E2E_BASE_URL/status"
```

### Playwright auth header snippet

```ts
import { test as base } from '@playwright/test';

const test = base.extend({
  context: async ({ browser }, use) => {
    const headers = process.env.VERCEL_AUTOMATION_BYPASS_SECRET
      ? { 'x-vercel-protection-bypass': process.env.VERCEL_AUTOMATION_BYPASS_SECRET }
      : {};

    const context = await browser.newContext({
      baseURL: process.env.E2E_BASE_URL || 'http://127.0.0.1:3000',
      extraHTTPHeaders: headers,
    });
    await use(context);
    await context.close();
  },
});

export { test };
```

## License

This project and its contents are proprietary and confidential. Unauthorized use, distribution, or reproduction is strictly prohibited. For licensing inquiries, please contact the Louhen team. See [NOTICE.md](NOTICE.md) for attributions of third-party dependencies and services used in this project.
