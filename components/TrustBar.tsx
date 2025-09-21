'use client';

import { cn, layout, surfaces } from '@/app/(site)/_lib/ui';
import TrustLogoLink from '@/components/TrustLogoLink';
import { useTranslations } from 'next-intl';

const ITEMS: Array<{ label: string; href: string; logo: string }> = [
  { label: 'KidStyle Magazine', href: 'https://example.com/kidstyle', logo: '/press/press1.svg' },
  { label: 'ParentLab', href: 'https://example.com/parentlab', logo: '/press/press2.svg' },
  { label: 'FamilyFit Weekly', href: 'https://example.com/familyfit', logo: '/press/press3.svg' },
];

export default function TrustBar() {
  const t = useTranslations('trust.bar');

  return (
    <section className={cn(layout.section, surfaces.subtle)} aria-label={t('aria')}>
      <div className={cn(layout.container, 'flex flex-wrap items-center justify-center gap-6 md:justify-between')}>
        {ITEMS.map((item) => (
          <TrustLogoLink
            key={item.label}
            href={item.href}
            logoSrc={item.logo}
            label={item.label}
            ariaLabel={t('logoAria', { brand: item.label })}
          />
        ))}
      </div>
    </section>
  );
}
