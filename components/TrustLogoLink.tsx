'use client';

import Image from 'next/image';
import { useCallback } from 'react';
import { track } from '@/lib/clientAnalytics';

type TrustLogoLinkProps = {
  href: string;
  label: string;
  logoSrc: string;
  ariaLabel?: string;
};

export default function TrustLogoLink({ href, label, logoSrc, ariaLabel }: TrustLogoLinkProps) {
  const handleClick = useCallback(() => {
    track({ name: 'trust_logo_click', label });
  }, [label]);

  return (
    <a
      href={href}
      target="_blank"
      rel="noreferrer"
      onClick={handleClick}
      className="group inline-flex items-center justify-center rounded-md px-sm py-xs transition-colors duration-150 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-border-focus"
      aria-label={ariaLabel ?? label}
      data-testid="trust-logo-link"
    >
      <Image
        src={logoSrc}
        alt=""
        width={120}
        height={40}
        className="h-8 w-auto opacity-70 transition-opacity duration-150 group-hover:opacity-100"
      />
      <span className="sr-only">{label}</span>
    </a>
  );
}
