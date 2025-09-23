import type { Metadata } from 'next'
import LandingExperience from '@/app/(site)/components/LandingExperience'
import ReferralAttribution from '@/app/(site)/components/ReferralAttribution'
import { SITE_NAME } from '@/constants/site'
import { loadMessages } from '@/lib/intl/loadMessages'
import { resolveBaseUrl } from '@/lib/seo/baseUrl'
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

export async function generateMetadata({ params, searchParams }: PageProps): Promise<Metadata> {
  const [{ locale }, resolvedSearchParams] = await Promise.all([params, searchParams])
  const messages = (await loadMessages(locale)) as Record<string, unknown>
  const homeMessages = (messages.home ?? {}) as Record<string, unknown>
  const metaMessages = (homeMessages.meta ?? {}) as Record<string, unknown>
  const defaultTitle = typeof metaMessages.title === 'string'
    ? metaMessages.title
    : `${SITE_NAME} — Personal style. Effortless fit.`
  const defaultDescription = typeof metaMessages.description === 'string'
    ? metaMessages.description
    : 'Join the Louhen waitlist and get smarter sizing, curated looks, and fit feedback that improves with every try.'
  const baseUrl = await resolveBaseUrl()
  const canonicalPath = `/${locale}`
  const ref = firstParam(resolvedSearchParams.ref)

  if (!ref) {
    return {
      title: { absolute: defaultTitle },
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
    title: { absolute: invitedTitle },
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
