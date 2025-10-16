export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

import { getTotals, getTopReferrers, getBlocks, getTrendDaily } from '@/app/admin/_lib/metrics';
import { loadMessages } from '@/lib/intl/loadMessages';
import { defaultLocale } from '@/next-intl.locales';
import Sparkline from '@/app/admin/components/Sparkline';

type SearchParams = Record<string, string | string[] | undefined>;

function requireAdmin(searchParams: SearchParams) {
  const adminKey = process.env.ADMIN_KEY;
  const keyFromUrl = typeof searchParams.key === 'string' ? searchParams.key : Array.isArray(searchParams.key) ? searchParams.key[0] : undefined;
  if (!adminKey || keyFromUrl !== adminKey) {
    return false;
  }
  return true;
}

function formatPercentage(value: number) {
  return `${value.toFixed(1)}%`;
}

export default async function MetricsPage({ searchParams }: { searchParams: SearchParams }) {
  if (!requireAdmin(searchParams)) {
    return (
      <main className="mx-auto max-w-2xl px-4 py-16">
        <h1 className="text-2xl font-bold">Unauthorized</h1>
        <p className="mt-2 text-text-muted">Missing or invalid key.</p>
      </main>
    );
  }

  const [totals, referrers, blocks, trend, messages] = await Promise.all([
    getTotals(),
    getTopReferrers(),
    getBlocks(),
    getTrendDaily(),
    loadMessages(defaultLocale),
  ]);

  const metricsCopy = ((messages as Record<string, unknown>).admin as Record<string, unknown> | undefined)?.metrics as Record<string, unknown> | undefined;
  const totalsCopy = (metricsCopy?.totals as Record<string, string> | undefined) ?? {};
  const sparklineCopy = (metricsCopy?.sparkline as Record<string, string> | undefined) ?? {};
  const resolve = (value: unknown, fallback: string) => (typeof value === 'string' ? value : fallback);
  const resolveSparkline = (key: string, fallback: string) => resolve(sparklineCopy[key], fallback);

  const signupsValues = trend.map((row) => row.signups);
  const confirmValues = trend.map((row) => row.confirms);

  return (
    <main className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 py-12">
      <header className="flex flex-col gap-sm">
        <h1 className="text-3xl font-bold tracking-tight">{resolve(metricsCopy?.title, 'Metrics dashboard')}</h1>
        <p className="text-sm text-text-muted">{resolve(metricsCopy?.intro, 'Key waitlist metrics updated every 60 seconds.')}</p>
      </header>

      <section className="mt-8 grid gap-lg sm:grid-cols-3">
        <article className="rounded-2xl border border-border bg-bg px-md py-lg shadow-card">
          <p className="text-xs uppercase tracking-wide text-text-muted">{resolve(totalsCopy.signups, 'Signups')}</p>
          <p className="mt-xs text-3xl font-semibold text-text">{totals.signups.toLocaleString()}</p>
        </article>
        <article className="rounded-2xl border border-border bg-bg px-md py-lg shadow-card">
          <p className="text-xs uppercase tracking-wide text-text-muted">{resolve(totalsCopy.confirmed, 'Confirmed')}</p>
          <p className="mt-xs text-3xl font-semibold text-text">{totals.confirmed.toLocaleString()}</p>
        </article>
        <article className="rounded-2xl border border-border bg-bg px-md py-lg shadow-card">
          <p className="text-xs uppercase tracking-wide text-text-muted">{resolve(totalsCopy.conversion, 'Conversion')}</p>
          <p className="mt-xs text-3xl font-semibold text-text">{formatPercentage(totals.conversionPct)}</p>
        </article>
      </section>

      <section className="mt-12 grid gap-lg sm:grid-cols-2">
        <article
          className="rounded-2xl border border-border bg-bg px-md py-lg shadow-card"
          style={{ color: 'var(--semantic-color-status-info)' }}
        >
          <h2 className="text-sm font-semibold text-text">{resolveSparkline('signups', '14-day Signups')}</h2>
          <div className="mt-sm">
            <Sparkline values={signupsValues} aria-label={resolveSparkline('signups', '14-day Signups')} />
          </div>
        </article>
        <article
          className="rounded-2xl border border-border bg-bg px-md py-lg shadow-card"
          style={{ color: 'var(--semantic-color-status-success)' }}
        >
          <h2 className="text-sm font-semibold text-text">{resolveSparkline('confirms', '14-day Confirmations')}</h2>
          <div className="mt-sm">
            <Sparkline values={confirmValues} aria-label={resolveSparkline('confirms', '14-day Confirmations')} />
          </div>
        </article>
      </section>

      <section className="mt-12 grid gap-lg lg:grid-cols-2">
        <article className="rounded-2xl border border-border bg-bg px-md py-lg shadow-card">
          <h2 className="text-lg font-semibold text-text">{resolve(metricsCopy?.topReferrers, 'Top referrers')}</h2>
          <table className="mt-4 min-w-full text-sm">
            <thead className="text-text-muted">
              <tr>
                <th className="py-xs text-left">{resolve(metricsCopy?.codeLabel, 'Code')}</th>
                <th className="py-xs text-right">{resolve(metricsCopy?.signupsLabel, 'Signups')}</th>
              </tr>
            </thead>
            <tbody>
              {referrers.map((row) => (
                <tr key={row.code} className="border-t border-border/60">
                  <td className="py-xs font-mono text-sm">{row.code}</td>
                  <td className="py-xs text-right">{row.count}</td>
                </tr>
              ))}
              {referrers.length === 0 && (
                <tr>
                  <td className="py-sm text-text-muted" colSpan={2}>{resolve(metricsCopy?.noReferrers, 'No referral data yet.')}</td>
                </tr>
              )}
            </tbody>
          </table>
        </article>
        <article className="rounded-2xl border border-border bg-bg px-md py-lg shadow-card">
          <h2 className="text-lg font-semibold text-text">{resolve(metricsCopy?.blocks, 'Referral blocks')}</h2>
          <table className="mt-4 min-w-full text-sm">
            <thead className="text-text-muted">
              <tr>
                <th className="py-xs text-left">{resolve(metricsCopy?.reason, 'Reason')}</th>
                <th className="py-xs text-right">{resolve(metricsCopy?.count, 'Count')}</th>
              </tr>
            </thead>
            <tbody>
              {blocks.map((row) => (
                <tr key={row.reason} className="border-t border-border/60">
                  <td className="py-xs capitalize">{row.reason}</td>
                  <td className="py-xs text-right">{row.count}</td>
                </tr>
              ))}
              {blocks.length === 0 && (
                <tr>
                  <td className="py-sm text-text-muted" colSpan={2}>{resolve(metricsCopy?.noBlocks, 'No blocked referrals recorded.')}</td>
                </tr>
              )}
            </tbody>
          </table>
        </article>
      </section>

      <section className="mt-12 rounded-2xl border border-border bg-bg px-md py-lg shadow-card">
        <h2 className="text-lg font-semibold text-text">{resolve(metricsCopy?.trend, '14-day trend')}</h2>
        <table className="mt-4 min-w-full text-sm">
          <thead className="text-text-muted">
            <tr>
              <th className="py-xs text-left">{resolve(metricsCopy?.date, 'Date')}</th>
              <th className="py-xs text-right">{resolve(metricsCopy?.signupsLabel, 'Signups')}</th>
              <th className="py-xs text-right">{resolve(metricsCopy?.confirmedLabel, 'Confirmed')}</th>
            </tr>
          </thead>
          <tbody>
            {trend.map((row) => (
              <tr key={row.date} className="border-t border-border/60">
                <td className="py-xs">{row.date}</td>
                <td className="py-xs text-right">{row.signups}</td>
                <td className="py-xs text-right">{row.confirms}</td>
              </tr>
            ))}
            {trend.length === 0 && (
              <tr>
                <td className="py-sm text-text-muted" colSpan={3}>{resolve(metricsCopy?.noTrend, 'No events recorded in this window.')}</td>
              </tr>
            )}
          </tbody>
        </table>
      </section>
    </main>
  );
}
