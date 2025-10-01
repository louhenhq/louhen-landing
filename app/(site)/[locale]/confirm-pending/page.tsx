export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

import ConfirmResendForm from '@/app/(site)/components/ConfirmResendForm';
import { cn, layout, text } from '@/app/(site)/_lib/ui';
import { loadMessages } from '@/lib/intl/loadMessages';
import type { SupportedLocale } from '@/next-intl.locales';

type Props = {
  params: Promise<{ locale: SupportedLocale }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

type ConfirmPendingCopy = { title: string; help: string };
type WaitlistErrorsCopy = { already: string };

function ensureConfirmPendingCopy(input: unknown): ConfirmPendingCopy {
  const fallback: ConfirmPendingCopy = {
    title: 'Check your inbox',
    help: 'Open the confirmation email to secure your place. Didn’t get it?',
  };
  if (!input || typeof input !== 'object') return fallback;
  const { title, help } = input as Record<string, unknown>;
  return {
    title: typeof title === 'string' ? title : fallback.title,
    help: typeof help === 'string' ? help : fallback.help,
  };
}

function ensureWaitlistErrorsCopy(input: unknown): WaitlistErrorsCopy {
  const fallback: WaitlistErrorsCopy = {
    already: 'This email is already on the waitlist.',
  };
  if (!input || typeof input !== 'object') return fallback;
  const { already } = input as Record<string, unknown>;
  return {
    already: typeof already === 'string' ? already : fallback.already,
  };
}

export default async function ConfirmPendingPage({ params, searchParams }: Props) {
  const [{ locale }, query] = await Promise.all([params, searchParams]);
  const rawMessages = await loadMessages(locale);
  const confirmPending = ensureConfirmPendingCopy((rawMessages as Record<string, unknown>).confirmPending);
  const waitlistErrors = ensureWaitlistErrorsCopy((((rawMessages as Record<string, unknown>).waitlist as Record<string, unknown> | undefined)?.form as Record<string, unknown> | undefined)?.errors);

  const status = typeof query.status === 'string' ? query.status : undefined;
  const already = status === 'already';

  return (
    <main className={cn(layout.page, 'flex items-center justify-center bg-bg py-3xl')}>
      <div className={cn(layout.card, 'mx-auto max-w-2xl px-gutter py-2xl')}>
        <div className="flex flex-col gap-md">
          <div className="flex flex-col gap-xs">
            <h1 className={text.heading}>{confirmPending.title}</h1>
            <p className={text.body}>{confirmPending.help}</p>
          </div>
          {already && (
            <p className="rounded-lg border border-status-info/40 bg-status-info/10 px-md py-sm text-body-sm text-status-info" aria-live="polite">
              {waitlistErrors.already}
            </p>
          )}
          <ConfirmResendForm />
        </div>
      </div>
    </main>
  );
}
