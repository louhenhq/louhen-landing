import type { Metadata } from 'next';
import { imprintPath } from '@lib/shared/routing/imprint-path';
import { isPrelaunch } from '@/lib/env/prelaunch';
import { hreflangMapFor, makeCanonical, resolveBaseUrl } from '@/lib/seo/shared';
import { defaultLocale } from '@/next-intl.locales';
import { unstable_setRequestLocale } from 'next-intl/server';

export const runtime = 'nodejs';

const LOCALE_FALLBACK_DESCRIPTION =
  'Legal disclosure, contact details, and accountability information for Louhen.';

function buildMetadata(): Metadata {
  const baseUrl = resolveBaseUrl();
  const canonicalPath = imprintPath(defaultLocale);
  const canonicalUrl = makeCanonical(canonicalPath, baseUrl);
  const hreflang = hreflangMapFor(imprintPath, baseUrl);
  const robots = isPrelaunch()
    ? { index: false, follow: false }
    : undefined;
  const isGerman = defaultLocale.startsWith('de');
  const title = isGerman ? 'Impressum – Louhen' : 'Imprint – Louhen';
  const description = isGerman
    ? 'Rechtliche Angaben, Kontaktinformationen und Verantwortlichkeiten von Louhen.'
    : LOCALE_FALLBACK_DESCRIPTION;
  const imageUrl = `${baseUrl}/opengraph-image?locale=${defaultLocale}`;

  return {
    title,
    description,
    robots,
    alternates: {
      canonical: canonicalUrl,
      languages: hreflang,
    },
    openGraph: {
      title,
      description,
      url: canonicalUrl,
      locale: defaultLocale,
      type: 'website',
      images: [imageUrl],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [imageUrl],
    },
  };
}

export function generateMetadata(): Metadata {
  return buildMetadata();
}

export default function ImprintPage() {
  unstable_setRequestLocale(defaultLocale);
  return (
    <main id="main-content" className="mx-auto max-w-3xl px-gutter py-3xl">
      <h1 className="text-3xl font-semibold text-text">Imprint</h1>
      <p className="mt-sm text-text-muted">This is a placeholder. Company details will be listed here.</p>
    </main>
  );
}
