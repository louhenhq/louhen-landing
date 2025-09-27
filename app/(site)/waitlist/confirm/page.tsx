import { redirect } from 'next/navigation';
import { processConfirmationToken } from '@/lib/waitlist/confirm';

export const dynamic = 'force-dynamic';

export default async function WaitlistConfirmPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const rawToken = params?.token;
  const token = Array.isArray(rawToken) ? rawToken[0] : rawToken ?? null;
  const result = await processConfirmationToken(token);

  switch (result) {
    case 'confirmed':
      redirect('/waitlist/success');
    case 'already':
      redirect('/waitlist/already-confirmed');
    case 'expired':
    case 'invalid':
    case 'not_found':
    default:
      redirect('/waitlist/expired');
  }
}
