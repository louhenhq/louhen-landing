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
  const { canonical, alternates } = await buildLocaleAlternates(normalized, '/privacy');

  return {
    title: { absolute: 'Privacy policy — Louhen' },
    description: 'Read how Louhen handles data, cookies, and consent across markets.',
    alternates,
    openGraph: {
      url: canonical,
      title: 'Privacy policy — Louhen',
      description: 'Understand how Louhen protects your data and consent preferences.',
      type: 'article',
    },
    twitter: {
      card: 'summary_large_image',
      title: 'Privacy policy — Louhen',
      description: 'Understand how Louhen protects your data and consent preferences.',
    },
  };
}

export default function PrivacyPage() {
  return (
    <main id="main" className="mx-auto max-w-3xl px-gutter py-3xl">
      <h1 className="text-3xl font-semibold text-text">Privacy</h1>
      <p className="mt-sm text-text-muted">This is a placeholder. Full policy coming soon.</p>
    </main>
  );
}
