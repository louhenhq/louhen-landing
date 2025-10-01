'use client';

import { useCallback, type ReactNode } from 'react';

type SkipToCtaLinkProps = {
  targetId: string;
  className?: string;
  children: ReactNode;
};

export default function SkipToCtaLink({ targetId, className, children }: SkipToCtaLinkProps) {
  const handleActivate = useCallback(() => {
    if (typeof document === 'undefined') return;
    const target = document.getElementById(targetId) as HTMLElement | null;
    if (!target) return;
    if (!target.hasAttribute('tabindex')) {
      target.setAttribute('tabindex', '-1');
    }
    target.focus({ preventScroll: false });
  }, [targetId]);

  return (
    <a
      href={`#${targetId}`}
      className={className}
      onClick={handleActivate}
      onKeyDown={(event) => {
        if (event.key === 'Enter' || event.key === ' ') {
          if (event.key === ' ') {
            event.preventDefault();
          }
          handleActivate();
        }
      }}
    >
      {children}
    </a>
  );
}
