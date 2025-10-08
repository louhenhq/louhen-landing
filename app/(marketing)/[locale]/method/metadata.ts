import type { Metadata } from 'next';
import { buildMethodMetadata } from '@lib/shared/seo/method-metadata';
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
  return buildMethodMetadata({ locale });
}
