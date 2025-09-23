export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

import type { SupportedLocale } from '@/next-intl.locales';
import ConfirmPendingPage from '@/app/(site)/[locale]/confirm-pending/page';

type AliasProps = {
  searchParams?: Record<string, string | string[] | undefined>;
};

export default function ConfirmPendingAlias({ searchParams }: AliasProps) {
  const params = Promise.resolve<{ locale: SupportedLocale }>({ locale: 'en' as SupportedLocale });
  const query = Promise.resolve<Record<string, string | string[] | undefined>>(searchParams ?? {});
  return ConfirmPendingPage({ params, searchParams: query });
}
