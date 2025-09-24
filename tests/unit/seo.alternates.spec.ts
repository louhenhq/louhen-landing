import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { buildLocaleAlternates } from '@/lib/seo/alternates';

const ORIGINAL_APP_BASE_URL = process.env.APP_BASE_URL;

describe('buildLocaleAlternates', () => {
  beforeEach(() => {
    process.env.APP_BASE_URL = 'https://example.com';
  });

  afterEach(() => {
    if (ORIGINAL_APP_BASE_URL === undefined) {
      delete process.env.APP_BASE_URL;
    } else {
      process.env.APP_BASE_URL = ORIGINAL_APP_BASE_URL;
    }
  });

  it('builds canonical and hreflang links for localized path', async () => {
    const result = await buildLocaleAlternates('en-de', '/method');

    expect(result.canonical).toBe('https://example.com/en-de/method');
    expect(result.alternates.canonical).toBe('https://example.com/en-de/method');
    expect(result.alternates.languages['en-DE']).toBe('https://example.com/en-de/method');
    expect(result.alternates.languages['de-DE']).toBe('https://example.com/de-de/method');
    expect(result.alternates.languages['x-default']).toBe('https://example.com/en-eu/method');
  });

  it('normalizes root path handling with trailing slash', async () => {
    const result = await buildLocaleAlternates('fr-fr', '/');

    expect(result.canonical).toBe('https://example.com/fr-fr/');
    expect(result.alternates.languages['fr-FR']).toBe('https://example.com/fr-fr/');
    expect(result.alternates.languages['x-default']).toBe('https://example.com/en-eu/');
  });
});
