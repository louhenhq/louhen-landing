import { Resend } from 'resend';

type SendEmailArgs = {
  to: string;
  subject: string;
  html: string;
  text: string;
  replyTo?: string;
  headers?: Record<string, string>;
};

export interface EmailTransport {
  readonly name: 'noop' | 'resend';
  send(args: SendEmailArgs): Promise<void>;
}

class NoopTransport implements EmailTransport {
  readonly name = 'noop' as const;

  async send({ to, subject, headers }: SendEmailArgs) {
    console.log('[email:noop]', { to, subject, headers });
  }
}

class ResendTransport implements EmailTransport {
  readonly name = 'resend' as const;
  private readonly resend: Resend;
  private readonly from: string;
  private readonly replyTo?: string;

  constructor({ apiKey, from, replyTo }: { apiKey: string; from: string; replyTo?: string }) {
    this.resend = new Resend(apiKey);
    this.from = from;
    this.replyTo = replyTo;
  }

  async send({ to, subject, html, text, replyTo, headers }: SendEmailArgs) {
    await this.resend.emails.send({
      from: this.from,
      to,
      subject,
      html,
      text,
      replyTo: replyTo || this.replyTo,
      headers,
    });
  }
}

export function getEmailTransport(): EmailTransport {
  const apiKey = process.env.RESEND_API_KEY?.trim();
  const from = process.env.RESEND_FROM?.trim();
  const replyTo = process.env.RESEND_REPLY_TO?.trim();

  if (apiKey && from) {
    return new ResendTransport({ apiKey, from, replyTo });
  }

  return new NoopTransport();
}
