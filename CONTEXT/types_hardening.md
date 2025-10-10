# TypeScript Hardening Plan

## Purpose
- Deliver strict TypeScript coverage feature-by-feature without breaking the global baseline.
- Give contributors a repeatable flow for enabling stricter flags (`strict`, `noImplicitOverride`, `exactOptionalPropertyTypes`, `noUncheckedIndexedAccess`) on scoped areas.
- Track the small number of temporary exceptions so they receive follow-up owners and removal slices.

## Rollout Principles
- **No global flips**: `tsconfig.json` stays developer-friendly until every feature passes the strict suite.
- **Opt-in pilots**: Each slice targets a single feature (e.g., `method`, `waitlist`, `header`) using `tsconfig.strict.json` with a focused include list.
- **Temporary expectations require budget entries**: Every `@ts-expect-error` or relaxed rule is logged in `/CONTEXT/types_budget.md` with an owner and removal plan.

## Pilot Checklist
1. **Select scope**: Choose a feature (aligned with `/CONTEXT/rename_map.md`) and update `tsconfig.strict.json` include paths for the duration of the slice.
2. **Run strict check**: `npm run typecheck:strict:feature` (or a feature-specific script) must pass.
3. **Fix issues**: Prefer actual typing fixes over expectations. When unavoidable, add a budget entry with owner + slice ID.
4. **Exit criteria**:
   - 0 TypeScript errors with strict config.
   - No `any` leakage (except logged exceptions).
   - No runtime behaviour changes introduced to satisfy the compiler.
5. **Document completion**: Update this file or commit notes to mark the feature as strict-ready, then restore the strict config include list to empty.

## Tooling
- `tsconfig.strict.json` — opt-in config (empty include by default).
- `npm run typecheck:strict:feature` — runs strict config after you populate the `include` array.
- Feature-specific scripts (e.g., `npm run typecheck:strict:method`) provide ready-made entry points with curated include globs.

## Notes
- Zustand stores use generics on `persist()` or the `StateCreator`, not `create()`, per v5 typings.

## Active pilots
- `components/features/header-nav/**/*`
- `components/features/footer/**/*`
- `components/features/waitlist/**/*` plus supporting shared/server libs and tests (see `tsconfig.strict.json`).

## Next steps
- Track active pilots and budgets in `/CONTEXT/types_budget.md`.
- Once every feature passes strict, we can discuss promoting the strict config to the global default in a dedicated slice.
