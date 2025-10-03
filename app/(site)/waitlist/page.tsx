import type { Metadata } from 'next';
import { createTranslator } from 'next-intl';
import WaitlistForm from '@/app/(site)/components/WaitlistForm';
import { loadWaitlistMessages } from '@/app/(site)/waitlist/_lib/messages';
import { WAITLIST_URGENCY_COPY_ENABLED } from '@/lib/flags';
import { DEFAULT_LOCALE } from '@/lib/i18n/locales';
import {
  buildAlternateLanguageMap,
  buildCanonicalPath,
} from '@/lib/i18n/metadata';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function generateMetadata(): Promise<Metadata> {
  const { locale, messages } = await loadWaitlistMessages();
  const t = createTranslator({ locale, messages, namespace: 'waitlist' });
  const title = t('title');
  const description = t('subtitle');
  const path = '/waitlist/';
  const languages = buildAlternateLanguageMap(path);

  return {
    title,
    description,
    alternates: {
      canonical: buildCanonicalPath(locale, path),
      languages,
    },
  };
}

export default async function WaitlistPage() {
  const { locale, messages } = await loadWaitlistMessages();
  const t = createTranslator({ locale, messages, namespace: 'waitlist' });
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
          </div>
        </dl>
      </section>

      <WaitlistForm showUrgencyBadge={urgencyEnabled} source={null} />
    </main>
  );
}
