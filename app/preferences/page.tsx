'use client';

import * as React from 'react';
import { useSearchParams } from 'next/navigation';

type Prefs = { waitlistUpdates: boolean; referrals: boolean; launchNews: boolean };

export default function PreferencesPage() {
  const params = useSearchParams();
  const token = params.get('token') || '';
  const [loading, setLoading] = React.useState(true);
  const [saving, setSaving] = React.useState(false);
  const [error, setError] = React.useState<string>('');
  const [email, setEmail] = React.useState<string>('');
  const [unsubscribed, setUnsubscribed] = React.useState(false);
  const [prefs, setPrefs] = React.useState<Prefs>({ waitlistUpdates: true, referrals: true, launchNews: true });

  React.useEffect(() => {
    let alive = true;
    async function load() {
      if (!token) { setError('Missing token'); setLoading(false); return; }
      try {
        const res = await fetch(`/api/prefs?token=${encodeURIComponent(token)}`);
        const data = await res.json();
        if (!alive) return;
        if (!res.ok || !data.ok) { setError(data?.error || 'Failed to load'); }
        else {
          setEmail(data.email || '');
          setUnsubscribed(!!data.unsubscribed);
          setPrefs(data.emailPrefs as Prefs);
        }
      } catch {
        if (alive) setError('Failed to load');
      } finally {
        if (alive) setLoading(false);
      }
    }
    load();
    return () => { alive = false; };
  }, [token]);

  async function save() {
    setSaving(true); setError('');
    try {
      const res = await fetch(`/api/prefs?token=${encodeURIComponent(token)}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ unsubscribed, emailPrefs: prefs }),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) setError(data?.error || 'Failed to save');
    } catch {
      setError('Failed to save');
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <main className="mx-auto max-w-3xl px-4 py-16">Loading…</main>;
  if (error) return <main className="mx-auto max-w-3xl px-4 py-16"><p className="text-rose-600">Error: {error}</p></main>;

  return (
    <main className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8 py-16">
      <h1 className="text-3xl font-bold tracking-tight">Email preferences</h1>
      <p className="mt-1 text-slate-600 text-sm">Managing: <span className="font-mono">{email}</span></p>

      <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-6">
        <label className="flex items-start gap-3">
          <input type="checkbox" className="mt-1 h-4 w-4" checked={!unsubscribed} onChange={e => setUnsubscribed(!e.target.checked)} />
          <div>
            <div className="font-medium">Receive emails</div>
            <div className="text-sm text-slate-600">Uncheck to unsubscribe from all messages.</div>
          </div>
        </label>
        <div className="mt-4 grid gap-3">
          <label className="flex items-start gap-3 opacity-100">
            <input type="checkbox" className="mt-1 h-4 w-4" checked={prefs.waitlistUpdates && !unsubscribed} onChange={e => setPrefs(p => ({ ...p, waitlistUpdates: e.target.checked }))} disabled={unsubscribed} />
            <div>
              <div className="font-medium">Waitlist updates</div>
              <div className="text-sm text-slate-600">News and progress before launch.</div>
            </div>
          </label>
          <label className="flex items-start gap-3">
            <input type="checkbox" className="mt-1 h-4 w-4" checked={prefs.referrals && !unsubscribed} onChange={e => setPrefs(p => ({ ...p, referrals: e.target.checked }))} disabled={unsubscribed} />
            <div>
              <div className="font-medium">Referral reminders</div>
              <div className="text-sm text-slate-600">Occasional nudges about your invite link.</div>
            </div>
          </label>
          <label className="flex items-start gap-3">
            <input type="checkbox" className="mt-1 h-4 w-4" checked={prefs.launchNews && !unsubscribed} onChange={e => setPrefs(p => ({ ...p, launchNews: e.target.checked }))} disabled={unsubscribed} />
            <div>
              <div className="font-medium">Launch news</div>
              <div className="text-sm text-slate-600">Be first to know when we go live.</div>
            </div>
          </label>
        </div>

        <div className="mt-6 flex gap-3">
          <button onClick={save} disabled={saving} className="rounded-xl bg-slate-900 text-white px-4 py-2 font-semibold hover:opacity-90 disabled:opacity-60">
            {saving ? 'Saving…' : 'Save preferences'}
          </button>
        </div>
      </div>
    </main>
  );
}

