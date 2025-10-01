'use client';

import Link from 'next/link';
import { track } from '@/lib/clientAnalytics';
import { useCallback } from 'react';

type Props = {
  href: string;
  children: React.ReactNode;
};

export default function PrivacyRibbonLink({ href, children }: Props) {
  const handleClick = useCallback(() => {
    track({ name: 'privacy_ribbon_click' });
  }, []);

  return (
    <Link
      href={href}
      onClick={handleClick}
      className="inline-flex items-center gap-xs text-label text-brand-primary underline-offset-4 transition-colors hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-border-focus"
    >
      {children}
    </Link>
  );
}
