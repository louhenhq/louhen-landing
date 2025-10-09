# Decision Log — Louhen Landing

**Change Control (Locked)** — Decisions move from Proposed → Locked exclusively via pull requests that update this log. Any amendment to a Locked decision requires a new PR referencing the superseded entry and must restate date and owner. Last updated: 2025-10-09, Owner: Martin.

---

## Framework & Runtime (Locked)

- Next.js App Router with TypeScript and Tailwind remains the runtime baseline; no alternate framework evaluations are in scope for landing.
- Server-side writes must use the Firebase Admin SDK; client bundles stay free of admin credentials or secret material.
- hCaptcha secures all public submissions end to end.
- Resend provides transactional email once the sender domain is verified.
  Status: (Locked) — Last updated: 2025-10-09, Owner: Martin

## Hosting & Delivery (Locked)

- Hosting stays on Vercel with deployment targets mapped to staging and production projects; Cloudflare retains DNS authority for `louhen.app`.
- Canonical production host is `www.louhen.app`; apex `louhen.app` issues a permanent 301 redirect. Preview traffic uses `staging.louhen.app` plus `*.staging.louhen.app` CNAMEs.
- Web application firewall coverage will be evaluated in a later slice; keep Cloudflare WAF disabled for now.
  Status: (Locked) — Last updated: 2025-10-09, Owner: Martin

## Preview & Indexability (Locked)

- Preview deployments run with `FEATURE_PREVIEW_STRIP=true`, removing analytics scripts, hiding consent UI, and enforcing `X-Robots-Tag: noindex`.
- Preview `robots.txt` responds with `Disallow: /`; production toggles to crawlable only when launch is approved.
- Dynamic sitemap lives at `/sitemap.xml` and is disabled in preview via configuration, not code removal.
  Status: (Locked) — Last updated: 2025-10-09, Owner: Martin

## Secrets & Configuration (Locked)

- Staging and production secrets remain fully distinct; never share API keys or credentials across environments.
- Secrets rotate quarterly or immediately on signal, with rotations tracked in `CONTEXT/envs.md`.
- Environment completeness (including `APP_BASE_URL`, Resend keys, captcha keys, and preview strip flag) is validated on every release PR.
  Status: (Locked) — Last updated: 2025-10-09, Owner: Martin

## Internationalization (Locked)

- Static locale set: `en`, `de`, `fr`, `nl`, `it`, supporting the DE launch market first.
- Default locale routes render explicitly (no bare `/` or `/method`); middleware keeps locale prefixes via `localePrefix = "always"`.
- Copy is localized for a German audience; no hardcoded user-facing strings are allowed—consume namespace-based messages through `next-intl`.
  Status: (Locked) — Last updated: 2025-10-09, Owner: Martin

## Metadata & SEO (Locked)

- Open Graph and Twitter cards are generated via Vercel OG per locale, sourced from the i18n title and strapline.
- Each locale publishes canonical and `hreflang` tags; the sitemap reflects the same locale coverage dynamically.
- Preview SEO stays suppressed with `X-Robots-Tag: noindex` headers and a blocked robots.txt.
  Status: (Locked) — Last updated: 2025-10-09, Owner: Martin

## Consent & Privacy (Locked)

- Custom consent banner governs analytics; no CMP integration is planned for landing.
- Analytics only fires after explicit opt-in on production. Preview hides the banner entirely and keeps analytics disabled.
- GDPR and ISO-27001 readiness remain baseline expectations for data handling and documentation.
  Status: (Locked) — Last updated: 2025-10-09, Owner: Martin

## Security & Observability (Locked)

- Content-Security-Policy reporting endpoints stay disabled; maintain optional stubs only.
- Uptime monitoring is enforced via scheduled GitHub Action checks hitting `/status` with bypass headers where required.
- Security posture requires no client-side secrets and proactive handling of abuse signals (captcha, rate limits, logging).
  Status: (Locked) — Last updated: 2025-10-09, Owner: Martin

