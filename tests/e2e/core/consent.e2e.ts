import type { Locator } from '@playwright/test';
import { expect, test } from '@tests/fixtures/playwright';
import { testIds } from '@tests/e2e/_utils/selectors';
import { getDefaultLocale, localeUrl } from '@tests/e2e/_utils/url';

const defaultLocale = getDefaultLocale();
const homePath = localeUrl('/', { locale: defaultLocale });
const seededDownloadUrl = process.env.NEXT_PUBLIC_APP_DOWNLOAD_URL ?? 'https://download.louhen.app';

test.describe('@critical consent experience', () => {
  test.beforeEach(async ({ context }) => {
    await context.addInitScript(
      ({ phase, downloadUrl }) => {
        Object.assign(window, {
          __LOUHEN_HEADER_PHASE__: phase,
          __LOUHEN_DOWNLOAD_URL__: downloadUrl,
        });
      },
      { phase: 'download', downloadUrl: seededDownloadUrl }
    );
  });

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

    await page.reload({ waitUntil: 'domcontentloaded' });
    await expect(page.getByTestId(testIds.consent.banner)).toHaveCount(0);

    const assertExternalLink = async (link: Locator) => {
      await expect(link).toHaveAttribute('target', '_blank');
      const relValue = ((await link.getAttribute('rel')) ?? '').split(/\s+/).filter(Boolean);
      const linkId = (await link.getAttribute('data-testid')) ?? (await link.getAttribute('href')) ?? '<unknown>';
      expect(relValue.includes('noopener'), `External link must include rel="noopener": ${linkId}`).toBeTruthy();

      const srHint = (await link.locator('.sr-only').first().textContent())?.trim() ?? null;
      expect(srHint, `External link ${linkId} should expose an SR hint`).toBeTruthy();

      const handle = await link.elementHandle();
      const snapshot = handle ? await page.accessibility.snapshot({ root: handle }) : null;
      await handle?.dispose();
      expect(snapshot?.name ?? '', 'Accessible name should include the SR hint for new-tab links').toContain(srHint!);
    };

    const downloadLink = page.getByTestId('lh-header-download-link');
    const downloadLinkCount = await downloadLink.count();

    if (downloadLinkCount > 0) {
      await assertExternalLink(downloadLink.first());
    } else {
      const fallbackLinks = page.locator('a[target="_blank"]');
      const fallbackCount = await fallbackLinks.count();
      if (fallbackCount === 0) {
        console.warn('[consent-e2e] No external new-tab links detected after consent; skipping new-tab assertions.');
      } else {
        for (let index = 0; index < fallbackCount; index += 1) {
          await assertExternalLink(fallbackLinks.nth(index));
        }
      }
    }
  });
});
