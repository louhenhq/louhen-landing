'use client';

import type { ButtonHTMLAttributes } from 'react';
<<<<<<< HEAD
import { Button } from '@/components/ui';
=======
>>>>>>> f7d7592 (Waitlist env split: build uses NEXT_PUBLIC only (#2))

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
<<<<<<< HEAD
    <section aria-labelledby="waitlist-share-heading" className="mt-lg">
      {title ? (
        <h2 id="waitlist-share-heading" className="text-meta font-semibold uppercase tracking-wide text-text-muted">
          {title}
        </h2>
      ) : null}
      <div className="mt-sm flex flex-wrap gap-sm">
        {buttons.map(({ id, label, href, onClick }) => (
          <Button
            key={id}
            variant="secondary"
            size="sm"
            onClick={onClick}
=======
    <section aria-labelledby="waitlist-share-heading" className="mt-8">
      {title ? (
        <h2 id="waitlist-share-heading" className="text-sm font-semibold uppercase tracking-wide text-slate-500">
          {title}
        </h2>
      ) : null}
      <div className="mt-3 flex flex-wrap gap-3">
        {buttons.map(({ id, label, href, onClick }) => (
          <button
            key={id}
            type="button"
            onClick={onClick}
            className="rounded-full border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 transition-colors duration-150 hover:bg-slate-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-500 disabled:cursor-not-allowed disabled:opacity-60"
>>>>>>> f7d7592 (Waitlist env split: build uses NEXT_PUBLIC only (#2))
            aria-label={href ? `${label} (disabled placeholder)` : label}
            disabled
          >
            {label}
<<<<<<< HEAD
          </Button>
=======
          </button>
>>>>>>> f7d7592 (Waitlist env split: build uses NEXT_PUBLIC only (#2))
        ))}
      </div>
    </section>
  );
}
