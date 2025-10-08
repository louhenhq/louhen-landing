import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import { headers } from 'next/headers';
import { getTranslations, unstable_setRequestLocale } from 'next-intl/server';
import { BreadcrumbJsonLd } from '@/components/SeoJsonLd';
import { legalPath, localeHomePath } from '@lib/shared/routing/legal-path';
import { buildLegalMetadata } from '@/lib/seo/legalMetadata';
import { makeCanonical, resolveBaseUrl } from '@/lib/seo/shared';
import type { SupportedLocale } from '@/next-intl.locales';

export const runtime = 'nodejs';

const REVISION_DATE_ISO = '2025-02-14';

const SECTION_KEYS = [
  'controller',
  'purpose',
  'legalBases',
  'processors',
  'retention',
  'rights',
  'children',
  'changes',
  'contact',
] as const;

const SECTION_IDS: Record<(typeof SECTION_KEYS)[number], string> = {
  controller: 'controller',
  purpose: 'purpose',
  legalBases: 'legal-bases',
  processors: 'processors',
  retention: 'retention',
  rights: 'rights',
  children: 'children',
  changes: 'changes',
  contact: 'contact',
};

type PrivacyPageProps = {
  params: { locale: SupportedLocale };
};

export async function generateMetadata({ params }: PrivacyPageProps): Promise<Metadata> {
  const { locale } = params;
  return buildLegalMetadata({ locale, kind: 'privacy' });
}

export default async function PrivacyPage({ params }: PrivacyPageProps) {
  const { locale } = params;
  unstable_setRequestLocale(locale);
  const [t, common] = await Promise.all([
    getTranslations({ locale, namespace: 'legal' }),
    getTranslations({ locale, namespace: 'common' }).catch(() => null),
  ]);
  const headerStore = await headers();
  const nonce = headerStore.get('x-csp-nonce') ?? undefined;
  const baseUrl = resolveBaseUrl();
  let homeLabel = locale.startsWith('de') ? 'Startseite' : 'Home';
  if (common) {
    try {
      homeLabel = common('breadcrumb.home');
    } catch {
      // fall back to heuristic
    }
  }
  const homeUrl = makeCanonical(localeHomePath(locale), baseUrl);
  const pageUrl = makeCanonical(legalPath(locale, 'privacy'), baseUrl);

  const revisionDate = new Date(REVISION_DATE_ISO);
  const formattedDate = new Intl.DateTimeFormat(locale, { dateStyle: 'long' }).format(revisionDate);
  const lastUpdatedLabel = t('common.lastUpdatedTemplate', { date: formattedDate });
  const privacyEmail = t('common.privacyEmail');
  const purposeItemsRaw = t.raw('privacy.purpose.items');
  const introParagraph = Array.isArray(purposeItemsRaw) && typeof purposeItemsRaw[0] === 'string'
    ? purposeItemsRaw[0]
    : t('privacy.purpose.heading');

  type SectionContent = {
    key: (typeof SECTION_KEYS)[number];
    heading: string;
    body: ReactNode;
  };

  const sections: SectionContent[] = SECTION_KEYS.map((key) => {
    const heading = t(`privacy.${key}.heading`);

    if (key === 'purpose' || key === 'legalBases' || key === 'rights') {
      const items = t.raw(`privacy.${key}.items`);
      const listItems = Array.isArray(items)
        ? items.filter((value): value is string => typeof value === 'string' && value.trim().length > 0)
        : [];

      const listBody = (
        <ul className="list-disc space-y-2 pl-6 text-base leading-relaxed text-text-muted">
          {listItems.map((item, index) => (
            <li key={`${key}-${index}`}>{item}</li>
          ))}
        </ul>
      );

      return {
        key,
        heading,
        body: listBody,
      };
    }

    if (key === 'contact') {
      const richBody = t.rich('privacy.contact.body', {
        email: (chunks) => (
          <a
            href={`mailto:${privacyEmail}`}
            className="text-brand-primary underline underline-offset-4 transition-colors hover:text-brand-primary/80 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-border-focus"
          >
            {chunks}
          </a>
        ),
        emailAddress: privacyEmail,
      });
      return {
        key,
        heading,
        body: richBody,
      };
    }

    const body = t(`privacy.${key}.body`);
    return {
      key,
      heading,
      body,
    };
  });

  const controllerSection = sections.find((section) => section.key === 'controller');
  const remainingSections = sections.filter((section) => section.key !== 'controller');

  return (
    <>
      <BreadcrumbJsonLd
        nonce={nonce}
        items={[
          { name: homeLabel, item: homeUrl },
          { name: t('privacy.title'), item: pageUrl },
        ]}
      />
      <main id="main-content" className="mx-auto max-w-3xl px-gutter py-3xl text-text">
      <article className="space-y-8">
        <header className="space-y-3">
          <h1 className="text-3xl font-semibold tracking-tight text-text">{t('privacy.title')}</h1>
          <p data-testid="last-updated" className="text-sm text-text-muted">{lastUpdatedLabel}</p>
          <p className="text-base leading-relaxed text-text-muted">{introParagraph}</p>
        </header>

        {controllerSection ? (
          <section id={SECTION_IDS.controller} className="space-y-3">
            <h2 className="text-2xl font-semibold text-text">{controllerSection.heading}</h2>
            <div className="text-base leading-relaxed text-text-muted">{controllerSection.body}</div>
          </section>
        ) : null}

        <div className="space-y-8">
          {remainingSections.map(({ key, heading, body }) => (
            <section key={key} id={SECTION_IDS[key]} className="space-y-3">
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
