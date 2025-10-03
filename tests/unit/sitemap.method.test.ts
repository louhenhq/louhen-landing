import { describe, expect, it } from 'vitest';
import sitemap from '@/app/sitemap';
import { locales } from '@/next-intl.locales';

const METHOD_PATH_REGEX = /^\/([a-z]{2}-[a-z]{2})\/method\/$/;

describe('sitemap method routes', () => {
  it('exposes only locale-prefixed method URLs', () => {
    const entries = sitemap();
    const methodEntries = entries.filter((entry) => entry.url.includes('/method/'));

    expect(methodEntries).toHaveLength(locales.length);

    const seenLocales = new Set<string>();

    methodEntries.forEach((entry) => {
      const { pathname } = new URL(entry.url);
      const match = pathname.match(METHOD_PATH_REGEX);
      expect(match, `Expected localized method path, received ${pathname}`).not.toBeNull();
      if (match) {
        seenLocales.add(match[1]);
      }

      const alternateUrls = Object.values(entry.alternates?.languages ?? {});
      alternateUrls.forEach((alternateUrl) => {
        if (!alternateUrl.includes('/method/')) return;
        const { pathname: alternatePath } = new URL(alternateUrl);
        const alternateMatch = alternatePath.match(METHOD_PATH_REGEX);
        expect(alternateMatch, `Expected localized alternate, received ${alternatePath}`).not.toBeNull();
      });
    });

    expect(seenLocales.size).toBe(locales.length);
    locales.forEach((locale) => {
      expect(seenLocales.has(locale)).toBe(true);
    });

    const bareEntries = entries.filter((entry) => {
      const { pathname } = new URL(entry.url);
      return pathname === '/method' || pathname === '/method/';
    });

    expect(bareEntries).toHaveLength(0);
  });
});
