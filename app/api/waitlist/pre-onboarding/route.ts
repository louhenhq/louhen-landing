import 'server-only';

import { NextResponse } from 'next/server';
import { BadRequestError, HttpError } from '@/lib/http/errors';
import { savePreOnboardingDraft } from '@/lib/firestore/waitlist';
import { parsePreOnboardingDTO } from '@/lib/validation/waitlist';
import { readWaitlistSession } from '@/lib/waitlist/session';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

function readJson(request: Request): Promise<unknown> {
  return request.json().catch(() => {
    throw new BadRequestError('invalid_json', 'Malformed JSON body');
  });
}

function errorResponse(error: HttpError) {
  return NextResponse.json(
    {
      ok: false,
      code: error.code,
      message: 'Unable to process request',
      details: error.details,
    },
    { status: error.status }
  );
}

export async function POST(request: Request) {
  try {
    const sessionId = await readWaitlistSession();
    if (!sessionId) {
      return NextResponse.json(
        { ok: false, code: 'not_authenticated' },
        { status: 401 }
      );
    }

    const payload = parsePreOnboardingDTO(await readJson(request));
    await savePreOnboardingDraft(sessionId, payload);

    return NextResponse.json({ ok: true });
  } catch (error) {
    if (error instanceof BadRequestError) {
      return errorResponse(error);
    }

    if (error instanceof HttpError) {
      console.error('[waitlist:pre-onboarding]', {
        code: error.code,
        details: error.details,
      });
      return errorResponse(error);
    }

    console.error('[waitlist:pre-onboarding]', {
      message: error instanceof Error ? error.message : 'unknown_error',
    });
    return NextResponse.json(
      {
        ok: false,
        code: 'internal_error',
        message: 'Unable to process request',
      },
      { status: 500 }
    );
  }
}
