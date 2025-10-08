'use client';

import Link from 'next/link';

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
  return (
    <nav className="flex flex-wrap items-center gap-md" aria-label="Footer">
      <div className="flex flex-col gap-1">
        <span className="text-xs uppercase tracking-wide text-text-muted">{heading}</span>
        <div className="flex flex-wrap items-center gap-md">
          {links.map((link) => (
            <Link
              key={link.id}
              data-ll={`footer-${link.id}-link`}
              href={link.href}
              prefetch={false}
              className="hover:text-text"
            >
              {link.label}
            </Link>
          ))}
        </div>
      </div>
      <button
        type="button"
        className="text-left text-text-muted hover:text-text underline"
        onClick={onManageConsent}
      >
        {preferencesLabel}
      </button>
    </nav>
  );
}
