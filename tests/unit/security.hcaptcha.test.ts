import { afterEach, describe, expect, it, vi } from 'vitest';
import { verifyToken } from '@/lib/security/hcaptcha';

const originalFetch = global.fetch;

afterEach(() => {
  if (originalFetch) {
    global.fetch = originalFetch;
  } else {
    // @ts-expect-error - restore to undefined when not present
    delete global.fetch;
  }
  vi.restoreAllMocks();
});

describe('hCaptcha verification', () => {
  it('returns success when provider approves token', async () => {
    const mockResponse = new Response(JSON.stringify({ success: true, score: 0.8 }), {
      status: 200,
      headers: { 'content-type': 'application/json' },
    });
    const fetchMock = vi.fn().mockResolvedValue(mockResponse);
    // @ts-expect-error - assign mock fetch
    global.fetch = fetchMock;

    const result = await verifyToken({ token: 'token', secret: 'secret', remoteIp: '127.0.0.1' });
    expect(result.success).toBe(true);
    expect(result.score).toBe(0.8);
    expect(fetchMock).toHaveBeenCalled();
  });

  it('returns failure when provider rejects token', async () => {
    const mockResponse = new Response(JSON.stringify({ success: false, 'error-codes': ['invalid-input-response'] }), {
      status: 200,
      headers: { 'content-type': 'application/json' },
    });
    const fetchMock = vi.fn().mockResolvedValue(mockResponse);
    // @ts-expect-error - assign mock fetch
    global.fetch = fetchMock;

    const result = await verifyToken({ token: 'token', secret: 'secret' });
    expect(result.success).toBe(false);
    expect(result.errorCodes).toContain('invalid-input-response');
  });

  it('returns failure on non-200 response', async () => {
    const mockResponse = new Response('error', { status: 500 });
    const fetchMock = vi.fn().mockResolvedValue(mockResponse);
    // @ts-expect-error - assign mock fetch
    global.fetch = fetchMock;

    const result = await verifyToken({ token: 'token', secret: 'secret' });
    expect(result.success).toBe(false);
    expect(result.errorCodes).toContain('verification_failed');
  });

  it('returns failure on network error', async () => {
    const fetchMock = vi.fn().mockRejectedValue(new Error('network down'));
    // @ts-expect-error - assign mock fetch
    global.fetch = fetchMock;

    const result = await verifyToken({ token: 'token', secret: 'secret' });
    expect(result.success).toBe(false);
    expect(result.errorCodes).toContain('network_error');
  });

  it('returns failure when secret missing', async () => {
    const result = await verifyToken({ token: 'token', secret: '' });
    expect(result.success).toBe(false);
    expect(result.errorCodes).toContain('missing_secret');
  });
});
