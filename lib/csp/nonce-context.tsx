'use client';

import { createContext, useContext, type ReactNode } from 'react';

const NonceContext = createContext<string | null>(null);

type NonceProviderProps = {
  nonce?: string | null;
  children: ReactNode;
};

export function NonceProvider({ nonce, children }: NonceProviderProps) {
  return <NonceContext.Provider value={nonce ?? null}>{children}</NonceContext.Provider>;
}

export function useNonce(): string | null {
  return useContext(NonceContext);
}
