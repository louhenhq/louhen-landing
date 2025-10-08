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
          <h1 className="text-2xl font-bold tracking-tight">Email preferences</h1>
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

  if (loading) return <p className="mt-4 text-slate-600">Loading…</p>;
  if (error) return <p className="mt-4 text-rose-600" role="alert">{error}</p>;

  return (
    <form onSubmit={onSave} className="mt-6 grid gap-4 max-w-lg rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <label className="flex items-center gap-3">
        <input type="checkbox" checked={!unsubscribed} onChange={(e)=>setUnsubscribed(!e.target.checked)} />
        <span className="font-medium">Receive emails from Louhen</span>
      </label>

      <fieldset className="grid gap-2 pl-6">
        <label className="flex items-center gap-3">
          <input type="checkbox" checked={prefs.waitlistUpdates} onChange={(e)=>setPrefs(p=>({ ...p, waitlistUpdates: e.target.checked }))} />
          <span>Waitlist updates</span>
        </label>
        <label className="flex items-center gap-3">
          <input type="checkbox" checked={prefs.referrals} onChange={(e)=>setPrefs(p=>({ ...p, referrals: e.target.checked }))} />
          <span>Referrals & rewards</span>
        </label>
        <label className="flex items-center gap-3">
          <input type="checkbox" checked={prefs.launchNews} onChange={(e)=>setPrefs(p=>({ ...p, launchNews: e.target.checked }))} />
          <span>Launch news</span>
        </label>
      </fieldset>

      <div className="flex items-center gap-3">
        <button className="rounded-xl bg-slate-900 text-white px-4 py-2 font-semibold hover:opacity-90">Save</button>
        {msg && <span className="text-emerald-700 text-sm" aria-live="polite">{msg}</span>}
      </div>
    </form>
  );
}

export default function PreferencesPage() {
  return (
    <Suspense fallback={<main className="mx-auto max-w-3xl px-4 py-10"><p className="text-slate-600">Loading…</p></main>}>
      <PrefsInner />
    </Suspense>
  );
}
