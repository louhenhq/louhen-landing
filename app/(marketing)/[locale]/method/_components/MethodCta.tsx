'use client';

import { useTranslations } from 'next-intl';
import { cn, layout, text } from '@/app/(site)/_lib/ui';
import { Button } from '@/components/ui';
import type { SupportedLocale } from '@/next-intl.locales';
import { useMethodExperience } from './MethodExperienceProvider';
import { getHelpSizingPath } from '../getHelpSizingPath';

type MethodCtaProps = {
  locale: SupportedLocale;
};

export default function MethodCta({ locale }: MethodCtaProps) {
  const t = useTranslations('method.cta');
  const { registerCtaInteraction } = useMethodExperience();

  const toLocalizedHref = (href: string) => {
    if (!href) return href;
    if (/^https?:\/\//.test(href)) return href;
    if (href.startsWith(`/${locale}`)) return href;
    const normalized = href.startsWith('/') ? href : `/${href}`;
    return `/${locale}${normalized}`;
  };

  const primaryLabel = t('primary');
  const primaryHref = toLocalizedHref(t('waitlistHref'));
  const secondaryLabel = t('secondary', { defaultValue: '' }).trim();
  const secondaryHrefValue = t('secondaryHref', { defaultValue: '' }).trim();
  const hasSecondary = secondaryLabel.length > 0 && secondaryHrefValue.length > 0;
  const secondaryHref = hasSecondary ? toLocalizedHref(secondaryHrefValue) : null;
  const helpSizingPath = getHelpSizingPath(locale);
  const shouldRenderSecondary = Boolean(secondaryHref && helpSizingPath && secondaryHref === helpSizingPath);

  return (
    <section
      id="join-waitlist"
      className={cn(layout.section, 'bg-brand-primary/10')}
      aria-labelledby="method-cta-title"
      tabIndex={-1}
      data-testid="method-cta"
    >
      <div className={cn(layout.container, 'flex flex-col items-center gap-md text-center')}>
        <h2 id="method-cta-title" className={cn(text.heading, 'text-balance')}>
          {t('title')}
        </h2>
        <div className="flex flex-col items-center gap-sm">
          <Button
            as="a"
            href={primaryHref}
            aria-label={primaryLabel}
            prefetch={false}
            onClick={() => registerCtaInteraction()}
          >
            {primaryLabel}
          </Button>
          {shouldRenderSecondary && secondaryHref ? (
            <Button
              as="a"
              href={secondaryHref}
              variant="secondary"
              aria-label={secondaryLabel}
              prefetch={false}
            >
              {secondaryLabel}
            </Button>
          ) : null}
        </div>
      </div>
    </section>
  );
}
