import type { Metadata } from 'next';
import MethodPageImpl from '@/app/(marketing)/[locale]/method/page';
import { generateMetadata as generateLocalizedMetadata } from '@/app/(marketing)/[locale]/method/metadata';
import { defaultLocale } from '@/next-intl.locales';

export const runtime = 'nodejs';

export async function generateMetadata(): Promise<Metadata> {
  return generateLocalizedMetadata({
    params: Promise.resolve({ locale: defaultLocale }),
  });
}

export default function MethodPage() {
  return <MethodPageImpl params={Promise.resolve({ locale: defaultLocale })} />;
}
