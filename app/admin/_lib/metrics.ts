import { initAdmin } from '@/lib/firebaseAdmin';
import { Timestamp } from 'firebase-admin/firestore';

type Totals = {
  signups: number;
  confirmed: number;
  conversionPct: number;
};

type ReferrerRow = {
  code: string;
  count: number;
};

type BlockRow = {
  reason: string;
  count: number;
};

type TrendRow = {
  date: string;
  signups: number;
  confirms: number;
};

const cache = new Map<string, { expires: number; value: unknown }>();
const CACHE_MS = 60_000;

function getCached<T>(key: string): T | null {
  const entry = cache.get(key);
  if (!entry) return null;
  if (Date.now() > entry.expires) {
    cache.delete(key);
    return null;
  }
  return entry.value as T;
}

function setCached<T>(key: string, value: T) {
  cache.set(key, { value, expires: Date.now() + CACHE_MS });
}

export async function getTotals(): Promise<Totals> {
  const cached = getCached<Totals>('totals');
  if (cached) return cached;
  const app = initAdmin();
  const db = app.firestore();
  const waitlistColl = db.collection('waitlist');
  const [signupsSnap, confirmedSnap] = await Promise.all([
    waitlistColl.count().get(),
    waitlistColl.where('status', '==', 'confirmed').count().get(),
  ]);
  const signups = signupsSnap.data().count;
  const confirmed = confirmedSnap.data().count;
  const conversionPct = signups ? Math.round((confirmed / signups) * 1000) / 10 : 0;
  const totals: Totals = { signups, confirmed, conversionPct };
  setCached('totals', totals);
  return totals;
}

export async function getTopReferrers(limit = 20): Promise<ReferrerRow[]> {
  const key = `top-referrers-${limit}`;
  const cached = getCached<ReferrerRow[]>(key);
  if (cached) return cached;
  const app = initAdmin();
  const db = app.firestore();
  const snap = await db.collection('events').where('name', '==', 'waitlist_submit').orderBy('createdAt', 'desc').limit(2000).get();
  const counts = new Map<string, number>();
  snap.forEach((doc) => {
    const ref = String(doc.get('referredBy') || '').toUpperCase();
    if (!ref) return;
    counts.set(ref, (counts.get(ref) || 0) + 1);
  });
  const rows = Array.from(counts.entries())
    .map(([code, count]) => ({ code, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, limit);
  setCached(key, rows);
  return rows;
}

export async function getBlocks(limit = 20): Promise<BlockRow[]> {
  const key = `blocks-${limit}`;
  const cached = getCached<BlockRow[]>(key);
  if (cached) return cached;
  const app = initAdmin();
  const db = app.firestore();
  const snap = await db.collection('events').where('name', '==', 'wl_referral_blocked').orderBy('createdAt', 'desc').limit(2000).get();
  const counts = new Map<string, number>();
  snap.forEach((doc) => {
    const reason = String(doc.get('reason') || 'unknown');
    counts.set(reason, (counts.get(reason) || 0) + 1);
  });
  const rows = Array.from(counts.entries())
    .map(([reason, count]) => ({ reason, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, limit);
  setCached(key, rows);
  return rows;
}

export async function getTrendDaily(days = 14): Promise<TrendRow[]> {
  const key = `trend-${days}`;
  const cached = getCached<TrendRow[]>(key);
  if (cached) return cached;
  const app = initAdmin();
  const db = app.firestore();
  const since = Timestamp.fromDate(new Date(Date.now() - days * 24 * 60 * 60 * 1000));
  const waitlistColl = db.collection('waitlist');
  const [signupsSnap, confirmedSnap] = await Promise.all([
    waitlistColl.where('createdAt', '>=', since).get(),
    waitlistColl.where('confirmedAt', '>=', since).get(),
  ]);

  const buckets = new Map<string, { signups: number; confirms: number }>();
  const ensureBucket = (date: string) => {
    if (!buckets.has(date)) buckets.set(date, { signups: 0, confirms: 0 });
    return buckets.get(date)!;
  };

  signupsSnap.forEach((doc) => {
    const createdAt = doc.get('createdAt');
    if (!createdAt?.toDate) return;
    const dateKey = createdAt.toDate().toISOString().slice(0, 10);
    ensureBucket(dateKey).signups += 1;
  });

  confirmedSnap.forEach((doc) => {
    const confirmedAt = doc.get('confirmedAt');
    if (!confirmedAt?.toDate) return;
    const dateKey = confirmedAt.toDate().toISOString().slice(0, 10);
    ensureBucket(dateKey).confirms += 1;
  });

  const rows: TrendRow[] = Array.from(buckets.entries())
    .map(([date, value]) => ({ date, signups: value.signups, confirms: value.confirms }))
    .sort((a, b) => (a.date < b.date ? -1 : 1));

  setCached(key, rows);
  return rows;
}
