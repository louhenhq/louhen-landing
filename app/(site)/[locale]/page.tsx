import type { Metadata } from 'next';
import LandingExperience from '@/app/(site)/components/LandingExperience';
import { ReferralAttribution } from '@components/features/waitlist';
import { SITE_NAME } from '@/constants/site';
import { getHeaderUserState } from '@/lib/auth/userState.server';
import { loadMessages } from '@/lib/intl/loadMessages';
import { safeGetMessage } from '@/lib/intl/getMessage';
import { localeHomePath } from '@lib/shared/routing/legal-path';
import { isPrelaunch } from '@/lib/env/prelaunch';
import { getSiteOrigin, hreflangMapFor, makeCanonical } from '@/lib/seo/shared';
import { getOgImageEntry } from '@lib/shared/og/builder';
import type { SupportedLocale } from '@/next-intl.locales';
import { unstable_setRequestLocale } from 'next-intl/server';

export const runtime = 'nodejs';

type PageProps = {
  params: Promise<{ locale: SupportedLocale }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

function firstParam(value: string | string[] | undefined): string | null {
  if (typeof value === 'string') return value;
  if (Array.isArray(value) && value.length) return value[0] ?? null;
  return null;
}

export async function generateMetadata({ params, searchParams }: PageProps): Promise<Metadata> {
  const [{ locale }, resolvedSearchParams] = await Promise.all([params, searchParams]);
  const messages = (await loadMessages(locale)) as Record<string, unknown>;
  const heroHeadline = safeGetMessage(messages, 'hero.h1', {
    locale,
    fallbackHint: 'home hero headline',
  });
  const defaultDescription = safeGetMessage(messages, 'hero.sub', {
    locale,
    fallbackHint: 'home hero subhead',
  });
  const baseUrl = getSiteOrigin();
  const canonicalPath = localeHomePath(locale);
  const canonicalUrl = makeCanonical(canonicalPath, baseUrl);
  const hreflang = hreflangMapFor(localeHomePath, baseUrl);
  const ref = firstParam(resolvedSearchParams.ref);
  const sanitizedRef = ref ? ref.trim().slice(0, 64) : null;
  const robots = isPrelaunch()
    ? { index: false, follow: false }
    : undefined;
  const baseOgImage = getOgImageEntry({
    locale,
    key: 'home',
    title: heroHeadline,
    description: defaultDescription,
  });

  const baseMetadata = {
    description: defaultDescription,
    alternates: {
      canonical: canonicalUrl,
      languages: hreflang,
    },
    openGraph: {
      title: heroHeadline,
      description: defaultDescription,
      url: canonicalUrl,
      locale,
      images: [baseOgImage],
    },
    twitter: {
      card: 'summary_large_image' as const,
      title: heroHeadline,
      description: defaultDescription,
      images: [baseOgImage.url],
    },
  };

  if (!sanitizedRef) {
    const defaultTitle = heroHeadline ? `${heroHeadline} | ${SITE_NAME}` : SITE_NAME;
    return {
      title: defaultTitle,
      robots,
      ...baseMetadata,
    };
  }

  const invitedTitle = safeGetMessage(messages, 'og.invited.title', {
    locale,
    fallbackHint: 'home invited og title',
  });
  const invitedDescription = safeGetMessage(messages, 'og.invited.description', {
    locale,
    fallbackHint: 'home invited og description',
  });
  const sharePath = sanitizedRef ? `/${locale}?ref=${encodeURIComponent(sanitizedRef)}` : canonicalPath;
  const fullUrl = `${baseUrl}${sharePath}`;
  const invitedOgImage = getOgImageEntry({
    locale,
    key: 'home-invited',
    title: invitedTitle,
    description: invitedDescription,
    params: sanitizedRef ? { ref: sanitizedRef } : undefined,
  });

  return {
    title: invitedTitle,
    description: invitedDescription,
    robots,
    alternates: baseMetadata.alternates,
    openGraph: {
      ...baseMetadata.openGraph,
      title: invitedTitle,
      description: invitedDescription,
      url: fullUrl,
      images: [invitedOgImage],
    },
    twitter: {
      ...baseMetadata.twitter,
      title: invitedTitle,
      description: invitedDescription,
      images: [invitedOgImage.url],
    },
  };
}

export default async function LocaleLandingPage({ params, searchParams }: PageProps) {
  const [{ locale }, resolvedSearchParams] = await Promise.all([params, searchParams]);
  unstable_setRequestLocale(locale);
  const messages = (await loadMessages(locale)) as Record<string, unknown>;
  const toastMessage = safeGetMessage(messages, 'referral.appliedToast', {
    locale,
    fallbackHint: 'home referral toast',
  });
  const headerUserState = await getHeaderUserState();

  return (
    <>
      <ReferralAttribution searchParams={resolvedSearchParams} message={toastMessage} />
      <LandingExperience userState={headerUserState} />
    </>
  );
}
