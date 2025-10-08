import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import { isPrelaunch } from '@lib/env/prelaunch';
import { methodPath } from '@lib/shared/routing/method-path';
import { hreflangMapFor, makeCanonical, resolveBaseUrl } from '@lib/seo/shared';
import { type SupportedLocale } from '@/next-intl.locales';

const OG_IMAGE_PATH = '/opengraph-image';
const DEFAULT_METHOD_TITLE = 'Method – Louhen';
const DEFAULT_METHOD_DESCRIPTION = 'How Louhen works: fit-first guidance, trusted sizing, and effortless discovery.';

type BuildMethodMetadataParams = {
  locale: SupportedLocale;
};

export async function buildMethodMetadata({ locale }: BuildMethodMetadataParams): Promise<Metadata> {
  const baseUrl = resolveBaseUrl();
  const canonicalPath = methodPath(locale);
  const canonicalUrl = makeCanonical(canonicalPath, baseUrl);
  const hreflang = hreflangMapFor(methodPath, baseUrl);
  const imageUrl = `${baseUrl}${OG_IMAGE_PATH}?locale=${locale}`;

  let title = DEFAULT_METHOD_TITLE;
  let description = DEFAULT_METHOD_DESCRIPTION;

  try {
    const t = await getTranslations({ locale, namespace: 'method' });
    try {
      title = t('seo.title');
    } catch {
      title = DEFAULT_METHOD_TITLE;
    }
    try {
      description = t('seo.description');
    } catch {
      description = DEFAULT_METHOD_DESCRIPTION;
    }
  } catch {
    title = DEFAULT_METHOD_TITLE;
    description = DEFAULT_METHOD_DESCRIPTION;
  }

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
      type: 'article',
      locale,
      images: [imageUrl],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [imageUrl],
    },
    robots,
  } satisfies Metadata;
}
