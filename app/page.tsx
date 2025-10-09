import type { Metadata } from 'next';
import { cookies, headers } from 'next/headers';
import { NextIntlClientProvider, type AbstractIntlMessages } from 'next-intl';
import LandingExperience from '@/app/(site)/components/LandingExperience';
import LocaleSuggestion from '@/app/(site)/components/LocaleSuggestion';
import ReferralAttribution from '@/app/(site)/components/ReferralAttribution';
import { loadMessages } from '@/lib/intl/loadMessages';
import {
  DEFAULT_LOCALE,
  isSupportedLocale,
  resolveLocaleFromAcceptLanguage,
  type AppLocale,
} from '@/lib/i18n/locales';
import {
  buildAlternateLanguageMap,
  buildCanonicalPath,
  buildCanonicalUrl,
  resolveSiteBaseUrl,
} from '@/lib/i18n/metadata';
import { LOCALE_COOKIE } from '@/lib/theme/constants';
import { SITE_NAME } from '@/constants/site';
const BOT_REGEX = /(bot|crawler|spider|bingpreview|facebookexternalhit|pinterest|embedly|quora link preview)/i;

type RootSearchParams = Promise<Record<string, string | string[] | undefined>>;

function firstParam(value: string | string[] | undefined): string | null {
  if (typeof value === 'string') return value;
  if (Array.isArray(value) && value.length) return value[0] ?? null;
  return null;
}

type MetadataArgs = {
  searchParams: RootSearchParams;
};

export async function generateMetadata({ searchParams }: MetadataArgs): Promise<Metadata> {
  const resolvedSearchParams = await searchParams;
  const messages = (await loadMessages(DEFAULT_LOCALE.value)) as Record<string, unknown>;
  const heroMessages = (messages.hero ?? {}) as Record<string, unknown>;
  const heroSubtitle = typeof heroMessages.sub === 'string'
    ? heroMessages.sub
    : 'Louhen pairs podiatrist-backed comfort with adaptive sizing to keep every step confident.';
  const defaultTitle = `${SITE_NAME} — Personal style. Effortless fit.`;
  const defaultDescription = heroSubtitle;
  const baseUrl = resolveSiteBaseUrl();
  const canonicalPath = buildCanonicalPath(DEFAULT_LOCALE.value, '/');
  const canonicalUrl = buildCanonicalUrl(DEFAULT_LOCALE.value, '/');
  const languages = buildAlternateLanguageMap('/');

  const ref = firstParam(resolvedSearchParams.ref);
  if (!ref) {
    return {
      title: defaultTitle,
      description: defaultDescription,
      alternates: {
        canonical: canonicalPath,
        languages,
      },
      openGraph: {
        title: defaultTitle,
        description: defaultDescription,
        url: canonicalUrl,
      },
      twitter: {
        title: defaultTitle,
        description: defaultDescription,
      },
    };
  }

  const sharePath = `${canonicalPath}?ref=${encodeURIComponent(ref)}`;
  const fullUrl = `${baseUrl}${sharePath}`;
  const imageUrl = `${baseUrl}/api/og?locale=${DEFAULT_LOCALE.value}&ref=${encodeURIComponent(ref)}`;

  return {
    title: defaultTitle,
    description: defaultDescription,
    alternates: {
      canonical: canonicalPath,
      languages,
    },
    openGraph: {
      title: defaultTitle,
      description: defaultDescription,
      url: fullUrl,
      images: [imageUrl],
    },
    twitter: {
      title: defaultTitle,
      description: defaultDescription,
      images: [imageUrl],
    },
  };
}

type RootPageProps = {
  searchParams: RootSearchParams;
};

type LocaleSuggestionState = {
  locale: AppLocale;
  reason: 'cookie' | 'accept-language';
};

export default async function RootLandingPage({ searchParams }: RootPageProps) {
  const cookieStore = await cookies();
  const localeCookie = cookieStore.get(LOCALE_COOKIE)?.value ?? null;
  const headerStore = await headers();
  const ua = headerStore.get('user-agent') ?? '';
  const acceptLanguageHeader = headerStore.get('accept-language');
  const isBot = BOT_REGEX.test(ua.toLowerCase());

  let suggestion: LocaleSuggestionState | null = null;

  if (!isBot) {
    const cookieLocale = localeCookie && isSupportedLocale(localeCookie) ? localeCookie : null;
    if (cookieLocale && cookieLocale !== DEFAULT_LOCALE.value) {
      suggestion = { locale: cookieLocale, reason: 'cookie' };
    } else if (!cookieLocale) {
      const matchedLocale = resolveLocaleFromAcceptLanguage(acceptLanguageHeader);
      if (matchedLocale && matchedLocale !== DEFAULT_LOCALE.value) {
        suggestion = { locale: matchedLocale, reason: 'accept-language' };
      }
    }
  }

  const rawMessages = await loadMessages(DEFAULT_LOCALE.value);
  const messagesRecord = rawMessages as unknown as Record<string, unknown>;
  const resolvedSearchParams = await searchParams;
  const referralToast = ((messagesRecord.referral ?? {}) as Record<string, unknown>).appliedToast;
  const toastMessage = typeof referralToast === 'string' ? referralToast : null;

  return (
    <NextIntlClientProvider
      locale={DEFAULT_LOCALE.value}
      messages={rawMessages as AbstractIntlMessages}
      timeZone="UTC"
    >
      <ReferralAttribution searchParams={resolvedSearchParams} message={toastMessage} />
      {suggestion ? <LocaleSuggestion targetLocale={suggestion.locale} reason={suggestion.reason} /> : null}
      <LandingExperience />
    </NextIntlClientProvider>
  );
}
