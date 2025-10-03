# Decision Log — Louhen Landing

This file tracks **locked decisions** (do not change without explicit proposal) and the **history of changes**.  
It ensures Codex and contributors never undo critical choices or repeat past discussions.

---

## Locked Decisions

- **Framework**: Next.js App Router with TypeScript + Tailwind.  
- **Hosting**: Vercel.  
- **Data writes**: Firebase Admin SDK (server-side only).  
- **Form security**: hCaptcha required on public submissions.  
- **Emails**: Resend for transactional flows (after domain verification).  
- **Release management**: semantic-release with Conventional Commits.  
- **Testing**: Playwright E2E + Lighthouse CI.  
- **Payments**: Adyen is company-wide provider (not yet used here).  
- **i18n**: next-intl scaffolding; ready for Locize + DeepL later.  
- **Security baseline**: no client-side secrets; GDPR-first handling of PII.
- **Environment & Domains locked**: Canonical host `www.louhen.app` (production). Apex `louhen.app` issues 301 redirect to `www.louhen.app`. Preview domain `staging.louhen.app` (maps to `staging` branch). Wildcard previews `*.staging.louhen.app` CNAME to `cname.vercel-dns.com` (DNS only). Deployment Protection does not cover custom production domains without Vercel Business; mitigation is keeping production DNS dark until launch.

---

## History

- **2025-09-19**  
  Centralized parsing of `WAITLIST_CONFIRM_TTL_DAYS`; expiry deterministic across confirm + resend flows.  

- **2025-09-22**  
  CI artifacts standardized (Playwright, Lighthouse, .next traces). Release job runs `npx semantic-release --debug`.  

- **2025-09-22**  
  Added `/CONTEXT` bundle with agents.md, project_overview.md, decision_log.md, etc. Codex workflow formalized.  

---

## 2025-10-01 — Method Page Scope & Rules (LOCKED)

- Route: /[locale]/method/
- Purpose: Trust + education + conversion (waitlist).
- Content blocks: Hero, Trust Strip, Pillars (Scan/Engine/Guarantee), “See the science” disclosure (collapsed by default), How-it-works timeline (5 steps), Testimonial (1), Founder note, FAQ teaser (≥3 links), Final CTA.
- Personalisation: If user logged-in with ≥1 child profile → inject first child’s first name into hero subcopy and 1x timeline line. Fallback to generic if none.
- Mobile CTA: Sticky CTA appears after 25% scroll; respects safe-area and reduced-motion.
- Nudge: If user reaches FAQ without any prior CTA click → inline “exit/scroll” nudge (dismissible). Feature-flagged.
- Icons/visuals: Use illustrations (no stock photos); child-friendly, warm style.
- Accessibility: WCAG 2.2 AA; include skip-to-CTA link; timeline announces “Step X of 5”.
- Analytics events (names LOCKED):
  - method_hero_waitlist_click
  - method_faq_teaser_waitlist_click
  - method_sticky_waitlist_click
  - method_exit_nudge_shown
- Quality bars: Lighthouse SEO ≥95, A11y ≥90, Perf ≥90.

---

- **2025-10-01**  
  Method page v1 finalized with localized copy, analytics parity, Playwright coverage, and Lighthouse gates enforced.

---

- **2025-10-10**  
  Landing design revamp (Slices 0–12) complete. Baseline screenshots stored in `tests/__screenshots__/landing-v1/` and enforced via `npm run validate:local`. Milestone **Landing v1** locked; future marketing surface changes require a new decision entry, refreshed baselines, and design review sign-off.

---

## Louhen Landing — Design System (Locked 2025-10-01)

