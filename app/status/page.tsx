import { Buffer } from 'node:buffer';

import type { Metadata } from 'next';
import { headers } from 'next/headers';

import type { StatusSnapshot } from '@/lib/status/collect';
import { buildStatusChallenge, verifyStatusAuth } from '@/lib/status/auth';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

type HeaderStore = Awaited<ReturnType<typeof headers>>;

function buildUnauthorizedResponse(): Response {
  return new Response('Unauthorized', {
    status: 401,
    headers: {
      'WWW-Authenticate': buildStatusChallenge(),
      'Cache-Control': 'no-store',
      'X-Robots-Tag': 'noindex, nofollow',
    },
  });
}

async function requireStatusAuth(): Promise<HeaderStore> {
  const headerStore = await headers();
  const auth = verifyStatusAuth(headerStore.get('authorization'));
  if (!auth.ok) {
    throw buildUnauthorizedResponse();
  }
  return headerStore;
}

function resolveStatusEndpoint(headerStore: HeaderStore): string {
  const envBase = process.env.APP_BASE_URL?.trim() || process.env.NEXT_PUBLIC_SITE_URL?.trim();
  if (envBase) {
    return new URL('/api/status', envBase).toString();
  }

  const host = headerStore.get('x-forwarded-host') || headerStore.get('host');
  const proto = headerStore.get('x-forwarded-proto') || 'https';
  if (!host) {
    throw new Error('Unable to resolve host for status fetch');
  }
  return `${proto}://${host}/api/status`;
}

type StatusApiResponse = {
  noncePresent: boolean;
  emailTransport: boolean;
  suppressionsCount: number;
  env: string;
  details?: StatusSnapshot;
};

async function fetchStatusSnapshot(headerStore: HeaderStore): Promise<StatusSnapshot> {
  const endpoint = resolveStatusEndpoint(headerStore);
  const user = process.env.STATUS_USER;
  const password = process.env.STATUS_PASS;
  if (!user || !password) {
    throw new Error('STATUS_USER/STATUS_PASS are not configured');
  }
  const encoded = Buffer.from(`${user}:${password}`).toString('base64');

  const response = await fetch(endpoint, {
    headers: {
      Authorization: `Basic ${encoded}`,
      Accept: 'application/json',
    },
    cache: 'no-store',
  });

  if (!response.ok) {
    throw new Error(`Status fetch failed with ${response.status}`);
  }

  const payload = (await response.json()) as StatusApiResponse;
  if (payload.details) {
    return payload.details;
  }

  return {
    timestamp: new Date().toISOString(),
    noncePresent: payload.noncePresent,
    consent: {
      analytics: null,
      marketing: null,
      timestamp: null,
    },
    emailTransport: payload.emailTransport,
    emailTransportMode: payload.emailTransport ? 'resend' : 'noop',
    suppressionsCount: payload.suppressionsCount,
    suppressionsSampleLimit: 0,
    env: {
      vercelEnv: payload.env,
      commitSha: null,
      appBaseUrl: null,
    },
    envLabel: payload.env,
    uptime: {
      seconds: 0,
      startedAt: new Date().toISOString(),
    },
  };
}

function formatBoolean(value: boolean | null): string {
  if (value === null) return 'unknown';
  return value ? 'enabled' : 'disabled';
}

function formatCommit(commit: string | null): string {
  if (!commit) return '—';
  return commit.length > 12 ? `${commit.slice(0, 12)}…` : commit;
}

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: 'Operational Status',
    robots: {
      index: false,
      follow: false,
    },
  };
}

