import { NextResponse, NextRequest } from 'next/server';
import { createHash } from 'crypto';
import { FieldValue, type QuerySnapshot, type DocumentData, type Timestamp } from 'firebase-admin/firestore';
import { initAdmin } from '@/lib/firebaseAdmin';
import { sendWaitlistWelcomeEmail } from '@/lib/waitlist/email';
import { logAnalyticsEvent } from '@/lib/analytics';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

function hashToken(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}

export async function GET(req: NextRequest) {
  const token = req.nextUrl.searchParams.get('token')?.trim();
  if (!token) {
    const expiredUrl = new URL('/waitlist/expired', req.nextUrl.origin);
    return NextResponse.redirect(expiredUrl, 303);
  }
  if (token.length < 20) {
    const expiredUrl = new URL('/waitlist/expired', req.nextUrl.origin);
    return NextResponse.redirect(expiredUrl, 303);
  }

  const tokenHash = hashToken(token);

  let snapshot: QuerySnapshot<DocumentData>;
  const app = initAdmin();
  const db = app.firestore();

  try {
    snapshot = await db.collection('waitlist').where('confirmToken', '==', tokenHash).limit(1).get();
  } catch (error) {
    console.error('waitlist confirm lookup failed', error);
    const expiredUrl = new URL('/waitlist/expired', req.nextUrl.origin);
    return NextResponse.redirect(expiredUrl, 303);
  }

  if (snapshot.empty) {
    const expiredUrl = new URL('/waitlist/expired', req.nextUrl.origin);
    return NextResponse.redirect(expiredUrl, 303);
  }

  const doc = snapshot.docs[0];
  const data = doc.data() as Record<string, unknown>;
  const email = typeof data.email === 'string' ? data.email : null;
  const locale = typeof data.locale === 'string' ? data.locale : null;
  const expiresAt = (data.confirmExpiresAt as Timestamp | null | undefined)?.toMillis?.();

  if (expiresAt && Date.now() > expiresAt) {
    await logAnalyticsEvent({
      name: 'waitlist_expired',
      data: { emailHash: doc.id, locale },
    });
    try {
      await doc.ref.set(
        {
          status: 'expired',
          confirmToken: null,
          confirmExpiresAt: null,
          updatedAt: FieldValue.serverTimestamp(),
        },
        { merge: true }
      );
    } catch (error) {
      console.error('waitlist expire update failed', error);
    }
    const expiredUrl = new URL('/waitlist/expired', req.nextUrl.origin);
    return NextResponse.redirect(expiredUrl, 303);
  }

  try {
    await doc.ref.set(
      {
        status: 'confirmed',
        confirmedAt: FieldValue.serverTimestamp(),
        confirmToken: null,
        confirmExpiresAt: null,
        updatedAt: FieldValue.serverTimestamp(),
      },
      { merge: true }
    );
  } catch (error) {
    console.error('waitlist confirm update failed', error);
    const expiredUrl = new URL('/waitlist/expired', req.nextUrl.origin);
    return NextResponse.redirect(expiredUrl, 303);
  }

  try {
    if (email) {
      await sendWaitlistWelcomeEmail({ to: email });
    }
  } catch (error) {
    console.error('waitlist welcome email failed', error);
    await logAnalyticsEvent({
      name: 'waitlist_bounced',
      data: {
        emailHash: doc.id,
        locale,
        phase: 'welcome',
        reason: error instanceof Error ? error.message : 'email_error',
      },
    });
  }

  await logAnalyticsEvent({
    name: 'waitlist_confirmed',
    data: {
      emailHash: doc.id,
      locale,
    },
  });

  const successUrl = new URL('/waitlist/success', req.nextUrl.origin);
  successUrl.searchParams.set('status', 'confirmed');
  return NextResponse.redirect(successUrl, 303);
}
