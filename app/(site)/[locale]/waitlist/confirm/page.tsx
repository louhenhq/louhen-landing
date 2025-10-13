import { redirect } from 'next/navigation';
import { processConfirmationToken } from '@lib/server/waitlist/confirm.server';
import type { SupportedLocale } from '@/next-intl.locales';

export const dynamic = 'force-dynamic';

export default async function WaitlistConfirmPage({
  params: routeParams,
  searchParams,
}: {
  params: { locale: SupportedLocale };
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const query = await searchParams;
  const rawToken = query?.token;
  const token = Array.isArray(rawToken) ? rawToken[0] : rawToken ?? null;
  const result = await processConfirmationToken(token);
  const locale = routeParams.locale;

  switch (result) {
    case 'confirmed':
      redirect(`/${locale}/waitlist/success`);
    case 'already':
      redirect(`/${locale}/waitlist/already-confirmed`);
    case 'expired':
    case 'invalid':
    case 'not_found':
    default:
      redirect(`/${locale}/waitlist/expired`);
  }
}
