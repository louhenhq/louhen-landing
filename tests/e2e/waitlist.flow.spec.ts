import { expect, test } from '@playwright/test';

function uniqueEmail(label: string) {
  const slug = `${label}-${Date.now()}-${Math.floor(Math.random() * 1e6)}`;
  return `${slug}@example.com`;
}

test.describe('Waitlist flows', () => {
  test('happy path with pre-onboarding and already confirmed revisit', async ({ page }) => {
    const email = uniqueEmail('happy');

    await page.goto('/waitlist');
    await page.fill('#waitlist-email', email);
    await page.check('#waitlist-consent');

    const waitlistResponse = page.waitForResponse((response) =>
      response.url().endsWith('/api/waitlist') && response.request().method() === 'POST'
    );

    await page.getByRole('button', { name: /join the waitlist/i }).click();

    const response = await waitlistResponse;
    const payload = await response.json();
    expect(payload).toMatchObject({ ok: true, shortCircuit: true });
    expect(payload.token).toBeTruthy();
    expect(payload.docId).toBeTruthy();

    await expect(page.getByRole('status')).toContainText('We saved your spot');

    await page.goto(`/waitlist/confirm?token=${payload.token}`);
    await page.waitForURL('**/waitlist/success');
    const preOnboardingLink = page.getByRole('link', { name: /pre-onboarding/i });
    await expect(preOnboardingLink).toBeVisible();

    await preOnboardingLink.click();
    await page.waitForURL('**/waitlist/pre-onboarding');

    await page.fill('#parent-first-name', 'Alex');
    await page.fill('#child-name-0', 'Mila');
    await page.fill('#child-birthday-0', '2018-04-12');
    await page.fill('#child-weight-0', '22');
    await page.fill('#child-shoesize-0', '33 EU');

    await Promise.all([
      page.waitForResponse((response) =>
        response.url().endsWith('/api/waitlist/pre-onboarding') && response.request().method() === 'POST'
      ),
      page.getByRole('button', { name: /save family profile/i }).click(),
    ]);

    await expect(page.locator('#preonboarding-feedback')).toContainText('Saved — we’ll use this profile');

    await page.reload();
    await expect(page.getByRole('status')).toContainText('Your family profile is already saved');

    await page.goto(`/waitlist/confirm?token=${payload.token}`);
    await page.waitForURL('**/waitlist/already-confirmed');
    await expect(page.getByRole('status')).toContainText('already saved');
  });

  test('expired token flow with resend produces new confirmation', async ({ page, request }) => {
    const email = uniqueEmail('expired');

    await page.goto('/waitlist');
    await page.fill('#waitlist-email', email);
    await page.check('#waitlist-consent');

    const waitlistResponse = page.waitForResponse((response) =>
      response.url().endsWith('/api/waitlist') && response.request().method() === 'POST'
    );
    await page.getByRole('button', { name: /join the waitlist/i }).click();

    const response = await waitlistResponse;
    const payload = await response.json();
    expect(payload.token).toBeTruthy();

    await request.post('/api/testing/waitlist', {
      data: {
        action: 'expire_token',
        token: payload.token,
      },
    });

    await page.goto(`/waitlist/confirm?token=${payload.token}`);
    await page.waitForURL('**/waitlist/expired');
    await expect(page.getByRole('heading', { name: /confirmation link expired/i })).toBeVisible();

    const resendResponse = page.waitForResponse((res) =>
      res.url().endsWith('/api/waitlist/resend') && res.request().method() === 'POST'
    );
    await page.fill('#resend-email', email);
    await page.getByRole('button', { name: /send a new confirmation email/i }).click();

    const resendPayload = await resendResponse.then((res) => res.json());
    expect(resendPayload.token).toBeTruthy();
    await expect(page.getByRole('status')).toContainText('Check your inbox');

    await page.goto(`/waitlist/confirm?token=${resendPayload.token}`);
    await page.waitForURL('**/waitlist/success');
    await expect(page.getByRole('heading', { level: 1 })).toContainText("You're in!");
  });
});
