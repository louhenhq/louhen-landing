import * as React from 'react';

import { SITE_NAME } from '@/constants/site';
import { buildEmailTheme } from '@/emails/emailTheme';
import { emailColors } from '@/lib/email/colors';

const theme = buildEmailTheme(emailColors);

export type WaitlistResendEmailProps = {
  confirmUrl: string;
  supportEmail?: string;
};

const bodyStyle: React.CSSProperties = {
  backgroundColor: theme.background,
  color: theme.text,
  fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif",
  margin: 0,
  padding: 0,
};

const cardStyle: React.CSSProperties = {
  backgroundColor: theme.card,
  borderRadius: '16px',
  boxShadow: theme.shadow,
  margin: '32px auto',
  maxWidth: '560px',
  padding: '32px',
};

export function WaitlistResendEmail({ confirmUrl, supportEmail }: WaitlistResendEmailProps) {
  return (
    <html>
      <head>
        <meta charSet="utf-8" />
        <title>Your new confirmation link</title>
      </head>
      <body style={bodyStyle}>
        <table role="presentation" width="100%" cellPadding={0} cellSpacing={0}>
          <tbody>
            <tr>
              <td>
                <div style={cardStyle}>
                  <h1 style={{ fontSize: '22px', margin: '0 0 16px' }}>Here is your new link</h1>
                  <p style={{ fontSize: '16px', lineHeight: '24px', margin: '0 0 20px' }}>
                    We received your request for another confirmation email. Use the button below to verify your address and
                    stay on the waitlist.
                  </p>
                  <p style={{ margin: '0 0 24px' }}>
                    <a
                      href={confirmUrl}
                      style={{
                        backgroundColor: theme.buttonBackground,
                        borderRadius: '9999px',
                        color: theme.buttonText,
                        display: 'inline-block',
                        fontWeight: 600,
                        padding: '12px 24px',
                        textDecoration: 'none',
                      }}
                    >
                      Confirm email
                    </a>
                  </p>
                  <p style={{ fontSize: '14px', lineHeight: '22px', margin: '0 0 12px' }}>
                    If the button does not work, copy and paste this link into your browser:
                  </p>
                  <p style={{ margin: '0 0 24px' }}>
                    <a href={confirmUrl} style={{ color: theme.link, wordBreak: 'break-all' }}>
                      {confirmUrl}
                    </a>
                  </p>
                  <p style={{ fontSize: '12px', color: theme.mutedText, lineHeight: '20px', margin: 0 }}>
                    You are receiving this message because you asked for a fresh confirmation link for the {SITE_NAME} waitlist.
                    {supportEmail ? (
                      <>
                        {' '}Need help? Email{' '}
                        <a href={`mailto:${supportEmail}`} style={{ color: theme.link }}>
                          {supportEmail}
                        </a>
                        .
                      </>
                    ) : null}
                  </p>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </body>
    </html>
  );
}

export default WaitlistResendEmail;
