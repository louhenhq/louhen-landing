# SEO Playbook

## Pre-launch policy

- Set `X-Robots-Tag: noindex` and serve `robots.txt` with `Disallow: /` on both preview and production domains until launch.
- Keep sitemap disabled pre-launch to prevent accidental discovery.
<<<<<<< HEAD
=======
- Canonical URLs in metadata must still point to `https://www.louhen.app` even while `noindex` is active.
>>>>>>> f7d7592 (Waitlist env split: build uses NEXT_PUBLIC only (#2))

## Launch day checklist

- Remove the `noindex` directives and update `robots.txt` to allow crawling with `Sitemap: https://www.louhen.app/sitemap.xml`.
- Revalidate caches/CDN entries after toggling crawl settings.
<<<<<<< HEAD
=======
- Ensure every `<link rel="canonical">`, `hreflang`, and `x-default` entry resolves to `https://www.louhen.app/{locale}`; never reference the apex domain.
>>>>>>> f7d7592 (Waitlist env split: build uses NEXT_PUBLIC only (#2))

## Redirects

- Enforce a permanent `301` redirect from `louhen.app` (apex) to `https://www.louhen.app` to keep a single canonical host and avoid duplicate indexing.
<<<<<<< HEAD

---

### Method Page SEO
- URL policy: /[locale]/method/ with trailing slash; set `Metadata.alternates.canonical` accordingly.
- Hreflang: use central generator; include all locales + `x-default` to root as per site policy.
- JSON-LD: Use `TechArticle` with localized headline/description; author Organization "Louhen"; `inLanguage` = current locale; inject via CSP-nonce helper.
=======
- Preview host remains `https://staging.louhen.app`; keep it isolated with `noindex` until GA.
>>>>>>> f7d7592 (Waitlist env split: build uses NEXT_PUBLIC only (#2))
