const HCAPTCHA_ENDPOINT = 'https://hcaptcha.com/siteverify';

export type HCaptchaVerificationResult = {
  success: boolean;
  score?: number;
  errorCodes?: string[];
};

export async function verifyToken({
  token,
  secret,
  remoteIp,
}: {
  token: string;
  secret: string;
  remoteIp?: string | null;
}): Promise<HCaptchaVerificationResult> {
  if (!secret) {
    return { success: false, errorCodes: ['missing_secret'] };
  }

  const form = new URLSearchParams({
    secret,
    response: token,
  });

  if (remoteIp) {
    form.set('remoteip', remoteIp);
  }

  try {
    const response = await fetch(HCAPTCHA_ENDPOINT, {
      method: 'POST',
      headers: {
        'content-type': 'application/x-www-form-urlencoded',
      },
      body: form,
    });

    if (!response.ok) {
      return { success: false, errorCodes: ['verification_failed'] };
    }

    const payload = (await response.json()) as {
      success?: boolean;
      score?: number;
      'error-codes'?: unknown;
    };

    const errorCodes = Array.isArray(payload['error-codes'])
      ? payload['error-codes'].filter((item): item is string => typeof item === 'string')
      : undefined;

    if (!payload.success) {
      return { success: false, score: payload.score, errorCodes };
    }

    return { success: true, score: payload.score };
  } catch (error) {
    console.error('[hcaptcha] verification error', { message: error instanceof Error ? error.message : 'unknown' });
    return { success: false, errorCodes: ['network_error'] };
  }
}
