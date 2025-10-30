import type { ReactNode } from 'react';
import { MethodExperienceProvider } from '@/components/features/method/MethodExperienceProvider';
import { methodPath } from '@lib/shared/routing/method-path';
import type { SupportedLocale } from '@/next-intl.locales';

export const runtime = 'nodejs';

type MethodLayoutProps = {
  children: ReactNode;
  params: Promise<{ locale: SupportedLocale }>;
};

export default async function MethodLayout({ children, params }: MethodLayoutProps) {
  const { locale } = await params;
  const route = methodPath(locale);

  return (
    <MethodExperienceProvider
      locale={locale}
      route={route}
      variantPersonalized={false}
      incentiveCopy={null}
    >
      {children}
    </MethodExperienceProvider>
  );
}
