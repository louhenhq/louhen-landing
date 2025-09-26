import 'server-only';

import { NextResponse } from 'next/server';
import { BadRequestError, HttpError, InternalServerError } from '@/lib/http/errors';
import { upsertPending } from '@/lib/firestore/waitlist';
import { sendWaitlistConfirmEmail } from '@/lib/email/sendWaitlistConfirm';
import { verifyToken as verifyCaptchaToken } from '@/lib/security/hcaptcha';
import { generateToken, hashToken } from '@/lib/security/tokens';
import { getExpiryDate } from '@/lib/waitlistConfirmTtl';
import { parseSignupDTO } from '@/lib/validation/waitlist';
import { ensureWaitlistServerEnv } from '@/lib/env/guard';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

function readJson(request: Request): Promise<unknown> {
  return request.json().catch(() => {
    throw new BadRequestError('invalid_json', 'Malformed JSON body');
  });
}

function resolveRemoteIp(request: Request): string | undefined {
  const forwarded = request.headers.get('x-forwarded-for');
  if (forwarded) {
    const [first] = forwarded.split(',');
    if (first) return first.trim() || undefined;
  }
  const realIp = request.headers.get('x-real-ip');
  return realIp?.trim() || undefined;
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
    // TODO: integrate IP/email rate limiting (Slice 3).
    const payload = parseSignupDTO(await readJson(request));

    const { captcha } = ensureWaitlistServerEnv();
    const secret = process.env.HCAPTCHA_SECRET?.trim();
    if (!secret || !captcha.hasSecret) {
      throw new InternalServerError('Missing hCaptcha credentials');
    }

    const isDevBypass = process.env.NODE_ENV !== 'production' && payload.hcaptchaToken === 'dev-bypass';

    if (!isDevBypass) {
      const verification = await verifyCaptchaToken({
        token: payload.hcaptchaToken,
        secret,
        remoteIp: resolveRemoteIp(request),
      });

      if (!verification.success) {
        throw new BadRequestError('captcha_invalid', 'Captcha verification failed', {
          details: verification.errorCodes,
        });
      }
    }

    const confirmToken = generateToken();
    const { hash, salt, lookupHash } = hashToken(confirmToken);
    const expiresAt = getExpiryDate();

    const upsertResult = await upsertPending(payload.email, {
      locale: payload.locale ?? null,
      utm: payload.utm,
      ref: payload.ref ?? null,
      consent: payload.consent,
      confirmExpiresAt: expiresAt,
      confirmTokenHash: hash,
      confirmTokenLookupHash: lookupHash,
      confirmSalt: salt,
    });

    if (upsertResult.status === 'pending') {
      try {
        await sendWaitlistConfirmEmail({
          email: payload.email,
          locale: payload.locale ?? upsertResult.locale ?? null,
          token: confirmToken,
        });
      } catch (error) {
        console.error('[waitlist:confirm-email]', {
          docId: upsertResult.docId,
          message: error instanceof Error ? error.message : 'unknown_error',
        });
      }
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    if (error instanceof BadRequestError) {
      return errorResponse(error);
    }

    if (error instanceof HttpError) {
      console.error('[waitlist:signup]', { code: error.code, message: error.message });
      return errorResponse(error);
    }

    console.error('[waitlist:signup]', { message: error instanceof Error ? error.message : 'unknown_error' });
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
