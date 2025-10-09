import { redirect } from 'next/navigation';
import type { SupportedLocale } from '@/next-intl.locales';

export const runtime = 'nodejs';

type LegacyPrivacyPageProps = {
  params: Promise<{ locale: SupportedLocale }>;
};

// TODO: Remove once /[locale]/legal/privacy is fully adopted (cleanup slice).
export default async function LegacyPrivacyPage({ params }: LegacyPrivacyPageProps) {
  const { locale } = await params;
  redirect(`/${locale}/legal/privacy`);
}
