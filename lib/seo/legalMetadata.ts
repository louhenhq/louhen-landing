import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import { isPrelaunch } from '@/lib/env/prelaunch';
import { legalPath, type LegalSlug } from '@lib/shared/routing/legal-path';
import { getSiteOrigin, hreflangMapFor, makeCanonical } from '@/lib/seo/shared';
import { buildOgImageEntry } from '@lib/shared/og/builder';
import { type SupportedLocale } from '@/next-intl.locales';

type LegalKind = Extract<LegalSlug, 'terms' | 'privacy'>;

type BuildLegalMetadataParams = {
  locale: SupportedLocale;
  kind: LegalKind;
};

function extractDescription(
  kind: LegalKind,
  t: Awaited<ReturnType<typeof getTranslations>>,
): string {
  if (kind === 'terms') {
    return t('terms.intro');
  }

  const rawItems = t.raw('privacy.purpose.items');
  if (Array.isArray(rawItems)) {
    const firstText = rawItems.find((value) => typeof value === 'string' && value.trim().length > 0);
    if (typeof firstText === 'string') {
      return firstText;
    }
  }

  return t('privacy.purpose.heading');
}

export async function buildLegalMetadata({ locale, kind }: BuildLegalMetadataParams): Promise<Metadata> {
  const baseUrl = getSiteOrigin();
  const path = legalPath(locale, kind);
  const canonicalUrl = makeCanonical(path, baseUrl);
  const hreflang = hreflangMapFor((supportedLocale) => legalPath(supportedLocale, kind), baseUrl);

  const t = await getTranslations({ locale, namespace: 'legal' });
  const title = kind === 'terms' ? t('terms.title') : t('privacy.title');
  const description = extractDescription(kind, t);

  const robots = isPrelaunch()
    ? { index: false, follow: false }
    : undefined;
  const surface = kind === 'terms' ? 'legal-terms' : 'legal-privacy';
  const ogImage = buildOgImageEntry({
    locale,
    surface,
    title,
    description,
  });

  return {
    title,
    description,
    alternates: {
      canonical: canonicalUrl,
      languages: hreflang,
    },
    openGraph: {
      title,
      description,
      url: canonicalUrl,
      locale,
      type: 'article',
      images: [ogImage],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [ogImage.url],
    },
    robots,
  } satisfies Metadata;
}
