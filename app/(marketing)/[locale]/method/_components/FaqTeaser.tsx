'use client';

import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { cn, layout, text } from '@/app/(site)/_lib/ui';
import { useMethodExperience } from './MethodExperienceProvider';

type FaqTeaserProps = {
  locale: string;
};

export default function FaqTeaser({ locale }: FaqTeaserProps) {
  const t = useTranslations('method.faqTeaser');
  const { registerCtaInteraction } = useMethodExperience();

  const faqLinks = [
    { href: `/${locale}/waitlist#onboarding`, label: t('linkOnboarding') },
    { href: `/${locale}/waitlist#guarantee`, label: t('linkGuarantee') },
    { href: `/${locale}/waitlist#privacy`, label: t('linkPrivacy') },
  ];

  return (
    <section id="method-faq-teaser" className={cn(layout.section, 'bg-bg')} aria-labelledby="method-faq-title">
      <div className={cn(layout.container, 'flex flex-col gap-lg')}>
        <div className="max-w-3xl">
          <h2 id="method-faq-title" className={cn(text.heading, 'text-balance')}>
            {t('title')}
          </h2>
          <p className={cn(text.body, 'mt-2 text-text-muted')}>{t('subtitle')}</p>
        </div>
        <ul className="grid gap-md md:grid-cols-3" role="list">
          {faqLinks.map(({ href, label }) => (
            <li key={href} className={cn(layout.card, 'px-gutter py-md text-left text-body text-text')}>
              <Link href={href} className="text-label text-brand-primary underline decoration-2 underline-offset-4">
                {label}
              </Link>
            </li>
          ))}
        </ul>
        <div>
          <Link
            href={`/${locale}/waitlist#faq`}
            className="text-label text-brand-primary underline decoration-2 underline-offset-4"
            onClick={() => registerCtaInteraction('faq_teaser')}
          >
            {t('cta')}
          </Link>
        </div>
      </div>
    </section>
  );
}
