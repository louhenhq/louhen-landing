import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import { headers } from 'next/headers';
import { getTranslations, unstable_setRequestLocale } from 'next-intl/server';
import { BreadcrumbJsonLd } from '@/components/SeoJsonLd';
import { legalPath, localeHomePath } from '@lib/shared/routing/legal-path';
import { buildLegalMetadata } from '@/lib/seo/legalMetadata';
import { getSiteOrigin, makeCanonical } from '@/lib/seo/shared';
import type { SupportedLocale } from '@/next-intl.locales';

export const runtime = 'nodejs';

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
  return buildLegalMetadata({ locale, kind: 'terms' });
}

export default async function TermsPage({ params }: TermsPageProps) {
  const { locale } = params;
  unstable_setRequestLocale(locale);
  const [t, common] = await Promise.all([
    getTranslations({ locale, namespace: 'legal' }),
    getTranslations({ locale, namespace: 'common' }).catch(() => null),
  ]);
  const headerStore = await headers();
  const nonce = headerStore.get('x-csp-nonce') ?? undefined;
  const baseUrl = getSiteOrigin();
  let homeLabel = locale.startsWith('de') ? 'Startseite' : 'Home';
  if (common) {
    try {
      homeLabel = common('breadcrumb.home');
    } catch {
      // fall back to heuristic
    }
  }
  const homeUrl = makeCanonical(localeHomePath(locale), baseUrl);
  const pageUrl = makeCanonical(legalPath(locale, 'terms'), baseUrl);

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
    <>
      <BreadcrumbJsonLd
        nonce={nonce}
        items={[
          { name: homeLabel, item: homeUrl },
          { name: t('terms.title'), item: pageUrl },
        ]}
      />
      <main id="main-content" className="mx-auto max-w-3xl px-gutter py-3xl text-text">
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
    </>
  );
}
