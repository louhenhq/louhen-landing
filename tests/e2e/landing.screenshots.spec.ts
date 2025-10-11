import { test, expect } from '@playwright/test';
import fs from 'node:fs';
import path from 'node:path';
import { setLocaleCookie } from '@tests/e2e/_utils/url';

const LOCALES = ['de-de', 'en-de', 'fr-fr', 'nl-nl', 'it-it'] as const;
const BASELINE_DIR = path.resolve(process.cwd(), 'tests/__screenshots__/landing-v1');

async function ensureBaselineDir() {
  await fs.promises.mkdir(BASELINE_DIR, { recursive: true });
}

test.describe('Landing visual baselines', () => {
  test.beforeAll(async () => {
    await ensureBaselineDir();
  });

  for (const locale of LOCALES) {
    test(`landing surfaces — ${locale}`, async ({ page }, testInfo) => {
      await page.setViewportSize({ width: 1280, height: 900 });
      await page.emulateMedia({ reducedMotion: 'reduce' });
      await setLocaleCookie(page.context(), locale);
      await page.goto(`/${locale}/`, { waitUntil: 'domcontentloaded' });
      await expect(page.getByTestId('lh-page-ready')).toHaveAttribute('data-state', 'ready');

      const sections = [
        { locator: page.locator('[data-testid="lh-hero-landing-root"]'), name: `hero-${locale}.png` },
        { locator: page.locator('[data-testid="landing-trust-bar"]'), name: `trust-bar-${locale}.png` },
        { locator: page.locator('[data-testid="landing-how-it-works"]'), name: `how-it-works-${locale}.png` },
        { locator: page.locator('[data-testid="landing-waitlist-section"]'), name: `waitlist-${locale}.png` },
        { locator: page.locator('[data-testid="lh-footer-site-root"]'), name: `footer-${locale}.png` },
      ];

      for (const section of sections) {
        await section.locator.scrollIntoViewIfNeeded();
        await expect(section.locator).toBeVisible();
        const snapshotPath = path.join(BASELINE_DIR, section.name);
        await expect(section.locator).toHaveScreenshot({
          path: snapshotPath,
          animations: 'disabled',
          caret: 'hide',
          scale: 'css',
          maxDiffPixelRatio: 0.01,
        });
      }

      await page.goto(`/${locale}/method/`, { waitUntil: 'domcontentloaded' });
      await expect(page.getByTestId('lh-page-ready')).toHaveAttribute('data-state', 'ready');
      const methodHero = page.locator('[data-testid="lh-hero-method-root"]');
      await methodHero.scrollIntoViewIfNeeded();
      await expect(methodHero).toBeVisible();
      const methodSnapshotPath = path.join(BASELINE_DIR, `method-hero-${locale}.png`);
      await expect(methodHero).toHaveScreenshot({
        path: methodSnapshotPath,
        animations: 'disabled',
        caret: 'hide',
        scale: 'css',
        maxDiffPixelRatio: 0.01,
      });

      await testInfo.attach(`landing-baselines-${locale}`, {
        body: JSON.stringify({ locale, baselines: sections.map((s) => s.name).concat(`method-hero-${locale}.png`) }),
        contentType: 'application/json',
      });
    });
  }
});
