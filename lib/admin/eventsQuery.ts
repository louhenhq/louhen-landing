import { initAdmin } from '@/lib/firebaseAdmin';

export type EventsQueryParams = {
  limit: number;
  cursorId?: string | null;
  eventName?: string | null;
  errorsOnly?: boolean;
  q?: string | null;
};

export type EventRow = {
  id: string;
  name: string;
  path?: string;
  variant?: string;
  id2?: string;
  ok?: boolean;
  error?: string;
  ua?: string;
  ip?: string;
  ip_hash?: string;
  ref?: string | null;
  referrer?: string | null;
  utm_source?: string | null;
  utm_medium?: string | null;
  utm_campaign?: string | null;
  utm_content?: string | null;
  utm_term?: string | null;
  ts?: number;
  createdAt?: FirebaseFirestore.Timestamp;
};

export async function getEvents(params: EventsQueryParams) {
  const { limit, cursorId, eventName, errorsOnly, q } = params;
  const app = initAdmin();
  const db = app.firestore();

  let query = db.collection('events') as FirebaseFirestore.Query<FirebaseFirestore.DocumentData>;

  if (eventName) {
    query = query.where('name', '==', eventName);
  }
  if (errorsOnly) {
    // Note: only matches documents with explicit ok=false
    query = query.where('ok', '==', false);
  }

  query = query.orderBy('createdAt', 'desc');

  if (cursorId) {
    const cursorDoc = await db.collection('events').doc(cursorId).get();
    if (cursorDoc.exists) {
      query = query.startAfter(cursorDoc);
    }
  }

  // Fetch up to 3x the limit if doing free-text filtering
  const fetchLimit = q ? Math.min(limit * 3, 1500) : limit;

  const snap = await query.limit(fetchLimit).get();

  const rawRows: EventRow[] = snap.docs.map((d) => {
    const raw = d.data() as Record<string, unknown>;
    return {
      id: d.id,
      name: String(raw.name || ''),
      path: typeof raw.path === 'string' ? raw.path : undefined,
      variant: typeof raw.variant === 'string' ? raw.variant : undefined,
      id2: typeof raw.id === 'string' ? raw.id : undefined,
      ok: typeof raw.ok === 'boolean' ? raw.ok : undefined,
      error: typeof raw.error === 'string' ? raw.error : undefined,
      ua: typeof raw.ua === 'string' ? raw.ua : undefined,
      ip: typeof raw.ip === 'string' ? raw.ip : undefined,
      ip_hash: typeof raw.ip_hash === 'string' ? raw.ip_hash : undefined,
      ref: (raw.ref as string) ?? null,
      referrer: (raw.referrer as string) ?? null,
      utm_source: (raw.utm_source as string) ?? null,
      utm_medium: (raw.utm_medium as string) ?? null,
      utm_campaign: (raw.utm_campaign as string) ?? null,
      utm_content: (raw.utm_content as string) ?? null,
      utm_term: (raw.utm_term as string) ?? null,
      ts: typeof raw.ts === 'number' ? raw.ts : undefined,
      createdAt: raw.createdAt as FirebaseFirestore.Timestamp | undefined,
    };
  });

  let rows = rawRows;
  if (q && q.trim()) {
    const needle = q.trim().toLowerCase();
    rows = rawRows.filter((r) => {
      const fields = [r.path, r.ref || undefined, r.referrer || undefined, r.utm_source || undefined, r.utm_medium || undefined, r.utm_campaign || undefined, r.utm_content || undefined, r.utm_term || undefined].filter(Boolean) as string[];
      return fields.some((v) => v.toLowerCase().includes(needle));
    });
  }

  if (rows.length > limit) rows = rows.slice(0, limit);

  const lastDoc = snap.docs[snap.docs.length - 1];
  const nextCursor = lastDoc ? lastDoc.id : null;

  return { rows, nextCursor };
}

