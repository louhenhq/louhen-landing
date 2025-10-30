import { expect, test } from '@tests/fixtures/playwright';
import { ALLOW_BLOCKED_REQUESTS_ANNOTATION } from '@tests/e2e/_utils/annotations';

test.describe('@critical network policy', () => {
  test.describe.configure({
    annotations: [
      {
        type: ALLOW_BLOCKED_REQUESTS_ANNOTATION,
        description: 'Intentional cross-origin probe to confirm blocking behaviour.',
      },
    ],
  });

  test('blocks cross-origin navigation attempts @critical', async ({ page, networkPolicy }, testInfo) => {
    testInfo.annotations.push({
      type: ALLOW_BLOCKED_REQUESTS_ANNOTATION,
      description: 'Intentional cross-origin probe to validate network guard behaviour.',
    });
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    networkPolicy.clearBlockedRequests();

    const probeOrigin = 'https://example.com';
    const probeUrl = `${probeOrigin}/louhen-network-policy?ts=${Date.now()}`;

    const failureEvent = page.waitForEvent('requestfailed', (request) => request.url() === probeUrl);
    await page.goto(probeUrl).catch(() => null);

    const failedRequest = await failureEvent;
    const failure = failedRequest.failure();
    const blockedRequests = networkPolicy.getBlockedRequests();

    const diagnostics = {
      url: failedRequest.url(),
      method: failedRequest.method(),
      failureText: failure?.errorText ?? null,
      blockedRequests,
    };

    if (!blockedRequests.some((url) => url === probeUrl) || !failure?.errorText) {
      await testInfo.attach('network-policy-diagnostics.json', {
        body: JSON.stringify(diagnostics, null, 2),
        contentType: 'application/json',
      });
    }

    expect(blockedRequests.some((url) => url === probeUrl), 'Probe URL should be recorded as blocked').toBeTruthy();
    expect(failure?.errorText, 'Playwright should report the blocked navigation as a failure').toBeTruthy();
    expect(/blocked|failed|net::/i.test(failure!.errorText)).toBeTruthy();
  });
});
