import 'server-only';

import type { ReactNode } from 'react';
import { headers } from 'next/headers';

import { NonceProviderClient } from './nonce-context.client';

export type ServerNonceProviderProps = {
  nonce?: string | null;
  children: ReactNode;
};

function normalizeNonce(value: string | null | undefined): string | null {
  if (typeof value !== 'string') {
    return null;
  }
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

export async function NonceProvider({ nonce, children }: ServerNonceProviderProps) {
  if (typeof window !== 'undefined') {
    throw new Error('NonceProvider (server) must not render on the client.');
  }

  const headerStore = await headers();
  const headerNonce = headerStore.get('x-csp-nonce');
  const resolvedNonce = normalizeNonce(nonce) ?? normalizeNonce(headerNonce);

  return <NonceProviderClient nonce={resolvedNonce}>{children}</NonceProviderClient>;
}
