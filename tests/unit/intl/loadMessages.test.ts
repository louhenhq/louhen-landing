import { describe, expect, it } from 'vitest';
import { loadMessages } from '@/lib/intl/loadMessages';
import { safeGetMessage } from '@/lib/intl/getMessage';

describe('loadMessages', () => {
  it('falls back to canonical English for shared header copy', async () => {
    const messages = await loadMessages('fr-fr');
    const howLabel = safeGetMessage(messages, 'header.nav.primary.how', { locale: 'fr-fr' });
    expect(howLabel).toBe('How it works');
  });

  it('exposes waitlist pre-onboarding copy for localized markets', async () => {
    const messages = await loadMessages('de-de');
    const preOnboardingTitle = safeGetMessage(messages, 'preonboarding.title', { locale: 'de-de' });
    expect(typeof preOnboardingTitle).toBe('string');
    expect(preOnboardingTitle.length).toBeGreaterThan(0);
  });

  it('overrides open graph copy for market-specific locales', async () => {
    const messages = await loadMessages('en-de');
    const ogTitle = safeGetMessage(messages, 'og.default.title', { locale: 'en-de' });
    expect(ogTitle).toBe('Louhen Germany — Personal style. Effortless fit.');
  });
});

describe('safeGetMessage', () => {
  it('returns a fallback when the path is missing', () => {
    const result = safeGetMessage({}, 'a.b.c', { locale: 'test-locale', fallbackHint: 'unit test' });
    expect(result).toBe('');
  });
});
