import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import { resolveBaseUrl } from '@/lib/seo/baseUrl';

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('guides.meta');
  const base = await resolveBaseUrl();
  const canonical = `${base}/en/guides`;

  return {
    title: { absolute: t('title') },
    description: t('description'),
    alternates: { canonical },
    robots: { index: false, follow: true },
    openGraph: {
      url: canonical,
      title: t('title'),
      description: t('description'),
      type: 'website',
      siteName: 'Louhen',
    },
    twitter: {
      card: 'summary_large_image',
      title: t('title'),
      description: t('description'),
    },
  };
}
