export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

import { getEvents } from '@/lib/admin/eventsQuery';
import type { EventRow } from '@/lib/admin/eventsQuery';
import type { Timestamp } from 'firebase-admin/firestore';

function toIso(input: unknown): string {
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
  if (typeof input === 'number') {
    const d = new Date(input);
    if (!Number.isNaN(d.getTime())) return d.toISOString();
  }
  return '';
}

type SearchParams = Record<string, string | string[] | undefined>;

export default async function EventsAdminPage({ searchParams }: { searchParams: SearchParams }) {
  const keyFromUrl = typeof searchParams.key === 'string' ? searchParams.key : Array.isArray(searchParams.key) ? searchParams.key[0] : undefined;
  const adminKey = process.env.ADMIN_KEY;
  if (!adminKey || keyFromUrl !== adminKey) {
    return (
      <main className="mx-auto max-w-2xl px-4 py-16">
        <h1 className="text-2xl font-bold">Unauthorized</h1>
        <p className="mt-2 text-text-muted">Missing or invalid key.</p>
      </main>
    );
  }

  const limit = Math.min(Number(searchParams.limit ?? 200) || 200, 500);
  const eventName = typeof searchParams.event === 'string' && searchParams.event !== '' ? searchParams.event : undefined;
  const q = typeof searchParams.q === 'string' && searchParams.q.trim() !== '' ? searchParams.q.trim() : undefined;
  const errorsOnly = String(searchParams.errors) === '1';
  const cursor = typeof searchParams.cursor === 'string' && searchParams.cursor !== '' ? searchParams.cursor : undefined;

  const { rows, nextCursor } = await getEvents({ limit, eventName: eventName || null, errorsOnly, q: q || null, cursorId: cursor || null });

  return (
    <main className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12">
      <div className="flex items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Recent Events</h1>
          <p className="mt-2 text-text-muted text-sm">Showing latest {rows.length}. Use the secret ?key=… to access.</p>
        </div>
        <div className="text-sm text-text-muted">ordered by createdAt desc</div>
      </div>
      <div className="mt-4 text-sm">
        <a href={`/admin?key=${encodeURIComponent(adminKey)}`} className="underline">Back to admin</a>
        <span className="mx-2">•</span>
        <a href={`/admin/events/export?key=${encodeURIComponent(adminKey)}&format=json${eventName ? `&event=${encodeURIComponent(eventName)}` : ''}${q ? `&q=${encodeURIComponent(q)}` : ''}${errorsOnly ? '&errors=1' : ''}`} className="underline">Export JSON</a>
        <span className="mx-2">•</span>
        <a href={`/admin/events/export?key=${encodeURIComponent(adminKey)}&format=csv${eventName ? `&event=${encodeURIComponent(eventName)}` : ''}${q ? `&q=${encodeURIComponent(q)}` : ''}${errorsOnly ? '&errors=1' : ''}`} className="underline">Export CSV</a>
      </div>
      <form method="get" className="mt-4 grid grid-cols-1 md:grid-cols-4 gap-3 items-end">
        <input type="hidden" name="key" value={adminKey} />
        <div>
          <label className="block text-xs text-text-muted mb-1">Event</label>
          <select name="event" defaultValue={eventName || ''} className="w-full border rounded-lg px-3 py-2">
            <option value="">All</option>
            <option value="page_view">page_view</option>
            <option value="cta_click">cta_click</option>
            <option value="waitlist_submit">waitlist_submit</option>
            <option value="how_it_works_click">how_it_works_click</option>
            <option value="wl_view">wl_view</option>
            <option value="wl_submit">wl_submit</option>
            <option value="wl_confirm_success">wl_confirm_success</option>
            <option value="wl_confirm_expired">wl_confirm_expired</option>
            <option value="wl_resend">wl_resend</option>
            <option value="wl_share_view">wl_share_view</option>
            <option value="wl_share_copy_link">wl_share_copy_link</option>
            <option value="wl_share_copy_code">wl_share_copy_code</option>
            <option value="wl_share_native">wl_share_native</option>
            <option value="wl_referral_applied">wl_referral_applied</option>
          </select>
        </div>
        <div>
          <label className="block text-xs text-text-muted mb-1">Search (path/ref/utm)</label>
          <input type="text" name="q" defaultValue={q || ''} placeholder="e.g. prelaunch or /?utm_" className="w-full border rounded-lg px-3 py-2" />
        </div>
        <div>
          <label className="block text-xs text-text-muted mb-1">Limit</label>
          <select name="limit" defaultValue={String(limit)} className="w-full border rounded-lg px-3 py-2">
            <option value="50">50</option>
            <option value="100">100</option>
            <option value="200">200</option>
            <option value="500">500</option>
          </select>
        </div>
        <div className="flex items-center gap-2">
          <input id="errors" type="checkbox" name="errors" value="1" defaultChecked={errorsOnly} className="h-4 w-4" />
          <label htmlFor="errors" className="text-sm">Errors only</label>
          <button type="submit" className="ml-auto inline-flex items-center rounded-lg px-3 py-2 text-sm bg-slate-900 text-text-inverse">Apply</button>
        </div>
      </form>
      <div className="mt-6 overflow-x-auto rounded-xl border border-border bg-bg-card">
        <table className="min-w-full text-xs sm:text-sm">
          <thead className="bg-bg text-text">
            <tr>
              <th className="px-3 py-2 text-left">When</th>
              <th className="px-3 py-2 text-left">Event</th>
              <th className="px-3 py-2 text-left">Path</th>
              <th className="px-3 py-2 text-left">Variant</th>
              <th className="px-3 py-2 text-left">ID</th>
              <th className="px-3 py-2 text-left">OK</th>
              <th className="px-3 py-2 text-left">Error</th>
              <th className="px-3 py-2 text-left">IP</th>
              <th className="px-3 py-2 text-left">UTM</th>
              <th className="px-3 py-2 text-left">Referrer</th>
              <th className="px-3 py-2 text-left">UA</th>
            </tr>
          </thead>
          <tbody>
            {(rows as EventRow[]).map((r: EventRow) => {
              const createdIso = r.createdAt ? toIso(r.createdAt) : (r.ts ? new Date(r.ts).toISOString() : '');
              return (
                <tr key={r.id} className="border-t border-border align-top">
                  <td className="px-3 py-2 whitespace-nowrap tabular-nums">{createdIso ? new Date(createdIso).toLocaleString() : '—'}</td>
                  <td className="px-3 py-2">{r.name}</td>
                  <td className="px-3 py-2 font-mono text-[11px] sm:text-xs max-w-[16rem] truncate" title={r.path}>{r.path || '—'}</td>
                  <td className="px-3 py-2">{r.variant || '—'}</td>
                  <td className="px-3 py-2 font-mono text-[11px] sm:text-xs">{r.id2 || '—'}</td>
                  <td className="px-3 py-2">{r.ok === undefined ? '—' : r.ok ? 'yes' : 'no'}</td>
                  <td className="px-3 py-2 text-feedback-error">{r.error || '—'}</td>
                  <td className="px-3 py-2 font-mono text-[11px] sm:text-xs">{r.ip_hash || '—'}</td>
                  <td className="px-3 py-2">
                    <div className="text-[11px] sm:text-xs text-text-muted">
                      {r.utm_source || r.utm_medium || r.utm_campaign || r.utm_content || r.utm_term ? (
                        <>
                          {r.utm_source && <span><b>src</b>={r.utm_source} </span>}
                          {r.utm_medium && <span><b>med</b>={r.utm_medium} </span>}
                          {r.utm_campaign && <span><b>cmp</b>={r.utm_campaign} </span>}
                          {r.utm_content && <span><b>cnt</b>={r.utm_content} </span>}
                          {r.utm_term && <span><b>term</b>={r.utm_term}</span>}
                        </>
                      ) : '—'}
                    </div>
                  </td>
                  <td className="px-3 py-2 max-w-[18rem] truncate" title={r.referrer || r.ref || undefined}>{r.referrer || r.ref || '—'}</td>
                  <td className="px-3 py-2 max-w-[22rem] truncate" title={r.ua}>{r.ua || '—'}</td>
                </tr>
              );
            })}
            {rows.length === 0 && (
              <tr>
                <td className="px-3 py-4 text-text-muted" colSpan={11}>
                  No data yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      <div className="mt-4 flex items-center justify-end gap-3">
        {nextCursor && (
          <a
            className="inline-flex items-center rounded-lg px-3 py-2 text-sm bg-bg border"
            href={`/admin/events?key=${encodeURIComponent(adminKey)}&limit=${limit}${eventName ? `&event=${encodeURIComponent(eventName)}` : ''}${q ? `&q=${encodeURIComponent(q)}` : ''}${errorsOnly ? '&errors=1' : ''}&cursor=${encodeURIComponent(nextCursor)}`}
          >
            Next →
          </a>
        )}
      </div>
    </main>
  );
}
