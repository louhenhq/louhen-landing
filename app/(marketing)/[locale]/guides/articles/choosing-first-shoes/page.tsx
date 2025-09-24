import { headers } from 'next/headers';
import { getLocale, getTranslations } from 'next-intl/server';

import { TechArticleJsonLd, type TechArticleSchema } from '@/components/SeoJsonLd';
import { resolveBaseUrl } from '@/lib/seo/baseUrl';
import {
  buildLocalePath,
  getLocaleDefinition,
  normalizeLocale,
  defaultLocale,
  type SupportedLocale,
} from '@/next-intl.locales';

export default async function ChoosingFirstShoes() {
  const rawLocale = await getLocale();
  const locale: SupportedLocale = normalizeLocale(rawLocale) ?? defaultLocale;

  const [articleTranslations, baseUrl, headerList, guidesTranslations] = await Promise.all([
    getTranslations({ locale, namespace: 'guides.articles.choosingFirst' }),
    resolveBaseUrl(),
    headers(),
    getTranslations({ locale, namespace: 'guides.hero' }),
  ]);

  const localizedPath = buildLocalePath(locale, '/guides/articles/choosing-first-shoes');
  const url = `${baseUrl}${localizedPath}`;
  const nonce = headerList.get('x-csp-nonce') ?? undefined;

  const localeDefinition = getLocaleDefinition(locale);

  const schema: TechArticleSchema = {
    '@context': 'https://schema.org',
    '@type': 'TechArticle',
    headline: articleTranslations('title'),
    description: articleTranslations('description'),
    inLanguage: localeDefinition?.hreflang ?? locale,
    author: { '@type': 'Organization', name: 'Louhen' },
    datePublished: '2025-01-01T00:00:00.000Z',
    dateModified: '2025-01-01T00:00:00.000Z',
    mainEntityOfPage: url,
    url,
  };

  const homeLabel = localeDefinition?.language === 'de' ? 'Startseite' : 'Home';
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
        name: guidesTranslations('title'),
        item: `${baseUrl}${buildLocalePath(locale, '/guides')}`,
      },
      {
        '@type': 'ListItem',
        position: 3,
        name: articleTranslations('title'),
        item: url,
      },
    ],
  };

  return (
    <>
      <script
        type="application/ld+json"
        nonce={nonce}
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />
      <TechArticleJsonLd schema={schema} nonce={nonce} />
      <article className="prose prose-neutral mx-auto max-w-3xl px-6 py-12">
        <h1>{articleTranslations('title')}</h1>
        <p className="lead">{articleTranslations('description')}</p>

        <h2>{articleTranslations('h1')}</h2>
        <p>{articleTranslations('p1')}</p>

        <h2>{articleTranslations('h2')}</h2>
        <p>{articleTranslations('p2')}</p>
      </article>
    </>
  );
}
