import 'server-only';

import { verifyUnsubToken } from '@/lib/email/tokens';
import { upsertSuppression } from '@/lib/email/suppress';

export const runtime = 'nodejs';

type PageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

function maskEmail(email: string): string {
  const [local, domain] = email.split('@');
  if (!domain) return 'your email address';
  const maskedLocal = local.length <= 2 ? `${local[0] ?? ''}*` : `${local[0]}***${local[local.length - 1]}`;
  const maskedDomain = domain.replace(/^(.).*?(.)(\.[^.]+)$/u, (_, a, b, tld) => `${a}***${b}${tld}`);
  return `${maskedLocal}@${maskedDomain}`;
}

export default async function UnsubscribePage({ searchParams }: PageProps) {
  const params = await searchParams;
  const tokenParam = typeof params.token === 'string' ? params.token : Array.isArray(params.token) ? params.token[0] : undefined;
  const statusParam = typeof params.status === 'string' ? params.status : Array.isArray(params.status) ? params.status[0] : undefined;

  let status: 'token-success' | 'token-invalid' | 'none' = 'none';
  let tokenEmail: string | null = null;

  if (tokenParam) {
    const payload = verifyUnsubToken(tokenParam.trim());
    if (payload) {
      await upsertSuppression({ email: payload.email, scope: payload.scope, source: 'one-click', reason: 'User unsubscribed via token' });
      status = 'token-success';
      tokenEmail = payload.email;
    } else {
      status = 'token-invalid';
    }
  }

  const manualSuccess = statusParam === 'manual-success';

  return (
    <main className="mx-auto flex min-h-screen max-w-lg flex-col gap-6 px-6 py-16">
      <header className="space-y-2">
        <h1 className="text-2xl font-semibold tracking-tight text-slate-900">Manage email preferences</h1>
        <p className="text-sm text-slate-600">
          Use this page to unsubscribe from Louhen updates. You can always rejoin the waitlist or resubscribe later.
        </p>
      </header>

      {status === 'token-success' && (
        <div className="rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-800" role="status">
          <p>Success! We&apos;ll stop emailing{tokenEmail ? ` ${maskEmail(tokenEmail)}` : ''}.</p>
        </div>
      )}

      {status === 'token-invalid' && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800" role="status">
          <p>The unsubscribe link has expired or is invalid. You can still unsubscribe manually below.</p>
        </div>
      )}

      {manualSuccess && (
        <div className="rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-800" role="status">
          <p>Thanks! Your unsubscribe request has been processed.</p>
        </div>
      )}

      <section className="rounded-xl border border-slate-200 bg-white px-6 py-5 shadow-sm">
        <h2 className="text-lg font-medium text-slate-900">Unsubscribe manually</h2>
        <p className="mt-1 text-sm text-slate-600">Enter your email and we&apos;ll stop sending updates to that address.</p>
        <form className="mt-4 flex flex-col gap-3" method="POST" action="/api/unsubscribe">
          <input type="hidden" name="redirect" value="/unsubscribe?status=manual-success" />
          <input
            type="email"
            name="email"
            required
            placeholder="you@example.com"
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm shadow-sm focus:border-slate-500 focus:outline-none"
          />
          <button
            type="submit"
            className="inline-flex w-full items-center justify-center rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-800"
          >
            Unsubscribe
          </button>
        </form>
      </section>

      <p className="text-xs text-slate-500">
        Prefer historical updates again? Reply to any Louhen email or reach out to support@louhen.eu and we&apos;ll help.
      </p>
    </main>
  );
}
