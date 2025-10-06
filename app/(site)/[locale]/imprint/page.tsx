import type { SupportedLocale } from '@/next-intl.locales';
import { unstable_setRequestLocale } from 'next-intl/server';

export const runtime = 'nodejs';

type ImprintPageProps = {
  params: { locale: SupportedLocale };
};

export default function ImprintPage({ params }: ImprintPageProps) {
  unstable_setRequestLocale(params.locale);
  return (
    <main id="main-content" className="mx-auto max-w-3xl px-gutter py-3xl">
      <h1 className="text-3xl font-semibold text-text">Imprint</h1>
      <p className="mt-sm text-text-muted">This is a placeholder. Company details will be listed here.</p>
    </main>
  );
}
