import { headers } from 'next/headers';
import { getLocale, getTranslations } from 'next-intl/server';

import { TechArticleJsonLd, type TechArticleSchema } from '@/components/SeoJsonLd';
import { resolveBaseUrl } from '@/lib/seo/baseUrl';

export default async function ChoosingFirstShoes() {
  const [locale, articleTranslations, baseUrl, headerList] = await Promise.all([
    getLocale(),
    getTranslations('guides.articles.choosingFirst'),
    resolveBaseUrl(),
    headers(),
  ]);

  const url = `${baseUrl}/${locale}/guides/articles/choosing-first-shoes`;
  const nonce = headerList.get('x-csp-nonce') ?? undefined;

  const schema: TechArticleSchema = {
    '@context': 'https://schema.org',
    '@type': 'TechArticle',
    headline: articleTranslations('title'),
    description: articleTranslations('description'),
    inLanguage: locale,
    author: { '@type': 'Organization', name: 'Louhen' },
    datePublished: '2025-01-01T00:00:00.000Z',
    dateModified: '2025-01-01T00:00:00.000Z',
    mainEntityOfPage: url,
    url,
  };

  const guidesTranslations = await getTranslations('guides.hero');
  const homeLabel = locale === 'de' ? 'Startseite' : 'Home';
  const breadcrumbJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      {
        '@type': 'ListItem',
        position: 1,
        name: homeLabel,
        item: `${baseUrl}/${locale}`,
      },
      {
        '@type': 'ListItem',
        position: 2,
        name: guidesTranslations('title'),
        item: `${baseUrl}/${locale}/guides`,
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
