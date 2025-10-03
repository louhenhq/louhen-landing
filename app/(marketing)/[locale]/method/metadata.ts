import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import type { SupportedLocale } from '@/next-intl.locales';
import {
  buildAlternateLanguageMap,
  buildCanonicalUrl,
  resolveSiteBaseUrl,
} from '@/lib/i18n/metadata';
import { SITE_NAME } from '@/constants/site';
import { buildMethodOgImageUrl } from './ogImage';

type MethodPageProps = {
  params: Promise<{ locale: SupportedLocale }>;
};

export async function generateMetadata({ params }: MethodPageProps): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'method' });

  const title = t('meta.title');
  const description = t('meta.description');
  const baseUrl = resolveSiteBaseUrl();
  const canonicalUrl = buildCanonicalUrl(locale, '/method/');
  const imageUrl = buildMethodOgImageUrl(baseUrl, locale, title, description);
  const languages = buildAlternateLanguageMap('/method/');
  const imageAlt = t('hero.imageAlt') ?? title;

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
      siteName: SITE_NAME,
      type: 'article',
      images: [
        {
          url: imageUrl,
          width: 1200,
          height: 630,
          alt: imageAlt,
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
