import type { Metadata } from 'next';
import { cookies } from 'next/headers';
import { WaitlistForm } from '@components/features/waitlist';
import { loadWaitlistMessages } from '@/app/(site)/[locale]/waitlist/_lib/messages';
import { getFlags } from '@/lib/shared/flags';
import { getSiteOrigin, hreflangMapFor, makeCanonical } from '@/lib/seo/shared';
import { isPrelaunch } from '@/lib/env/prelaunch';
import { getOgImageEntry } from '@lib/shared/og/builder';
import type { SupportedLocale } from '@/next-intl.locales';
import { safeGetMessage } from '@/lib/intl/getMessage';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const revalidate = 0;

type WaitlistPageParams = {
  locale: SupportedLocale;
};

export async function generateMetadata({ params }: { params: WaitlistPageParams }): Promise<Metadata> {
  const activeLocale = params.locale;
  const { messages } = await loadWaitlistMessages(activeLocale);
  const title = safeGetMessage(messages, 'waitlist.title', {
    locale: activeLocale,
    fallbackHint: 'waitlist hero title',
  });
  const description = safeGetMessage(messages, 'waitlist.subtitle', {
    locale: activeLocale,
    fallbackHint: 'waitlist hero subtitle',
  });
  const baseUrl = getSiteOrigin();
  const canonicalPath = `/${activeLocale}/waitlist`;
  const canonicalUrl = makeCanonical(canonicalPath, baseUrl);
  const waitlistPathForLocale = (locale: SupportedLocale) => `/${locale}/waitlist`;
  const hreflang = hreflangMapFor(waitlistPathForLocale, baseUrl);
  const robots = isPrelaunch()
    ? { index: false, follow: false }
    : undefined;
  const ogImage = getOgImageEntry({
    locale: activeLocale,
    key: 'waitlist',
    title,
    description,
  });

  return {
    title,
    description,
    robots,
    alternates: {
      canonical: canonicalUrl,
      languages: hreflang,
    },
    openGraph: {
      title,
      description,
      url: canonicalUrl,
      images: [ogImage],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [ogImage.url],
    },
  };
}

export default async function WaitlistPage({ params }: { params: WaitlistPageParams }) {
  const { locale, messages } = await loadWaitlistMessages(params.locale);
  const trustPodiatrist = safeGetMessage(messages, 'waitlist.trust.podiatrist', {
    locale,
    fallbackHint: 'waitlist trust podiatrist',
  });
  const trustLouhenFit = safeGetMessage(messages, 'waitlist.trust.louhenfit', {
    locale,
    fallbackHint: 'waitlist trust louhenfit',
  });
  const urgencyBadge = safeGetMessage(messages, 'waitlist.urgency.badge', {
    locale,
    fallbackHint: 'waitlist urgency badge',
  });
  const title = safeGetMessage(messages, 'waitlist.title', {
    locale,
    fallbackHint: 'waitlist hero title',
  });
  const subtitle = safeGetMessage(messages, 'waitlist.subtitle', {
    locale,
    fallbackHint: 'waitlist hero subtitle',
  });
  const cookieStore = await cookies();
  const { BANNER_WAITLIST_URGENCY: urgencyEnabled } = getFlags({
    cookies: cookieStore.getAll(),
  });
  const waitlistBadgeLabel = safeGetMessage(messages, 'waitlist.badge.label', {
    locale,
    fallbackHint: 'waitlist badge label',
  });

  return (
    <main className="mx-auto flex w-full max-w-5xl flex-col gap-12 px-6 py-12 md:px-10">
      <section className="flex flex-col gap-6 md:max-w-2xl">
        <span className="inline-flex w-fit items-center gap-2 rounded-full bg-emerald-50 px-3 py-1 text-xs font-medium uppercase tracking-wide text-emerald-700">
          {waitlistBadgeLabel}
        </span>
        <h1 className="text-3xl font-semibold tracking-tight text-slate-900 md:text-4xl">{title}</h1>
        <p className="text-base leading-relaxed text-slate-700 md:text-lg">{subtitle}</p>
        {urgencyEnabled ? (
          <p className="text-sm font-medium text-emerald-600" role="status">
            {urgencyBadge}
          </p>
        ) : null}
        <dl className="grid gap-3 text-sm text-slate-600 md:grid-cols-2">
          <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
            <dt className="text-xs font-semibold uppercase tracking-wide text-emerald-600">LouhenFit</dt>
            <dd className="mt-1 text-slate-700">{trustLouhenFit}</dd>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
            <dt className="text-xs font-semibold uppercase tracking-wide text-emerald-600">Podiatry</dt>
            <dd className="mt-1 text-slate-700">{trustPodiatrist}</dd>
          </div>
        </dl>
      </section>

      <WaitlistForm source={null} />
    </main>
  );
}
