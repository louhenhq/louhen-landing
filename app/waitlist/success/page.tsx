import React from 'react';
import type { Metadata } from 'next';
import { cookies, headers } from 'next/headers';
import StateCard from '@/components/marketing/StateCard';
import TrackView from '@/components/marketing/TrackView';
import { extractLocaleFromCookies } from '@/lib/intl/getLocale';
import { loadMessages } from '@/lib/intl/loadMessages';
import type { SupportedLocale } from '@/next-intl.locales';

export const revalidate = 0;
export const dynamic = 'force-dynamic';

type PageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

async function resolveLocale(): Promise<SupportedLocale> {
  const cookieStore = await cookies();
  const cookieLocale = cookieStore.get('NEXT_LOCALE')?.value;
  const headerLocale = extractLocaleFromCookies(headers().get('cookie'));
  const candidate = (cookieLocale as SupportedLocale | undefined) ?? headerLocale;
  return (candidate ?? 'en') as SupportedLocale;
}

async function getMessages(locale: SupportedLocale) {
  return (await loadMessages(locale)) as Record<string, any>;
}

function baseUrl() {
  return (process.env.APP_BASE_URL || process.env.NEXT_PUBLIC_SITE_URL || 'https://louhen.com').replace(/\/$/, '');
}

export async function generateMetadata(): Promise<Metadata> {
  const locale = await resolveLocale();
  const messages = await getMessages(locale);
  const meta = ((messages.waitlist?.success?.meta) ?? {}) as Record<string, string>;
  const title = meta.title || 'Louhen waitlist – confirmation';
  const description = meta.description || 'Thanks for confirming your Louhen waitlist spot. We’ll reach out with curated updates soon.';
  const url = `${baseUrl()}/waitlist/success`;

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

function titleForStatus(messages: any, status: string | null) {
  if (status === 'confirmed') return messages.waitlist?.success?.title?.confirmed ?? 'You’re in! 🎉';
  return messages.waitlist?.success?.title?.pending ?? 'Check your inbox ✉️';
}

function bodyForStatus(messages: any, status: string | null) {
  if (status === 'confirmed') return messages.waitlist?.success?.body?.confirmed ?? 'We just unlocked your spot. Welcome aboard!';
  return messages.waitlist?.success?.body?.pending ?? 'We sent you a confirmation email. Follow the link to finish joining.';
}

export default async function WaitlistSuccessPage({ searchParams }: PageProps) {
  const resolvedSearchParams = await searchParams;
  const statusParam = typeof resolvedSearchParams.status === 'string' ? resolvedSearchParams.status : null;
  const locale = await resolveLocale();
  const messages = await getMessages(locale);
  const successMessages = (messages.waitlist as any)?.success ?? {};

  const title = titleForStatus(messages, statusParam);
  const body = bodyForStatus(messages, statusParam);
  const ctas = [
    {
      href: `/${locale}`,
      label: successMessages.cta?.home || 'Return home',
      kind: 'primary' as const,
    },
    {
      href: '/preferences',
      label: successMessages.cta?.preferences || 'Manage preferences',
      kind: 'secondary' as const,
    },
  ];

  return (
    <>
      <TrackView event="waitlist_landing_success_view" />
      <StateCard icon={statusParam === 'confirmed' ? '🎉' : '✉️'} title={title} body={body} ctas={ctas} />
    </>
  );
}
