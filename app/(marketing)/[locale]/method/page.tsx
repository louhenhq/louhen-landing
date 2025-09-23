import Header from '@/app/(site)/components/Header';
import Footer from '@/app/(site)/components/Footer';
import { layout } from '@/app/(site)/_lib/ui';
import { TechArticleJsonLd } from '@/components/SeoJsonLd';
import type { SupportedLocale } from '@/next-intl.locales';
import { headers } from 'next/headers';
import { getTranslations } from 'next-intl/server';
import MethodHero from './_components/MethodHero';
import Pillars from './_components/Pillars';
import HowItWorks from './_components/HowItWorks';
import TrustLayer from './_components/TrustLayer';
import MethodCta from './_components/MethodCta';
import { buildMethodTechArticleSchema } from './articleSchema';
import { InlineFaq } from '@/components/InlineFaq';
import { normalizeInlineFaqItems } from '@/lib/help/inlineFaq';

export const runtime = 'nodejs';

type MethodPageProps = {
  params: Promise<{ locale: SupportedLocale }>;
};

export default async function MethodPage({ params }: MethodPageProps) {
  const { locale } = await params;
  const headerStore = await headers();
  const nonce = headerStore.get('x-csp-nonce') ?? undefined;

  const t = await getTranslations({ locale, namespace: 'method' });
  const inlineTranslations = await getTranslations({ locale, namespace: 'help.inline' });

  const FALLBACK_SITE_URL = 'https://louhen-landing.vercel.app';
  const rawBaseUrl = process.env.APP_BASE_URL?.trim() || process.env.NEXT_PUBLIC_SITE_URL?.trim() || FALLBACK_SITE_URL;
  const baseUrl = rawBaseUrl.replace(/\/$/, '');
  const localizedPath = `/${locale}/method`;
  const articleUrl = `${baseUrl}${localizedPath}`;

  const pillarTitles = (() => {
    const raw = t.raw('pillars.items');
    if (!Array.isArray(raw)) return [] as string[];
    return raw
      .map((item) => (item && typeof item === 'object' ? (item as { title?: unknown }).title : undefined))
      .filter((value): value is string => typeof value === 'string' && value.trim().length > 0);
  })();

  const howTitles = (() => {
    const raw = t.raw('how.steps');
    if (!Array.isArray(raw)) return [] as string[];
    return raw
      .map((item) => (item && typeof item === 'object' ? (item as { title?: unknown }).title : undefined))
      .filter((value): value is string => typeof value === 'string' && value.trim().length > 0);
  })();

  const inlineFaqItems = (() => {
    const candidateKeys = ['pdp', 'method'] as const;
    for (const key of candidateKeys) {
      const items = normalizeInlineFaqItems(inlineTranslations.raw(key));
      if (items.length) {
        return items;
      }
    }
    return [];
  })();

  const homeLabel = locale === 'de' ? 'Startseite' : 'Home';
  const breadcrumbSchema = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      {
        '@type': 'ListItem',
        position: 1,
        name: homeLabel,
        item: `${baseUrl}/${locale}`,
      },
      {
        '@type': 'ListItem',
        position: 2,
        name: t('hero.title'),
        item: articleUrl,
      },
    ],
  };

  const schema = buildMethodTechArticleSchema({
    url: articleUrl,
    headline: t('hero.title'),
    description: t('seo.description'),
    locale,
    sections: [...pillarTitles, ...howTitles, t('trust.headline')],
    baseUrl,
    brandName: 'Louhen',
    image: `${baseUrl}/opengraph-image.png`,
    datePublished: '2025-01-15T00:00:00.000Z',
    dateModified: '2025-01-15T00:00:00.000Z',
  });

  return (
    <div className={layout.page}>
      <script
        type="application/ld+json"
        nonce={nonce}
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />
      <TechArticleJsonLd schema={schema} nonce={nonce} />
      <Header />
      <main id="main">
        <MethodHero />
        <Pillars />
        <HowItWorks />
        <TrustLayer />
        {inlineFaqItems.length ? (
          <section className={`${layout.container} py-2xl`}>
            <InlineFaq items={inlineFaqItems} variant="card" />
          </section>
        ) : null}
        <MethodCta locale={locale} />
      </main>
      <Footer />
    </div>
  );
}
