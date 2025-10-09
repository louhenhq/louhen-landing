import type { Metadata } from 'next';
import { createTranslator } from 'next-intl';
import WaitlistForm from '@/app/(site)/components/WaitlistForm';
import { loadWaitlistMessages } from '@/app/(site)/waitlist/_lib/messages';
import { WAITLIST_URGENCY_COPY_ENABLED } from '@/lib/flags';
<<<<<<< HEAD
import { DEFAULT_LOCALE } from '@/lib/i18n/locales';
import {
  buildAlternateLanguageMap,
  buildCanonicalPath,
} from '@/lib/i18n/metadata';
=======
>>>>>>> f7d7592 (Waitlist env split: build uses NEXT_PUBLIC only (#2))

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function generateMetadata(): Promise<Metadata> {
  const { locale, messages } = await loadWaitlistMessages();
  const t = createTranslator({ locale, messages, namespace: 'waitlist' });
  const title = t('title');
  const description = t('subtitle');
<<<<<<< HEAD
  const path = '/waitlist/';
  const languages = buildAlternateLanguageMap(path);
=======
>>>>>>> f7d7592 (Waitlist env split: build uses NEXT_PUBLIC only (#2))

  return {
    title,
    description,
    alternates: {
<<<<<<< HEAD
      canonical: buildCanonicalPath(locale, path),
      languages,
    },
=======
      canonical: '/waitlist',
    },
    // TODO: add per-locale canonical + hreflang entries in SEO slice.
>>>>>>> f7d7592 (Waitlist env split: build uses NEXT_PUBLIC only (#2))
  };
}

export default async function WaitlistPage() {
  const { locale, messages } = await loadWaitlistMessages();
  const t = createTranslator({ locale, messages, namespace: 'waitlist' });
<<<<<<< HEAD
  const trustCopy = createTranslator({ locale, messages, namespace: 'trustCopy' });
  const trustLouhenFit = trustCopy('fitCard');
  const trustGdpr = trustCopy('gdprDetail');
  const fitTitle = trustCopy('fitTitle');
  const gdprTitle = trustCopy('gdprTitle');
  const urgencyEnabled = WAITLIST_URGENCY_COPY_ENABLED;
  const isDefaultLocale = locale === DEFAULT_LOCALE.value;

  return (
    <main className="mx-auto flex w-full max-w-5xl flex-col gap-xl px-md py-xl md:px-xl">
      <section className="flex flex-col gap-md md:max-w-2xl" data-testid="landing-waitlist">
        <span className="inline-flex w-fit items-center gap-xs rounded-full border border-feedback-success-border bg-feedback-success-surface px-sm py-4 text-meta font-medium uppercase tracking-[0.24em] text-feedback-success">
          {isDefaultLocale ? 'Warteliste' : 'Waitlist'}
        </span>
        <h1 className="text-display-xl text-balance text-text">{t('title')}</h1>
        <p className="text-body text-text md:max-w-xl">{t('subtitle')}</p>
        <dl className="grid gap-sm text-body-sm text-text-muted md:grid-cols-2">
          <div className="rounded-2xl border border-border bg-bg px-sm py-sm">
            <dt className="text-meta font-semibold uppercase tracking-wide text-feedback-success">{fitTitle}</dt>
            <dd className="mt-xs text-body text-text">{trustLouhenFit}</dd>
          </div>
          <div className="rounded-2xl border border-border bg-bg px-sm py-sm">
            <dt className="text-meta font-semibold uppercase tracking-wide text-feedback-success">{gdprTitle}</dt>
            <dd className="mt-xs text-body text-text">{trustGdpr}</dd>
=======
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
>>>>>>> f7d7592 (Waitlist env split: build uses NEXT_PUBLIC only (#2))
          </div>
        </dl>
      </section>

      <WaitlistForm showUrgencyBadge={urgencyEnabled} source={null} />
    </main>
  );
}