- **Principles**: Trust-first storytelling, visual calm, scalability for new product surfaces, and accessibility as a default constraint.  
- **Typography**: Fraunces (locked headline family, weights 600–700) replaces Recoleta to eliminate licensing friction while preserving the serif character; Inter remains the body/UI family (weights 400/500/600) with shared fallback stacks. Type utilities expose clamp-based sizes, conservative line-height targets, and letter-spacing guidance to prevent layout shift. Implementation is scheduled in [Slice 2 — Typography + Token Wiring](CONTEXT/backlog.md#slice-2-typography--token-wiring).
- **Color System**: All UI color uses semantic tokens (brand.*, neutral.*, background.*, text.*, border.*, feedback.*). Seasonal accent tokens are swappable without changing component primitives; raw hex values remain prohibited in runtime code.
- **Layout & Spacing**: Components adhere to the 12-column grid with a 1440px content max. Vertical rhythm uses the locked 4 → 64 spacing scale (0.25rem → 4rem) with tokenised gutters and paddings. Radii default to `--radii-2xl`; shadows stay in the `--shadow-card` / `--shadow-elevated` system.
- **Token Exposure**: `@louhen/design-tokens` now emits CSS variables consumed in Next.js (`/public/tokens/*.css`) and Tailwind. Legacy utility names (`slate-*`, `emerald-*`) are aliased to the new semantic tokens until admin tooling migrates.
- **Motion**: Framer Motion drives interactive states with easing presets and 200–300ms durations; hero Lottie sequences respect a 250KB zipped budget. All flows must honor `prefers-reduced-motion` with fade/opacity fallbacks and no size/weight transitions.
- **Imagery & Illustration**: Marketing art remains light, airy lifestyle photography with GDPR-compliant sourcing; illustrations stay pastel with consistent stroke weight to match Louhen app iconography.
- **Internationalization**: Layouts plan for DE-length strings and RTL mirroring; copy decks follow BCP-47 locale keys to match `next-intl` routing.
- **Dark Mode**: Dark theme ships with system-default detection plus an explicit toggle. Component tokens map 1:1 across light/dark themes, including focus and elevated surfaces.
- **Alignment with App Tokens**: Landing tokens inherit naming from the core Louhen app (`brand.primary`, `text.muted`, `border.subtle`) to maintain cross-surface consistency and simplify shared tooling.

### Impact
- Removes paid font licensing risk by locking Fraunces as the serif headline family (Google Fonts) and aligns web typography with Style Dictionary tokens shared with the app.  
- Provides a single source of truth for layout, tokens, and motion so Slices 1–13 can reference immutable decisions.  
- Delivers semantic design tokens (color/spacing/radius/shadow) as CSS variables + Tailwind utilities, eliminating hardcoded literals across the landing codebase.  
- Establishes contributor guardrails (PR checklist, README snapshot) that prevent design drift and ensure CI/lint hooks enforce the design contract.

### Risks
- Typeface swap requires thorough regression of perceived weight/kerning; confirm Fraunces preload/swap strategies stay within CLS budgets.  
- Hero Lottie and motion micro-interactions must stay within the 250KB zipped payload budget to avoid perf regressions.  
- Icon and illustration stroke inconsistencies could erode the trust-first principle; enforce shared stroke guides in design reviews.  
- Tailwind legacy aliases may mask improper usage; track residual `slate-*`/`emerald-*` utilities and migrate to explicit semantic classes during admin polish.

- **2025-10-03**  
  Slice 2 ships the locked Fraunces + Inter pairing via `--typography-font-family-display` / `--typography-font-family-sans`, adds the `text-display-xl` → `text-meta` utility scale, and replaces ad-hoc font sizing across the landing experience.

- **2025-10-04**  
  Slice 3 introduces the SiteShell (12-col grid, 1440px max), translucent sticky header with locale switcher, and accessible footer with GDPR reassurance. All landing sections now consume the shared layout helpers and section rhythm.
 
- **2025-10-07**  
  Middleware locks `localePrefix = 'always'`, passes through already-localised `/en-de/*` and `/de-de/*` requests without rewrites, and upgrades `/en`, `/de`, and bare routes to their canonical `/en-de/*` counterparts. Loopback hosts continue to bypass HTTPS/HSTS so automation never encounters Chrome interstitials. Lighthouse defaults to `http://localhost:4311/en-de/method`, waits for a `200`, and can still be overridden with `LHCI_URL` when targeting other locales.
