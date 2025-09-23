import * as React from 'react';

import WaitlistWelcomeEmail from '@/emails/WaitlistWelcome';
import { renderWaitlistConfirm, renderWaitlistResend } from '@/lib/email/renderWaitlist';
import { getEmailTransport } from '@/lib/email/transport';
import { buildStandardHeaders } from '@/lib/email/headers';
import { shouldSend } from '@/lib/email/suppress';
import { getResendClient } from '@/lib/resendClient';

type MailSenderConfig = {
  from: string;
  replyTo?: string;
  appName: string;
};

function getMailSenderConfig(): MailSenderConfig {
  const from = process.env.RESEND_FROM?.trim();
  if (!from) throw new Error('Missing RESEND_FROM');
  const replyTo = process.env.RESEND_REPLY_TO?.trim();
  const appName = process.env.APP_NAME?.trim() || 'Louhen';
  return { from, replyTo, appName };
}

type ConfirmEmailArgs = {
  to: string;
  confirmUrl: string;
};

type EmailResult = {
  ok: boolean;
  transport: 'noop' | 'resend';
  skipped?: string;
};

const templatesEnabled = (() => {
  const flag = process.env.EMAIL_TEMPLATES_ENABLED?.trim()?.toLowerCase();
  return flag === 'true' || flag === '1';
})();

const FALLBACK_BASE_URL = 'https://louhen-landing.vercel.app';
const DEFAULT_UNSUBSCRIBE_EMAIL = 'unsubscribe@louhen.eu';
const DEFAULT_SUPPORT_EMAIL = 'support@louhen.eu';

function resolveBaseUrl() {
  const fromEnv = process.env.APP_BASE_URL?.trim() || process.env.NEXT_PUBLIC_SITE_URL?.trim();
  return (fromEnv ?? FALLBACK_BASE_URL).replace(/\/$/, '');
}

function buildSkippedResult(reason: string): EmailResult {
  return { ok: true, transport: 'noop', skipped: reason };
}

export async function sendWaitlistConfirmEmail({ to, confirmUrl }: ConfirmEmailArgs): Promise<EmailResult> {
  if (!templatesEnabled) {
    return buildSkippedResult('flag disabled');
  }

  const suppression = await shouldSend({ email: to, scope: 'transactional' });
  if (!suppression.allowed) {
    console.info('[email:suppressed]', { scope: 'transactional', emailHash: suppression.record?.emailHash });
    return buildSkippedResult('suppressed');
  }

  const transport = getEmailTransport();
  const { html, text } = await renderWaitlistConfirm({ confirmUrl });
  const subject = 'Confirm your Louhen waitlist signup';
  const baseUrl = resolveBaseUrl();
  const unsubscribeUrl = `${baseUrl}/unsubscribe`;
  const replyTo = process.env.RESEND_REPLY_TO?.trim() || DEFAULT_SUPPORT_EMAIL;
  const headers = buildStandardHeaders({
    email: to,
    unsubscribeMailto: DEFAULT_UNSUBSCRIBE_EMAIL,
    unsubscribeUrl,
    replyTo,
    marketing: false,
  });

  await transport.send({ to, subject, html, text, replyTo, headers });

  return transport.name === 'noop'
    ? { ok: true, transport: transport.name, skipped: 'using noop transport' }
    : { ok: true, transport: transport.name };
}

export async function sendWaitlistResendEmail({ to, confirmUrl }: ConfirmEmailArgs): Promise<EmailResult> {
  if (!templatesEnabled) {
    return buildSkippedResult('flag disabled');
  }

  const suppression = await shouldSend({ email: to, scope: 'transactional' });
  if (!suppression.allowed) {
    console.info('[email:suppressed]', { scope: 'transactional', emailHash: suppression.record?.emailHash });
    return buildSkippedResult('suppressed');
  }

  const transport = getEmailTransport();
  const { html, text } = await renderWaitlistResend({ confirmUrl });
  const subject = 'Your Louhen confirmation link';
  const baseUrl = resolveBaseUrl();
  const unsubscribeUrl = `${baseUrl}/unsubscribe`;
  const replyTo = process.env.RESEND_REPLY_TO?.trim() || DEFAULT_SUPPORT_EMAIL;
  const headers = buildStandardHeaders({
    email: to,
    unsubscribeMailto: DEFAULT_UNSUBSCRIBE_EMAIL,
    unsubscribeUrl,
    replyTo,
    marketing: false,
  });

  await transport.send({ to, subject, html, text, replyTo, headers });

  return transport.name === 'noop'
    ? { ok: true, transport: transport.name, skipped: 'using noop transport' }
    : { ok: true, transport: transport.name };
}

type WelcomeEmailOptions = {
  to: string;
  supportEmail?: string;
};

export async function sendWaitlistWelcomeEmail(options: WelcomeEmailOptions) {
  const { to, supportEmail } = options;
  const suppression = await shouldSend({ email: to, scope: 'transactional' });
  if (!suppression.allowed) {
    console.info('[email:suppressed]', { scope: 'transactional', emailHash: suppression.record?.emailHash });
    return;
  }

  const { from, replyTo, appName } = getMailSenderConfig();
  const resend = getResendClient();
  const normalizedBase = resolveBaseUrl();
  const preferencesUrl = normalizedBase ? `${normalizedBase}/preferences` : undefined;
  const unsubscribeUrl = `${normalizedBase}/unsubscribe`;
  const effectiveReplyTo = supportEmail || replyTo || DEFAULT_SUPPORT_EMAIL;
  const headers = buildStandardHeaders({
    email: to,
    unsubscribeMailto: DEFAULT_UNSUBSCRIBE_EMAIL,
    unsubscribeUrl,
    replyTo: effectiveReplyTo,
    marketing: false,
  });

  await resend.emails.send({
    from,
    to,
    subject: `Welcome to ${appName}`,
    react: React.createElement(WaitlistWelcomeEmail, {
      appName,
      supportEmail: supportEmail || replyTo,
      preferencesUrl,
    }),
    replyTo: effectiveReplyTo,
    headers,
    text: buildWelcomeTextBody({ appName, preferencesUrl }),
  });
}

function buildWelcomeTextBody(params: { appName: string; preferencesUrl?: string }): string {
  return [
    `Welcome to ${params.appName}!`,
    '',
    'Thanks for confirming your email. We will let you know as soon as your spot in the waitlist unlocks.',
    'In the meantime, feel free to reply to this email with any questions or feedback.',
    params.preferencesUrl ? `Manage your preferences anytime: ${params.preferencesUrl}` : undefined,
    '',
    `— ${params.appName} team`,
  ].filter(Boolean).join('\n');
}
