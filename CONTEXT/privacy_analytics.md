# Privacy-First Analytics

Establishes the contract for analytics on the landing experience. Consent is first-party, explicit, and revocable. No vendor CMPs are allowed; this policy governs the bootstrap, storage, event schema, and CSP expectations ahead of the implementation slice.

---

## Consent States & Storage
- Allowed consent states: `granted`, `denied`, `unknown`. New sessions start `unknown`.
- Default behaviour: **no analytics**, no network calls, and no cookies/localStorage keys until consent transitions to `granted`.
- Persistence lives in a first-party key only, e.g. `ll_consent=v1:granted`. Maximum retention is 12 months; renew by re-asking.
- Never write identifiers or analytics metadata to `localStorage`/cookies before consent. Queue events in memory only.
- Updates to the stored consent string must dispatch a change event so listeners (analytics bootstrap, banner, header) react immediately.

## Bootstrap & Revocation
- `components/ConsentBanner.tsx` is the single UI through which users grant or deny analytics consent.
- Consent banner actions write via `lib/shared/consent/api.ts`, which exposes `getState()`, `setState(next)`, and `subscribe(listener)`; internal modules read from this API only.
- `lib/shared/analytics/client.ts` owns the client queue and lazy bootstrap. It exposes `enqueue(event)` and `flush()` (automatic when consent is `granted`).
- When consent flips to `granted`, the analytics bootstrap runs once, emits a buffered `page_view`, and then processes queued events FIFO.
- When consent flips to `denied`, immediately tear down vendor clients, cancel pending network calls, clear queues, and delete any consent cookie/localStorage entry.
- Subsequent revocations must suppress events instantly; do not allow “grace periods” or batched revocations.

## Network Hygiene
- Do not load analytics vendors in hidden iframes, preconnect/preload to analytics domains, or warm caches before consent. All DNS/TLS handshakes wait until `granted`.
- `connect-src` remains `'self'` by default. Runtime expansion (e.g. adding `https://analytics.louhen.app`) must happen only after consent, using the request nonce to inject whitelisted origins.
- Any bootstrap script fetched after consent must handle failure silently and never block UI threads; cap retries to a minimal, documented number.

## Event Model
- Supported event names for the initial rollout: `page_view`, `cta_click`, `form_submit`, `error`. Names stay `snake_case`; prefer generic verbs over surface-specific prefixes.
- Event payloads use minimal fields: `{ name, context, payload? }` where `context` may include locale, route, journey stage, or short-lived campaign tags. Omit undefined fields.
- `lib/shared/analytics/client.ts` enriches events centrally; consumer code should avoid duplicating metadata or storing personal data.
- Queueing honours consent: events raised while `unknown` or `denied` stay client-side and are dropped if consent is ultimately denied.

## Security & CSP
- Inline bootstrap snippets (if used) must receive the SSR nonce via `useNonce()`; never inject inline analytics without `nonce={nonce}`.
- CSP defaults (`default-src 'self'; script-src 'self' 'nonce-<value>'; connect-src 'self'`) remain unchanged until consent. Bootstrap updates to `connect-src` happen dynamically after the state flips to `granted`.
- All analytics vendor code loads lazily from first-party modules or approved origins and must remain absent from the HTML/JS bundles prior to consent.

## Auditing & Compliance
- Consent storage, event queues, and teardown behaviour require automated tests (see [/CONTEXT/testing.md](testing.md)).
- Document any deviations (e.g., regulators requiring earlier preconnect) via an RFC before implementation; defaults above stay locked for this slice.
