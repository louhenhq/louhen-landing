import { NextRequest, NextResponse } from 'next/server';
function isLoopbackHost(hostname: string) {
  return hostname === 'localhost' || hostname === '127.0.0.1' || hostname === '0.0.0.0';
}

export function GET(request: NextRequest) {
  const fallbackOrigin = (process.env.BASE_URL?.trim() || 'http://localhost:4311').replace(/\/$/, '');

  const forwardedHost = request.headers.get('x-forwarded-host');
  const hostHeader = request.headers.get('host');
  const resolvedHost = forwardedHost ?? hostHeader ?? new URL(fallbackOrigin).host;

  const hostnameOnly = resolvedHost.split(':')[0]?.toLowerCase() ?? resolvedHost.toLowerCase();

  const forwardedProto = request.headers.get('x-forwarded-proto');
  const proto = forwardedProto?.split(',')[0]?.trim() || (isLoopbackHost(hostnameOnly) ? 'http' : 'https');

  const originFromHeaders = resolvedHost ? `${proto}://${resolvedHost}`.replace(/\/$/, '') : null;
  const origin = originFromHeaders || fallbackOrigin;

  const allowIndexOverride = process.env.LH_ALLOW_INDEX === 'true';
  const productionIndex =
    process.env.VERCEL_ENV === 'production' && process.env.NEXT_PUBLIC_ALLOW_INDEXING === 'true';

  const allowIndexing = productionIndex || allowIndexOverride || isLoopbackHost(hostnameOnly);

  const lines = allowIndexing
    ? [`User-agent: *`, 'Allow: /', `Sitemap: ${origin}/sitemap.xml`]
    : ['User-agent: *', 'Disallow: /'];

  return new NextResponse(`${lines.join('\n')}
`, {
    status: 200,
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Cache-Control': 'public, max-age=300',
    },
  });
}
