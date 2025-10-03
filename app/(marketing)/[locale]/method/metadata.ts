import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import type { SupportedLocale } from '@/next-intl.locales';
import {
  buildAlternateLanguageMap,
  buildCanonicalPath,
  buildCanonicalUrl,
  resolveSiteBaseUrl,
} from '@/lib/i18n/metadata';

type MethodPageProps = {
  params: Promise<{ locale: SupportedLocale }>;
};

export async function generateMetadata({ params }: MethodPageProps): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'method' });

  const title = t('seo.title');
  const description = t('seo.description');
  const baseUrl = resolveSiteBaseUrl();
  const canonicalUrl = buildCanonicalUrl(locale, '/method');
  const imageUrl = `${baseUrl}/opengraph-image.png`;
  const languages = buildAlternateLanguageMap('/method');

  return {
    title,
    description,
    alternates: {
      canonical: canonicalUrl,
      languages,
    },
    openGraph: {
      title,
      description,
      url: canonicalUrl,
      locale,
      type: 'article',
      images: [
        {
          url: imageUrl,
          width: 1200,
          height: 630,
          alt: t('hero.imageAlt') ?? title,
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [imageUrl],
    },
    robots: {
      index: true,
      follow: true,
    },
  };
}
