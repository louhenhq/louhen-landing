'use client';

import type { ReactNode } from 'react';
import { useMemo, useState } from 'react';
import { useTranslations } from 'next-intl';
import { cn } from '@/app/(site)/_lib/ui';
import TrustModal from '@/app/(site)/components/TrustModals';
import { Button, Card } from '@/components/ui';

type Props = {
  variant?: 'default' | 'inline' | 'tile';
  label?: string;
  description?: string;
  ariaLabel?: string;
  icon?: ReactNode;
  className?: string;
};

function TileIcon({ icon }: { icon?: ReactNode }) {
  if (icon) {
    return <>{icon}</>;
  }

  return (
    <svg
      viewBox="0 0 24 24"
      className="h-6 w-6"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="M12 3 5.5 6v5c0 4.89 3.5 8.74 6.5 10 3-1.26 6.5-5.11 6.5-10V6L12 3Z" />
      <path d="m9 12 2 2 4-4" />
    </svg>
  );
}

export default function PodiatristBadge({
  variant = 'default',
  label,
  description,
  ariaLabel,
  icon,
  className,
}: Props) {
  const t = useTranslations('trust.podiatrist');
  const [open, setOpen] = useState(false);
  const resolvedLabel = label ?? t('badge');
  const resolvedDescription = description;
  const resolvedAriaLabel = ariaLabel ?? resolvedLabel;
  const inlineIcon = useMemo(() => (
    <span role="img" aria-hidden className="text-label leading-none">
      👣
    </span>
  ), []);

  if (variant === 'tile') {
    return (
      <>
        <Card
          as="button"
          type="button"
          interactive
          onClick={() => setOpen(true)}
          aria-label={resolvedAriaLabel}
          aria-haspopup="dialog"
          className={cn('group flex h-full flex-col items-start gap-sm px-lg py-md text-left', className)}
        >
          <span
            aria-hidden
            className="flex h-12 w-12 items-center justify-center rounded-xl border border-border bg-bg text-text-muted transition-colors duration-200 group-hover:border-border-strong group-hover:text-text"
          >
            <TileIcon icon={icon} />
          </span>
          <span className="text-label text-text">{resolvedLabel}</span>
          {resolvedDescription ? <span className="text-body-sm text-text-muted">{resolvedDescription}</span> : null}
        </Card>
        <TrustModal
          id="podiatrist"
          open={open}
          onClose={() => setOpen(false)}
          title={t('title')}
          body={t('body')}
        />
      </>
    );
  }

  return (
    <>
      <Button
        type="button"
        variant="secondary"
        size="sm"
        onClick={() => setOpen(true)}
        aria-haspopup="dialog"
        className={cn(
          'flex items-center gap-xs rounded-pill px-sm',
          variant === 'inline' ? 'bg-bg' : 'bg-bg-card shadow-card',
          className
        )}
      >
        {inlineIcon}
        {resolvedLabel}
      </Button>
      <TrustModal
        id="podiatrist"
        open={open}
        onClose={() => setOpen(false)}
        title={t('title')}
        body={t('body')}
      />
    </>
  );
}

export function LouhenFitBadge({ variant = 'default' }: Props) {
  const t = useTranslations('trust.louhenfit');
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button
        type="button"
        variant="secondary"
        size="sm"
        onClick={() => setOpen(true)}
        aria-haspopup="dialog"
        className={cn(
          'flex items-center gap-xs rounded-pill px-sm',
          variant === 'inline' ? 'bg-bg' : 'bg-bg-card shadow-card'
        )}
      >
        <span role="img" aria-hidden className="text-label leading-none">🛡️</span>
        {t('badge')}
      </Button>
      <TrustModal
        id="louhenfit"
        open={open}
        onClose={() => setOpen(false)}
        title={t('title')}
        body={t('body')}
      />
    </>
  );
}
