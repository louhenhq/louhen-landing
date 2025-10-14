import { beforeEach, describe, expect, it, vi } from 'vitest';

type ViMock = ReturnType<typeof vi.fn>;

const flush = () => new Promise((resolve) => setTimeout(resolve, 0));

function setLocation(url: string) {
  if (typeof window === 'undefined') return;
  const base = window.location.origin || 'http://127.0.0.1';
  const target = new URL(url, base);
  window.history.replaceState({}, '', `${target.pathname}${target.search}${target.hash}`);
}

beforeEach(async () => {
  vi.resetModules();
  vi.useRealTimers();
  if (typeof window !== 'undefined') {
    window.sessionStorage.clear();
    window.localStorage.clear();
    setLocation('https://example.com/en?utm_source=test-source&utm_medium=test-medium&utm_campaign=test-campaign&utm_content=test-content&utm_term=test-term');
    Object.defineProperty(document, 'referrer', { configurable: true, value: 'https://referrer.example.com/article' });
    Object.defineProperty(window.navigator, 'sendBeacon', { configurable: true, value: undefined });
  }
  document.cookie = '';
  process.env.NEXT_PUBLIC_COMMIT_SHA = 'testsha';
  process.env.NEXT_PUBLIC_ANALYTICS_DISABLED = '0';
  process.env.NEXT_PUBLIC_ANALYTICS_DEBUG = '0';
  globalThis.fetch = vi.fn(async () => ({ ok: true })) as unknown as typeof fetch;

  const consentApi = await import('@/lib/shared/consent/api');
  consentApi.clearConsent();
  consentApi.setConsent('granted');
});

describe('client analytics', () => {
  it('enriches events with utm, page context, and version', async () => {
    const { track } = await import('@/lib/clientAnalytics');
    await track({ name: 'hero_twin_badge_click' });
    await flush();

    const fetchMock = globalThis.fetch as unknown as ViMock;
    expect(fetchMock).toHaveBeenCalledTimes(1);
    const body = JSON.parse(fetchMock.mock.calls[0][1].body as string);
    expect(body.name).toBe('hero_twin_badge_click');
    expect(body.app_version).toBe('testsha');
    expect(body.page).toMatchObject({ path: '/en?utm_source=test-source&utm_medium=test-medium&utm_campaign=test-campaign&utm_content=test-content&utm_term=test-term', referrer: 'https://referrer.example.com/article' });
    expect(body.utm_source).toBe('test-source');
    expect(body.utm_medium).toBe('test-medium');
    expect(body.utm_campaign).toBe('test-campaign');
  });

  it('dedupes identical events within one second', async () => {
    const { track } = await import('@/lib/clientAnalytics');
    const fetchMock = globalThis.fetch as unknown as ViMock;
    await track({ name: 'hero_twin_badge_click' });
    await track({ name: 'hero_twin_badge_click' });
    await flush();
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it('flushes buffered events when consent granted', async () => {
    const consentApi = await import('@/lib/shared/consent/api');
    consentApi.setConsent('denied');
    const { track, getConsent } = await import('@/lib/clientAnalytics');
    const fetchMock = globalThis.fetch as unknown as ViMock;

    await track({ name: 'hero_twin_badge_click' });
    await flush();
    expect(getConsent()).toBe(false);
    expect(fetchMock).not.toHaveBeenCalled();

    consentApi.setConsent('granted');
    await flush();
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it('retries with fetch when sendBeacon fails', async () => {
    if (typeof window !== 'undefined') {
      Object.defineProperty(window.navigator, 'sendBeacon', {
        configurable: true,
        value: vi.fn(() => false),
      });
    }
    const fetchMock = vi
      .fn()
      .mockRejectedValueOnce(new Error('network failure'))
      .mockResolvedValue({ ok: true });
    globalThis.fetch = fetchMock as unknown as typeof fetch;

    const { track } = await import('@/lib/clientAnalytics');
    await track({ name: 'hero_twin_badge_click' });
    await flush();

    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it('no-ops when analytics disabled', async () => {
    process.env.NEXT_PUBLIC_ANALYTICS_DISABLED = '1';
    const fetchMock = globalThis.fetch as unknown as ViMock;
    const { track } = await import('@/lib/clientAnalytics');
    await track({ name: 'hero_twin_badge_click' });
    await flush();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('observeOnce only fires handler once and cleans up', async () => {
    const callbacks: Array<(entries: unknown[]) => void> = [];
    const observers: MockIntersectionObserver[] = [];
    class MockIntersectionObserver {
      callback: (entries: unknown[]) => void;
      constructor(cb: (entries: unknown[]) => void) {
        this.callback = cb;
        callbacks.push(cb);
        observers.push(this);
      }
      observe = vi.fn();
      unobserve = vi.fn();
      disconnect = vi.fn();
    }
    (globalThis as typeof globalThis & { IntersectionObserver: typeof IntersectionObserver }).IntersectionObserver =
      MockIntersectionObserver as unknown as typeof IntersectionObserver;

    const { observeOnce } = await import('@/lib/clientAnalytics');
    const el = document.createElement('div');
    const handler = vi.fn();
    const dispose = observeOnce(el, handler, 0.2);

    expect(observers[0].observe).toHaveBeenCalledTimes(1);

    const trigger = callbacks[0];
    trigger([
      {
        target: el,
        isIntersecting: true,
        intersectionRatio: 0.5,
      },
    ]);

    expect(handler).toHaveBeenCalledTimes(1);
    dispose();
    expect(observers[0].disconnect).toHaveBeenCalled();
  });
});
