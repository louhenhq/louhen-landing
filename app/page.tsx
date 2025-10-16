import type { Metadata } from 'next';
import { cookies, headers } from 'next/headers';
import { NextIntlClientProvider, type AbstractIntlMessages } from 'next-intl';
import LandingExperience from '@/app/(site)/components/LandingExperience';
import LocaleSuggestion from '@/app/(site)/components/LocaleSuggestion';
import { ReferralAttribution } from '@components/features/waitlist';
import { loadMessages } from '@/lib/intl/loadMessages';
import { safeGetMessage } from '@/lib/intl/getMessage';
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
import { getOgImageEntry } from '@lib/shared/og/builder';
import { LOCALE_COOKIE } from '@/lib/theme/constants';
import { SITE_NAME } from '@/constants/site';
import { getHeaderUserState } from '@server/auth/user-state.server';
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
  const heroHeadline = safeGetMessage(messages, 'hero.h1', {
    locale: DEFAULT_LOCALE.value,
    fallbackHint: 'home hero headline',
  });
  const defaultDescription = safeGetMessage(messages, 'hero.sub', {
    locale: DEFAULT_LOCALE.value,
    fallbackHint: 'home hero subhead',
  });
  const baseUrl = resolveSiteBaseUrl();
  const canonicalPath = buildCanonicalPath(DEFAULT_LOCALE.value, '/');
  const canonicalUrl = buildCanonicalUrl(DEFAULT_LOCALE.value, '/');
  const languages = buildAlternateLanguageMap('/');

  const baseOgImage = getOgImageEntry({
    locale: DEFAULT_LOCALE.value,
    key: 'home',
    title: heroHeadline,
    description: defaultDescription,
  });
  const ref = firstParam(resolvedSearchParams.ref);
  const sanitizedRef = ref ? ref.trim().slice(0, 64) : null;
  if (!sanitizedRef) {
    return {
      title: heroHeadline || SITE_NAME,
      description: defaultDescription,
      alternates: {
        canonical: canonicalPath,
        languages,
      },
      openGraph: {
        title: heroHeadline,
        description: defaultDescription,
        url: canonicalUrl,
        images: [baseOgImage],
      },
      twitter: {
        card: 'summary_large_image',
        title: heroHeadline,
        description: defaultDescription,
        images: [baseOgImage.url],
      },
    };
  }

  const sharePath = `${canonicalPath}?ref=${encodeURIComponent(sanitizedRef)}`;
  const fullUrl = `${baseUrl}${sharePath}`;
  const invitedTitle = safeGetMessage(messages, 'og.invited.title', {
    locale: DEFAULT_LOCALE.value,
    fallbackHint: 'home invited og title',
  });
  const invitedDescription = safeGetMessage(messages, 'og.invited.description', {
    locale: DEFAULT_LOCALE.value,
    fallbackHint: 'home invited og description',
  });

  const invitedOgImage = getOgImageEntry({
    locale: DEFAULT_LOCALE.value,
    key: 'home-invited',
    title: invitedTitle,
    description: invitedDescription,
    params: { ref: sanitizedRef },
  });

  return {
    title: heroHeadline,
    description: defaultDescription,
    alternates: {
      canonical: canonicalPath,
      languages,
    },
    openGraph: {
      title: heroHeadline,
      description: invitedDescription,
      url: fullUrl,
      images: [invitedOgImage],
    },
    twitter: {
      card: 'summary_large_image',
      title: invitedTitle,
      description: invitedDescription,
      images: [invitedOgImage.url],
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
  const toastMessage = safeGetMessage(messagesRecord, 'referral.appliedToast', {
    locale: DEFAULT_LOCALE.value,
    fallbackHint: 'home referral toast',
  });
  const headerUserState = await getHeaderUserState();

  return (
    <NextIntlClientProvider
      locale={DEFAULT_LOCALE.value}
      messages={rawMessages as AbstractIntlMessages}
      timeZone="UTC"
    >
      <ReferralAttribution searchParams={resolvedSearchParams} message={toastMessage} />
      {suggestion ? <LocaleSuggestion targetLocale={suggestion.locale} reason={suggestion.reason} /> : null}
      <LandingExperience userState={headerUserState} />
    </NextIntlClientProvider>
  );
}
