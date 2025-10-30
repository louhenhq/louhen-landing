import { NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(_req: Request, { params }: { params: { code: string } }) {
  const code = (params.code || '').toUpperCase();
  const base = process.env.NEXT_PUBLIC_SITE_URL || '/';
  const url = new URL(base.startsWith('http') ? base : 'http://127.0.0.1');
  url.pathname = '/';
  url.searchParams.set('ref', code);

  const res = NextResponse.redirect(url.toString(), 302);
  res.headers.append('Set-Cookie', `wl_ref=${encodeURIComponent(code)}; Path=/; Max-Age=${60 * 60 * 24 * 90}`);
  return res;
}
