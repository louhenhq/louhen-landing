'use client';

import type { ReactNode } from 'react';
import { useEffect, useMemo, useState } from 'react';
import { useTranslations } from 'next-intl';
import { cn, layout, text } from '@/app/(site)/_lib/ui';
import { Card } from '@/components/ui';
import { usePrefersReducedMotion } from '@/app/(site)/_lib/usePrefersReducedMotion';
import PodiatristBadge from '@/app/(site)/components/PodiatristBadge';
import TrustModal from '@/app/(site)/components/TrustModals';

type TrustModalTileProps = {
  id: string;
  icon: ReactNode;
  label: string;
  description?: string;
  ariaLabel: string;
  title: string;
  body: string;
};

function TrustModalTile({ id, icon, label, description, ariaLabel, title, body }: TrustModalTileProps) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Card
        as="button"
        type="button"
        interactive
        className="group flex h-full flex-col items-start gap-sm px-lg py-md text-left"
        aria-label={ariaLabel}
        aria-haspopup="dialog"
        onClick={() => setOpen(true)}
      >
        <span
          aria-hidden
          className="flex h-12 w-12 items-center justify-center rounded-xl border border-border bg-bg text-text-muted transition-colors duration-200 group-hover:border-border-strong group-hover:text-text"
        >
          {icon}
        </span>
        <span className="text-label text-text">{label}</span>
        {description ? <span className={text.bodyMuted}>{description}</span> : null}
      </Card>
      <TrustModal id={id} open={open} onClose={() => setOpen(false)} title={title} body={body} />
    </>
  );
}

function ShieldCheckIcon() {
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

function ShieldLockIcon() {
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
      <path d="M9 11a3 3 0 0 1 6 0v2" />
      <rect x="9" y="13" width="6" height="5" rx="1.5" />
    </svg>
  );
}

function RepeatArrowIcon() {
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
      <path d="M3 11a7 7 0 0 1 7-7h2" />
      <path d="M13 4 10 7l3 3" />
      <path d="M21 13a7 7 0 0 1-7 7h-2" />
      <path d="M11 20 14 17l-3-3" />
    </svg>
  );
}

function CardCheckIcon() {
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
      <rect x="2" y="5" width="20" height="14" rx="2" />
      <path d="M2 10h20" />
      <path d="m15 16 2 2 3-3" />
    </svg>
  );
}

export default function TrustBar() {
  const t = useTranslations('trust.bar');
  const trust = useTranslations('trust');
  const prefersReducedMotion = usePrefersReducedMotion();
  const [isAnimated, setIsAnimated] = useState(prefersReducedMotion);

  useEffect(() => {
    if (prefersReducedMotion) {
      setIsAnimated(true);
      return;
    }
    const frame = requestAnimationFrame(() => setIsAnimated(true));
    return () => cancelAnimationFrame(frame);
  }, [prefersReducedMotion]);

  const items = useMemo(() => (
    [
      {
        key: 'podiatrist',
        type: 'podiatrist' as const,
        label: t('items.podiatrist.label'),
        description: t('items.podiatrist.description'),
        aria: t('items.podiatrist.aria'),
        icon: <ShieldCheckIcon />,
        title: trust('podiatrist.title'),
        body: trust('podiatrist.body'),
      },
      {
        key: 'privacy',
        type: 'modal' as const,
        label: t('items.privacy.label'),
        description: t('items.privacy.description'),
        aria: t('items.privacy.aria'),
        icon: <ShieldLockIcon />,
        title: t('items.privacy.modalTitle'),
        body: t('items.privacy.modalBody'),
      },
      {
        key: 'returns',
        type: 'modal' as const,
        label: t('items.returns.label'),
        description: t('items.returns.description'),
        aria: t('items.returns.aria'),
        icon: <RepeatArrowIcon />,
        title: trust('louhenfit.title'),
        body: trust('louhenfit.body'),
      },
      {
        key: 'adyen',
        type: 'modal' as const,
        label: t('items.adyen.label'),
        description: t('items.adyen.description'),
        aria: t('items.adyen.aria'),
        icon: <CardCheckIcon />,
        title: t('items.adyen.modalTitle'),
        body: t('items.adyen.modalBody'),
      },
    ]
  ), [t, trust]);

  return (
    <section
      className={cn(layout.section, 'pt-0')}
      aria-labelledby="trust-bar-heading"
      data-testid="landing-trust-bar"
    >
      <div className={cn(layout.container, layout.grid)}>
        <div className="md:col-span-12">
          <h2 id="trust-bar-heading" className="sr-only">
            {t('heading')}
          </h2>
          <ul className="grid gap-md sm:grid-cols-2 lg:grid-cols-4" role="list">
            {items.map((item, index) => (
              <li
                key={item.key}
                className={cn(
                  'transition-all duration-700 ease-out',
                  isAnimated ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'
                )}
                style={{ transitionDelay: prefersReducedMotion ? undefined : `${index * 80}ms` }}
              >
                {item.type === 'podiatrist' ? (
                  <PodiatristBadge
                    variant="tile"
                    label={item.label}
                    description={item.description}
                    ariaLabel={item.aria}
                    icon={item.icon}
                  />
                ) : (
                  <TrustModalTile
                    id={`trust-${item.key}`}
                    icon={item.icon}
                    label={item.label}
                    description={item.description}
                    ariaLabel={item.aria}
                    title={item.title}
                    body={item.body}
                  />
                )}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}
