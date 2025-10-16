'use client';

import { useEffect, useMemo, useState } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { cn, layout, text } from '@/app/(site)/_lib/ui';
import { usePrefersReducedMotion } from '@/app/(site)/_lib/usePrefersReducedMotion';
import { Button, Card } from '@/components/ui';

type Step = {
  id: string;
  title: string;
  body: string;
  illustrationLabel?: string;
  link?: {
    label: string;
    href: string;
  };
};

function resolveLocaleHref(locale: string, href: string | undefined) {
  if (!href) return undefined;
  const trimmed = href.trim();
  if (!trimmed) return undefined;
  if (/^https?:/i.test(trimmed)) {
    return trimmed;
  }
  const prefixed = trimmed.startsWith('/') ? trimmed : `/${trimmed}`;
  if (prefixed.startsWith(`/${locale}/`) || prefixed === `/${locale}`) {
    return prefixed;
  }
  return `/${locale}${prefixed}`;
}

export default function HowItWorks() {
  const locale = useLocale();
  const t = useTranslations('how');
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

  const subtitle = t('subtitle', { defaultValue: '' }).trim();

  const steps = useMemo<Step[]>(() => {
    const raw = t.raw('steps');
    if (!Array.isArray(raw)) return [];

    const normalized: Step[] = [];

    raw.forEach((entry, index) => {
      if (!entry || typeof entry !== 'object') return;
      const record = entry as Record<string, unknown>;
      const title = typeof record.title === 'string' ? record.title : null;
      const body = typeof record.body === 'string' ? record.body : null;
      if (!title || !body) return;

      const id = typeof record.id === 'string' && record.id.length > 0 ? record.id : `step-${index + 1}`;
      const illustrationLabel = typeof record.illustrationLabel === 'string' ? record.illustrationLabel : undefined;

      let link: Step['link'];
      const linkRecord = record.link && typeof record.link === 'object' ? (record.link as Record<string, unknown>) : null;
      const linkLabel =
        typeof record.linkLabel === 'string'
          ? record.linkLabel
          : linkRecord && typeof linkRecord.label === 'string'
            ? (linkRecord.label as string)
            : undefined;
      const linkHrefRaw =
        typeof record.linkHref === 'string'
          ? record.linkHref
          : linkRecord && typeof linkRecord.href === 'string'
            ? (linkRecord.href as string)
            : undefined;
      const resolvedHref = resolveLocaleHref(locale, linkHrefRaw);
      if (linkLabel && resolvedHref) {
        link = { label: linkLabel, href: resolvedHref };
      }

      normalized.push({
        id,
        title,
        body,
        illustrationLabel,
        link,
      });
    });

    return normalized;
  }, [locale, t]);

  return (
    <section
      id="how"
      className={cn(layout.section, 'bg-bg')}
      aria-labelledby="how-it-works-heading"
      data-testid="landing-how-it-works"
    >
      <div className={cn(layout.container, layout.grid, 'items-start gap-y-xl')}>
        <div className="md:col-span-5 lg:col-span-4 flex flex-col gap-sm">
          <h2 id="how-it-works-heading" className={cn(text.heading, 'text-balance')}>
            {t('title')}
          </h2>
          {subtitle ? <p className={cn(text.subheading, 'max-w-prose')}>{subtitle}</p> : null}
        </div>
        <div className="md:col-span-12">
          <ol className="grid list-none gap-lg sm:grid-cols-2 xl:grid-cols-3">
            {steps.map((step, index) => {
              const headingId = `how-step-${step.id}-title`;
              return (
                <li key={step.id} className="h-full">
                  <Card
                    className={cn(
                      'flex h-full flex-col gap-md p-lg transition-all duration-700 ease-out',
                      isAnimated ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'
                    )}
                    style={{ transitionDelay: prefersReducedMotion ? undefined : `${index * 80}ms` }}
                    aria-labelledby={headingId}
                  >
                    <div
                      aria-hidden
                      className="relative flex w-full items-center justify-center overflow-hidden rounded-xl border border-border bg-bg"
                      style={{ aspectRatio: '4 / 3' }}
                    >
                      <div className="absolute inset-0 bg-gradient-to-br from-border/40 via-transparent to-border/20" />
                      <div className="relative flex h-16 w-16 items-center justify-center rounded-full border border-dashed border-border text-label text-text-muted">
                        {String(index + 1).padStart(2, '0')}
                      </div>
                    </div>
                    {step.illustrationLabel ? <span className="sr-only">{step.illustrationLabel}</span> : null}
                    <div className="flex flex-col gap-sm">
                      <h3 id={headingId} className="text-h3 text-text">
                        {step.title}
                      </h3>
                      <p className={cn(text.bodyMuted, 'text-balance')}>{step.body}</p>
                      {step.link ? (
                        <Button
                          as="a"
                          variant="secondary"
                          size="sm"
                          href={step.link.href}
                          className="w-fit"
                        >
                          {step.link.label}
                        </Button>
                      ) : null}
                    </div>
                  </Card>
                </li>
              );
            })}
          </ol>
        </div>
      </div>
    </section>
  );
}
