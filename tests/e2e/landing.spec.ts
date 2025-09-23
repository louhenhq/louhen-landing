import { test, expect } from '@playwright/test';

async function interceptAnalytics(page: import('@playwright/test').Page) {
  const events: any[] = [];
  await page.route('**/api/track', async (route) => {
    const request = route.request();
    const payload = request.postDataJSON?.() ?? {};
    events.push(payload);
    await route.fulfill({ status: 200, body: '{}' });
  });
  return events;
}

async function waitForEvent(events: any[], name: string) {
  await expect.poll(() => events.some((event) => event.name === name)).toBeTruthy();
}

async function allowAnalytics(page: import('@playwright/test').Page) {
  await page.addInitScript(() => {
    const value = { analytics: true, marketing: false };
    window['__LOUHEN_CONSENT__'] = value;
    const payload = encodeURIComponent(JSON.stringify({ ...value, timestamp: new Date().toISOString() }));
    document.cookie = `louhen_consent=${payload}; Path=/; SameSite=Lax`;
    window.dispatchEvent(new CustomEvent('louhen:consent', { detail: { analytics: true } }));
    window['__LOUHEN_POPUPS__'] = [];
    window.open = (...args) => {
      const url = typeof args[0] === 'string' ? args[0] : null;
      if (url) {
        window['__LOUHEN_POPUPS__'].push(url);
      }
      return null;
    };
  });
}

test.describe('Landing Page – EN', () => {
  test('hero scroll, voucher copy/share, section views, founder placeholder', async ({ page }) => {
    const events = await interceptAnalytics(page);

    await allowAnalytics(page);

    await page.goto('/en', { waitUntil: 'networkidle' });
    const { origin } = new URL(page.url());
    await page.context().grantPermissions(['clipboard-read', 'clipboard-write'], { origin });

    const heroBadge = page.getByRole('button', { name: /twin parent voucher/i });
    await heroBadge.click();
    await expect(page.locator('#founder-story')).toBeVisible();
    await waitForEvent(events, 'hero_twin_badge_click');

    const copyButton = page.getByRole('button', { name: /copy voucher code/i });
    await copyButton.click();
    await expect(page.getByText(/copied/i)).toBeVisible();
    await waitForEvent(events, 'voucher_code_copy');
    await expect.poll(async () => await page.evaluate(() => navigator.clipboard.readText())).toBe('TWINS5');

    const shareButton = page.getByRole('button', { name: /share the twin voucher/i });
    await shareButton.click();
    const popups = await page.evaluate(() => window['__LOUHEN_POPUPS__']);
    expect(Array.isArray(popups)).toBe(true);
    expect(popups.some((value) => typeof value === 'string' && value.includes('wa.me'))).toBe(true);
    await waitForEvent(events, 'voucher_share_whatsapp_click');

    await page.locator('#founder-story').scrollIntoViewIfNeeded();
    await page.waitForTimeout(300);
    await page.locator('#how').scrollIntoViewIfNeeded();
    await page.waitForTimeout(300);
    const sectionEvents = events.filter((event) => event.name === 'section_view').map((event) => event.id);
    expect(new Set(sectionEvents)).toEqual(new Set(['founder-story', 'how']));

    const howSection = page.locator('#how');
    await expect(howSection).toBeVisible();
    await expect(howSection.locator('li')).toHaveCount(3);
    await expect(howSection.getByRole('link', { name: /join the waitlist/i })).toBeVisible();

    const founderImg = page.locator('img[alt*="Martin Weis"], img[alt*="Founder"]');
    await expect(founderImg).toBeVisible();
  });
});

test.describe('Landing Page – DE', () => {
  test('localized copy and voucher analytics', async ({ page }) => {
    const events = await interceptAnalytics(page);
    await allowAnalytics(page);
    await page.goto('/de', { waitUntil: 'networkidle' });
    const { origin } = new URL(page.url());
    await page.context().grantPermissions(['clipboard-read', 'clipboard-write'], { origin });

    await expect(page.getByRole('button', { name: /zwillingseltern/i })).toBeVisible();

    const copyButton = page.getByRole('button', { name: /gutscheincode.*twins5.*kopieren/i });
    await copyButton.click();
    await expect(page.getByText(/kopiert/i)).toBeVisible();
    await waitForEvent(events, 'voucher_code_copy');
  });
});

test.describe('Trust & Social Proof', () => {
  test('testimonials, podiatrist, trust logos, privacy analytics', async ({ page }) => {
    const events = await interceptAnalytics(page);
    await allowAnalytics(page);
    await page.goto('/en', { waitUntil: 'networkidle' });

    const testimonials = page.getByTestId('testimonial-card');
    const testimonialCount = await testimonials.count();
    for (let index = 0; index < testimonialCount; index += 1) {
      await testimonials.nth(index).scrollIntoViewIfNeeded();
      await page.waitForTimeout(200);
    }
    await waitForEvent(events, 'testimonial_view');
    const testimonialEvents = events.filter((event) => event.name === 'testimonial_view').map((event) => event.ix);
    expect(new Set(testimonialEvents)).toEqual(new Set([0, 1, 2]));

    const podiatristLink = page.getByRole('link', { name: /learn how we fit/i });
    await podiatristLink.click();
    await waitForEvent(events, 'trust_podiatrist_learn_more');

    const logoLink = page.getByTestId('trust-logo-link').first();
    await logoLink.click();
    await waitForEvent(events, 'trust_logo_click');

    const privacyLink = page.getByRole('link', { name: /read our privacy policy/i });
    await privacyLink.click();
    await waitForEvent(events, 'privacy_ribbon_click');
  });
});
