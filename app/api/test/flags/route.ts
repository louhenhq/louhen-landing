import { NextResponse } from 'next/server';
import { FLAG_COOKIE_NAME, isProduction, type FeatureFlags } from '@/lib/shared/flags';

type PublicFlagPayload = Partial<Pick<FeatureFlags, 'ANALYTICS_ENABLED' | 'BANNER_WAITLIST_URGENCY'>>;

const MAX_AGE_SECONDS = 60 * 10; // 10 minutes

function encodeOverrides(overrides: PublicFlagPayload): string {
  return encodeURIComponent(JSON.stringify(overrides));
}

function isEmpty(overrides: PublicFlagPayload): boolean {
  return Object.keys(overrides).length === 0;
}

export async function POST(request: Request) {
  if (isProduction()) {
    return new Response('Not Found', { status: 404 });
  }

  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    payload = {};
  }

  const overrides: PublicFlagPayload = {};
  if (payload && typeof payload === 'object') {
    const candidate = payload as Record<string, unknown>;
    if (typeof candidate.ANALYTICS_ENABLED === 'boolean') {
      overrides.ANALYTICS_ENABLED = candidate.ANALYTICS_ENABLED;
    }
    if (typeof candidate.BANNER_WAITLIST_URGENCY === 'boolean') {
      overrides.BANNER_WAITLIST_URGENCY = candidate.BANNER_WAITLIST_URGENCY;
    }
  }

  const response = new NextResponse(null, { status: 204, headers: { 'Cache-Control': 'no-store' } });
  const secure = process.env.NODE_ENV !== 'development';

  if (isEmpty(overrides)) {
    response.cookies.set({
      name: FLAG_COOKIE_NAME,
      value: '',
      httpOnly: false,
      sameSite: 'lax',
      secure,
      path: '/',
      maxAge: 0,
    });
  } else {
    response.cookies.set({
      name: FLAG_COOKIE_NAME,
      value: encodeOverrides(overrides),
      httpOnly: false,
      sameSite: 'lax',
      secure,
      path: '/',
      maxAge: MAX_AGE_SECONDS,
    });
  }

  return response;
}
