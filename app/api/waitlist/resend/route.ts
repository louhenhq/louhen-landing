import 'server-only';

import { NextResponse } from 'next/server';
import { BadRequestError, HttpError, InternalServerError } from '@/lib/http/errors';
import { findByEmail, upsertPending } from '@/lib/firestore/waitlist';
import { sendWaitlistConfirmEmail } from '@/lib/email/sendWaitlistConfirm';
<<<<<<< HEAD
import { enforceRateLimit } from '@/lib/rate/limiter';
import { getWaitlistResendRule } from '@/lib/rate/rules';
=======
>>>>>>> f7d7592 (Waitlist env split: build uses NEXT_PUBLIC only (#2))
import { verifyToken as verifyCaptchaToken } from '@/lib/security/hcaptcha';
import { generateToken, hashToken } from '@/lib/security/tokens';
import { getExpiryDate } from '@/lib/waitlistConfirmTtl';
import { parseResendDTO } from '@/lib/validation/waitlist';
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
    const payload = parseResendDTO(await readJson(request));

<<<<<<< HEAD
    const rateDecision = await enforceRateLimit(getWaitlistResendRule(), payload.email);
    if (!rateDecision.allowed) {
      return NextResponse.json(
        { ok: false, code: 'rate_limited' },
        {
          status: 429,
          headers: {
            'Retry-After': rateDecision.retryAfterSeconds.toString(),
          },
        }
      );
    }

    if (process.env.TEST_E2E_SHORTCIRCUIT === 'true') {
      const record = await findByEmail(payload.email);
      if (!record || record.status === 'confirmed') {
        return NextResponse.json({ ok: true, status: record?.status ?? null }, { status: 200 });
      }

      const confirmToken = generateToken();
      const { hash, salt, lookupHash } = hashToken(confirmToken);
      const expiresAt = getExpiryDate();

      await upsertPending(payload.email, {
        locale: record.locale ?? null,
        utm: record.utm ?? undefined,
        ref: record.ref ?? null,
        consent: true,
        confirmExpiresAt: expiresAt,
        confirmTokenHash: hash,
        confirmTokenLookupHash: lookupHash,
        confirmSalt: salt,
      });

      return NextResponse.json(
        {
          ok: true,
          shortCircuit: true,
          token: confirmToken,
          lookupHash,
          docId: record.id,
        },
        { status: 200 }
      );
    }

=======
>>>>>>> f7d7592 (Waitlist env split: build uses NEXT_PUBLIC only (#2))
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

    const record = await findByEmail(payload.email);
    if (!record || record.status === 'confirmed') {
      return NextResponse.json({ ok: true });
    }

    const confirmToken = generateToken();
    const { hash, salt, lookupHash } = hashToken(confirmToken);
    const expiresAt = getExpiryDate();

    try {
      await upsertPending(payload.email, {
        locale: record.locale ?? null,
        utm: record.utm ?? undefined,
        ref: record.ref ?? null,
        consent: true,
        confirmExpiresAt: expiresAt,
        confirmTokenHash: hash,
        confirmTokenLookupHash: lookupHash,
        confirmSalt: salt,
      });

      await sendWaitlistConfirmEmail({
        email: payload.email,
        locale: record.locale ?? null,
        token: confirmToken,
      });
    } catch (error) {
      console.error('[waitlist:resend-email]', {
        recordId: record.id,
        message: error instanceof Error ? error.message : 'unknown_error',
      });
      throw new InternalServerError('Unable to process resend');
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    if (error instanceof BadRequestError) {
      return errorResponse(error);
    }

    if (error instanceof HttpError) {
      console.error('[waitlist:resend]', { code: error.code, message: error.message });
      return errorResponse(error);
    }

    console.error('[waitlist:resend]', { message: error instanceof Error ? error.message : 'unknown_error' });
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
