export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

import type { SupportedLocale } from '@/next-intl.locales';
import ConfirmPage from '@/app/(site)/[locale]/confirm/page';

type AliasProps = {
  searchParams?: { [key: string]: string | string[] | undefined };
};

export default function ConfirmAlias({ searchParams }: AliasProps) {
  return ConfirmPage({ params: { locale: 'en' as SupportedLocale }, searchParams });
}
