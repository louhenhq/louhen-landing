import type { Metadata } from 'next';
import { cookies } from 'next/headers';
import { createTranslator } from 'next-intl';
import { WaitlistForm } from '@components/features/waitlist';
import { loadWaitlistMessages } from '@/app/(site)/waitlist/_lib/messages';
import { getFlags } from '@/lib/shared/flags';
import { getSiteOrigin, hreflangMapFor, makeCanonical } from '@/lib/seo/shared';
import { isPrelaunch } from '@/lib/env/prelaunch';
import { getOgImageEntry } from '@lib/shared/og/builder';
import type { SupportedLocale } from '@/next-intl.locales';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function generateMetadata(): Promise<Metadata> {
  const { locale, messages } = await loadWaitlistMessages();
  const t = createTranslator({ locale, messages, namespace: 'waitlist' });
  const title = t('title');
  const description = t('subtitle');
  const baseUrl = getSiteOrigin();
  const canonicalPath = '/waitlist';
  const canonicalUrl = makeCanonical(canonicalPath, baseUrl);
  const waitlistPathForLocale: (locale: SupportedLocale) => string = () => canonicalPath;
  const hreflang = hreflangMapFor(waitlistPathForLocale, baseUrl);
  const robots = isPrelaunch()
    ? { index: false, follow: false }
    : undefined;
  const ogImage = getOgImageEntry({
    locale,
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

export default async function WaitlistPage() {
  const { locale, messages } = await loadWaitlistMessages();
  const t = createTranslator({ locale, messages, namespace: 'waitlist' });
  const trustPodiatrist = t('trust.podiatrist');
  const trustLouhenFit = t('trust.louhenfit');
  const urgencyBadge = t('urgency.badge');
  const cookieStore = await cookies();
  const { BANNER_WAITLIST_URGENCY: urgencyEnabled } = getFlags({
    cookies: cookieStore.getAll(),
  });

  return (
    <main className="mx-auto flex w-full max-w-5xl flex-col gap-12 px-6 py-12 md:px-10">
      <section className="flex flex-col gap-6 md:max-w-2xl">
        <span className="inline-flex w-fit items-center gap-2 rounded-full bg-emerald-50 px-3 py-1 text-xs font-medium uppercase tracking-wide text-emerald-700">
          {locale === 'de' ? 'Warteliste' : 'Waitlist'}
        </span>
        <h1 className="text-3xl font-semibold tracking-tight text-slate-900 md:text-4xl">{t('title')}</h1>
        <p className="text-base leading-relaxed text-slate-700 md:text-lg">{t('subtitle')}</p>
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
