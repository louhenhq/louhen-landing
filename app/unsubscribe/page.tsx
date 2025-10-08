import 'server-only';

import { verifyUnsubToken } from '@/lib/email/tokens';
import { upsertSuppression } from '@/lib/email/suppress';
import { buttons, cn } from '@/app/(site)/_lib/ui';

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
    <main className="mx-auto flex min-h-screen max-w-lg flex-col gap-6 px-6 py-16" data-testid="unsubscribe-root">
      <header className="space-y-2">
        <h1 className="text-2xl font-semibold tracking-tight text-slate-900" data-testid="unsubscribe-heading">
          Manage email preferences
        </h1>
        <p className="text-sm text-slate-600">
          Use this page to unsubscribe from Louhen updates. You can always rejoin the waitlist or resubscribe later.
        </p>
      </header>

      {status === 'token-success' && (
        <div
          className="rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-800"
          role="status"
          data-testid="unsubscribe-token-success"
        >
          <p>Success! We&apos;ll stop emailing{tokenEmail ? ` ${maskEmail(tokenEmail)}` : ''}.</p>
        </div>
      )}

      {status === 'token-invalid' && (
        <div
          className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800"
          role="status"
          data-testid="unsubscribe-token-invalid"
        >
          <p>The unsubscribe link has expired or is invalid. You can still unsubscribe manually below.</p>
        </div>
      )}

      {manualSuccess && (
        <div
          className="rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-800"
          role="status"
          data-testid="unsubscribe-manual-success"
        >
          <p data-testid="unsubscribe-manual-success-copy">Thanks! Your unsubscribe request has been processed.</p>
        </div>
      )}

      <section className="rounded-xl border border-border bg-bg-card px-6 py-5 shadow-sm">
        <h2 className="text-h3 text-text">Unsubscribe manually</h2>
        <p className="mt-1 text-body text-text-muted">Enter your email and we&apos;ll stop sending updates to that address.</p>
        <form className="mt-sm flex flex-col gap-sm" method="POST" action="/api/unsubscribe">
          <input type="hidden" name="redirect" value="/unsubscribe?status=manual-success" />
          <input
            type="email"
            name="email"
            required
            placeholder="you@example.com"
            className="w-full rounded-lg border border-border px-sm py-xs text-body shadow-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-border-focus"
          />
          <button
            type="submit"
            className={cn(buttons.primary, 'w-full rounded-lg px-sm py-xs')}
          >
            Unsubscribe
          </button>
        </form>
      </section>

      <p className="text-body-sm text-text-muted">
        Prefer historical updates again? Reply to any Louhen email or reach out to support@louhen.eu and we&apos;ll help.
      </p>
    </main>
  );
}
