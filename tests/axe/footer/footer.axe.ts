import { expect, test } from '@tests/fixtures/playwright';
import { runAxe } from '@tests/fixtures/axe';
import { getDefaultLocale, setLocaleCookie } from '@tests/e2e/_utils/url';

const locale = getDefaultLocale();

test.describe('Footer — accessibility', () => {
  test('contentinfo landmark and axe', async ({ page }, testInfo) => {
    await page.setViewportSize({ width: 1280, height: 900 });
    await setLocaleCookie(page.context(), locale);
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    await expect(page).toHaveURL(new RegExp(`/${locale}/?(?:[?#].*)?$`));

    const footer = page.locator('[data-ll="footer-root"]');
    await expect(footer).toHaveAttribute('role', 'contentinfo');

    const footerNav = footer.locator('nav');
    await expect(footerNav).toHaveAttribute('aria-labelledby', 'footer-legal-heading');

    await expect(footer.locator('[data-ll="footer-privacy-link"]')).toHaveAccessibleName(/.+/);
    await expect(footer.locator('[data-ll="footer-terms-link"]')).toHaveAccessibleName(/.+/);

    await runAxe(page, testInfo, { route: 'footer', locale, viewport: 'desktop' });
  });
});
