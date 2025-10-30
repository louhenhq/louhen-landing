import { chromium } from 'playwright';
const BASE = 'http://127.0.0.1:4311';
const PAGE = `${BASE}/de-de/waitlist`;
const RE = /\/api(?:\/testing)?\/waitlist(?:\/.*)?(?=$|[?#])/;

const log = (...a) => console.log('[LOG]', ...a);

const browser = await chromium.launch();
const ctx = await browser.newContext();
const page = await ctx.newPage();

page.on('request', req => {
  const u = new URL(req.url());
  const match = RE.test(u.pathname);
  if (req.method() === 'POST' || match) log('REQ', req.method(), u.pathname + u.search, match ? '← matches WAITLIST_API_PATTERN' : '');
});
page.on('response', res => {
  const u = new URL(res.url());
  const match = RE.test(u.pathname);
  if (res.request().method() === 'POST' || match) log('RES', res.status(), u.pathname + u.search, match ? '← matches WAITLIST_API_PATTERN' : '');
});

await page.goto(PAGE, { waitUntil: 'domcontentloaded' });
await page.getByTestId('waitlist-form-email').fill('critical-suite@example.com');
await page.getByTestId('waitlist-form-consent').check({ force: true });
await page.getByTestId('waitlist-form-submit').click();

await page.waitForTimeout(3000);
await browser.close();
