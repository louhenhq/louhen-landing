import type { Metadata } from 'next';
import LandingExperience from '@/app/(site)/components/LandingExperience';
import ReferralAttribution from '@/app/(site)/components/ReferralAttribution';
import { loadMessages } from '@/lib/intl/loadMessages';
import type { SupportedLocale } from '@/next-intl.locales';

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
  const ref = firstParam(resolvedSearchParams.ref);
  if (!ref) return {};

  const messages = (await loadMessages(locale)) as Record<string, unknown>;
  const og = ((messages.og ?? {}) as Record<string, unknown>).invited as Record<string, unknown> | undefined;
  const title = typeof og?.title === 'string' ? og.title : 'A friend invited you to Louhen';
  const description = typeof og?.description === 'string' ? og.description : 'Join through their link to unlock early rewards and smarter sizing for every outfit.';
  const baseUrl = (process.env.NEXT_PUBLIC_SITE_URL || 'https://louhen-landing.vercel.app').replace(/\/$/, '');
  const sharePath = `/${locale}?ref=${encodeURIComponent(ref)}`;
  const fullUrl = `${baseUrl}${sharePath}`;
  const imageUrl = `${baseUrl}/opengraph-image?locale=${locale}&ref=${encodeURIComponent(ref)}`;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      url: fullUrl,
      images: [imageUrl],
    },
    twitter: {
      title,
      description,
      images: [imageUrl],
    },
  };
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
