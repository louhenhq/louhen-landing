export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

import { initAdmin } from '@/lib/firebaseAdmin';
import type { WaitlistDoc } from '@/types/waitlist';
import type { Timestamp } from 'firebase-admin/firestore';

function toIsoDate(input: unknown): string {
  if (input && typeof input === 'object' && 'toDate' in (input as Record<string, unknown>)) {
    const ts = input as Timestamp;
    const d = ts.toDate();
    return d.toISOString();
  }
  if (input instanceof Date) return input.toISOString();
  if (typeof input === 'string') {
    const d = new Date(input);
    if (!Number.isNaN(d.getTime())) return d.toISOString();
  }
  return '';
}

function maskEmail(email: string) {
  const [user, domain] = email.split('@');
  if (!user || !domain) return email;
  const maskedUser =
    user.length <= 2
      ? user[0] + '*'
      : user[0] + '*'.repeat(Math.max(1, user.length - 2)) + user.slice(-1);
  return `${maskedUser}@${domain}`;
}

type SearchParams = Record<string, string | string[] | undefined>;

export default async function AdminPage({ searchParams }: { searchParams: SearchParams }) {
  const keyFromUrl = typeof searchParams.key === 'string' ? searchParams.key : Array.isArray(searchParams.key) ? searchParams.key[0] : undefined;
  const adminKey = process.env.ADMIN_KEY;
  if (!adminKey || keyFromUrl !== adminKey) {
    return (
      <main className="mx-auto max-w-2xl px-4 py-16">
        <h1 className="text-2xl font-bold">Unauthorized</h1>
        <p className="mt-2 text-slate-600">Missing or invalid key.</p>
      </main>
    );
  }

  const app = initAdmin();
  const db = app.firestore();
  const snap = await db.collection('waitlist').orderBy('referralCount', 'desc').limit(50).get();

  type Row = {
    id: string;
    email: string;
    code: string;
    count: number;
    createdAt: string;
    country: string;
  };

  const rows: Row[] = snap.docs.map((d) => {
    const raw = d.data() as FirebaseFirestore.DocumentData;
    const data: Partial<WaitlistDoc> = {
      email: String(raw.email),
      referralCode: String(raw.referralCode || ''),
      referralCount: Number(raw.referralCount || 0),
      createdAt: raw.createdAt,
      country: raw.country || '',
    };
    return {
      id: d.id,
      email: data.email || '',
      code: data.referralCode || '',
      count: data.referralCount || 0,
      createdAt: toIsoDate(data.createdAt as unknown),
      country: String(data.country || ''),
    };
  });

  return (
    <main className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 py-12">
      <h1 className="text-3xl font-bold tracking-tight">Top Referrers</h1>
      <p className="mt-2 text-slate-600 text-sm">Showing top 50 by referralCount. Use the secret ?key=… to access.</p>
      <div className="mt-4 text-sm">
        <a
          href={`/api/admin/backfill-unsub?key=${encodeURIComponent(adminKey)}&dry=1&limit=50`}
          className="underline"
        >
          Backfill unsubscribe tokens (dry-run)
        </a>
        <span className="mx-2">•</span>
        <a
          href={`/api/admin/backfill-unsub?key=${encodeURIComponent(adminKey)}&dry=0&limit=50`}
          className="underline text-rose-600"
        >
          Execute backfill (50 per page)
        </a>
        <span className="mx-2">•</span>
        <a href={`/admin/events?key=${encodeURIComponent(adminKey)}`} className="underline">View recent events</a>
      </div>
      <div className="mt-6 overflow-x-auto rounded-xl border border-slate-200 bg-white">
        <table className="min-w-full text-sm">
          <thead className="bg-slate-50 text-slate-700">
            <tr>
              <th className="px-3 py-2 text-left">#</th>
              <th className="px-3 py-2 text-left">Email</th>
              <th className="px-3 py-2 text-left">Code</th>
              <th className="px-3 py-2 text-left">Referrals</th>
              <th className="px-3 py-2 text-left">Created</th>
              <th className="px-3 py-2 text-left">Country</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r, i) => (
              <tr key={r.id} className="border-t border-slate-100">
                <td className="px-3 py-2">{i + 1}</td>
                <td className="px-3 py-2">{maskEmail(r.email)}</td>
                <td className="px-3 py-2 font-mono">{r.code}</td>
                <td className="px-3 py-2">{r.count}</td>
                <td className="px-3 py-2 tabular-nums">
                  {r.createdAt ? new Date(r.createdAt).toLocaleString(undefined, {
                    year: 'numeric', month: 'short', day: '2-digit',
                    hour: '2-digit', minute: '2-digit'
                  }) : '—'}
                </td>
                <td className="px-3 py-2">{r.country}</td>
              </tr>
            ))}
            {rows.length === 0 && (
              <tr>
                <td className="px-3 py-4 text-slate-500" colSpan={6}>
                  No data yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </main>
  );
}
