import { redirect } from 'next/navigation';
import { processConfirmationToken } from '@/lib/waitlist/confirm';
import { setWaitlistSession, clearWaitlistSession } from '@/lib/waitlist/session';

export const dynamic = 'force-dynamic';

export default async function WaitlistConfirmPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const rawToken = params?.token;
  const token = Array.isArray(rawToken) ? rawToken[0] : rawToken ?? null;
  const outcome = await processConfirmationToken(token);

  if (outcome.docId && (outcome.status === 'confirmed' || outcome.status === 'already')) {
    setWaitlistSession(outcome.docId);
  } else {
    clearWaitlistSession();
  }

  switch (outcome.status) {
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
