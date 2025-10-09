# SEO Playbook — Louhen Landing

Search visibility remains tightly controlled until launch, with locked metadata behaviours across locales.

---

## Open Graph / Twitter (Locked)

- Social previews use the Vercel OG image function per locale, sourcing the localized title and strapline from the i18n catalog.
- Keep OG/Twitter metadata synchronized with page copy; update image templates only via governed Slice work.
- Regenerate OG assets on localisation changes to avoid stale language collisions.
  Status: (Locked) — Last updated: 2025-10-09, Owner: Martin

## Preview SEO (Locked)

- Preview domains (`staging.louhen.app` and branch previews) respond with `X-Robots-Tag: noindex` and serve a `robots.txt` with `Disallow: /`.
- Preview analytics stays disabled and sitemap route remains unreachable to prevent accidental discovery.
- Prelaunch canonical tags still point to production URLs even while noindex is active.
  Status: (Locked) — Last updated: 2025-10-09, Owner: Martin

## Canonical Structure (Locked)

- Every locale publishes `<link rel="canonical">` and `hreflang` entries targeting `https://www.louhen.app/{locale}/...` plus an `x-default`.
- The sitemap at `/sitemap.xml` renders dynamically to mirror active locales and high-value routes.
- Redirect apex `louhen.app` to `https://www.louhen.app` permanently to maintain a single canonical host.
  Status: (Locked) — Last updated: 2025-10-09, Owner: Martin

## Launch Operations

- Before GA, remove `noindex` directives on production, update `robots.txt` to include `Allow` rules and the sitemap, then purge CDN caches.
- Confirm JSON-LD (TechArticle with localized headline, description, and `inLanguage`) injects with the CSP nonce.
- Validate Lighthouse SEO score >=95 for `/[locale]/method/` and `/[locale]/` routes post-launch.
