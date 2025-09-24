'use client';

import { createContext, useContext, useState, type ReactNode } from 'react';

const NonceContext = createContext<string | null>(null);

type NonceProviderProps = {
  nonce?: string | null;
  children: ReactNode;
};

export function NonceProvider({ nonce, children }: NonceProviderProps) {
  const [stableNonce] = useState(() => nonce ?? null);

  return <NonceContext.Provider value={stableNonce}>{children}</NonceContext.Provider>;
}

export function useNonce(): string | null {
  return useContext(NonceContext);
}
