import 'server-only';

import { NextResponse } from 'next/server';
import { __test as waitlistTestUtils } from '@/lib/firestore/waitlist';
import { upsertPending } from '@/lib/firestore/waitlist';

export async function POST(request: Request) {
  if (process.env.NODE_ENV !== 'test') {
    return NextResponse.json({ ok: false }, { status: 404 });
  }

  const body = await request.json().catch(() => ({}));
  const action = typeof body.action === 'string' ? body.action : '';

  switch (action) {
    case 'expire_token': {
      const token = typeof body.token === 'string' ? body.token : null;
      if (!token) {
        return NextResponse.json({ ok: false, error: 'missing_token' }, { status: 400 });
      }
      const success = waitlistTestUtils.expireToken(token);
      return NextResponse.json({ ok: success });
    }
    case 'seed_waitlist': {
      const email = typeof body.email === 'string' ? body.email : null;
      const locale = typeof body.locale === 'string' ? body.locale : null;
      if (!email) {
        return NextResponse.json({ ok: false, error: 'missing_email' }, { status: 400 });
      }
      await upsertPending(email, {
        locale,
        utm: undefined,
        ref: null,
        consent: true,
        confirmExpiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        confirmTokenHash: 'seed-hash',
        confirmTokenLookupHash: 'seed-lookup',
        confirmSalt: 'seed-salt',
      });
      return NextResponse.json({ ok: true });
    }
    default:
      return NextResponse.json({ ok: false, error: 'unknown_action' }, { status: 400 });
  }
}
