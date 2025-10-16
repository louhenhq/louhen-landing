# Contract & Schema Tests — Louhen Landing

Contract tests ensure structured outputs remain stable as the app evolves. Follow these rules whenever you introduce or update an internal API, metadata builder, or structured JSON/HTML fragment.

## What Requires a Contract Test?
- JSON-LD builders (`lib/shared/seo/json-ld.tsx`, metadata helpers).
- API responses served from `/api/*` when consumed by the frontend.
- Structured HTML fragments reused across pages (e.g., canonical header/footer snippets).
- Serialization helpers that fan-out to third-party integrations (email payloads, analytics events).

## Authoring Guidelines
1. **Prefer schemas over snapshots.** Use Zod/TypeBox/JSON schema to assert shape, required fields, enums, and optional sections.
2. **Keep fragments tiny.** If a snapshot is unavoidable, capture the minimal fragment (header list, attribute map) rather than entire DOM trees or marketing copy.
3. **Type+liveness:** contract tests run in `tests/unit/contracts/**` (or adjacent to the module). They are part of the unit/integration coverage thresholds.
4. **Review diffs deliberately.** Schema updates must reference product/SEO requirements and include reviewer acknowledgements in the PR.
5. **Reject large DOM snapshots.** They are brittle and hide real regressions. Use Playwright expectations for end-to-end verification instead.

## Tooling
- Add schema helpers under `tests/fixtures/contracts/schema.ts` if you need reusable assertions.
- Run `npm run test:unit:coverage` to ensure contract tests count toward thresholds.
- Document new contracts in `/CONTEXT/tests.md` (API Contracts & Schema Checks) when adding major surfaces.
