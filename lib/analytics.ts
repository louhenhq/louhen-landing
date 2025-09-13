export type AnalyticsEvent =
  | { name: 'page_view'; path: string; variant?: string; ref?: string | null }
  | { name: 'cta_click'; id: 'hero_primary' | 'hero_secondary'; variant?: string }
  | { name: 'waitlist_submit'; ok: boolean; error?: string }
  | { name: 'how_it_works_click' };

export async function track(evt: AnalyticsEvent) {
  try {
    await fetch('/api/track', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        ...evt,
        ts: Date.now(),
        ua: typeof navigator !== 'undefined' ? navigator.userAgent : 'server',
      }),
      keepalive: true,
    });
  } catch {
    // swallow
  }
}

