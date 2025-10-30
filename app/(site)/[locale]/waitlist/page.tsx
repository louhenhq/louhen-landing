import type { Metadata } from 'next';
import { cookies } from 'next/headers';
import { unstable_setRequestLocale } from 'next-intl/server';
import { WaitlistForm } from '@components/features/waitlist';
import { Header } from '@components/features/header-nav';
import { Footer } from '@components/features/footer';
import SiteShell from '@/app/(site)/components/SiteShell';
import { badges, cn, layout, text } from '@/app/(site)/_lib/ui';
import { loadWaitlistMessages } from '@/app/(site)/[locale]/waitlist/_lib/messages';
import { getHeaderUserState } from '@server/auth/user-state.server';
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
  unstable_setRequestLocale(locale);
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
  const waitlistBadgeLabel = safeGetMessage(messages, 'waitlist.badge.label', {
    locale,
    fallbackHint: 'waitlist badge label',
  });
  const trustLouhenfitLabel =
    safeGetMessage(messages, 'waitlist.trust.labels.louhenfit', {
      locale,
      fallbackHint: 'waitlist trust louhenfit label',
    }) || 'LouhenFit';
  const trustPodiatristLabel =
    safeGetMessage(messages, 'waitlist.trust.labels.podiatrist', {
      locale,
      fallbackHint: 'waitlist trust podiatrist label',
    }) || 'Podiatry';
  const skipToMainLabel =
    safeGetMessage(messages, 'layout.skipToMain', {
      locale,
      fallbackHint: 'layout skip to main',
    }) || 'Skip to main content';
  const cookieStore = await cookies();
  const { BANNER_WAITLIST_URGENCY: urgencyEnabled } = getFlags({
    cookies: cookieStore.getAll(),
  });
  const headerUserState = await getHeaderUserState();

  return (
    <SiteShell
      header={<Header userState={headerUserState} />}
      footer={<Footer />}
      skipToMainLabel={skipToMainLabel}
    >
      <section className={layout.section} aria-labelledby="waitlist-page-heading">
        <div
          className={cn(
            layout.container,
            'grid gap-3xl lg:grid-cols-[minmax(0,0.95fr)_minmax(0,1fr)] lg:items-start'
          )}
        >
          <div className="flex flex-col gap-lg" data-testid="waitlist-intro">
            <span
              className={cn(
                badges.pill,
                'w-fit border-brand-primary/20 bg-brand-primary/10 text-brand-primary'
              )}
            >
              {waitlistBadgeLabel}
            </span>
            <div className="flex flex-col gap-sm">
              <h1 id="waitlist-page-heading" className={text.heading}>
                {title}
              </h1>
              <p className={text.bodyMuted}>{subtitle}</p>
            </div>
            {urgencyEnabled ? (
              <p role="status" className="text-body-sm font-medium text-brand-primary">
                {urgencyBadge}
              </p>
            ) : null}
            <dl className="grid gap-md text-body text-text-muted sm:grid-cols-2">
              <div className="rounded-2xl border border-border bg-bg-subtle px-lg py-md">
                <dt className="text-label text-text">{trustLouhenfitLabel}</dt>
                <dd className="mt-xs text-body text-text-muted">{trustLouhenFit}</dd>
              </div>
              <div className="rounded-2xl border border-border bg-bg-subtle px-lg py-md">
                <dt className="text-label text-text">{trustPodiatristLabel}</dt>
                <dd className="mt-xs text-body text-text-muted">{trustPodiatrist}</dd>
              </div>
            </dl>
          </div>
          <div className="flex flex-col" data-testid="waitlist-form-wrapper">
            <WaitlistForm headingId="waitlist-form-heading" source={null} className="w-full" />
          </div>
        </div>
      </section>
    </SiteShell>
  );
}
