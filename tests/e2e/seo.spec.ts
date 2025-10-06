import { expect, test } from '@playwright/test';
import { getDefaultLocale, localeUrl } from './_utils/url';

const rawBaseUrl = process.env.APP_BASE_URL ?? 'http://localhost:4311';
const baseUrl = rawBaseUrl.replace(/\/$/, '');
const fallbackBaseUrl = 'https://louhen-landing.vercel.app';
const allowedHosts = [
  (() => {
    try {
      return new URL(baseUrl).host;
    } catch {
      return null;
    }
  })(),
  new URL(fallbackBaseUrl).host,
].filter(Boolean) as string[];

const defaultLocale = getDefaultLocale();

function getCanonicalParts(href: string | null) {
  if (!href) {
    return { host: null, path: null };
  }

  try {
    const url = new URL(href);
    return {
      host: url.host,
      path: url.pathname.replace(/\/$/, '') || '/',
    };
  } catch {
    return { host: null, path: href.replace(/\/$/, '') };
  }
}

test.describe('SEO metadata', () => {
  test('home page metadata renders canonical tags and JSON-LD', async ({ page }) => {
    await page.goto(localeUrl());

    const metaDescriptions = await page
      .locator('meta[name="description"]')
      .evaluateAll((nodes) => nodes.map((node) => node.getAttribute('content') ?? ''));
    expect(metaDescriptions.some((content) => /Louhen/i.test(content))).toBeTruthy();

    const canonical = page.locator('link[rel="canonical"]');
    const canonicalHref = await canonical.getAttribute('href');
    const canonicalParts = getCanonicalParts(canonicalHref);
    expect([`/${defaultLocale}`, '/en-de', '/de-de']).toContain(canonicalParts.path);
    expect(allowedHosts).toContain(canonicalParts.host);

    const altTexts = await page
      .locator('img')
      .evaluateAll((nodes) => nodes.map((node) => node.getAttribute('alt')?.trim()).filter((alt) => !!alt));
    expect(altTexts.length).toBeGreaterThan(0);

    const robots = page.locator('meta[name="robots"]');
    if (process.env.VERCEL_ENV && process.env.VERCEL_ENV !== 'production') {
      await expect(robots).toHaveAttribute('content', /noindex/i);
    } else {
      await expect(robots).toHaveCount(0);
    }

    const jsonLdContent = await page
      .locator('script[type="application/ld+json"]')
      .evaluateAll((nodes) => nodes.map((node) => node.textContent || ''));

    expect(jsonLdContent.some((content) => content.includes('"@type":"Organization"'))).toBeTruthy();
    expect(jsonLdContent.some((content) => content.includes('"@type":"WebSite"'))).toBeTruthy();
  });

  test('method page has canonical URL and breadcrumb JSON-LD', async ({ page }) => {
    await page.goto(localeUrl('/method'));

    const metaDescriptions = await page
      .locator('meta[name="description"]')
      .evaluateAll((nodes) => nodes.map((node) => node.getAttribute('content') ?? ''));
    expect(metaDescriptions.some((content) => /Louhen/i.test(content))).toBeTruthy();

    const canonical = page.locator('link[rel="canonical"]');
    const canonicalHref = await canonical.getAttribute('href');
    const canonicalParts = getCanonicalParts(canonicalHref);
    expect(canonicalParts.path).toBe(`/${defaultLocale}/method`);
    expect(allowedHosts).toContain(canonicalParts.host);

    const jsonLdContent = await page
      .locator('script[type="application/ld+json"]')
      .evaluateAll((nodes) => nodes.map((node) => node.textContent || ''));

    expect(jsonLdContent.some((content) => content.includes('"@type":"BreadcrumbList"'))).toBeTruthy();
  });
});
