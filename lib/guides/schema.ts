import type { TechArticleSchema } from '@/components/SeoJsonLd';

type BuildGuideArticleSchemaArgs = {
  url: string;
  locale: string;
  title: string;
  description: string;
  datePublished: string;
  dateModified?: string;
  authorName?: string;
};

export function buildGuideArticleSchema({
  url,
  locale,
  title,
  description,
  datePublished,
  dateModified = datePublished,
  authorName = 'Louhen',
}: BuildGuideArticleSchemaArgs): TechArticleSchema {
  return {
    '@context': 'https://schema.org',
    '@type': 'TechArticle',
    headline: title,
    description,
    inLanguage: locale,
    url,
    mainEntityOfPage: url,
    author: {
      '@type': 'Organization',
      name: authorName,
    },
    publisher: {
      '@type': 'Organization',
      name: authorName,
    },
    datePublished,
    dateModified,
    isAccessibleForFree: true,
  };
}
