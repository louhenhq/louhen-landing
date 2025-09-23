import type { Metadata } from 'next';
import { getLocale, getTranslations } from 'next-intl/server';
import { resolveBaseUrl } from '@/lib/seo/baseUrl';

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale();
  const t = await getTranslations('guides.meta');
  const base = await resolveBaseUrl();
  const url = `${base}/${locale}/guides`;

  return {
    title: { absolute: t('title') },
    description: t('description'),
    alternates: { canonical: url },
    openGraph: {
      url,
      title: t('title'),
      description: t('description'),
      type: 'website',
      locale,
      siteName: 'Louhen',
    },
    twitter: {
      card: 'summary_large_image',
      title: t('title'),
      description: t('description'),
    },
  };
}