export default async function StatusPage() {
  const headerStore = await requireStatusAuth();
  const snapshot = await fetchStatusSnapshot(headerStore);

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-3xl flex-col gap-6 px-6 py-12">
      <header className="flex items-center justify-between gap-3">
        <div>
          <p className="text-meta uppercase tracking-[0.24em] text-feedback-warning">ops only</p>
          <h1 className="text-display-lg text-text">Operational diagnostics</h1>
        </div>
        <span className="rounded-full bg-neutral-90 px-sm py-4 text-body-sm font-medium text-neutral-0">
          Updated {new Date(snapshot.timestamp).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
        </span>
      </header>

      <section className="grid gap-4 md:grid-cols-2">
        <article className="rounded-lg border border-border bg-bg-card p-4 shadow-sm">
          <h2 className="text-h3 text-text">Security signals</h2>
          <dl className="mt-3 space-y-2 text-body-sm text-text-muted">
            <div className="flex items-center justify-between">
              <dt>CSP nonce</dt>
              <dd className={snapshot.noncePresent ? 'text-feedback-success' : 'text-feedback-error'}>
                {snapshot.noncePresent ? 'present' : 'missing'}
              </dd>
            </div>
            <div className="flex items-center justify-between">
              <dt>Consent analytics</dt>
              <dd>{formatBoolean(snapshot.consent.analytics)}</dd>
            </div>
            <div className="flex items-center justify-between">
              <dt>Consent marketing</dt>
              <dd>{formatBoolean(snapshot.consent.marketing)}</dd>
            </div>
            <div className="flex items-center justify-between">
              <dt>Consent timestamp</dt>
              <dd>{snapshot.consent.timestamp ?? '—'}</dd>
            </div>
          </dl>
        </article>

        <article className="rounded-lg border border-border bg-bg-card p-4 shadow-sm">
          <h2 className="text-h3 text-text">Email</h2>
          <dl className="mt-3 space-y-2 text-body-sm text-text-muted">
            <div className="flex items-center justify-between">
              <dt>Live transport</dt>
              <dd className={snapshot.emailTransport ? 'text-feedback-success' : 'text-feedback-warning'}>
                {formatBoolean(snapshot.emailTransport)}
              </dd>
            </div>
            <div className="flex items-center justify-between">
              <dt>Transport mode</dt>
              <dd className="font-mono text-body-sm uppercase text-text">{snapshot.emailTransportMode}</dd>
            </div>
            <div className="flex items-center justify-between">
              <dt>Suppressions (last {snapshot.suppressionsSampleLimit})</dt>
              <dd>{snapshot.suppressionsCount ?? 'unavailable'}</dd>
            </div>
          </dl>
        </article>
      </section>

      <section className="rounded-lg border border-border bg-bg-card p-4 shadow-sm">
        <h2 className="text-h3 text-text">Environment</h2>
        <dl className="mt-3 grid grid-cols-1 gap-3 text-body-sm text-text-muted md:grid-cols-3">
          <div>
            <dt className="text-meta uppercase tracking-[0.2em] text-text-muted">Vercel env</dt>
            <dd className="font-medium text-text">{snapshot.env.vercelEnv ?? '—'}</dd>
          </div>
          <div>
            <dt className="text-meta uppercase tracking-[0.2em] text-text-muted">Commit SHA</dt>
            <dd className="font-mono text-body-sm">{formatCommit(snapshot.env.commitSha)}</dd>
          </div>
          <div>
            <dt className="text-meta uppercase tracking-[0.2em] text-text-muted">Base URL</dt>
            <dd className="text-body-sm">{snapshot.env.appBaseUrl ?? '—'}</dd>
          </div>
        </dl>
      </section>

      <section className="rounded-lg border border-border bg-bg-card p-4 shadow-sm">
        <h2 className="text-h3 text-text">Process uptime</h2>
        <dl className="mt-3 grid grid-cols-1 gap-3 text-body-sm text-text-muted md:grid-cols-2">
          <div>
            <dt className="text-meta uppercase tracking-[0.2em] text-text-muted">Seconds</dt>
            <dd className="font-medium text-text">{snapshot.uptime.seconds}</dd>
          </div>
          <div>
            <dt className="text-meta uppercase tracking-[0.2em] text-text-muted">Started</dt>
            <dd>{new Date(snapshot.uptime.startedAt).toLocaleString()}</dd>
          </div>
        </dl>
      </section>
    </main>
  );
}
