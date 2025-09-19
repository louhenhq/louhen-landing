import React from 'react';
import type { Metadata } from 'next';
import { cookies, headers } from 'next/headers';
import StateCard from '@/components/marketing/StateCard';
import { extractLocaleFromCookies } from '@/lib/intl/getLocale';
import { loadMessages } from '@/lib/intl/loadMessages';
import type { SupportedLocale } from '@/next-intl.locales';

export const revalidate = 0;
export const dynamic = 'force-dynamic';

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
  const meta = ((messages.waitlist?.index?.meta) ?? {}) as Record<string, string>;
  const title = meta.title || 'Louhen waitlist';
  const description = meta.description || 'See how the Louhen waitlist works and confirm your spot in minutes.';
  const url = `${baseUrl()}/waitlist`;

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

export default async function WaitlistIndexPage() {
  const locale = await resolveLocale();
  const messages = await getMessages(locale);
  const indexMessages = messages.waitlist?.index ?? {};
  const steps: string[] = Array.isArray(indexMessages.steps) ? indexMessages.steps : [];

  const body = (
    <div className="flex flex-col gap-md text-left">
      <p>{indexMessages.body || 'Three simple steps are all it takes to secure early access.'}</p>
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
      title={indexMessages.title || 'Join the Louhen waitlist'}
      body={body}
      align="start"
      ctas={[
        {
          href: `/${locale}#waitlist-form`,
          label: indexMessages.cta?.join || 'Join the waitlist',
          kind: 'primary',
        },
        {
          href: `/${locale}/privacy`,
          label: indexMessages.cta?.privacy || 'Privacy',
          kind: 'secondary',
        },
        {
          href: `/${locale}#faq`,
          label: indexMessages.cta?.faq || 'FAQ',
          kind: 'secondary',
        },
      ]}
    />
  );
}
