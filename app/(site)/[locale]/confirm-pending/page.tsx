export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

import type { Metadata } from 'next';
import { ConfirmResendForm } from '@components/features/waitlist';
import { cn, layout, text } from '@/app/(site)/_lib/ui';
import { loadMessages } from '@/lib/intl/loadMessages';
import { safeGetMessage } from '@/lib/intl/getMessage';
import { isPrelaunch } from '@/lib/env/prelaunch';
import { getSiteOrigin, hreflangMapFor, makeCanonical } from '@/lib/seo/shared';
import { getOgImageEntry } from '@lib/shared/og/builder';
import { waitlistConfirmPendingPath } from '@lib/shared/routing/waitlist-path';
import type { SupportedLocale } from '@/next-intl.locales';
import { unstable_setRequestLocale } from 'next-intl/server';

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
  unstable_setRequestLocale(locale);
  const rawMessages = await loadMessages(locale);
  const confirmPending = ensureConfirmPendingCopy((rawMessages as Record<string, unknown>).confirmPending);
  const waitlistErrors = ensureWaitlistErrorsCopy((((rawMessages as Record<string, unknown>).waitlist as Record<string, unknown> | undefined)?.form as Record<string, unknown> | undefined)?.errors);
  const skipToMainLabel =
    safeGetMessage(rawMessages as Record<string, unknown>, 'layout.skipToMain', {
      locale,
      fallbackHint: 'layout skip to main',
    }) || 'Skip to main content';

  const status = typeof query.status === 'string' ? query.status : undefined;
  const already = status === 'already';

  return (
    <>
      <a
        href="#main-content"
        className="sr-only focus-visible:not-sr-only focus-visible:absolute focus-visible:left-1/2 focus-visible:top-sm focus-visible:-translate-x-1/2 focus-visible:inline-flex focus-visible:items-center focus-visible:rounded-pill focus-visible:border focus-visible:border-border focus-visible:bg-bg focus-visible:px-sm focus-visible:py-xs focus-visible:text-sm focus-visible:text-text focus-visible:shadow-card focus-visible:transition focus-visible:z-header focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-border-focus"
      >
        {skipToMainLabel}
      </a>
      <main id="main-content" tabIndex={-1} className={cn(layout.page, 'flex items-center justify-center bg-bg py-3xl')}>
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
    </>
  );
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const baseUrl = getSiteOrigin();
  const canonicalPath = waitlistConfirmPendingPath(locale);
  const canonicalUrl = makeCanonical(canonicalPath, baseUrl);
  const hreflang = hreflangMapFor(waitlistConfirmPendingPath, baseUrl);
  const robots = isPrelaunch()
    ? { index: false, follow: false }
    : undefined;
  let title = 'Check your inbox';
  let description = 'Open the confirmation email to secure your place.';

  try {
    const rawMessages = await loadMessages(locale);
    const confirmPending = ensureConfirmPendingCopy((rawMessages as Record<string, unknown>).confirmPending);
    title = confirmPending.title;
    description = confirmPending.help;
  } catch {
    // fall back to defaults
  }

  const ogImage = getOgImageEntry({
    locale,
    key: 'confirm-pending',
    title,
    description,
  });

  return {
    title,
    description,
    robots,
    alternates: {
      canonical: canonicalUrl,
      languages: hreflang,
    },
    openGraph: {
      title,
      description,
      url: canonicalUrl,
      locale,
      type: 'website',
      images: [ogImage],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [ogImage.url],
    },
  };
}
