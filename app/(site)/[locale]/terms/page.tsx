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
  const { canonical, alternates } = await buildLocaleAlternates(normalized, '/terms');

  return {
    title: { absolute: 'Terms of use — Louhen' },
    description: 'Review the Louhen terms that govern your account, services, and waitlist participation.',
    alternates,
    openGraph: {
      url: canonical,
      title: 'Terms of use — Louhen',
      description: 'Review the Louhen terms that govern your account, services, and waitlist participation.',
      type: 'article',
    },
    twitter: {
      card: 'summary_large_image',
      title: 'Terms of use — Louhen',
      description: 'Review the Louhen terms that govern your account, services, and waitlist participation.',
    },
  };
}

export default function TermsPage() {
  return (
    <main id="main" className="mx-auto max-w-3xl px-gutter py-3xl">
      <h1 className="text-3xl font-semibold text-text">Terms</h1>
      <p className="mt-sm text-text-muted">This is a placeholder. Full terms will be published soon.</p>
    </main>
  );
}
