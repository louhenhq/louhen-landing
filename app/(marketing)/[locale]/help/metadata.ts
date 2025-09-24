import type { Metadata } from 'next';
import { getLocale, getTranslations } from 'next-intl/server';

import { buildLocaleAlternates } from '@/lib/seo/alternates';
import { normalizeLocale, defaultLocale, type SupportedLocale } from '@/next-intl.locales';

export async function generateMetadata(): Promise<Metadata> {
  const rawLocale = await getLocale();
  const locale: SupportedLocale = normalizeLocale(rawLocale) ?? defaultLocale;
  const t = await getTranslations('help.meta');
  const { canonical, alternates } = await buildLocaleAlternates(locale, '/help');

  return {
    title: { absolute: t('title') },
    description: t('description'),
    alternates,
    openGraph: {
      url: canonical,
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
