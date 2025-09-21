import React from 'react';
import type { Metadata } from 'next';
import { cookies, headers } from 'next/headers';
import StateCard from '@/components/marketing/StateCard';
import TrackView from '@/components/marketing/TrackView';
import ResendConfirmForm, { type ResendConfirmStrings } from '@/components/waitlist/ResendConfirmForm';
import { cn, layout } from '@/app/(site)/_lib/ui';
import { extractLocaleFromCookies, resolveLocale as resolveLocaleValue } from '@/lib/intl/getLocale';
import { loadMessages } from '@/lib/intl/loadMessages';
import type { SupportedLocale } from '@/next-intl.locales';

export const revalidate = 0;
export const dynamic = 'force-dynamic';

type UnknownRecord = Record<string, unknown>;

function isRecord(value: unknown): value is UnknownRecord {
  return typeof value === 'object' && value !== null;
}

function getString(value: unknown, fallback: string): string {
  return typeof value === 'string' && value.trim().length > 0 ? value : fallback;
}

async function resolveLocale(): Promise<SupportedLocale> {
  const cookieStore = await cookies();
  const cookieLocale = resolveLocaleValue(cookieStore.get('NEXT_LOCALE')?.value ?? null);
  const headerList = await headers();
  const headerLocale = extractLocaleFromCookies(headerList.get('cookie'));
  return cookieLocale ?? headerLocale ?? 'en';
}

async function getMessages(locale: SupportedLocale) {
  return (await loadMessages(locale)) as UnknownRecord;
}

function baseUrl() {
  return (process.env.APP_BASE_URL || process.env.NEXT_PUBLIC_SITE_URL || 'https://louhen.com').replace(/\/$/, '');
}

export async function generateMetadata(): Promise<Metadata> {
  const locale = await resolveLocale();
  const messages = await getMessages(locale);
  const waitlist = isRecord(messages.waitlist) ? (messages.waitlist as UnknownRecord) : {};
  const expired = isRecord(waitlist.expired) ? (waitlist.expired as UnknownRecord) : {};
  const meta = isRecord(expired.meta) ? (expired.meta as UnknownRecord) : {};

  const title = getString(meta.title, 'Louhen waitlist – link expired');
  const description = getString(
    meta.description,
    'Your waitlist confirmation link expired. Request a new confirmation email in seconds.'
  );
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

function buildResendStrings(waitlist: UnknownRecord): ResendConfirmStrings {
  const resend = isRecord(waitlist.resend) ? (waitlist.resend as UnknownRecord) : {};
  const form = isRecord(waitlist.form) ? (waitlist.form as UnknownRecord) : {};
  const placeholders = isRecord(form.placeholders) ? (form.placeholders as UnknownRecord) : {};

  return {
    title: getString(resend.title, 'Need another email?'),
    description: getString(resend.description, 'Enter your email and we’ll send a fresh confirmation link right away.'),
    email: {
      label: getString(resend.email && isRecord(resend.email) ? (resend.email as UnknownRecord).label : undefined, 'Email address'),
      placeholder: getString(
        resend.email && isRecord(resend.email) ? (resend.email as UnknownRecord).placeholder : undefined,
        getString(placeholders.email, 'you@example.com')
      ),
    },
    submit: getString(resend.submit, 'Resend confirmation'),
    success: getString(resend.success, 'If that address is on the waitlist, a new confirmation email is already on its way.'),
    error: getString(resend.error, 'We couldn’t resend the email just now. Please try again shortly.'),
    rateLimited: getString(resend.rateLimited, 'Too many requests. Please wait a moment before trying again.'),
    invalid: getString(resend.invalid, 'Please enter a valid email address.'),
  };
}

export default async function WaitlistExpiredPage() {
  const locale = await resolveLocale();
  const messages = await getMessages(locale);
  const waitlist = isRecord(messages.waitlist) ? (messages.waitlist as UnknownRecord) : {};
  const expired = isRecord(waitlist.expired) ? (waitlist.expired as UnknownRecord) : {};

  const title = getString(expired.title, 'Link expired');
  const body = getString(
    expired.body,
    'The confirmation link you opened has expired. Request a new email below to finish signing up.'
  );
  const primaryCta = getString(expired.cta && isRecord(expired.cta) ? (expired.cta as UnknownRecord).resend : undefined, 'Back to waitlist');

  const resendStrings = buildResendStrings(waitlist);

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
