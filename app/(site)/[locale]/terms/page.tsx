import { redirect } from 'next/navigation';
import type { SupportedLocale } from '@/next-intl.locales';

export const runtime = 'nodejs';

type LegacyTermsPageProps = {
  params: Promise<{ locale: SupportedLocale }>;
};

// TODO: Remove once /[locale]/legal/terms is fully adopted (cleanup slice).
export default async function LegacyTermsPage({ params }: LegacyTermsPageProps) {
  const { locale } = await params;
  redirect(`/${locale}/legal/terms`);
}
