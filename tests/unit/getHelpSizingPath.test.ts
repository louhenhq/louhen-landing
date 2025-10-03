import { describe, expect, it } from 'vitest';
import { getHelpSizingPath } from '@/app/(marketing)/[locale]/method/getHelpSizingPath';

describe('getHelpSizingPath', () => {
  it('returns localized path for supported locale', () => {
    expect(getHelpSizingPath('en-de')).toBe('/en-de/help/sizing');
  });

  it('returns null when locale unsupported', () => {
    expect(getHelpSizingPath('fr-fr')).toBeNull();
  });

  it('returns null when locale missing mapping', () => {
    expect(getHelpSizingPath('de-de')).toBe('/de-de/hilfe/messen');
  });
});
