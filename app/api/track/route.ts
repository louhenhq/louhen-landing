import { NextRequest, NextResponse } from 'next/server';
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

import { initAdmin } from '@/lib/firebaseAdmin';
import { FieldValue } from 'firebase-admin/firestore';
import { hashIp } from '@/lib/crypto/ipHash';

function getIp(req: NextRequest): string | null {
  // Prefer Next.js provided ip, fallback to header
  const fromNext = (req as unknown as { ip?: string | null }).ip ?? null;
  if (fromNext) return fromNext;
  const fwd = req.headers.get('x-forwarded-for') || '';
  const ip = fwd.split(',')[0].trim();
  return ip || null;
}

function parseUrl(input: unknown): URL | null {
  if (!input) return null;
  if (typeof input !== 'string') return null;
  try {
    // If path-only was sent (e.g., "/"), construct from site URL
    if (input.startsWith('/')) {
      const base = process.env.NEXT_PUBLIC_SITE_URL || 'https://louhen-landing.vercel.app';
      return new URL(input, base);
    }
    return new URL(input);
  } catch {
    return null;
  }
}

function parseUtm(u: URL | null):
  | { utm_source?: string; utm_medium?: string; utm_campaign?: string; utm_content?: string; utm_term?: string }
  | undefined {
  if (!u) return undefined;
  const keys = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term'] as const;
  const out: Record<string, string> = {};
  for (const k of keys) {
    const v = u.searchParams.get(k);
    if (v && v.trim() !== '') out[k] = v.trim();
  }
  return Object.keys(out).length ? (out as any) : undefined;
}

export async function POST(req: NextRequest) {
  const data = await req.json().catch(() => null);
  if (!data || typeof data.name !== 'string') {
    return NextResponse.json({ ok: false, error: 'bad_request' }, { status: 400 });
  }

  // Safe log for now
  console.log('[track]', {
    name: data.name,
    path: data.path,
    id: data.id,
    ok: data.ok,
    error: data.error,
    variant: data.variant,
    ts: data.ts,
  });

  // ---- Persist to Firestore if service account is configured ----
  try {
    if (process.env.FIREBASE_SERVICE_ACCOUNT) {
      const app = initAdmin();
      const db = app.firestore();
      const fromPath = parseUrl(typeof data.path === 'string' ? data.path : null);
      const fromHeader = parseUrl(req.headers.get('referer'));
      const utm = parseUtm(fromPath || fromHeader);
      // Normalize fields
      const name = String(data.name || '').trim();
      const variant = typeof data.variant === 'string' ? String(data.variant).trim().toUpperCase() : undefined;
      const ipRaw = getIp(req);
      const ip_hash = hashIp(ipRaw);
      const storeIp = typeof process.env.ANALYTICS_STORE_IP === 'string' && process.env.ANALYTICS_STORE_IP.trim().toLowerCase() === 'true';
      const eventDoc: Record<string, unknown> = {
        ...data,
        name,
        variant,
        ts: typeof data.ts === 'number' ? data.ts : Date.now(),
        ua: typeof data.ua === 'string' ? data.ua : null,
        ip: storeIp ? ipRaw : undefined,
        ip_hash,
        ref: typeof data.ref === 'string' ? data.ref : null,
        ...(utm ? utm : {}),
        referrer: (() => {
          const r = req.headers.get('referer') || '';
          try {
            const u = new URL(r);
            if (u.host && u.pathname) return r;
          } catch {}
          return undefined;
        })(),
        createdAt: FieldValue.serverTimestamp(),
        source: 'landing:v1',
      };
      await db.collection('events').add(eventDoc);
    }
  } catch (_e) {
    // Best-effort: never fail the request on analytics write
    // eslint-disable-next-line no-console
    console.error('analytics persist failed');
  }

  return NextResponse.json({ ok: true });
}
