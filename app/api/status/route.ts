import { NextResponse, type NextRequest } from 'next/server';

import { collectStatusSignals } from '@/lib/status/collect';
import { buildStatusChallenge, verifyStatusAuth } from '@/lib/status/auth';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const RATE_LIMIT_MAX = 10;
const RATE_LIMIT_WINDOW_MS = 60_000;

type RateEntry = {
  count: number;
  windowStart: number;
};

const rateLimitState = new Map<string, RateEntry>();

function getClientKey(request: NextRequest): string {
  const forwarded = request.headers.get('x-forwarded-for');
  if (forwarded) {
    const [first] = forwarded.split(',');
    if (first) return first.trim() || 'forwarded';
  }
  const realIp = request.headers.get('x-real-ip');
  if (realIp) return realIp.trim();
  return 'unknown';
}

function checkRateLimit(key: string): { limited: boolean; retryAfter?: number } {
  const now = Date.now();
  const entry = rateLimitState.get(key);

  if (!entry || now - entry.windowStart >= RATE_LIMIT_WINDOW_MS) {
    rateLimitState.set(key, { count: 1, windowStart: now });
    return { limited: false };
  }

  if (entry.count >= RATE_LIMIT_MAX) {
    const retryAfterMs = entry.windowStart + RATE_LIMIT_WINDOW_MS - now;
    return { limited: true, retryAfter: Math.max(1, Math.ceil(retryAfterMs / 1000)) };
  }

  entry.count += 1;
  return { limited: false };
}

function unauthorizedResponse(): NextResponse {
  const headers = new Headers({
    'WWW-Authenticate': buildStatusChallenge(),
    'Cache-Control': 'no-store',
    'X-Robots-Tag': 'noindex, nofollow',
    Vary: 'Authorization',
  });
  return new NextResponse('Unauthorized', { status: 401, headers });
}

export async function GET(request: NextRequest) {
  const clientKey = getClientKey(request);
  const rate = checkRateLimit(clientKey);

  if (rate.limited) {
    const headers = new Headers({
      'Retry-After': String(rate.retryAfter ?? 60),
      'Cache-Control': 'no-store',
      'X-Robots-Tag': 'noindex, nofollow',
    });
    return NextResponse.json({ error: 'rate_limited' }, { status: 429, headers });
  }

  const auth = verifyStatusAuth(request.headers.get('authorization'));
  if (!auth.ok) {
    console.warn('[status:auth] invalid credentials', { client: clientKey });
    return unauthorizedResponse();
  }

  const payload = await collectStatusSignals({ headers: request.headers });

  const headers = new Headers({
    'Cache-Control': 'no-store',
    'X-Robots-Tag': 'noindex, nofollow',
    Vary: 'Authorization',
  });

  return NextResponse.json(payload, { status: 200, headers });
}
