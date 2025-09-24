import type { Metadata } from 'next';
import { buildLocaleAlternates } from '@/lib/seo/alternates';
import { defaultLocale, normalizeLocale, type SupportedLocale } from '@/next-intl.locales';

export const runtime = 'nodejs';

type PageParams = {
  params: Promise<{ locale: SupportedLocale }>;
};

export async function generateMetadata({ params }: PageParams): Promise<Metadata> {
  const { locale } = await params;
  const normalized = normalizeLocale(locale) ?? defaultLocale;
  const { canonical, alternates } = await buildLocaleAlternates(normalized, '/imprint');

  return {
    title: { absolute: 'Imprint — Louhen' },
    description: 'Find Louhen’s registered address, contact details, and legal disclosures.',
    alternates,
    openGraph: {
      url: canonical,
      title: 'Imprint — Louhen',
      description: 'Find Louhen’s registered address, contact details, and legal disclosures.',
      type: 'article',
    },
    twitter: {
      card: 'summary_large_image',
      title: 'Imprint — Louhen',
      description: 'Find Louhen’s registered address, contact details, and legal disclosures.',
    },
  };
}

export default function ImprintPage() {
  return (
    <main id="main" className="mx-auto max-w-3xl px-gutter py-3xl">
      <h1 className="text-3xl font-semibold text-text">Imprint</h1>
      <p className="mt-sm text-text-muted">This is a placeholder. Company details will be listed here.</p>
    </main>
  );
}
