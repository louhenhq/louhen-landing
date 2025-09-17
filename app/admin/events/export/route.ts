import { NextResponse } from 'next/server';
import { getEvents } from '@/lib/admin/eventsQuery';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  const url = new URL(req.url);
  const key = url.searchParams.get('key');
  const adminKey = process.env.ADMIN_KEY;
  if (!adminKey || key !== adminKey) {
    return NextResponse.json({ ok: false, error: 'unauthorized' }, { status: 401 });
  }

  const format = (url.searchParams.get('format') || 'json').toLowerCase();
  const limit = Math.min(Number(url.searchParams.get('limit') ?? 1000) || 1000, 5000);
  const eventName = url.searchParams.get('event') || null;
  const q = url.searchParams.get('q') || null;
  const errorsOnly = url.searchParams.get('errors') === '1';
  const cursorId = url.searchParams.get('cursor') || null;

  const { rows, nextCursor } = await getEvents({ limit, eventName, errorsOnly, q, cursorId });

  if (format === 'csv') {
    const headers = [
      'id','createdAt','name','path','variant','event_id','ok','error','ip_hash','ref','referrer','utm_source','utm_medium','utm_campaign','utm_content','utm_term','ua'
    ];
    const csv = [headers.join(',')].concat(
      rows.map((r) => {
        const createdIso = r.createdAt ? (r.createdAt as any).toDate().toISOString() : (r.ts ? new Date(r.ts).toISOString() : '');
        const ip_hash = (r as any).ip_hash || '';
        const vals = [
          r.id,
          createdIso,
          r.name || '',
          r.path || '',
          r.variant || '',
          r.id2 || '',
          typeof r.ok === 'boolean' ? String(r.ok) : '',
          r.error || '',
          ip_hash,
          r.ref || '',
          r.referrer || '',
          r.utm_source || '',
          r.utm_medium || '',
          r.utm_campaign || '',
          r.utm_content || '',
          r.utm_term || '',
          r.ua || '',
        ];
        return vals.map((v) => {
          const s = String(v);
          if (s.includes(',') || s.includes('"') || s.includes('\n')) {
            return '"' + s.replace(/"/g, '""') + '"';
          }
          return s;
        }).join(',');
      })
    ).join('\n');
    const body = csv + (nextCursor ? `\n# nextCursor=${nextCursor}` : '');
    return new NextResponse(body, {
      headers: {
        'content-type': 'text/csv; charset=utf-8',
        'content-disposition': `attachment; filename="events-export.csv"`,
      },
    });
  }

  return NextResponse.json({ ok: true, nextCursor, rows });
}

