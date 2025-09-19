import * as React from 'react';
import { emailTheme } from '@/emails/emailTheme';

type Props = {
  confirmUrl: string;
  appName?: string;
  supportEmail?: string;
};

const baseStyles = {
  body: {
    margin: 0,
    padding: 0,
    fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif",
    backgroundColor: emailTheme.background,
    color: emailTheme.text,
  },
  container: {
    maxWidth: '560px',
    margin: '0 auto',
    padding: '32px 24px',
  },
  card: {
    backgroundColor: emailTheme.card,
    borderRadius: '16px',
    padding: '32px',
    boxShadow: emailTheme.shadow,
  },
  button: {
    display: 'inline-block',
    padding: '14px 24px',
    borderRadius: '9999px',
    backgroundColor: emailTheme.buttonBackground,
    color: emailTheme.buttonText,
    textDecoration: 'none',
    fontWeight: 600,
  },
  footer: {
    marginTop: '32px',
    fontSize: '12px',
    color: emailTheme.mutedText,
    lineHeight: 1.6,
    textAlign: 'center' as const,
  },
};

export function WaitlistConfirmEmail({ confirmUrl, appName = 'Louhen', supportEmail }: Props) {
  return (
    <html>
      <head>
        <meta charSet="utf-8" />
        <title>Confirm your email</title>
      </head>
      <body style={baseStyles.body}>
        <table role="presentation" width="100%" cellPadding={0} cellSpacing={0} style={baseStyles.container}>
          <tbody>
            <tr>
              <td>
                <table role="presentation" width="100%" cellPadding={0} cellSpacing={0} style={baseStyles.card}>
                  <tbody>
                    <tr>
                      <td>
                        <h1 style={{ fontSize: '22px', margin: '0 0 16px' }}>Welcome to {appName}</h1>
                        <p style={{ margin: '0 0 16px', lineHeight: 1.6 }}>
                          Thanks for joining the {appName} waitlist. Please confirm your email to secure your spot.
                        </p>
                        <p style={{ margin: '0 0 24px' }}>
                          <a href={confirmUrl} style={baseStyles.button} target="_blank" rel="noopener noreferrer">
                            Confirm email
                          </a>
                        </p>
                        <p style={{ margin: '0 0 24px', lineHeight: 1.6 }}>
                          If the button does not work, copy and paste this link into your browser:
                          <br />
                          <a href={confirmUrl} style={{ color: emailTheme.link, wordBreak: 'break-all' }}>
                            {confirmUrl}
                          </a>
                        </p>
                        <p style={{ margin: 0, lineHeight: 1.6 }}>
                          This link expires soon for your security. If it expires, you can request a new confirmation email.
                        </p>
                      </td>
                    </tr>
                  </tbody>
                </table>
                <p style={baseStyles.footer}>
                  You are receiving this email because you signed up for the {appName} waitlist.
                  {supportEmail ? (
                    <>
                      {' '}
                      Need help? Contact us at{' '}
                      <a href={`mailto:${supportEmail}`} style={{ color: emailTheme.link }}>
                        {supportEmail}
                      </a>
                      .
                    </>
                  ) : (
                    ''
                  )}
                </p>
              </td>
            </tr>
          </tbody>
        </table>
      </body>
    </html>
  );
}

export default WaitlistConfirmEmail;
