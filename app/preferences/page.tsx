'use client';
import * as React from 'react';
import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { WaitlistForm } from '@components/features/waitlist';

// Force dynamic rendering (no prerender) to avoid static export errors
export const dynamic = 'force-dynamic';

function PrefsInner() {
  const sp = useSearchParams(); // requires Suspense boundary
  const token = sp.get('token') || '';
  const defaultEmail = sp.get('email') || undefined;
  const source = sp.get('utm_source') || sp.get('source') || null;

  return (
    <main className="mx-auto max-w-3xl px-4 py-10">
      {!token ? (
        <WaitlistForm defaultEmail={defaultEmail} source={source} />
      ) : (
        <>
          <h1 className={text.heading}>Email preferences</h1>
          <PrefsForm token={token} />
        </>
      )}
    </main>
  );
}

function PrefsForm({ token }: { token: string }) {
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string>('');
  const [unsubscribed, setUnsubscribed] = React.useState(false);
  const [prefs, setPrefs] = React.useState<{ waitlistUpdates: boolean; referrals: boolean; launchNews: boolean }>({
    waitlistUpdates: true,
    referrals: true,
    launchNews: true,
  });
  const [msg, setMsg] = React.useState('');

  React.useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(`/api/prefs?token=${encodeURIComponent(token)}`, { cache: 'no-store' });
        if (!res.ok) throw new Error('Failed to load preferences');
        const data = await res.json();
        if (!cancelled) {
          setUnsubscribed(Boolean(data.unsubscribed));
          setPrefs({
            waitlistUpdates: Boolean(data?.emailPrefs?.waitlistUpdates),
            referrals: Boolean(data?.emailPrefs?.referrals),
            launchNews: Boolean(data?.emailPrefs?.launchNews),
          });
        }
      } catch {
        if (!cancelled) setError('Could not load preferences. The link may be expired.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [token]);

  async function onSave(_e: React.FormEvent) {
    _e.preventDefault();
    setError('');
    setMsg('');
    try {
      const res = await fetch(`/api/prefs?token=${encodeURIComponent(token)}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ unsubscribed, emailPrefs: prefs }),
      });
      if (!res.ok) throw new Error('Save failed');
      setMsg('Preferences saved.');
    } catch {
      setError('Could not save preferences.');
    }
  }

  if (loading) return <p className="mt-4 text-body text-text-muted">Loading…</p>;
  if (error) return <p className="mt-4 text-feedback-error" role="alert">{error}</p>;

  return (
    <form onSubmit={onSave} className="mt-6 grid max-w-lg gap-sm rounded-2xl border border-border bg-bg-card p-md shadow-card">
      <label className="flex items-center gap-sm">
        <input
          className="h-5 w-5 rounded border border-border accent-brand focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-border-focus"
          type="checkbox"
          checked={!unsubscribed}
          onChange={(e) => setUnsubscribed(!e.target.checked)}
        />
        <span className={text.label}>Receive emails from Louhen</span>
      </label>

      <fieldset className="grid gap-xs pl-lg">
        <label className="flex items-center gap-sm">
          <input
            className="h-5 w-5 rounded border border-border accent-brand focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-border-focus"
            type="checkbox"
            checked={prefs.waitlistUpdates}
            onChange={(e) => setPrefs((p) => ({ ...p, waitlistUpdates: e.target.checked }))}
          />
          <span className={text.body}>Waitlist updates</span>
        </label>
        <label className="flex items-center gap-sm">
          <input
            className="h-5 w-5 rounded border border-border accent-brand focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-border-focus"
            type="checkbox"
            checked={prefs.referrals}
            onChange={(e) => setPrefs((p) => ({ ...p, referrals: e.target.checked }))}
          />
          <span className={text.body}>Referrals & rewards</span>
        </label>
        <label className="flex items-center gap-sm">
          <input
            className="h-5 w-5 rounded border border-border accent-brand focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-border-focus"
            type="checkbox"
            checked={prefs.launchNews}
            onChange={(e) => setPrefs((p) => ({ ...p, launchNews: e.target.checked }))}
          />
          <span className={text.body}>Launch news</span>
        </label>
      </fieldset>

      <div className="flex items-center gap-sm">
        <button className={cn(buttons.primary, 'rounded-xl px-lg py-xs')}>
          Save
        </button>
        {msg && (
          <span className="text-body-sm text-feedback-success" aria-live="polite">
            {msg}
          </span>
        )}
      </div>
    </form>
  );
}

export default function PreferencesPage() {
  return (
    <Suspense fallback={<main className="mx-auto max-w-3xl px-4 py-10"><p className="text-text-muted">Loading…</p></main>}>
      <PrefsInner />
    </Suspense>
  );
}
