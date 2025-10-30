import { beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';
import { GET } from '@/app/api/waitlist/confirm/route';
import { WAITLIST_SESSION_COOKIE } from '@/lib/waitlist/session';

const confirmMock = vi.hoisted(() => ({
  processConfirmationToken: vi.fn(),
}));

vi.mock('@/lib/waitlist/confirm', () => confirmMock);

function makeRequest(token?: string) {
  const url = new URL('http://127.0.0.1/waitlist/confirm');
  if (token) {
    url.searchParams.set('token', token);
  }
  return new NextRequest(url);
}

describe('waitlist confirm route', () => {
  beforeEach(() => {
    confirmMock.processConfirmationToken.mockReset();
  });

  it('redirects to success and sets session cookie on confirmed outcome', async () => {
    confirmMock.processConfirmationToken.mockResolvedValueOnce({
      status: 'confirmed',
      docId: 'doc-123',
    });

    const response = await GET(makeRequest('token-123'));
    expect(response.status).toBe(307);
    expect(response.headers.get('location')).toContain('/waitlist/success');
    const cookie = response.cookies.get(WAITLIST_SESSION_COOKIE);
    expect(cookie?.value).toBe('doc-123');
  });

  it('redirects to already-confirmed and clears session cookie', async () => {
    confirmMock.processConfirmationToken.mockResolvedValueOnce({
      status: 'already',
      docId: 'doc-abc',
    });

    const response = await GET(makeRequest('token-abc'));
    expect(response.headers.get('location')).toContain('/waitlist/already-confirmed');
    const cookieHeader = response.headers.get('set-cookie') || '';
    expect(cookieHeader).toMatch(/waitlist_session=;/);
  });

  it('redirects to expired and clears session cookie when invalid', async () => {
    confirmMock.processConfirmationToken.mockResolvedValueOnce({ status: 'invalid' });

    const response = await GET(makeRequest());
    expect(response.headers.get('location')).toContain('/waitlist/expired');
    const cookieHeader = response.headers.get('set-cookie') || '';
    expect(cookieHeader).toMatch(/waitlist_session=;/);
  });
});
