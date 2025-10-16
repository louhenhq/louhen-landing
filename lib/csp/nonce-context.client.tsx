'use client';

import { createContext, useContext, useRef, type ReactNode } from 'react';

function normalizeNonce(value: string | null | undefined): string | null {
  if (typeof value !== 'string') {
    return null;
  }
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

const NonceContext = createContext<string | null>(null);

export type NonceProviderClientProps = {
  nonce?: string | null;
  children: ReactNode;
};

export function NonceProviderClient({ nonce, children }: NonceProviderClientProps) {
  const stableNonceRef = useRef<string | null>(null);
  const normalized = normalizeNonce(nonce);
  if (stableNonceRef.current === null && normalized) {
    stableNonceRef.current = normalized;
  }

  const value = stableNonceRef.current ?? normalized ?? null;

  return <NonceContext.Provider value={value}>{children}</NonceContext.Provider>;
}

export function useNonce(): string | null {
  const nonce = useContext(NonceContext);
  return normalizeNonce(nonce);
}
