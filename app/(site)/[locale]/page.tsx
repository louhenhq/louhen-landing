import type { Metadata } from 'next'
import LandingExperience from '@/app/(site)/components/LandingExperience'
import ReferralAttribution from '@/app/(site)/components/ReferralAttribution'
import { SITE_NAME } from '@/constants/site'
import { getHeaderUserState } from '@/lib/auth/userState.server'
import { loadMessages } from '@/lib/intl/loadMessages'
import { localeHomePath } from '@/lib/routing/legalPath'
import { hreflangMapFor, makeCanonical, resolveBaseUrl } from '@/lib/seo/shared'
import type { SupportedLocale } from '@/next-intl.locales'
import { unstable_setRequestLocale } from 'next-intl/server'

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
  const [{ locale }, resolvedSearchParams] = await Promise.all([params, searchParams])
  const messages = (await loadMessages(locale)) as Record<string, unknown>
  const heroMessages = (messages.hero ?? {}) as Record<string, unknown>
  const heroSubtitle = typeof heroMessages.sub === 'string'
    ? heroMessages.sub
    : 'Louhen pairs podiatrist-backed comfort with adaptive sizing to keep every step confident.'
  const defaultTitle = `${SITE_NAME} — Personal style. Effortless fit.`
  const defaultDescription = heroSubtitle
  const baseUrl = resolveBaseUrl()
  const canonicalPath = localeHomePath(locale)
  const canonicalUrl = makeCanonical(canonicalPath, baseUrl)
  const hreflang = hreflangMapFor(localeHomePath, baseUrl)
  const ref = firstParam(resolvedSearchParams.ref)

  const baseMetadata = {
    description: defaultDescription,
    alternates: {
      canonical: canonicalUrl,
      languages: hreflang,
    },
    openGraph: {
      title: defaultTitle,
      description: defaultDescription,
      url: canonicalUrl,
      locale,
    },
    twitter: {
      card: 'summary_large_image' as const,
      title: defaultTitle,
      description: defaultDescription,
    },
  }

  if (!ref) {
    return {
      title: defaultTitle,
      ...baseMetadata,
    }
  }

  const og = ((messages.og ?? {}) as Record<string, unknown>).invited as Record<string, unknown> | undefined
  const invitedTitle = typeof og?.title === 'string' ? og.title : 'A friend invited you to Louhen'
  const invitedDescription = typeof og?.description === 'string'
    ? og.description
    : 'Join through their link to unlock early rewards and smarter sizing for every outfit.'
  const sharePath = `/${locale}?ref=${encodeURIComponent(ref)}`
  const fullUrl = `${baseUrl}${sharePath}`
  const imageUrl = `${baseUrl}/opengraph-image?locale=${locale}&ref=${encodeURIComponent(ref)}`

  return {
    title: invitedTitle,
    description: invitedDescription,
    alternates: baseMetadata.alternates,
    openGraph: {
      ...baseMetadata.openGraph,
      title: invitedTitle,
      description: invitedDescription,
      url: fullUrl,
      images: [imageUrl],
    },
    twitter: {
      ...baseMetadata.twitter,
      title: invitedTitle,
      description: invitedDescription,
      images: [imageUrl],
    },
  }
}

export default async function LocaleLandingPage({ params, searchParams }: PageProps) {
  const [{ locale }, resolvedSearchParams] = await Promise.all([params, searchParams]);
  unstable_setRequestLocale(locale);
  const messages = (await loadMessages(locale)) as Record<string, unknown>;
  const referralToast = ((messages.referral ?? {}) as Record<string, unknown>).appliedToast;
  const toastMessage = typeof referralToast === 'string' ? referralToast : null;
  const headerUserState = await getHeaderUserState();

  return (
    <>
      <ReferralAttribution searchParams={resolvedSearchParams} message={toastMessage} />
      <LandingExperience userState={headerUserState} />
    </>
  );
}
