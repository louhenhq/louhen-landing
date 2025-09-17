export async function joinWaitlist(email: string) {
  try {
    const href = typeof window !== 'undefined' ? window.location.href : undefined;
    let referredBy: string | undefined;
    try {
      if (typeof window !== 'undefined') {
        const u = new URL(window.location.href);
        referredBy = u.searchParams.get('ref') || undefined;
      }
    } catch {}
    if (!referredBy && typeof document !== 'undefined') {
      const m = document.cookie.match(/(?:^|; )wl_ref=([^;]+)/);
      if (m) referredBy = decodeURIComponent(m[1]);
    }

    const res = await fetch('/api/waitlist', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ email, href, referredBy }),
    });
    const json = await res.json();
    return json;
  } catch (_e) {
    return { ok: false, error: 'network_error' };
  }
}
