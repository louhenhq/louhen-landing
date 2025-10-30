"use client";

import { useEffect, useRef } from 'react';

/**
 * Renders a shared page-ready marker once client-side effects have run.
 * Tests can await the `data-state="ready"` attribute without relying on timeouts.
 */
export function PageReadySentinel() {
  const sentinelRef = useRef<HTMLSpanElement | null>(null);

  useEffect(() => {
    const node = sentinelRef.current;
    if (node) {
      node.dataset.state = 'ready';
    }
  }, []);

  return (
    <span
      ref={sentinelRef}
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
