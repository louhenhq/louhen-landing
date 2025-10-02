'use client';

import Link from 'next/link';
import { useEffect, useMemo, useRef, useState, useId, type KeyboardEvent } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { cn, layout, text } from '@/app/(site)/_lib/ui';
import { Button, Card } from '@/components/ui';

type Pillar = {
  title: string;
  body: string;
  badgeLabel?: string | null;
  badgeTooltip?: string | null;
};

export default function Pillars() {
  const locale = useLocale();
  const t = useTranslations('method.pillars');
  const disclosureT = useTranslations('method.scienceDisclosure');
  const badgeIdPrefix = useId();
  const disclosureId = useId();
  const [isDisclosureOpen, setIsDisclosureOpen] = useState(false);
  const disclosureContentRef = useRef<HTMLDivElement | null>(null);
  const disclosureButtonRef = useRef<HTMLButtonElement | null>(null);
  const wasDisclosureOpen = useRef(false);
  useEffect(() => {
    if (isDisclosureOpen) {
      disclosureContentRef.current?.focus({ preventScroll: true });
    } else if (wasDisclosureOpen.current) {
      disclosureButtonRef.current?.focus({ preventScroll: true });
    }

    wasDisclosureOpen.current = isDisclosureOpen;
  }, [isDisclosureOpen]);

  useEffect(() => {
    if (!isDisclosureOpen) return;

    const handleKeyDown = (event: globalThis.KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        setIsDisclosureOpen(false);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isDisclosureOpen]);

  const pillars = useMemo(() => {
    const raw = t.raw('items');
    if (!Array.isArray(raw)) return [] as Pillar[];

    const mapped: Pillar[] = [];

    raw.forEach((item) => {
      if (!item || typeof item !== 'object') return;
      const value = item as Partial<Pillar>;
      if (typeof value.title !== 'string' || typeof value.body !== 'string') return;

      const badgeLabel = typeof (value as { badgeLabel?: unknown }).badgeLabel === 'string' ? (value as { badgeLabel?: string }).badgeLabel : null;
      const badgeTooltip = typeof (value as { badgeTooltip?: unknown }).badgeTooltip === 'string' ? (value as { badgeTooltip?: string }).badgeTooltip : null;

      const next: Pillar = { title: value.title, body: value.body };
      if (badgeLabel !== null) {
        next.badgeLabel = badgeLabel;
      }
      if (badgeTooltip !== null) {
        next.badgeTooltip = badgeTooltip;
      }
      mapped.push(next);
    });

    return mapped;
  }, [t]);

  const disclosureHeadingId = `${disclosureId}-heading`;
  const disclosureContentId = `${disclosureId}-content`;
  const disclosure = {
    title: t('engine.scienceDisclosure.title'),
    body: t('engine.scienceDisclosure.body'),
    privacyNote: t.rich('engine.scienceDisclosure.privacyNote', {
      privacyLink: (chunks) => (
        <Link
          href={`/${locale}/privacy`}
          className="font-semibold text-brand-primary underline-offset-2 hover:underline focus-visible:underline"
        >
          {chunks}
        </Link>
      ),
    }),
    cta: disclosureT('cta'),
  };

  const handleDisclosureKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key === 'Escape') {
      event.preventDefault();
      setIsDisclosureOpen(false);
    }
  };

  return (
    <section className={cn(layout.section, 'bg-bg')} aria-labelledby="method-pillars-title">
      <div className={cn(layout.container, 'flex flex-col gap-xl')}>
        <div className="max-w-3xl">
          <h2 id="method-pillars-title" className={cn(text.heading, 'text-balance')}>
            {t('title')}
          </h2>
        </div>
        <div className="grid gap-lg md:grid-cols-2 xl:grid-cols-4">
          {pillars.map((pillar, index) => {
            const badgeDescriptionId = pillar.badgeTooltip ? `${badgeIdPrefix}-${index}` : undefined;

            return (
              <article key={pillar.title} className="h-full">
                <Card className="flex h-full flex-col gap-sm px-gutter py-xl">
                  <header className="flex flex-col gap-xs">
                    <h3 className="text-h3 text-text">{pillar.title}</h3>
                    {pillar.badgeLabel ? (
                      <>
                      <span
                        className="inline-flex w-fit items-center gap-1 rounded-full border border-brand-primary/30 bg-brand-primary/10 px-3 py-1 text-meta uppercase tracking-[0.32em] text-brand-primary"
                        role="note"
                        aria-describedby={badgeDescriptionId}
                      >
                        {pillar.badgeLabel}
                      </span>
                      {badgeDescriptionId ? (
                        <span id={badgeDescriptionId} className="sr-only">
                          {pillar.badgeTooltip}
                        </span>
                      ) : null}
                    </>
                    ) : null}
                  </header>
                  <p className="text-body text-text-muted">{pillar.body}</p>
                  {index === 1 ? (
                    <Card
                      variant="outline"
                      className="px-md py-sm text-left"
                    >
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="flex w-full items-center justify-between gap-sm px-0 text-label text-brand-primary"
                        aria-expanded={isDisclosureOpen}
                        aria-controls={disclosureContentId}
                        onClick={() => setIsDisclosureOpen((prev) => !prev)}
                        ref={disclosureButtonRef}
                      >
                        {disclosure.cta}
                        <span className="text-label leading-none" aria-hidden="true">
                          {isDisclosureOpen ? '-' : '+'}
                        </span>
                      </Button>
                      {isDisclosureOpen ? (
                        <div
                          id={disclosureContentId}
                          ref={disclosureContentRef}
                          role="region"
                          tabIndex={-1}
                          className="mt-3 space-y-3 text-body-sm text-text-muted"
                          aria-live="polite"
                          aria-labelledby={disclosureHeadingId}
                          onKeyDown={handleDisclosureKeyDown}
                        >
                          <h4 id={disclosureHeadingId} className="text-label text-text">
                            {disclosure.title}
                          </h4>
                          <p>{disclosure.body}</p>
                          {disclosure.privacyNote ? <p>{disclosure.privacyNote}</p> : null}
                        </div>
                      ) : null}
                      <noscript>
                        <div className="mt-3 space-y-3 text-body-sm text-text-muted">
                          <h4 className="text-label text-text">{disclosure.title}</h4>
                          <p>{disclosure.body}</p>
                          {disclosure.privacyNote ? <p>{disclosure.privacyNote}</p> : null}
                        </div>
                      </noscript>
                    </Card>
                  ) : null}
                </Card>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}
