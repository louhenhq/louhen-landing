'use client';

import { createContext, useContext, useRef, type ReactNode } from 'react';

const NonceContext = createContext<string | null>(null);

type NonceProviderProps = {
  nonce?: string | null;
  children: ReactNode;
};

export function NonceProvider({ nonce, children }: NonceProviderProps) {
  const stableNonce = useRef<string | null>(null);
  if (stableNonce.current === null && typeof nonce === 'string' && nonce.trim().length > 0) {
    stableNonce.current = nonce;
  }
  const resolvedNonce =
    stableNonce.current ?? (typeof nonce === 'string' && nonce.trim().length > 0 ? nonce : null);
  return <NonceContext.Provider value={resolvedNonce}>{children}</NonceContext.Provider>;
}

export function useNonce(): string | null {
  return useContext(NonceContext);
}
