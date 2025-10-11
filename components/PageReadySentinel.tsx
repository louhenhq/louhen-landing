"use client";

import { useEffect, useState } from 'react';

/**
 * Renders a shared page-ready marker once client-side effects have run.
 * Tests can await the `data-state="ready"` attribute without relying on timeouts.
 */
export function PageReadySentinel() {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setReady(true);
  }, []);

  if (!ready) {
    return null;
  }

  return (
    <span
      data-testid="lh-page-ready"
      data-state="ready"
      aria-hidden="true"
      style={{
        position: 'fixed',
        inset: '-1px auto auto -1px',
        width: 1,
        height: 1,
        overflow: 'hidden',
        pointerEvents: 'none',
        opacity: 0,
      }}
    />
  );
}
