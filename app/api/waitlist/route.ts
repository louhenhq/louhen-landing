import 'server-only';

import { NextResponse } from 'next/server';
import { BadRequestError, HttpError, InternalServerError } from '@/lib/http/errors';
import { upsertPending } from '@lib/server/waitlist/firestore.server';
import { sendWaitlistConfirmEmail } from '@/lib/email/sendWaitlistConfirm';
import { verifyToken as verifyCaptchaToken } from '@/lib/security/hcaptcha';
import { generateToken, hashToken } from '@/lib/security/tokens';
import { getExpiryDate } from '@/lib/waitlistConfirmTtl';
import { parseSignupDTO } from '@lib/shared/validation/waitlist-schema';
import { ensureWaitlistServerEnv } from '@/lib/env/guard';
import { enforceRateLimit, type RateLimitDecision } from '@/lib/rate/limiter';
import { getWaitlistSubmitRule, type RateLimitRule } from '@/lib/rate/rules';

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

type WaitlistSignupRepository = {
  upsertPending: typeof upsertPending;
};

type WaitlistSignupDependencies = {
  repo: WaitlistSignupRepository;
  rateLimiter: (rule: RateLimitRule, identifier: string) => Promise<RateLimitDecision>;
  getRule: () => RateLimitRule;
};

const defaultSignupDependencies: WaitlistSignupDependencies = {
  repo: { upsertPending },
  rateLimiter: enforceRateLimit,
  getRule: getWaitlistSubmitRule,
};

function rateLimitExceeded(decision: RateLimitDecision) {
  const body: Record<string, unknown> = {
    ok: false,
    code: 'rate_limited',
    message: 'Rate limit exceeded',
  };
  if (decision.retryAfterSeconds) {
    body.retryAfterSeconds = decision.retryAfterSeconds;
  }
  const response = NextResponse.json(body, { status: 429 });
  if (decision.retryAfterSeconds) {
    response.headers.set('Retry-After', String(decision.retryAfterSeconds));
  }
  return response;
}

function toRecord(value: unknown): Record<string, unknown> {
  if (value && typeof value === 'object') {
    return value as Record<string, unknown>;
  }
  return {};
}

async function handleTestShortCircuit(
  rawPayload: unknown,
  deps: WaitlistSignupDependencies
) {
  const payload = toRecord(rawPayload);
  const emailRaw = typeof payload.email === 'string' ? payload.email.trim() : '';
  if (!emailRaw) {
    throw new BadRequestError('invalid_payload', 'Invalid waitlist signup request', {
      details: ['email'],
    });
  }
  if (payload.consent !== true) {
    throw new BadRequestError('invalid_payload', 'Invalid waitlist signup request', {
      details: ['consent'],
    });
  }

  const localeRaw = typeof payload.locale === 'string' ? payload.locale.trim() : null;
  const refRaw = typeof payload.ref === 'string' ? payload.ref.trim() : null;
  const ref = refRaw && refRaw.length ? refRaw.slice(0, 200) : null;

  const confirmToken = generateToken();
  const { hash, salt, lookupHash } = hashToken(confirmToken);
  const expiresAt = getExpiryDate();

  const upsertResult = await deps.repo.upsertPending(emailRaw, {
    locale: localeRaw ?? null,
    utm: undefined,
    ref,
    consent: true,
    confirmExpiresAt: expiresAt,
    confirmTokenHash: hash,
    confirmTokenLookupHash: lookupHash,
    confirmSalt: salt,
  });

  const statusCode = upsertResult.created ? 201 : 200;
  return NextResponse.json(
    {
      ok: true,
      shortCircuit: true,
      token: confirmToken,
      docId: upsertResult.docId,
      lookupHash,
      status: upsertResult.status,
    },
    { status: statusCode }
  );
}

export function createWaitlistPostHandler(
  overrides: Partial<WaitlistSignupDependencies> = {}
) {
  const deps: WaitlistSignupDependencies = {
    repo: overrides.repo ?? defaultSignupDependencies.repo,
    rateLimiter: overrides.rateLimiter ?? defaultSignupDependencies.rateLimiter,
    getRule: overrides.getRule ?? defaultSignupDependencies.getRule,
  };

  return async function POST(request: Request) {
    try {
      const isTestMode = process.env.TEST_MODE === '1';
      const shortCircuitValue = process.env.TEST_E2E_SHORTCIRCUIT ?? '';
      const normalizedShortCircuit = shortCircuitValue.trim().toLowerCase();
      const isShortCircuit = normalizedShortCircuit === 'true' || normalizedShortCircuit === '1';
      const shouldIncludeTestPayload = isShortCircuit || isTestMode;

      const rawPayload = await readJson(request);

      if (isShortCircuit) {
        return handleTestShortCircuit(rawPayload, deps);
      }

      const payload = parseSignupDTO(rawPayload);

      if (!isShortCircuit) {
        const rule = deps.getRule();
        const identifier = resolveRemoteIp(request) ?? 'anonymous';
        const decision = await deps.rateLimiter(rule, identifier);
        if (!decision.allowed) {
          return rateLimitExceeded(decision);
        }

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
      }

      const confirmToken = generateToken();
      const { hash, salt, lookupHash } = hashToken(confirmToken);
      const expiresAt = getExpiryDate();

      const upsertResult = await deps.repo.upsertPending(payload.email, {
        locale: payload.locale ?? null,
        utm: payload.utm,
        ref: payload.ref ?? null,
        consent: payload.consent,
        confirmExpiresAt: expiresAt,
        confirmTokenHash: hash,
        confirmTokenLookupHash: lookupHash,
        confirmSalt: salt,
      });

      const statusCode = 200;
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

      const responseBody: Record<string, unknown> = { ok: true };
      if (shouldIncludeTestPayload) {
        responseBody.token = confirmToken;
        responseBody.docId = upsertResult.docId;
        responseBody.lookupHash = lookupHash;
        responseBody.status = upsertResult.status;
      }

      return NextResponse.json(responseBody, { status: statusCode });
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
  };
}

export type { WaitlistSignupDependencies };

export const POST = createWaitlistPostHandler();
