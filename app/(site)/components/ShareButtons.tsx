'use client';

import type { ButtonHTMLAttributes } from 'react';
import { Button } from '@/components/ui';

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
          <Button
            key={id}
            variant="secondary"
            size="sm"
            onClick={onClick}
            aria-label={href ? `${label} (disabled placeholder)` : label}
            disabled
          >
            {label}
          </Button>
        ))}
      </div>
    </section>
  );
}
