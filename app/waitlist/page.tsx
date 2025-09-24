import React from 'react';
import type { Metadata } from 'next';
import { cookies, headers } from 'next/headers';
import StateCard from '@/components/marketing/StateCard';
import { extractLocaleFromCookies, resolveLocale as resolveLocaleValue } from '@/lib/intl/getLocale';
import { loadMessages } from '@/lib/intl/loadMessages';
import { buildLocaleAlternates } from '@/lib/seo/alternates';
import { LOCALE_COOKIE, defaultLocale, type SupportedLocale } from '@/next-intl.locales';

export const revalidate = 0;
export const dynamic = 'force-dynamic';

async function resolveLocale(): Promise<SupportedLocale> {
  const cookieStore = await cookies();
  const cookieLocale = resolveLocaleValue(cookieStore.get(LOCALE_COOKIE)?.value ?? null);
  const headerList = await headers();
  const headerLocale = extractLocaleFromCookies(headerList.get('cookie'));
  return cookieLocale ?? headerLocale ?? defaultLocale;
}

type UnknownRecord = Record<string, unknown>;

function isRecord(value: unknown): value is UnknownRecord {
  return typeof value === 'object' && value !== null;
}

function getString(value: unknown, fallback: string): string {
  return typeof value === 'string' && value.trim().length > 0 ? value : fallback;
}

function getStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.filter((item): item is string => typeof item === 'string' && item.trim().length > 0);
}

async function getMessages(locale: SupportedLocale) {
  return (await loadMessages(locale)) as UnknownRecord;
}

export async function generateMetadata(): Promise<Metadata> {
  const locale = await resolveLocale();
  const messages = await getMessages(locale);
  const waitlist = isRecord(messages.waitlist) ? (messages.waitlist as UnknownRecord) : {};
  const index = isRecord(waitlist.index) ? (waitlist.index as UnknownRecord) : {};
  const meta = isRecord(index.meta) ? (index.meta as UnknownRecord) : {};

  const title = getString(meta.title, 'Louhen waitlist');
  const description = getString(
    meta.description,
    'Discover how to join the Louhen waitlist and secure early access in minutes.'
  );
  const { canonical, alternates } = await buildLocaleAlternates(locale, '/waitlist');

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

export default async function WaitlistIndexPage() {
  const locale = await resolveLocale();
  const messages = await getMessages(locale);
  const waitlist = isRecord(messages.waitlist) ? (messages.waitlist as UnknownRecord) : {};
  const index = isRecord(waitlist.index) ? (waitlist.index as UnknownRecord) : {};
  const cta = isRecord(index.cta) ? (index.cta as UnknownRecord) : {};
  const steps = getStringArray(index.steps);

  const body = (
    <div className="flex flex-col gap-md text-left">
      <p>{getString(index.body, 'Join the waitlist to receive curated drops, styling guidance, and the LouhenFit guarantee before anyone else.')}</p>
      {steps.length ? (
        <ul className="list-disc list-inside flex flex-col gap-xs text-left">
          {steps.map((step) => (
            <li key={step}>{step}</li>
          ))}
        </ul>
      ) : null}
    </div>
  );

  return (
    <StateCard
      icon="🪄"
      title={getString(index.title, 'Get early access with Louhen')}
      body={body}
      align="start"
      ctas={[
        {
          href: `/${locale}#waitlist-form`,
          label: getString(cta.join, 'Join the waitlist'),
          kind: 'primary',
        },
        {
          href: `/${locale}/privacy`,
          label: getString(cta.privacy, 'Privacy policy'),
          kind: 'secondary',
        },
        {
          href: `/${locale}#faq`,
          label: getString(cta.faq, 'Read the FAQ'),
          kind: 'secondary',
        },
      ]}
    />
  );
}
