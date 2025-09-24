import Link from 'next/link';
import { headers } from 'next/headers';
import { getLocale, getTranslations } from 'next-intl/server';
import Section from '@/components/Section';
import { Card } from '@/components/ui/Card';
import { cn, focusRing } from '@/app/(site)/_lib/ui';
import { resolveBaseUrl } from '@/lib/seo/baseUrl';
import {
  buildLocalePath,
  getLocaleDefinition,
  normalizeLocale,
  defaultLocale,
  type SupportedLocale,
} from '@/next-intl.locales';

export default async function GuidesIndex() {
  const rawLocale = await getLocale();
  const locale: SupportedLocale = normalizeLocale(rawLocale) ?? defaultLocale;
  const [t, headerList, baseUrl] = await Promise.all([
    getTranslations({ locale, namespace: 'guides' }),
    headers(),
    resolveBaseUrl(),
  ]);
  const nonce = headerList.get('x-csp-nonce') ?? undefined;

  const items = [
    { slug: 'healthy-feet', title: t('topics.healthyFeet.title'), summary: t('topics.healthyFeet.summary') },
    { slug: 'sizing', title: t('topics.sizing.title'), summary: t('topics.sizing.summary') },
    { slug: 'parenting', title: t('topics.parenting.title'), summary: t('topics.parenting.summary') },
  ];

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: t('meta.title'),
    about: items.map((item) => item.title),
  };

  const localeDefinition = getLocaleDefinition(locale);
  const homeLabel = localeDefinition?.language === 'de' ? 'Startseite' : 'Home';
  const guidesUrl = `${baseUrl}${buildLocalePath(locale, '/guides')}`;
  const breadcrumbJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      {
        '@type': 'ListItem',
        position: 1,
        name: homeLabel,
        item: `${baseUrl}${buildLocalePath(locale)}`,
      },
      {
        '@type': 'ListItem',
        position: 2,
        name: t('hero.title'),
        item: guidesUrl,
      },
    ],
  };

  return (
    <>
      <Section pad="lg" className="max-w-5xl">
        <h1 className="font-semibold text-[var(--typography-size-2xl)] leading-[var(--typography-line-height-snug)] text-text md:text-[var(--typography-size-3xl)]">
          {t('hero.title')}
        </h1>
        <p className="mt-sm max-w-3xl text-[var(--typography-size-md)] leading-[var(--typography-line-height-relaxed)] text-text-muted">
          {t('hero.subtitle')}
        </p>

        <div className="mt-xl grid gap-lg md:grid-cols-2 lg:grid-cols-3">
          {items.map((item) => (
            <Card key={item.slug} role="article" className="flex h-full flex-col gap-sm">
              <h2 className="font-semibold text-[var(--typography-size-xl)] leading-[var(--typography-line-height-snug)] text-text">
                <Link
                  href={buildLocalePath(locale, `/guides/${item.slug}`)}
                  className={cn(
                    'flex w-full items-center rounded-md py-xs min-h-[var(--spacing-xl)] text-left',
                    focusRing,
                  )}
                >
                  {item.title}
                </Link>
              </h2>
              <p className="text-[var(--typography-size-sm)] leading-[var(--typography-line-height-normal)] text-text-muted">
                {item.summary}
              </p>
              <div className="mt-md">
                <Link
                  href={buildLocalePath(locale, `/guides/${item.slug}`)}
                  className={cn(
                    'inline-flex items-center gap-xs rounded-pill px-sm min-h-[var(--spacing-xl)] text-[var(--typography-size-sm)] font-medium text-brand-primary underline underline-offset-4',
                    focusRing,
                  )}
                >
                  {t('cta.readMore')}
                </Link>
              </div>
            </Card>
          ))}
        </div>
      </Section>

      <script
        type="application/ld+json"
        nonce={nonce}
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />
      <script
        type="application/ld+json"
        nonce={nonce}
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
    </>
  );
}
