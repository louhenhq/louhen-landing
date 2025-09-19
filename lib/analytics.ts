import { FieldValue } from 'firebase-admin/firestore';
import { initAdmin } from '@/lib/firebaseAdmin';

export type WaitlistAnalyticsEventName =
  | 'waitlist_signup_submitted'
  | 'waitlist_signup_accepted'
  | 'waitlist_confirmed'
  | 'waitlist_expired'
  | 'waitlist_bounced';

export type WaitlistAnalyticsEvent = {
  name: WaitlistAnalyticsEventName;
  data?: Record<string, unknown>;
};

const SOURCE = 'api:waitlist';

function buildPayload(event: WaitlistAnalyticsEvent): Record<string, unknown> {
  const data: Record<string, unknown> = { name: event.name, source: SOURCE };
  const extras = event.data ?? {};
  for (const [key, value] of Object.entries(extras)) {
    if (value !== undefined) data[key] = value;
  }
  return data;
}

export async function logAnalyticsEvent(event: WaitlistAnalyticsEvent) {
  const payload = buildPayload(event);

  if (process.env.NODE_ENV !== 'production') {
    console.info('[analytics]', payload);
    return;
  }

  try {
    const app = initAdmin();
    const db = app.firestore();
    await db.collection('events').add({
      ...payload,
      createdAt: FieldValue.serverTimestamp(),
    });
  } catch (error) {
    console.error('logAnalyticsEvent failed', { event: event.name, error });
  }
}

