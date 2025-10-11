import { describe, expect, it } from 'vitest';

import { buildMethodTechArticleSchema } from '@lib/shared/method/article-schema';

type MethodArticleInput = Parameters<typeof buildMethodTechArticleSchema>[0];

const baseInput: MethodArticleInput = {
  url: 'https://example.com/method',
  headline: 'Fit intelligence that keeps up with growing feet.',
  description: 'Discover how Louhen blends kid-safe scanning with verified fit science.',
  locale: 'de-de',
  sections: ['Kid-safe scanning', 'Verified fit science', 'Adaptive personalization'],
  baseUrl: 'https://example.com',
  brandName: 'Louhen',
  image: 'https://example.com/opengraph-image?locale=de-de&surface=method',
  datePublished: '2025-01-15T00:00:00.000Z',
  dateModified: '2025-01-15T00:00:00.000Z',
};

describe('buildMethodTechArticleSchema', () => {
  it('returns a TechArticle schema with essential fields', () => {
    const schema = buildMethodTechArticleSchema(baseInput);

    expect(schema['@type']).toBe('TechArticle');
    expect(schema.headline).toBe(baseInput.headline);
    expect(schema.description).toBe(baseInput.description);
    expect(schema.inLanguage).toBe('de-DE');
    expect(schema.url).toBe(baseInput.url);
    expect(schema.mainEntityOfPage).toBe(baseInput.url);
    expect(new URL(schema.url).pathname).toBe('/method');
    expect(schema.articleSection).toContain('Kid-safe scanning');
    expect(schema.keywords).toContain('Adaptive personalization');
    expect(schema.publisher).toMatchObject({
      '@type': 'Organization',
      name: 'Louhen',
      logo: {
        '@type': 'ImageObject',
        url: `${baseInput.baseUrl}/icon-512.png`,
      },
    });
    expect(schema.author).toMatchObject({ name: 'Louhen' });
    expect(schema.image).toEqual([baseInput.image]);
    expect(schema.datePublished).toBe(baseInput.datePublished);
    expect(schema.dateModified).toBe(baseInput.dateModified);
    expect(schema.isAccessibleForFree).toBe(true);
  });

  it('deduplicates blank or repeated sections', () => {
    const schema = buildMethodTechArticleSchema({
      ...baseInput,
      sections: ['Kid-safe scanning', 'Kid-safe scanning', '  ', 'Trust built-in'],
    });

    expect(schema.articleSection).toEqual(['Kid-safe scanning', 'Trust built-in']);
  });
});
