import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react';
import { describe, expect, beforeEach, afterEach, vi, it } from 'vitest';
import LocaleSwitcher from '@/components/LocaleSwitcher';

let trackMock: ReturnType<typeof vi.fn>;

const pushMock = vi.fn();
const consentValue = { consent: { analytics: false, marketing: false }, setConsent: vi.fn(), openManager: vi.fn() };

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: pushMock, prefetch: vi.fn(), replace: vi.fn(), back: vi.fn(), forward: vi.fn() }),
  usePathname: () => '/en-de/guides',
  useSearchParams: () => ({ toString: () => '' }),
}));

vi.mock('next-intl', () => ({
  useLocale: () => 'en-de',
}));

vi.mock('@/components/ConsentProvider', () => ({
  useConsent: () => consentValue,
}));

vi.mock('@/lib/clientAnalytics', () => ({
  track: (...args: unknown[]) => trackMock(...args),
}));

describe('LocaleSwitcher', () => {
  beforeEach(() => {
    pushMock.mockReset();
    trackMock = vi.fn();
    trackMock.mockReset();
    vi.stubGlobal('fetch', vi.fn(async () => ({ ok: true })) as unknown as typeof fetch);
    document.cookie = '';
    window.localStorage.clear();
    consentValue.consent.analytics = false;
    consentValue.consent.marketing = false;
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('navigates to localized path and sets cookie', async () => {
    const { getByLabelText } = render(<LocaleSwitcher className="test-select" />);

    fireEvent.change(getByLabelText('Select language and region'), { target: { value: 'de-de' } });

    await waitFor(() => {
      expect(pushMock).toHaveBeenCalledWith('/de-de/guides');
    });

    expect(document.cookie).toContain('lh_locale=de-de');
    expect(window.localStorage.getItem('lh_locale')).toBeNull();
    expect(trackMock).toHaveBeenCalledWith('locale_changed', {
      from: 'en-de',
      to: 'de-de',
      preservedPath: true,
    });
  });

  it('falls back to locale home when target path missing', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => ({ ok: false })) as unknown as typeof fetch
    );

    const { getByLabelText } = render(<LocaleSwitcher />);
    fireEvent.change(getByLabelText('Select language and region'), { target: { value: 'fr-fr' } });

    await waitFor(() => {
      expect(pushMock).toHaveBeenCalledWith('/fr-fr/');
    });

    expect(trackMock).toHaveBeenCalledWith('locale_changed', {
      from: 'en-de',
      to: 'fr-fr',
      preservedPath: false,
    });
  });

  it('persists locale to localStorage when marketing consent granted', async () => {
    consentValue.consent.marketing = true;
    const { getByLabelText } = render(<LocaleSwitcher />);
    fireEvent.change(getByLabelText('Select language and region'), { target: { value: 'en-nl' } });

    await waitFor(() => {
      expect(pushMock).toHaveBeenCalledWith('/en-nl/guides');
    });

    expect(window.localStorage.getItem('lh_locale')).toBe('en-nl');
    expect(trackMock).toHaveBeenCalledWith('locale_changed', {
      from: 'en-de',
      to: 'en-nl',
      preservedPath: true,
    });
  });
});
