import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import { locales, type SupportedLocale } from '@/next-intl.locales';

type MethodPageProps = {
  params: Promise<{ locale: SupportedLocale }>;
};

export async function generateMetadata({ params }: MethodPageProps): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'method' });

  const title = t('seo.title');
  const description = t('seo.description');
  const localizedPath = `/${locale}/method/`;
  const baseUrlRaw = process.env.APP_BASE_URL?.trim() || process.env.NEXT_PUBLIC_SITE_URL?.trim() || 'https://louhen-landing.vercel.app';
  const baseUrl = baseUrlRaw.replace(/\/$/, '');
  const imageUrl = `${baseUrl}/opengraph-image.png`;
  const languages = locales.reduce<Record<string, string>>((acc, code) => {
    acc[code] = `/${code}/method/`;
    return acc;
  }, {});
  languages['x-default'] = '/method/';

  return {
    title,
    description,
    alternates: {
      canonical: localizedPath,
      languages,
    },
    openGraph: {
      title,
      description,
      url: `${baseUrl}${localizedPath}`,
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
