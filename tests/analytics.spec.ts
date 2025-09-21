import { beforeEach, describe, expect, it, vi } from 'vitest';

const flush = () => new Promise((resolve) => setTimeout(resolve, 0));

function setLocation(url: string) {
  if (typeof window === 'undefined') return;
  const base = window.location.origin || 'http://localhost';
  const target = new URL(url, base);
  window.history.replaceState({}, '', `${target.pathname}${target.search}${target.hash}`);
}

beforeEach(() => {
  vi.resetModules();
  vi.useRealTimers();
  if (typeof window !== 'undefined') {
    window.sessionStorage.clear();
    window.localStorage.clear();
    setLocation('https://example.com/en?utm_source=test-source&utm_medium=test-medium&utm_campaign=test-campaign&utm_content=test-content&utm_term=test-term');
    Object.defineProperty(document, 'referrer', { configurable: true, value: 'https://referrer.example.com/article' });
    (window as any).__LOUHEN_CONSENT__ = { analytics: true };
    Object.defineProperty(window.navigator, 'sendBeacon', { configurable: true, value: undefined });
  }
  document.cookie = '';
  process.env.NEXT_PUBLIC_COMMIT_SHA = 'testsha';
  process.env.NEXT_PUBLIC_ANALYTICS_DISABLED = '0';
  process.env.NEXT_PUBLIC_ANALYTICS_DEBUG = '0';
  globalThis.fetch = vi.fn(async () => ({ ok: true })) as unknown as typeof fetch;
});

describe('client analytics', () => {
  it('enriches events with utm, page context, and version', async () => {
    const { track } = await import('../lib/clientAnalytics');
    await track({ name: 'hero_twin_badge_click' });
    await flush();

    const fetchMock: any = globalThis.fetch;
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
    const { track } = await import('../lib/clientAnalytics');
    const fetchMock: any = globalThis.fetch;
    await track({ name: 'hero_twin_badge_click' });
    await track({ name: 'hero_twin_badge_click' });
    await flush();
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it('flushes buffered events when consent granted', async () => {
    if (typeof window !== 'undefined') {
      (window as any).__LOUHEN_CONSENT__ = { analytics: false };
    }
    const { track, getConsent } = await import('../lib/clientAnalytics');
    const fetchMock: any = globalThis.fetch;

    await track({ name: 'hero_twin_badge_click' });
    await flush();
    expect(getConsent()).toBe(false);
    expect(fetchMock).not.toHaveBeenCalled();

    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('louhen:consent', { detail: { analytics: true } }));
    }
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

    const { track } = await import('../lib/clientAnalytics');
    await track({ name: 'hero_twin_badge_click' });
    await flush();

    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it('no-ops when analytics disabled', async () => {
    process.env.NEXT_PUBLIC_ANALYTICS_DISABLED = '1';
    const fetchMock: any = globalThis.fetch;
    const { track } = await import('../lib/clientAnalytics');
    await track({ name: 'hero_twin_badge_click' });
    await flush();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('observeOnce only fires handler once and cleans up', async () => {
    const callbacks: Array<(entries: any[]) => void> = [];
    const observers: MockIntersectionObserver[] = [];
    class MockIntersectionObserver {
      callback: (entries: any[]) => void;
      constructor(cb: (entries: any[]) => void) {
        this.callback = cb;
        callbacks.push(cb);
        observers.push(this);
      }
      observe = vi.fn();
      unobserve = vi.fn();
      disconnect = vi.fn();
    }
    (globalThis as any).IntersectionObserver = MockIntersectionObserver as unknown as typeof IntersectionObserver;

    const { observeOnce } = await import('../lib/clientAnalytics');
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
