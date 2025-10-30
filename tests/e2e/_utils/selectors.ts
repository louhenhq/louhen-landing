export const testIds = {
  sentinel: {
    pageReady: 'lh-page-ready',
  },
  consent: {
    banner: 'lh-consent-banner',
    dialog: 'lh-consent-dialog',
    acceptAll: 'lh-consent-accept-all',
  },
  nav: {
    root: 'lh-nav-root',
    skipLink: 'lh-nav-skip-link',
    primaryCta: 'lh-nav-cta-primary',
  },
  hero: {
    primaryCta: 'lh-cta-join-waitlist',
  },
  waitlist: {
    card: 'waitlist-form-card',
    form: 'waitlist-form',
    emailInput: 'waitlist-form-email',
    consentCheckbox: 'waitlist-form-consent',
    captchaContainer: 'waitlist-form-captcha',
    submitButton: 'waitlist-form-submit',
    successState: 'waitlist-form-success',
    serverError: 'waitlist-form-error',
  },
} as const;

export const byTestId = (value: string): string => `[data-testid="${value}"]`;
