import { Resend } from 'resend';

let singleton: Resend | null = null;

export function getResendClient(): Resend {
  if (singleton) return singleton;

  const apiKey = process.env.RESEND_API_KEY?.trim();
  if (!apiKey) {
    throw new Error('Missing RESEND_API_KEY');
  }

  singleton = new Resend(apiKey);
  return singleton;
}
