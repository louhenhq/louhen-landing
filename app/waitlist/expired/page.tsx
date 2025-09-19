import React from 'react';
import type { Metadata } from 'next';
import { cookies, headers } from 'next/headers';
import StateCard from '@/components/marketing/StateCard';
import TrackView from '@/components/marketing/TrackView';
import ResendConfirmForm from '@/components/waitlist/ResendConfirmForm';
import { extractLocaleFromCookies } from '@/lib/intl/getLocale';
import { loadMessages } from '@/lib/intl/loadMessages';
import type { SupportedLocale } from '@/next-intl.locales';
import { cn, layout } from '@/app/(site)/_lib/ui';

export const revalidate = 0;
export const dynamic = 'force-dynamic';

type WaitlistMessages = Record<string, unknown> & {
  waitlist?: Record<string, unknown>;
};

async function resolveLocale(): Promise<SupportedLocale> {
  const cookieStore = await cookies();
  const cookieLocale = cookieStore.get('NEXT_LOCALE')?.value;
  const headerLocale = extractLocaleFromCookies(headers().get('cookie'));
  const candidate = (cookieLocale as SupportedLocale | undefined) ?? headerLocale;
  return (candidate ?? 'en') as SupportedLocale;
}

async function getMessages(locale: SupportedLocale) {
  return (await loadMessages(locale)) as WaitlistMessages;
}

function baseUrl() {
  return (process.env.APP_BASE_URL || process.env.NEXT_PUBLIC_SITE_URL || 'https://louhen.com').replace(/\/$/, '');
}

export async function generateMetadata(): Promise<Metadata> {
  const locale = await resolveLocale();
  const messages = await getMessages(locale);
  const meta = ((messages.waitlist as any)?.expired?.meta ?? {}) as Record<string, string>;
  const title = meta.title || 'Louhen waitlist – link expired';
  const description = meta.description || 'Your waitlist confirmation link expired. Request a new email to finish joining Louhen.';
  const url = `${baseUrl()}/waitlist/expired`;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      url,
    },
    alternates: {
      canonical: url,
    },
  };
}

export default async function WaitlistExpiredPage() {
  const locale = await resolveLocale();
  const messages = await getMessages(locale);
  const waitlistMessages = (messages.waitlist as any) ?? {};
  const expiredMessages = waitlistMessages.expired ?? {};
  const resendMessages = waitlistMessages.resend ?? {};
  const placeholders = waitlistMessages.form?.placeholders ?? {};

  const title = expiredMessages.title || 'Link expired';
  const body = expiredMessages.body || 'The confirmation link is no longer valid. Please submit the waitlist form again.';
  const primaryCta = expiredMessages.cta?.resend || 'Back to waitlist';

  const resendStrings = {
    title: resendMessages.title || 'Need another email?',
    description: resendMessages.description || 'Enter your email and we’ll send a new confirmation link right away.',
    email: {
      label: resendMessages.email?.label || 'Email',
      placeholder: resendMessages.email?.placeholder || placeholders.email || 'you@example.com',
    },
    submit: resendMessages.submit || 'Resend confirmation',
    success: resendMessages.success || 'If that email is on the waitlist, a fresh confirmation link is on the way.',
    error: resendMessages.error || 'We couldn’t resend the email. Please try again in a moment.',
    rateLimited: resendMessages.rateLimited || 'Too many requests. Please wait before trying again.',
    invalid: resendMessages.invalid || 'Please enter a valid email address.',
  };

  return (
    <>
      <TrackView event="waitlist_landing_expired_view" />
      <StateCard
        icon="⏳"
        title={title}
        body={body}
        ctas={[
          {
            href: `/${locale}#waitlist-form`,
            label: primaryCta,
            kind: 'primary',
          },
        ]}
      />
      <div className={cn(layout.container, 'pb-3xl')}>
        <ResendConfirmForm strings={resendStrings} />
      </div>
    </>
  );
}
