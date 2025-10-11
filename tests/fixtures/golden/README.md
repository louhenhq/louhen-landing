# Golden Fixtures

Golden fixtures are small, deterministic samples used by contract/unit tests. Keep them tiny (≤5 KB) and human-readable so reviewers can diff changes quickly.

Guidelines:
- Store fixtures as `.json`/`.ts` exports in this directory. Add a comment describing provenance (e.g., "captured from production headers on 2025-10-10").
- Never mutate a golden fixture inside a test. Clone or deep-copy before making changes.
- Every fixture change requires approval from the owning team (see `/CONTEXT/owners.md`). Include before/after snippets in the PR description.
- Remove unused fixtures promptly to avoid carrying stale data.

When adding new fixtures, update `/CONTEXT/tests.md` if the surface area or ownership changes.
