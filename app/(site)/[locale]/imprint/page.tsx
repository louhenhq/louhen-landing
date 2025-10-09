import type { Metadata } from 'next';
import { imprintPath } from '@lib/shared/routing/imprint-path';
import { isPrelaunch } from '@/lib/env/prelaunch';
import { getSiteOrigin, hreflangMapFor, makeCanonical } from '@/lib/seo/shared';
import { buildOgImageEntry } from '@lib/shared/og/builder';
import type { SupportedLocale } from '@/next-intl.locales';
import { unstable_setRequestLocale } from 'next-intl/server';

export const runtime = 'nodejs';

type ImprintPageProps = {
  params: { locale: SupportedLocale };
};

export default function ImprintPage({ params }: ImprintPageProps) {
  unstable_setRequestLocale(params.locale);
  return (
    <main id="main-content" className="mx-auto max-w-3xl px-gutter py-3xl">
      <h1 className="text-3xl font-semibold text-text">Imprint</h1>
      <p className="mt-sm text-text-muted">This is a placeholder. Company details will be listed here.</p>
    </main>
  );
}

export function generateMetadata({ params }: ImprintPageProps): Metadata {
  const { locale } = params;
  const baseUrl = getSiteOrigin();
  const canonicalPath = imprintPath(locale);
  const canonicalUrl = makeCanonical(canonicalPath, baseUrl);
  const hreflang = hreflangMapFor(imprintPath, baseUrl);
  const robots = isPrelaunch()
    ? { index: false, follow: false }
    : undefined;
  const isGerman = locale.startsWith('de');
  const title = isGerman ? 'Impressum – Louhen' : 'Imprint – Louhen';
  const description = isGerman
    ? 'Rechtliche Angaben, Kontaktinformationen und Verantwortlichkeiten von Louhen.'
    : 'Legal disclosure, contact, and accountability details for Louhen.';
  const ogImage = buildOgImageEntry({
    locale,
    surface: 'imprint',
    title,
    description,
  });

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
      locale,
      type: 'website',
      images: [ogImage],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [ogImage.url],
    },
  };
}
