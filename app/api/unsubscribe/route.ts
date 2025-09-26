import 'server-only';

import { NextResponse } from 'next/server';

import { shouldSend, upsertSuppression } from '@/lib/email/suppress';
import { verifyUnsubToken } from '@/lib/email/tokens';

export const runtime = 'nodejs';

async function parseBody(request: Request): Promise<Record<string, unknown>> {
  const contentType = request.headers.get('content-type') || '';
  if (contentType.includes('application/json')) {
    try {
      return await request.json();
    } catch {
      return {};
    }
  }

  if (contentType.includes('application/x-www-form-urlencoded') || contentType.includes('multipart/form-data')) {
    try {
      const form = await request.formData();
      const result: Record<string, unknown> = {};
      form.forEach((value, key) => {
        result[key] = typeof value === 'string' ? value : String(value);
      });
      return result;
    } catch {
      return {};
    }
  }

  return {};
}

export async function POST(request: Request) {
  const body = await parseBody(request);

  let redirectTarget: string | undefined;
  try {
    const token = typeof body.token === 'string' ? body.token.trim() : undefined;
    const email = typeof body.email === 'string' ? body.email.trim() : undefined;
    redirectTarget = typeof body.redirect === 'string' ? body.redirect : undefined;

    if (token) {
      const payload = verifyUnsubToken(token);
      if (payload) {
        await upsertSuppression({
          email: payload.email,
          scope: payload.scope,
          source: 'one-click',
          reason: 'User unsubscribed via token',
        });
      }
    } else if (email) {
      await upsertSuppression({
        email,
        scope: 'all',
        source: 'manual',
        reason: 'User unsubscribed via form',
      });
    }
  } catch (error) {
    console.error('unsubscribe error', error);
  }
  if (redirectTarget) {
    try {
      const url = new URL(redirectTarget, request.url);
      return NextResponse.redirect(url.toString(), { status: 303 });
    } catch {
      // ignore malformed redirect target
    }
  }

  return NextResponse.json({ ok: true });
}

export async function GET(request: Request) {
  if (process.env.TEST_MODE === '1') {
    try {
      const url = new URL(request.url);
      const email = url.searchParams.get('email');
      const scopeParam = url.searchParams.get('scope');
      if (email) {
        const scope = scopeParam === 'marketing' || scopeParam === 'transactional' ? scopeParam : 'all';
        const result = await shouldSend({ email, scope });
        return NextResponse.json({ ok: true, allowed: result.allowed });
      }
    } catch {
      // fall through to generic response
    }
  }

  return NextResponse.json({ ok: true });
}
