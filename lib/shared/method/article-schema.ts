export type BuildMethodTechArticleInput = {
  url: string;
  headline: string;
  description: string;
  locale: string;
  sections: string[];
  baseUrl: string;
  brandName: string;
  image?: string;
  datePublished: string;
  dateModified: string;
};

type TechArticleSchema = {
  '@context': 'https://schema.org';
  '@type': 'TechArticle';
} & Record<string, unknown>;

function formatLocaleForSchema(locale: string): string {
  if (!locale) {
    return locale;
  }
  const segments = locale.split('-');
  if (segments.length !== 2) {
    return locale;
  }
  const [language, region] = segments;
  if (!language || !region) {
    return locale;
  }
  return `${language.toLowerCase()}-${region.toUpperCase()}`;
}

export function buildMethodTechArticleSchema({
  url,
  headline,
  description,
  locale,
  sections,
  baseUrl,
  brandName,
  image,
  datePublished,
  dateModified,
}: BuildMethodTechArticleInput): TechArticleSchema {
  const uniqueSections = sections
    .map((value) => value.trim())
    .filter((value, index, array) => Boolean(value) && array.indexOf(value) === index);

  return {
    '@context': 'https://schema.org',
    '@type': 'TechArticle',
    headline,
    description,
    inLanguage: formatLocaleForSchema(locale),
    url,
    mainEntityOfPage: url,
    author: {
      '@type': 'Organization',
      name: brandName,
      url: baseUrl,
    },
    publisher: {
      '@type': 'Organization',
      name: brandName,
      url: baseUrl,
      logo: {
        '@type': 'ImageObject',
        url: `${baseUrl}/icon-512.png`,
      },
    },
    image: image ? [image] : undefined,
    datePublished,
    dateModified,
    isAccessibleForFree: true,
    articleSection: uniqueSections,
    about: uniqueSections,
    keywords: uniqueSections,
  };
}
