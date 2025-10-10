# Routing — Legal Pages

## Path Structure
- All legal routes live under `/[locale]/legal/<slug>`.
- Initial slugs:
  - `/[locale]/legal/terms` → Terms of Service
  - `/[locale]/legal/privacy` → Privacy Policy
- Locale segment follows the configured `next-intl` locales; default locale renders without duplication in metadata (handled by App Router).

## Locale Format (BCP-47)
- Use lowercase language codes with optional region (e.g., `en`, `en-GB`, `de`, `fi-FI`).
- When introducing a region-specific variant, duplicate only the locale segment (`/en-GB/legal/terms`). Slugs stay in English per localization guidelines; copy comes from message catalogs.

## Canonical URL Rules
- Canonical host remains `https://www.louhen.app` (see `decision_log.md`).
- Each legal page must emit `<link rel="canonical">https://www.louhen.app/{locale}/legal/<slug>` matching the active locale.
- Pre-launch `noindex` directives stay in place even with canonical links; remove the `noindex` only after launch approval.
- Ensure `hreflang`/`x-default` entries include the legal routes once localized, keeping parity with core marketing pages.

## Linking Conventions
- Footer includes localized links to Terms and Privacy for every locale.
- Include breadcrumbs or hero links only if UX requires; keep route naming stable to avoid churn in translations and tests.

## Future Additions
- `Impressum` or jurisdiction-specific pages must follow the same structure (`/[locale]/legal/impressum`) and inherit the SEO + i18n rules documented here.
