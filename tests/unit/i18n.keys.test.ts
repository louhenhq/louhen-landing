import { describe, expect, it } from 'vitest';
import en from '@/messages/en.json';
import de from '@/messages/de.json';

type LocaleObject = Record<string, unknown>;

function collectKeys(obj: LocaleObject, prefix = ''): string[] {
  return Object.entries(obj).flatMap(([key, value]) => {
    const path = prefix ? `${prefix}.${key}` : key;
    if (Array.isArray(value)) {
      return value.flatMap((entry, index) => {
        const entryPath = `${path}[${index}]`;
        if (entry && typeof entry === 'object') {
          return collectKeys(entry as LocaleObject, entryPath);
        }
        expect(typeof entry === 'string').toBe(true);
        return [entryPath];
      });
    }
    if (value && typeof value === 'object') {
      return collectKeys(value as LocaleObject, path);
    }
    expect(typeof value === 'string').toBe(true);
    return [path];
  });
}

describe('i18n catalogs', () => {
  it('de has all keys present in en', () => {
    const enKeys = collectKeys(en as LocaleObject);
    const deKeys = collectKeys(de as LocaleObject);
    const missing = enKeys.filter((key) => !deKeys.includes(key));
    expect(missing).toEqual([]);
  });
});
