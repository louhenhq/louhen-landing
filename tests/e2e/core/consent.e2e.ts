import { expect, test } from '@tests/fixtures/playwright';
import { testIds } from '@tests/e2e/_utils/selectors';
import { getDefaultLocale, localeUrl } from '@tests/e2e/_utils/url';

const defaultLocale = getDefaultLocale();
const homePath = localeUrl('/', { locale: defaultLocale });

test.describe('@critical consent experience', () => {
  test('accepts banner via keyboard and persists consent state @critical', async ({ page, consentUnknown }) => {
    await consentUnknown();

    await page.goto(homePath, { waitUntil: 'domcontentloaded' });
    await expect(page.getByTestId(testIds.nav.root)).toBeVisible();

    const banner = page.getByTestId(testIds.consent.banner);
    await expect(banner, 'Consent banner should appear for unknown state').toBeVisible();
    await banner.waitFor({ state: 'attached' });

    const acceptButton = banner.locator('[data-consent-accept]');
    await expect(acceptButton).toBeVisible();
    await acceptButton.scrollIntoViewIfNeeded();
    await acceptButton.evaluate((element: HTMLElement) => {
      element.scrollIntoView({ block: 'center' });
      element.focus();
    });

    await expect
      .poll(
        () => page.evaluate(() => document.activeElement?.getAttribute('data-consent-accept')),
        { message: 'accept button should own focus' }
      )
      .toBe('true');

    await page.keyboard.press('Enter');
    await expect(banner).toHaveCount(0);

    await expect
      .poll(async () => {
        const cookies = await page.context().cookies();
        const rawValue = cookies.find((cookie) => cookie.name === 'll_consent')?.value ?? null;
        return rawValue ? decodeURIComponent(rawValue) : null;
      }, { message: 'll_consent cookie should be stored after acceptance' })
      .toBe('v1:granted');

    await page.addInitScript(() => {
      window.__LOUHEN_HEADER_PHASE__ = 'download';
    });
    await page.reload({ waitUntil: 'domcontentloaded' });
    await expect(page.getByTestId(testIds.consent.banner)).toHaveCount(0);

    const externalLinks = page.locator('a[target="_blank"]');
    const count = await externalLinks.count();
    expect(count, 'Expected at least one data-testid link opening a new tab').toBeGreaterThan(0);

    for (let index = 0; index < count; index += 1) {
      const link = externalLinks.nth(index);
      const rel = (await link.getAttribute('rel')) ?? '';
      expect(rel.split(/\s+/).includes('noopener'), `External link must include rel="noopener": ${await link.getAttribute('data-testid')}`).toBeTruthy();

      const srHint = (await link.locator('.sr-only').first().textContent())?.trim() ?? null;
      expect(srHint, `External link ${await link.getAttribute('data-testid')} should expose an SR hint`).toBeTruthy();

      const handle = await link.elementHandle();
      const snapshot = handle ? await page.accessibility.snapshot({ root: handle }) : null;
      await handle?.dispose();
      expect(snapshot?.name ?? '', 'Accessible name should include the SR hint for new-tab links').toContain(srHint!);
    }
  });
});
