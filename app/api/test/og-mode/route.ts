import { NextResponse } from 'next/server';
import { isDynamicOgEnabled, setDynamicOgOverride } from '@/lib/env/media';

type Mode = 'dynamic' | 'static' | 'auto';

function toOverride(mode: Mode): boolean | null {
  if (mode === 'dynamic') return true;
  if (mode === 'static') return false;
  return null;
}

export async function POST(request: Request) {
  if (process.env.TEST_MODE !== '1') {
    return new Response('Not Found', { status: 404 });
  }

  try {
    const body = (await request.json()) as { mode?: Mode };
    const mode = body.mode ?? 'auto';
    if (!['dynamic', 'static', 'auto'].includes(mode)) {
      return NextResponse.json(
        { error: 'Invalid mode' },
        { status: 400, headers: { 'Cache-Control': 'no-store' } },
      );
    }

    setDynamicOgOverride(toOverride(mode as Mode));

    return NextResponse.json(
      { mode, dynamic: isDynamicOgEnabled() },
      { headers: { 'Cache-Control': 'no-store' } },
    );
  } catch {
    return NextResponse.json(
      { error: 'Invalid payload' },
      { status: 400, headers: { 'Cache-Control': 'no-store' } },
    );
  }
}
