import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import { getTranslations, unstable_setRequestLocale } from 'next-intl/server';
import { isPrelaunch } from '@/lib/env/prelaunch';
import type { SupportedLocale } from '@/next-intl.locales';

export const runtime = 'nodejs';

const FALLBACK_SITE_URL = 'https://louhen-landing.vercel.app';
const REVISION_DATE_ISO = '2025-02-14';
const SECTION_ORDER = [
  'eligibility',
  'waitlist',
  'acceptableUse',
  'intellectualProperty',
  'availability',
  'disclaimer',
  'liability',
  'governingLaw',
  'changes',
  'contact',
] as const;

type TermsPageProps = {
  params: { locale: SupportedLocale };
};

type SectionKey = (typeof SECTION_ORDER)[number];

type SectionContent = {
  key: SectionKey;
  heading: string;
  body: ReactNode;
};

export async function generateMetadata({ params }: TermsPageProps): Promise<Metadata> {
  const { locale } = params;
  const t = await getTranslations({ locale, namespace: 'legal' });

  const title = t('terms.title');
  const description = t('terms.intro');
  const rawBaseUrl = process.env.APP_BASE_URL?.trim() || process.env.NEXT_PUBLIC_SITE_URL?.trim() || FALLBACK_SITE_URL;
  const baseUrl = rawBaseUrl.replace(/\/$/, '');
  const canonicalPath = `/${locale}/legal/terms`;
  const fullUrl = `${baseUrl}${canonicalPath}`;

  const robots = isPrelaunch()
    ? { index: false, follow: false }
    : undefined;

  return {
    title,
    description,
    alternates: {
      canonical: canonicalPath,
    },
    openGraph: {
      title,
      description,
      url: fullUrl,
    },
    twitter: {
      title,
      description,
    },
    robots,
  } satisfies Metadata;
}

export default async function TermsPage({ params }: TermsPageProps) {
  const { locale } = params;
  unstable_setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: 'legal' });

  const revisionDate = new Date(REVISION_DATE_ISO);
  const formattedDate = new Intl.DateTimeFormat(locale, { dateStyle: 'long' }).format(revisionDate);
  const lastUpdatedLabel = t('common.lastUpdatedTemplate', { date: formattedDate });
  const legalEmail = t('common.legalEmail');

  const sections: SectionContent[] = SECTION_ORDER.map((key) => {
    const heading = t(`terms.sections.${key}.heading`);
    if (key === 'contact') {
      const body = t.rich(`terms.sections.${key}.body`, {
        email: (chunks) => (
          <a
            href={`mailto:${legalEmail}`}
            className="text-brand-primary underline underline-offset-4 transition-colors hover:text-brand-primary/80 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-border-focus"
          >
            {chunks}
          </a>
        ),
        emailAddress: legalEmail,
      });
      return { key, heading, body };
    }

    const body = t(`terms.sections.${key}.body`);
    return { key, heading, body };
  });

  return (
    <main id="main" className="mx-auto max-w-3xl px-gutter py-3xl text-text">
      <article className="space-y-8">
        <header className="space-y-3">
          <h1 className="text-3xl font-semibold tracking-tight text-text">{t('terms.title')}</h1>
          <p data-testid="last-updated" className="text-sm text-text-muted">{lastUpdatedLabel}</p>
          <p className="text-base leading-relaxed text-text-muted">{t('terms.intro')}</p>
        </header>

        <div className="space-y-8">
          {sections.map(({ key, heading, body }) => (
            <section key={key} id={key} className="space-y-3">
              <h2 className="text-2xl font-semibold text-text">{heading}</h2>
              <div className="text-base leading-relaxed text-text-muted">{body}</div>
            </section>
          ))}
        </div>
      </article>
    </main>
  );
}
