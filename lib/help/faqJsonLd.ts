import type { InlineFaqEntry } from '@/lib/help/inlineFaq';

type BuildFaqParams = {
  url: string;
  locale: string;
  items: InlineFaqEntry[];
};

export function buildFaqPageJsonLd({ url, locale, items }: BuildFaqParams) {
  const mainEntity = items
    .filter((item) => item.q && item.a)
    .map((item) => ({
      '@type': 'Question',
      name: item.q,
      acceptedAnswer: {
        '@type': 'Answer',
        text: item.a,
      },
    }));

  if (!mainEntity.length) return null;

  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    inLanguage: locale,
    url,
    mainEntity,
  };
}
