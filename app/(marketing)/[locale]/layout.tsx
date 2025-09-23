import type { CSSProperties } from 'react';
import LocaleLayout, { generateStaticParams } from '@/app/(site)/[locale]/layout';

type LocaleLayoutProps = Parameters<typeof LocaleLayout>[0];

const marketingBackground: CSSProperties = {
  backgroundColor: 'var(--semantic-color-bg-page)',
  backgroundImage:
    'radial-gradient(120% 80% at 50% 0%, color-mix(in srgb, var(--semantic-color-bg-page) 96%, var(--color-brand-teal) 4%), transparent 70%)',
  backgroundRepeat: 'no-repeat',
};

export { generateStaticParams };

export default async function MarketingLayout({ children, params }: LocaleLayoutProps) {
  return (
    <LocaleLayout params={params}>
      <div className="min-h-screen" style={marketingBackground}>
        {children}
      </div>
    </LocaleLayout>
  );
}
