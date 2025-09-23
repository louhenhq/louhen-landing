import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import type { SupportedLocale } from '@/next-intl.locales';

type MethodPageProps = {
  params: Promise<{ locale: SupportedLocale }>;
};

export async function generateMetadata({ params }: MethodPageProps): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'method' });

  const title = t('seo.title');
  const description = t('seo.description');
  const canonicalPath = '/method';
  const localizedPath = `/${locale}/method`;

  return {
    title,
    description,
    alternates: {
      canonical: canonicalPath,
    },
    openGraph: {
      title,
      description,
      url: localizedPath,
      locale,
      type: 'article',
      images: ['/opengraph-image.png'],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: ['/opengraph-image.png'],
    },
    robots: {
      index: true,
      follow: true,
    },
  };
}
