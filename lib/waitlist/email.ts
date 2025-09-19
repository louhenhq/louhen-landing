import * as React from 'react';
import WaitlistConfirmEmail from '@/emails/WaitlistConfirm';
import WaitlistWelcomeEmail from '@/emails/WaitlistWelcome';
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

type ConfirmEmailOptions = {
  to: string;
  confirmUrl: string;
  supportEmail?: string;
};

type WelcomeEmailOptions = {
  to: string;
  supportEmail?: string;
};

export async function sendWaitlistConfirmEmail(options: ConfirmEmailOptions) {
  const { to, confirmUrl, supportEmail } = options;
  const { from, replyTo, appName } = getMailSenderConfig();
  const resend = getResendClient();

  await resend.emails.send({
    from,
    to,
    subject: `Confirm your ${appName} email`,
    react: React.createElement(WaitlistConfirmEmail, {
      confirmUrl,
      appName,
      supportEmail: supportEmail || replyTo,
    }),
    reply_to: replyTo,
    text: buildConfirmTextBody({ appName, confirmUrl }),
  });
}

export async function sendWaitlistWelcomeEmail(options: WelcomeEmailOptions) {
  const { to, supportEmail } = options;
  const { from, replyTo, appName } = getMailSenderConfig();
  const resend = getResendClient();
  const baseUrl = process.env.APP_BASE_URL?.trim() || process.env.NEXT_PUBLIC_SITE_URL?.trim();
  const normalizedBase = baseUrl ? baseUrl.replace(/\/$/, '') : null;
  const preferencesUrl = normalizedBase ? `${normalizedBase}/preferences` : undefined;

  await resend.emails.send({
    from,
    to,
    subject: `Welcome to ${appName}`,
    react: React.createElement(WaitlistWelcomeEmail, {
      appName,
      supportEmail: supportEmail || replyTo,
      preferencesUrl,
    }),
    reply_to: replyTo,
    text: buildWelcomeTextBody({ appName, preferencesUrl }),
  });
}

function buildConfirmTextBody(params: { appName: string; confirmUrl: string }): string {
  return [
    `Welcome to ${params.appName}!`,
    '',
    'Thanks for joining the waitlist. Please confirm your email by opening the link below:',
    params.confirmUrl,
    '',
    'This link expires soon for your security. If it stops working, you can request a fresh confirmation email.',
    '',
    `See you soon,`,
    `${params.appName} team`,
  ].join('\n');
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
