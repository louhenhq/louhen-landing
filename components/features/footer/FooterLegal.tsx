'use client';

import Link from 'next/link';
import { cn, focusRing } from '@app/(site)/_lib/ui';

export type FooterLegalLinkId = 'privacy' | 'terms';

export type FooterLegalLink = {
  id: FooterLegalLinkId;
  href: string;
  label: string;
};

type FooterLegalProps = {
  heading: string;
  links: readonly FooterLegalLink[];
  onManageConsent: () => void;
  preferencesLabel: string;
};

export function FooterLegal({ heading, links, onManageConsent, preferencesLabel }: FooterLegalProps) {
  const headingId = 'footer-legal-heading';
  return (
    <nav className="flex flex-wrap items-center gap-md" aria-labelledby={headingId}>
      <div className="flex flex-col gap-1">
        <span id={headingId} className="text-xs uppercase tracking-wide text-text-muted">
          {heading}
        </span>
        <div className="flex flex-wrap items-center gap-md">
          {links.map((link) => (
            <Link
              key={link.id}
              data-ll={`footer-${link.id}-link`}
              href={link.href}
              prefetch={false}
              className={cn(
                'inline-flex min-h-6 items-center text-text-muted transition-colors duration-base hover:text-text',
                focusRing
              )}
            >
              {link.label}
            </Link>
          ))}
        </div>
      </div>
      <button
        type="button"
        className={cn(
          'inline-flex min-h-6 items-center text-left text-text-muted underline transition-colors duration-base hover:text-text',
          focusRing
        )}
        onClick={onManageConsent}
      >
        {preferencesLabel}
      </button>
    </nav>
  );
}
