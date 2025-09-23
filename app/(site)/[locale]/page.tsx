import type { Metadata } from 'next'
import LandingExperience from '@/app/(site)/components/LandingExperience'
import ReferralAttribution from '@/app/(site)/components/ReferralAttribution'
import { SITE_NAME } from '@/constants/site'
import { loadMessages } from '@/lib/intl/loadMessages'
import type { SupportedLocale } from '@/next-intl.locales'

type PageProps = {
  params: Promise<{ locale: SupportedLocale }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

function firstParam(value: string | string[] | undefined): string | null {
  if (typeof value === 'string') return value;
  if (Array.isArray(value) && value.length) return value[0] ?? null;
  return null;
}

const FALLBACK_SITE_URL = 'https://louhen-landing.vercel.app'

export async function generateMetadata({ params, searchParams }: PageProps): Promise<Metadata> {
  const [{ locale }, resolvedSearchParams] = await Promise.all([params, searchParams])
  const messages = (await loadMessages(locale)) as Record<string, unknown>
  const heroMessages = (messages.hero ?? {}) as Record<string, unknown>
  const heroSubtitle = typeof heroMessages.sub === 'string'
    ? heroMessages.sub
    : 'Louhen pairs podiatrist-backed comfort with adaptive sizing to keep every step confident.'
  const defaultTitle = `${SITE_NAME} — Personal style. Effortless fit.`
  const defaultDescription = heroSubtitle
  const baseUrl = (process.env.APP_BASE_URL?.trim() || process.env.NEXT_PUBLIC_SITE_URL?.trim() || FALLBACK_SITE_URL).replace(/\/$/, '')
  const canonicalPath = `/${locale}`
  const ref = firstParam(resolvedSearchParams.ref)

  if (!ref) {
    return {
      title: defaultTitle,
      description: defaultDescription,
      alternates: {
        canonical: canonicalPath,
      },
      openGraph: {
        title: defaultTitle,
        description: defaultDescription,
        url: canonicalPath,
      },
      twitter: {
        title: defaultTitle,
        description: defaultDescription,
      },
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
    alternates: {
      canonical: canonicalPath,
    },
    openGraph: {
      title: invitedTitle,
      description: invitedDescription,
      url: fullUrl,
      images: [imageUrl],
    },
    twitter: {
      title: invitedTitle,
      description: invitedDescription,
      images: [imageUrl],
    },
  }
}

export default async function LocaleLandingPage({ params, searchParams }: PageProps) {
  const [{ locale }, resolvedSearchParams] = await Promise.all([params, searchParams]);
  const messages = (await loadMessages(locale)) as Record<string, unknown>;
  const referralToast = ((messages.referral ?? {}) as Record<string, unknown>).appliedToast;
  const toastMessage = typeof referralToast === 'string' ? referralToast : null;

  return (
    <>
      <ReferralAttribution searchParams={resolvedSearchParams} message={toastMessage} />
      <LandingExperience />
    </>
  );
}
