import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import { isPrelaunch } from '@/lib/env/prelaunch';
import { legalPath, type LegalSlug } from '@/lib/routing/legalPath';
import { hreflangMapFor, makeCanonical, resolveBaseUrl } from '@/lib/seo/shared';
import { type SupportedLocale } from '@/next-intl.locales';

const OG_IMAGE_PATH = '/opengraph-image.png';

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
  const baseUrl = resolveBaseUrl();
  const path = legalPath(locale, kind);
  const canonicalUrl = makeCanonical(path, baseUrl);
  const hreflang = hreflangMapFor((supportedLocale) => legalPath(supportedLocale, kind), baseUrl);

  const t = await getTranslations({ locale, namespace: 'legal' });
  const title = kind === 'terms' ? t('terms.title') : t('privacy.title');
  const description = extractDescription(kind, t);

  const robots = isPrelaunch()
    ? { index: false, follow: false }
    : undefined;

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
      images: [`${baseUrl}${OG_IMAGE_PATH}`],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [`${baseUrl}${OG_IMAGE_PATH}`],
    },
    robots,
  } satisfies Metadata;
}
