import type { Metadata } from 'next';
import { createTranslator } from 'next-intl';
import WaitlistForm from '@/app/(site)/components/WaitlistForm';
import { loadWaitlistMessages } from '@/app/(site)/waitlist/_lib/messages';
import { WAITLIST_URGENCY_COPY_ENABLED } from '@/lib/flags';
import { hreflangMapFor, makeCanonical, resolveBaseUrl } from '@/lib/seo/shared';
import type { SupportedLocale } from '@/next-intl.locales';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function generateMetadata(): Promise<Metadata> {
  const { locale, messages } = await loadWaitlistMessages();
  const t = createTranslator({ locale, messages, namespace: 'waitlist' });
  const title = t('title');
  const description = t('subtitle');
  const baseUrl = resolveBaseUrl();
  const canonicalPath = '/waitlist';
  const canonicalUrl = makeCanonical(canonicalPath, baseUrl);
  const waitlistPathForLocale: (locale: SupportedLocale) => string = () => canonicalPath;
  const hreflang = hreflangMapFor(waitlistPathForLocale, baseUrl);

  return {
    title,
    description,
    alternates: {
      canonical: canonicalUrl,
      languages: hreflang,
    },
    openGraph: {
      title,
      description,
      url: canonicalUrl,
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
    },
  };
}

export default async function WaitlistPage() {
  const { locale, messages } = await loadWaitlistMessages();
  const t = createTranslator({ locale, messages, namespace: 'waitlist' });
  const trustPodiatrist = t('trust.podiatrist');
  const trustLouhenFit = t('trust.louhenfit');
  const urgencyEnabled = WAITLIST_URGENCY_COPY_ENABLED;

  return (
    <main className="mx-auto flex w-full max-w-5xl flex-col gap-12 px-6 py-12 md:px-10">
      <section className="flex flex-col gap-6 md:max-w-2xl">
        <span className="inline-flex w-fit items-center gap-2 rounded-full bg-emerald-50 px-3 py-1 text-xs font-medium uppercase tracking-wide text-emerald-700">
          {locale === 'de' ? 'Warteliste' : 'Waitlist'}
        </span>
        <h1 className="text-3xl font-semibold tracking-tight text-slate-900 md:text-4xl">{t('title')}</h1>
        <p className="text-base leading-relaxed text-slate-700 md:text-lg">{t('subtitle')}</p>
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

      <WaitlistForm showUrgencyBadge={urgencyEnabled} source={null} />
    </main>
  );
}
