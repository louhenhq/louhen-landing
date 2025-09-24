# SEO Strategy — Locale & URL Structure

This document defines how the landing site implements canonical URLs, hreflang, sitemaps, and bot handling under the locked BCP-47 path strategy.

---

## Canonical URLs

- Every page emits a canonical pointing to its explicit locale path (e.g., `https://louhen.example/en-de/method`). Use `buildLocaleAlternates(locale, pathname)` (defined in `lib/seo/alternates.ts`) to generate both the canonical URL and the hreflang map. Do not hand-roll canonicals or alternates outside that helper.
- Never point canonicals to `/` or a different locale variant.
- `buildLocaleAlternates` resolves the base URL using `resolveBaseUrl()`, so ensure `NEXT_PUBLIC_SITE_URL`/`APP_BASE_URL` are set per environment.

---

## Hreflang Policy

- Emit hreflang tags for each locale variant of the page plus an `x-default` entry mapped to `/en-eu/`.
- Match URLs one-to-one by path: `/fr-fr/blog/fit-guide` references `/en-de/blog/fit-guide`, `/de-de/blog/fit-guide`, etc., when those pages exist.
- Include self-referential hreflang (`hreflang="fr-FR" href=".../fr-fr/..."`).
- Use lowercase paths; hreflang values follow standard casing (language lowercase, region uppercase), e.g., `hreflang="en-DE"`.

**Example block for `/fr-fr/` page**

```html
<link rel="canonical" href="https://louhen.site/fr-fr/method" />
<link rel="alternate" hreflang="fr-FR" href="https://louhen.site/fr-fr/method" />
<link rel="alternate" hreflang="en-DE" href="https://louhen.site/en-de/method" />
<link rel="alternate" hreflang="de-DE" href="https://louhen.site/de-de/method" />
<link rel="alternate" hreflang="en-AT" href="https://louhen.site/en-at/method" />
<link rel="alternate" hreflang="en-NL" href="https://louhen.site/en-nl/method" />
<link rel="alternate" hreflang="en-EU" href="https://louhen.site/en-eu/method" />
<link rel="alternate" hreflang="x-default" href="https://louhen.site/en-eu/method" />
```

---

## Bot & Redirect Handling

- Root `/` serves x-default content to bots without redirecting; human visitors receive a one-time suggestion/302 when locale detection applies.
- Ignore Accept-Language/IP hints for known bots (search crawlers, uptime monitors).
- Legacy `/de/` and descendants respond with permanent 308 redirects to `/de-de/` equivalents. Update redirect map whenever new slugs land under the German tree.
- Never auto-redirect bots between locales.

---

## Sitemaps

- `app/sitemap.ts` enumerates every locale/path using `buildLocalePath` from the registry. When adding locales or routes, update the static segment lists there so localized URLs stay in sync.
- Generate individual sitemap files per locale (e.g., `/sitemaps/en-de.xml`, `/sitemaps/fr-fr.xml`).
- Provide an index sitemap that lists each locale sitemap with `<lastmod>` timestamps.
- Ensure every localized page in production is represented in the matching locale sitemap.
- Validate sitemap coverage after adding or renaming slugs.

---

## SEO Checklist (for locale-aware changes)

- [ ] Canonical URL matches the page locale path.
- [ ] Hreflang matrix updated for all locales + `x-default` → `/en-eu/...`.
- [ ] Root `/` human suggestion flow tested; bots confirmed to see x-default without redirect.
- [ ] Legacy `/de/` redirects tested (308) including nested routes.
- [ ] Locale sitemap regenerated and index sitemap references it.
- [ ] No contradictory guidance with privacy/trust/CSP policies.
