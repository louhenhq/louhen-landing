'use client';

import Link from 'next/link';
import { track } from '@/lib/clientAnalytics';
import { useCallback } from 'react';

type Props = {
  href: string;
  label: string;
};

export default function PodiatristBadgeCta({ href, label }: Props) {
  const handleClick = useCallback(() => {
    track({ name: 'trust_podiatrist_learn_more' });
  }, []);

  return (
    <Link
      href={href}
      onClick={handleClick}
      className="inline-flex items-center gap-xs text-sm font-medium text-brand-primary underline-offset-4 transition-colors hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-border-focus"
    >
      {label}
    </Link>
  );
}
