import type { Metadata } from 'next';
import MethodPageImpl from '@app/(marketing)/[locale]/method/page';
import { buildMethodMetadata } from '@lib/shared/seo/method-metadata';
import { defaultLocale } from '@/next-intl.locales';
import { unstable_setRequestLocale } from 'next-intl/server';

export const runtime = 'nodejs';

export async function generateMetadata(): Promise<Metadata> {
  return buildMethodMetadata({ locale: defaultLocale });
}

export default function MethodPage() {
  unstable_setRequestLocale(defaultLocale);
  return <MethodPageImpl params={Promise.resolve({ locale: defaultLocale })} />;
}
