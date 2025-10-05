import Header from '@/app/(site)/components/Header';
import Footer from '@/app/(site)/components/Footer';
import { layout } from '@/app/(site)/_lib/ui';
import { TechArticleJsonLd } from '@/components/SeoJsonLd';
import { resolveBaseUrl } from '@/lib/seo/shared';
import { methodPath } from '@/lib/routing/methodPath';
import type { SupportedLocale } from '@/next-intl.locales';
import { headers } from 'next/headers';
import { getTranslations, unstable_setRequestLocale } from 'next-intl/server';
import MethodHero from './_components/MethodHero';
import Pillars from './_components/Pillars';
import HowItWorks from './_components/HowItWorks';
import TrustLayer from './_components/TrustLayer';
import MethodCta from './_components/MethodCta';
import { buildMethodTechArticleSchema } from './articleSchema';

export const runtime = 'nodejs';

type MethodPageProps = {
  params: Promise<{ locale: SupportedLocale }>;
};

export default async function MethodPage({ params }: MethodPageProps) {
  const { locale } = await params;
  unstable_setRequestLocale(locale);
  const headerStore = await headers();
  const nonce = headerStore.get('x-csp-nonce') ?? undefined;

  const t = await getTranslations({ locale, namespace: 'method' });

  const baseUrl = resolveBaseUrl();
  const localizedPath = methodPath(locale);
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
      <TechArticleJsonLd schema={schema} nonce={nonce} />
      <Header />
      <main id="main">
        <MethodHero />
        <Pillars />
        <HowItWorks />
        <TrustLayer />
        <MethodCta locale={locale} />
      </main>
      <Footer />
    </div>
  );
}
