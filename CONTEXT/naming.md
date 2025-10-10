# Louhen Landing — Naming & Structure Conventions

## 1. Purpose & Scope
- Governs naming, files, folders, exports, barrels, routing, and selectors across the repo.
- Excludes visual design tokens, copywriting guidelines, and third-party configuration (see `/CONTEXT` docs for those).

## 2. Filenames & Suffixes
- **Components (reusable):** `PascalCase.tsx` (example: `Button.tsx`).
- **Client components:** `PascalCase.client.tsx` flagged when `use client` is required.
- **Hooks:** `useThing.ts` (example: `useMediaQuery.ts`).
- **Utilities (isomorphic):** `kebab-case.ts` (example: `fetch-json.ts`).
- **Server-only modules:** `kebab-case.server.ts` (example: `adyen-client.server.ts`).
- **Types-only modules:** `kebab-case.types.ts` (example: `waitlist.types.ts`).
- **Tests:** `*.spec.ts` for unit, `*.e2e.ts` for end-to-end, `*.axe.ts` for accessibility.

## 3. Exports Policy
- Prefer named exports everywhere; only Next.js framework surfaces (`page.tsx`, `layout.tsx`, `loading.tsx`, `error.tsx`, `route.ts`) may default export.
- Use `import type { ... }` syntax when importing types or interfaces.
- Keep export surfaces small and explicit; re-export only from approved barrels.

## 4. Folder Taxonomy (source of truth)

| Directory | Purpose | Notes |
| --- | --- | --- |
| `app/` | Route groups + loaders | Use route groups `(site)`, locale segments, and `route.ts` for APIs. |
| `components/` | UI building blocks | Subdivide into `ui/`, `blocks/`, and `features/<feature>/`. |
| `lib/` | Cross-cutting logic | Split into `shared/` (isomorphic) and `server/` (Node/RSC). |
| `styles/` | Global styles & Tailwind entry | Keep per-component styles colocated in component dirs. |
| `content/` | Static MD/JSON fixtures | Version content alongside features when possible. |
| `public/` | Static assets served verbatim | No transforms; ensure filenames are cache-safe. |
| `tests/` | Automated checks | Mirror feature names under `unit/`, `e2e/`, `axe/`. |
| `scripts/` | DevOps tooling | Shell/Node scripts with clear usage comments. |
| `CONTEXT/`, `.github/` | Governance & workflows | Policies, docs, templates only. |

- Route folders follow BCP-47 locales (lowercase) and kebab-case segments.
- Keep feature-specific assets inside `components/features/<feature>/`.
- API handlers live in `app/api/<name>/route.ts`.

## 5. Barrels (restricted)
- Allowed barrels: `components/ui/index.ts`, `components/blocks/index.ts`, `components/features/<feature>/index.ts`.
- Disallow deep barrels (no nested `index.ts` beyond the paths above) to keep import paths explicit.
- Barrels must re-export named members only; no default proxies.

## 6. Routing & i18n
- Locale folders use lowercase BCP-47 tags (example: `en-gb`); nested segments stay kebab-case.
- Default locale routes must set the locale explicitly (see `/CONTEXT/i18n.md` for mechanics).
- Never add `index.tsx`; use the Next.js convention files (`page.tsx`, `route.ts`, etc.) instead.

## 7. Testing & Selectors
- Prefer `data-ll="…" ` attributes for Playwright and axe selectors; map each critical element once.
- Canonical selectors: `hero-cta`, `nav`, `footer`, `pdp-blocks`, and other marketing funnels.
- Keep selectors stable—avoid class or DOM order coupling in tests.

## 8. Examples
- Component: `components/ui/Button.tsx`.
- Feature composite: `components/features/method/MethodHero.tsx`.
- Block: `components/blocks/FeatureGrid.tsx`.
- Hook: `lib/shared/useMediaQuery.ts`.
- Server util: `lib/server/adapters/adyen-client.server.ts`.
- Route: `app/(site)/en-de/method/page.tsx`.
- API handler: `app/api/status/route.ts`.
- Tests: `tests/e2e/method/hero.e2e.ts`, `tests/axe/method/hero.axe.ts`.

## 9. Anti-Patterns (with fixes)
- Default exports in non-framework modules → replace with named exports and update imports.
- Deep relative imports when an alias exists → switch to configured alias paths.
- Class-based or fragile DOM selectors in tests → switch to stable `data-ll` selectors.

## 10. Governance & Enforcement
- Planned lint rules: ESLint `import/no-default-export`, filename pattern checks, CI directory guards.
- Exceptions list: Next.js framework files only (`page.tsx`, `layout.tsx`, `loading.tsx`, `error.tsx`, `route.ts`).
- Flag deviations in PR review; document approved exceptions in `/CONTEXT/decision_log.md`.

## 11. Migration Notes
- Cross-reference `/CONTEXT/rename_map.md` (Slice B) before any renaming work.
- Follow one-feature-per-PR move policy; keep refactors isolated.
- Use `git mv` for renames to preserve file history and reduce review noise.
