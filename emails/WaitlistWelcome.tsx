import * as React from 'react';
import { buildEmailTheme } from '@/emails/emailTheme';
import { emailColors } from '@/lib/email/colors';

const theme = buildEmailTheme(emailColors);

type Props = {
  appName?: string;
  supportEmail?: string;
  nextSteps?: string[];
  preferencesUrl?: string;
};

const styles = {
  body: {
    margin: 0,
    padding: 0,
    fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif",
    backgroundColor: theme.background,
    color: theme.text,
  },
  container: {
    maxWidth: '560px',
    margin: '0 auto',
    padding: '32px 24px',
  },
  card: {
    backgroundColor: theme.card,
    borderRadius: '16px',
    padding: '32px',
    boxShadow: theme.shadow,
  },
  list: {
    paddingLeft: '20px',
    margin: '0 0 16px',
  },
  footer: {
    marginTop: '32px',
    fontSize: '12px',
    color: theme.mutedText,
    lineHeight: 1.6,
    textAlign: 'center' as const,
  },
};

export function WaitlistWelcomeEmail({ appName = 'Louhen', supportEmail, nextSteps, preferencesUrl }: Props) {
  const fallbackSteps = [
    'Watch your inbox for launch updates and early access invitations.',
    'Follow us on social to see the latest product previews.',
    'Share your referral link to move up the queue.',
  ];
  const steps = nextSteps && nextSteps.length > 0 ? nextSteps : fallbackSteps;

  return (
    <html>
      <head>
        <meta charSet="utf-8" />
        <title>Welcome to {appName}</title>
      </head>
      <body style={styles.body}>
        <table role="presentation" width="100%" cellPadding={0} cellSpacing={0} style={styles.container}>
          <tbody>
            <tr>
              <td>
                <table role="presentation" width="100%" cellPadding={0} cellSpacing={0} style={styles.card}>
                  <tbody>
                    <tr>
                      <td>
                        <h1 style={{ fontSize: '22px', margin: '0 0 16px' }}>You&rsquo;re in!</h1>
                        <p style={{ margin: '0 0 16px', lineHeight: 1.6 }}>
                          Thanks for confirming your email. We&rsquo;re excited to have you in the {appName} community.
                        </p>
                        <p style={{ margin: '0 0 16px', lineHeight: 1.6 }}>
                          Here&rsquo;s what happens next:
                        </p>
                        <ul style={styles.list}>
                          {steps.map((step) => (
                            <li key={step} style={{ marginBottom: '8px' }}>
                              {step}
                            </li>
                          ))}
                        </ul>
                        <p style={{ margin: 0, lineHeight: 1.6 }}>
                          We&rsquo;ll reach out as soon as your spot unlocks. In the meantime, reply to this email if you have
                          questions—we read every message.
                        </p>
                        {preferencesUrl ? (
                          <p style={{ margin: '24px 0 0', lineHeight: 1.6 }}>
                            Prefer fewer emails?{' '}
                            <a href={preferencesUrl} style={{ color: theme.link }}>Manage your preferences</a> anytime.
                          </p>
                        ) : null}
                      </td>
                    </tr>
                  </tbody>
                </table>
                <p style={styles.footer}>
                  Thanks for being part of the journey.
                  {supportEmail ? (
                    <>
                      {' '}
                      Need help? Contact us at{' '}
                      <a href={`mailto:${supportEmail}`} style={{ color: theme.link }}>
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

export default WaitlistWelcomeEmail;
