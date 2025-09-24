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
- **URL & i18n routing** (Locked 2025-09-24): BCP-47 locale path prefixes (e.g., `/en-de/`) with root `/` as x-default suggestion, hreflang parity, and consent-aware locale storage.

---

## History

- **2025-09-19**  
  Centralized parsing of `WAITLIST_CONFIRM_TTL_DAYS`; expiry deterministic across confirm + resend flows.  

- **2025-09-22**  
  CI artifacts standardized (Playwright, Lighthouse, .next traces). Release job runs `npx semantic-release --debug`.  

- **2025-09-22**  
  Added `/CONTEXT` bundle with agents.md, project_overview.md, decision_log.md, etc. Codex workflow formalized.  

---

### 2025-09-23 — Suppression wildcard fix + new unit test

- Updated `lib/email/suppress.ts` to track per-email suppression scopes in TEST_MODE using `Set<SuppressionScope>`.
- Both TEST_MODE and production now treat `"all"` as a blanket block across every scope (transactional, marketing, custom).
- Added `tests/unit/suppress.all-scope.test.ts` to confirm that a single `"all"` suppression prevents sends for multiple scopes.
- Added deterministic `getSalt()` fallback in TEST_MODE for stable hashes.
- Validation: `npm run test:unit` passes with new coverage.


### 2025-09-23 — Guides SEO skeleton + sitemap enhancement

**What changed**
- Extended `app/sitemap.ts` to cover Guides content:
  - `/{locale}/guides` hub plus `/healthy-feet`, `/sizing`, `/parenting`
  - `/{locale}/guides/articles/choosing-first-shoes`
  - Default-locale alias entries under `/guides…`
- Swapped hard-coded base URL for `resolveBaseUrl()` to generate accurate `<loc>` values in dev (localhost) and prod (Vercel domain).
- Kept existing static routes (home, method, privacy, terms, imprint).

**Why**
- Finish the SEO skeleton for the Guides hub and ensure canonical correctness across locales/environments.

**Implementation notes**
- `resolveBaseUrl()` centralizes env override + header-derived base URL detection.
- Guides rollout landed incrementally:
  1. Localized Guides index with minimal JSON-LD.
  2. Topic pages (hero + intro) to resolve missing translation warnings.
  3. First article with localized copy and Article JSON-LD.
  4. Sitemap entries for hub, topics, and the first article.
- Default-locale alias `/guides` serves EN content while canonical points to `/{locale}/guides`.

**Validation**
- `npm run build`
- Local QA: `PORT=4311 npm run start` → `/sitemap.xml` lists static + Guides URLs for EN/DE with localhost `<loc>` values.
- Spot-checked sitemap links return 200.

**Follow-ups**  
- Add additional articles by extending `GUIDE_ARTICLE_SEGMENTS`.
- Revisit alias entries if `localePrefix: "always"` is enabled later.


### 2025-09-24 — URL & i18n Strategy (BCP-47 path prefixes) — Locked

- **Summary**: Adopt BCP-47 locale path prefixes (lowercase) like `/en-de/`, `/de-de/`, `/fr-fr/`, with `/` as the x-default entry offering a one-time suggestion/redirect for humans while bots receive the x-default content. Legacy `/de/` paths permanently redirect (308) to `/de-de/`. Hreflang is emitted for every locale variant plus x-default, and the visible switcher preserves paths when possible or falls back to the target locale homepage. User-consented preferences persist via cookie + localStorage.
- **Rationale**: Path-based BCP-47 slugs scale cleanly across markets, keep locale intent explicit for SEO, and align with industry standards and search engine guidance on hreflang/x-default usage.
- **Scope**: Landing experience only; product/app surfaces may adopt the same model later once dependencies are ready.
- **Non-goals**: No domain-per-locale rollout yet; URLs remain path-based under a single hostname. No mandatory auto-redirect loops for bots.
- **Rollback plan**: Revert to the previous `/de/` German subtree with root `/` serving English if the path strategy introduces regressions.
- **Owner**: Martin (Growth) — **Date**: 2025-09-24


### 2025-09-23 — FAQ Inline Injection + FAQPage JSON-LD

**What changed**  
- Added a compact `<InlineFaq>` component with normalization helper for rendering inline FAQs.  
- Wired localized inline FAQs (EN/DE) into three surfaces:
  - Onboarding flows (`/confirm`, `/confirm-pending`)  
  - Method page (`/method`, `/de/method`)  
  - Checkout flow (`/thanks`)  
- Introduced `buildFaqPageJsonLd` to generate `FAQPage` JSON-LD schemas.  
- Each page now emits a matching `FAQPage` JSON-LD script based on its inline FAQ items, using `resolveBaseUrl` for absolute URLs.  

**Why**  
- Inline FAQs reduce friction by answering key trust/fit questions in context.  
- `FAQPage` JSON-LD improves SEO by surfacing Q&A content directly in search results.  
- Supports localized EN/DE content for parity across markets.  

**Implementation notes**  
- Fallback logic prefers `help.inline.pdp` keys and falls back to `help.inline.method`.  
- Normalization ensures malformed entries don’t block rendering.  
- JSON-LD emits only when items exist; avoids empty schemas.  
- Validation: `npm run validate:local` green; sandbox e2e blocked (EPERM) → `npm run validate:e2e:sentinel` passes.  

**Follow-ups**  
- Add unit tests for `buildFaqPageJsonLd` and inline FAQ normalization.  
- Add Playwright smoke checks (when ports available) to assert Inline FAQ visibility + JSON-LD presence.  
- Consider future CMS wiring to replace static i18n arrays.  


### 2025-09-23 — Visual Uplift (Token-Driven Primitives & A11y Polish)

**What changed**  
- Introduced `<Section>` and `<Card>` primitives tied strictly to tokens for spacing, radius, elevation, and focus.  
- Applied primitives to Home hero + blocks, Method pillars, and Guides hub.  
- Added a faint marketing background tint (`bg-page` + `brand-teal` mix).  
- Updated hero and subtitle typography to token scales.  
- Added a reusable `focusRing` utility and token min-height to button classes; upgraded links for larger tap targets.  

**Why**  
- Ensure consistent rhythm and hierarchy across pages using one source of truth (tokens).  
- Improve perceived polish and cohesion without blocking engineering velocity.  
- Strengthen accessibility with visible focus states and WCAG-compliant hit areas.  

**Validation**  
- `npm run validate:local` → green.  
- Sentinel e2e for environments where ports are blocked.  
- Manual QA: focus/tab check across `/`, `/method`, `/guides`; Cards show hover lift and focus outlines; background tint is subtle but visible.  

**Follow-ups**  
- Optional motion/animation layer using motion tokens.  
- Snapshot/visual regression testing before public launch.  
