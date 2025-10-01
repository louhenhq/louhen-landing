'use client';

import type { ButtonHTMLAttributes } from 'react';

export type ShareButton = {
  id: string;
  label: string;
  href?: string;
  onClick?: ButtonHTMLAttributes<HTMLButtonElement>['onClick'];
};

type ShareButtonsProps = {
  title?: string;
  buttons: ShareButton[];
};

export default function ShareButtons({ title, buttons }: ShareButtonsProps) {
  return (
    <section aria-labelledby="waitlist-share-heading" className="mt-lg">
      {title ? (
        <h2 id="waitlist-share-heading" className="text-meta font-semibold uppercase tracking-wide text-text-muted">
          {title}
        </h2>
      ) : null}
      <div className="mt-sm flex flex-wrap gap-sm">
        {buttons.map(({ id, label, href, onClick }) => (
          <button
            key={id}
            type="button"
            onClick={onClick}
            className="rounded-pill border border-border px-md py-xs text-label text-text transition-colors duration-base hover:bg-bg focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-border-focus disabled:cursor-not-allowed disabled:opacity-60"
            aria-label={href ? `${label} (disabled placeholder)` : label}
            disabled
          >
            {label}
          </button>
        ))}
      </div>
    </section>
  );
}
