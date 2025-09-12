/**
 * Optional, typed Resend loader.
 * Returns null if RESEND_API_KEY is missing or the module isn't installed.
 */
export type ResendEmailsSendInput = {
  from: string;
  to: string | string[];
  subject: string;
  html?: string;
  text?: string;
  headers?: Record<string, string>;
};

export type ResendLike = {
  emails: {
    send(input: ResendEmailsSendInput): Promise<unknown>;
  };
};

export async function getResend(): Promise<ResendLike | null> {
  try {
    const key = process.env.RESEND_API_KEY;
    if (!key) return null;
    // Lazy import; avoids build-time resolution errors if "resend" isn't installed locally
    const mod = await import('resend');
    const Ctor = (mod as unknown as { Resend: new (apiKey: string) => ResendLike }).Resend;
    return new Ctor(key);
  } catch {
    // Either module not installed or some runtime error – treat as disabled
    return null;
  }
}
