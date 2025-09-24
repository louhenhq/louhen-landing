import React from 'react';
import type { Metadata } from 'next';
import { cookies, headers } from 'next/headers';
import StateCard from '@/components/marketing/StateCard';
import TrackView from '@/components/marketing/TrackView';
import { extractLocaleFromCookies, resolveLocale as resolveLocaleValue } from '@/lib/intl/getLocale';
import { loadMessages } from '@/lib/intl/loadMessages';
import { buildLocaleAlternates } from '@/lib/seo/alternates';
import type { PageProps, SearchParams } from '@/lib/nextTypes';
import { LOCALE_COOKIE, defaultLocale, type SupportedLocale } from '@/next-intl.locales';

export const revalidate = 0;
export const dynamic = 'force-dynamic';

type WaitlistSuccessSearchParams = SearchParams & {
  status?: string | string[];
};

type UnknownRecord = Record<string, unknown>;

type StatusKey = 'confirmed' | 'pending';

function isRecord(value: unknown): value is UnknownRecord {
  return typeof value === 'object' && value !== null;
}

function getString(value: unknown, fallback: string): string {
  return typeof value === 'string' && value.trim().length > 0 ? value : fallback;
}

async function resolveLocale(): Promise<SupportedLocale> {
  const cookieStore = await cookies();
  const cookieLocale = resolveLocaleValue(cookieStore.get(LOCALE_COOKIE)?.value ?? null);
  const headerList = await headers();
  const headerLocale = extractLocaleFromCookies(headerList.get('cookie'));
  return cookieLocale ?? headerLocale ?? defaultLocale;
}

async function getMessages(locale: SupportedLocale) {
  return (await loadMessages(locale)) as UnknownRecord;
}

export async function generateMetadata(): Promise<Metadata> {
  const locale = await resolveLocale();
  const messages = await getMessages(locale);
  const waitlist = isRecord(messages.waitlist) ? (messages.waitlist as UnknownRecord) : {};
  const success = isRecord(waitlist.success) ? (waitlist.success as UnknownRecord) : {};
  const meta = isRecord(success.meta) ? (success.meta as UnknownRecord) : {};

  const title = getString(meta.title, 'Louhen waitlist – confirmation');
  const description = getString(
    meta.description,
    'Your Louhen waitlist place is confirmed. Expect curated updates and early access soon.'
  );
  const { canonical, alternates } = await buildLocaleAlternates(locale, '/waitlist/success');

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      url: canonical,
    },
    alternates,
  };
}

async function resolveSearchParamsValue(
  searchParams?: WaitlistSuccessSearchParams | Promise<WaitlistSuccessSearchParams>
): Promise<WaitlistSuccessSearchParams | undefined> {
  if (!searchParams) return undefined;
  if (typeof (searchParams as unknown as Promise<unknown>).then === 'function') {
    return (await searchParams) ?? undefined;
  }
  return searchParams;
}

function pickStatus(searchParams?: WaitlistSuccessSearchParams | undefined): StatusKey {
  const raw = searchParams?.status;
  const value = Array.isArray(raw) ? raw[0] : raw;
  return value === 'confirmed' ? 'confirmed' : 'pending';
}

function titleForStatus(successMessages: UnknownRecord, status: StatusKey): string {
  const titles = isRecord(successMessages.title) ? (successMessages.title as UnknownRecord) : {};
  return getString(
    titles[status],
    status === 'confirmed' ? 'You’re in! 🎉' : 'Check your inbox ✉️'
  );
}

function bodyForStatus(successMessages: UnknownRecord, status: StatusKey): string {
  const bodies = isRecord(successMessages.body) ? (successMessages.body as UnknownRecord) : {};
  return getString(
    bodies[status],
    status === 'confirmed'
      ? 'Thanks for confirming. Your Louhen waitlist spot is saved—watch your inbox for invites and styling updates.'
      : 'Open the confirmation email we just sent to finish joining the waitlist.'
  );
}

export default async function WaitlistSuccessPage({ searchParams }: PageProps<WaitlistSuccessSearchParams>) {
  const resolvedSearchParams = await resolveSearchParamsValue(searchParams);
  const status = pickStatus(resolvedSearchParams);
  const locale = await resolveLocale();
  const messages = await getMessages(locale);
  const waitlist = isRecord(messages.waitlist) ? (messages.waitlist as UnknownRecord) : {};
  const successMessages = isRecord(waitlist.success) ? (waitlist.success as UnknownRecord) : {};
  const ctaMessages = isRecord(successMessages.cta) ? (successMessages.cta as UnknownRecord) : {};

  const title = titleForStatus(successMessages, status);
  const body = bodyForStatus(successMessages, status);

  const ctas = [
    {
      href: `/${locale}`,
      label: getString(ctaMessages.home, 'Return home'),
      kind: 'primary' as const,
    },
    {
      href: '/preferences',
      label: getString(ctaMessages.preferences, 'Manage email preferences'),
      kind: 'secondary' as const,
    },
  ];

  return (
    <>
      <TrackView event="waitlist_landing_success_view" />
      <StateCard icon={status === 'confirmed' ? '🎉' : '✉️'} title={title} body={body} ctas={ctas} />
    </>
  );
}
