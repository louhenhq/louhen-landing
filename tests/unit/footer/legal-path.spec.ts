import { describe, expect, it } from 'vitest';
import { defaultLocale } from '@/next-intl.locales';
import { legalPath, localeHomePath } from '@lib/shared/routing/legal-path';

const alternateLocale = defaultLocale === 'de-de' ? 'en-de' : 'de-de';

describe('legal-path routing helpers', () => {
  describe('legalPath', () => {
    it('returns non-prefixed path for default locale', () => {
      expect(legalPath(defaultLocale, 'privacy')).toBe('/legal/privacy');
      expect(legalPath(defaultLocale, 'terms')).toBe('/legal/terms');
    });

    it('prefixes locale for non-default locales', () => {
      expect(legalPath(alternateLocale, 'privacy')).toBe(`/${alternateLocale}/legal/privacy`);
      expect(legalPath(alternateLocale, 'terms')).toBe(`/${alternateLocale}/legal/terms`);
    });
  });

  describe('localeHomePath', () => {
    it('returns root path for default locale', () => {
      expect(localeHomePath(defaultLocale)).toBe('/');
    });

    it('prefixes locale for non-default locales', () => {
      expect(localeHomePath(alternateLocale)).toBe(`/${alternateLocale}`);
    });
  });
});
