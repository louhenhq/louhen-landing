import * as React from 'react';

import { SITE_NAME } from '@/constants/site';
import { emailTheme } from '@/emails/emailTheme';

export type WaitlistConfirmEmailProps = {
  confirmUrl: string;
  supportEmail?: string;
};

const bodyStyle: React.CSSProperties = {
  backgroundColor: emailTheme.background,
  color: emailTheme.text,
  fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif",
  margin: 0,
  padding: 0,
};

const cardStyle: React.CSSProperties = {
  backgroundColor: emailTheme.card,
  borderRadius: '16px',
  boxShadow: emailTheme.shadow,
  margin: '32px auto',
  maxWidth: '560px',
  padding: '32px',
};

export function WaitlistConfirmEmail({ confirmUrl, supportEmail }: WaitlistConfirmEmailProps) {
  return (
    <html>
      <head>
        <meta charSet="utf-8" />
        <title>Confirm your email</title>
      </head>
      <body style={bodyStyle}>
        <table role="presentation" width="100%" cellPadding={0} cellSpacing={0}>
          <tbody>
            <tr>
              <td>
                <div style={cardStyle}>
                  <h1 style={{ fontSize: '22px', margin: '0 0 16px' }}>Welcome to {SITE_NAME}</h1>
                  <p style={{ fontSize: '16px', lineHeight: '24px', margin: '0 0 20px' }}>
                    Thanks for joining the waitlist. Confirm your email to secure your place and receive early access updates.
                  </p>
                  <p style={{ margin: '0 0 24px' }}>
                    <a
                      href={confirmUrl}
                      style={{
                        backgroundColor: emailTheme.buttonBackground,
                        borderRadius: '9999px',
                        color: emailTheme.buttonText,
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
                    <a href={confirmUrl} style={{ color: emailTheme.link, wordBreak: 'break-all' }}>
                      {confirmUrl}
                    </a>
                  </p>
                  <p style={{ fontSize: '12px', color: emailTheme.mutedText, lineHeight: '20px', margin: 0 }}>
                    You are receiving this message because you signed up for the {SITE_NAME} waitlist.
                    {supportEmail ? (
                      <>
                        {' '}Need help? Email{' '}
                        <a href={`mailto:${supportEmail}`} style={{ color: emailTheme.link }}>
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

export default WaitlistConfirmEmail;