## Design System & Theming (Locked)

- Style Dictionary remains the single source of truth; validation must run on CI to block stray design token usage.
- Light/dark theme toggle ships functional with token parity across states.
- Design tokens map to semantic utilities only; raw hex values are prohibited outside generated assets.
  Status: (Locked) — Last updated: 2025-10-09, Owner: Martin

## CI & Quality Gates (Locked)

- Playwright E2E and Lighthouse run on PR merges to staging and production releases; results upload as artifacts.
- Accessibility, SEO, and CSP checks execute in warn mode through Phase 2 but artifacts are mandatory for every run.
- Release cadence continues via `semantic-release`, with branch protection requiring green CI before promotion.
  Status: (Locked) — Last updated: 2025-10-09, Owner: Martin

## Method Page Scope & Rules (Locked)

- Scope covers `/[locale]/method/` delivering trust, education, and waitlist conversion with locked block order: hero, trust strip, pillars (scan/engine/guarantee), “See the science” disclosure (collapsed by default), how-it-works timeline (5 steps), testimonial, founder note, FAQ teaser (≥3 links), and final CTA.
- Personalisation injects the first child's first name when present; otherwise fallback copy renders. Sticky mobile CTA appears after 25% scroll and honors reduced-motion preferences.
- Nudge logic fires an inline exit prompt if a visitor reaches FAQ without prior CTA engagement (feature-flagged).
- Analytics events: `method_hero_waitlist_click`, `method_faq_teaser_waitlist_click`, `method_sticky_waitlist_click`, `method_exit_nudge_shown`; Lighthouse targets stay ≥90 Performance, ≥90 Accessibility, ≥95 SEO.
  Status: (Locked) — Last updated: 2025-10-09, Owner: Martin

## Design System Principles (Locked)

- Principles: trust-first storytelling, calm visuals, accessible defaults, scalable across marketing surfaces.
- Typography: Fraunces (weights 600–700) for headlines, Inter (400/500/600) for UI/body via tokenized utilities; clamp-based sizing avoids CLS.
- Layout: 12-column grid capped at 1440px, 4 → 64 spacing scale, `--radii-2xl` default corners, and `--shadow-card` / `--shadow-elevated` depth pairings.
- Motion: Framer Motion with 200–300 ms easing presets respecting `prefers-reduced-motion`; hero Lottie payload ≤250 KB zipped.
- Imagery: GDPR-compliant photography and pastel illustrations with consistent stroke weight; dark mode mirrors tokens 1:1.
  Status: (Locked) — Last updated: 2025-10-09, Owner: Martin

---

## History

- 2025-09-19 — Centralized parsing of `WAITLIST_CONFIRM_TTL_DAYS`; expiry remains deterministic across confirmation and resend flows.
- 2025-09-22 — CI artifacts standardized (Playwright, Lighthouse, `.next` traces); release job runs `npx semantic-release --debug`.
- 2025-09-24 — Locked transactional email identity (`no-reply@` sender, `hello@` reply-to`), ratified canonical hosts, documented captcha policy, and enforced `/api/status` monitoring.
- 2025-10-01 — Method page v1 finalized with localized copy, analytics parity, Playwright coverage, and Lighthouse gates enforced.
- 2025-10-03 — Slice 2 delivered Fraunces + Inter pairing via design tokens, adding the text utility scale and replacing ad-hoc sizing.
- 2025-10-04 — Slice 3 introduced the SiteShell, translucent sticky header with locale switcher, and accessible footer pattern.
- 2025-10-07 — Middleware locked `localePrefix = "always"`, preserved already-localised paths, and maintained loopback exceptions for automation.
- 2025-10-10 — Landing design revamp (Slices 0–12) complete; baseline screenshots stored in `tests/__screenshots__/landing-v1/` enforced via `npm run validate:local`.
