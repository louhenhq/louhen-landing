import type { Metadata } from 'next';
import { buildMethodMetadata } from '@/lib/seo/methodMetadata';
import type { SupportedLocale } from '@/next-intl.locales';

type MethodPageProps = {
  params: Promise<{ locale: SupportedLocale }>;
};

export async function generateMetadata({ params }: MethodPageProps): Promise<Metadata> {
  const { locale } = await params;
  return buildMethodMetadata({ locale });
}
