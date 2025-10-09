import { buildStandardHeaders } from '@/lib/email/headers';
import { getEmailTransport } from '@/lib/email/transport';
import { getSiteOrigin } from '@/lib/env/site-origin';

const SUBJECTS: Record<'en' | 'de', string> = {
  en: 'Confirm your spot on the Louhen waitlist ✨',
  de: 'Bitte bestätige deine Louhen-Warteliste ✨',
};

const PREVIEW_TEXT: Record<'en' | 'de', string> = {
  en: 'Tap to secure early access. This link expires soon.',
  de: 'Tippe, um deinen Frühzugang zu sichern. Der Link läuft bald ab.',
};

const BODY_COPY: Record<'en' | 'de', { intro: string; button: string; outro: string }> = {
  en: {
    intro: 'You’re one step away from early access. Confirm your email to save your spot and hear about the first drops.',
    button: 'Confirm my email',
    outro: 'This confirmation link expires soon. If you didn’t request it you can safely ignore this email.',
  },
  de: {
    intro: 'Nur noch ein Schritt bis zum Frühzugang. Bestätige deine E-Mail, um deinen Platz zu sichern und die ersten Drops zu erhalten.',
    button: 'E-Mail bestätigen',
    outro: 'Dieser Bestätigungslink läuft bald ab. Wenn du ihn nicht angefordert hast, kannst du diese E-Mail ignorieren.',
  },
};

function resolveLocale(locale?: string | null): 'en' | 'de' {
  if (!locale) return 'en';
  return locale.toLowerCase().startsWith('de') ? 'de' : 'en';
}

function buildConfirmUrl(token: string): string {
  return `${getSiteOrigin()}/waitlist/confirm?token=${encodeURIComponent(token)}`;
}

function buildHtmlCopy(locale: 'en' | 'de', confirmUrl: string): string {
  const copy = BODY_COPY[locale];
  return `<!DOCTYPE html>
<html lang="${locale}">
  <head>
    <meta http-equiv="Content-Type" content="text/html; charset=utf-8" />
    <title>${SUBJECTS[locale]}</title>
  </head>
  <body style="margin:0;padding:32px;font-family:Inter,Segoe UI,Helvetica,Arial,sans-serif;background-color:rgb(248,250,252);color:rgb(15,23,42);">
    <table width="100%" cellpadding="0" cellspacing="0" role="presentation">
      <tr>
        <td align="center">
          <table width="560" cellpadding="0" cellspacing="0" role="presentation" style="background:rgb(255,255,255);border-radius:24px;padding:40px;box-shadow:0 12px 40px rgba(15,23,42,0.08);">
            <tr>
              <td style="font-size:18px;font-weight:600;">${SUBJECTS[locale]}</td>
            </tr>
            <tr>
              <td style="padding-top:16px;font-size:16px;line-height:1.6;">${copy.intro}</td>
            </tr>
            <tr>
              <td style="padding-top:32px;padding-bottom:32px;">
                <a href="${confirmUrl}" style="display:inline-block;background:rgb(15,23,42);color:rgb(255,255,255);text-decoration:none;font-weight:600;font-size:16px;padding:16px 28px;border-radius:999px;">${copy.button}</a>
              </td>
            </tr>
            <tr>
              <td style="font-size:14px;line-height:1.6;color:rgb(71,85,105);">${copy.outro}</td>
            </tr>
          </table>
          <p style="margin-top:24px;font-size:12px;color:rgb(100,116,139);">© ${new Date().getFullYear()} Louhen</p>
        </td>
      </tr>
    </table>
  </body>
</html>`;
}

function buildTextCopy(locale: 'en' | 'de', confirmUrl: string): string {
  const copy = BODY_COPY[locale];
  return [SUBJECTS[locale], '', copy.intro, '', confirmUrl, '', copy.outro].join('\n');
}

export type SendWaitlistConfirmOptions = {
  email: string;
  locale?: string | null;
  token: string;
};

export type SendWaitlistConfirmResult = {
  ok: boolean;
  transport: 'noop' | 'resend';
};

export async function sendWaitlistConfirmEmail({ email, locale, token }: SendWaitlistConfirmOptions): Promise<SendWaitlistConfirmResult> {
  const resolvedLocale = resolveLocale(locale);
  const confirmUrl = buildConfirmUrl(token);
  const transport = getEmailTransport();
  const subject = SUBJECTS[resolvedLocale];
  const html = buildHtmlCopy(resolvedLocale, confirmUrl);
  const text = buildTextCopy(resolvedLocale, confirmUrl);
  const headers = buildStandardHeaders({ email, marketing: false });

  await transport.send({
    to: email,
    subject,
    html,
    text,
    headers: {
      'X-Entity-Ref-ID': 'waitlist-confirmation',
      'X-Louhen-Template': 'waitlist-confirm-v1',
      'X-Entity-Preview': PREVIEW_TEXT[resolvedLocale],
      ...headers,
    },
  });

  return { ok: true, transport: transport.name };
}
