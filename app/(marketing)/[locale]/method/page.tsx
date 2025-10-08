import type { Metadata } from 'next';
import { Footer } from '@components/features/footer';
import { Header } from '@components/features/header-nav';
import { layout } from '@app/(site)/_lib/ui';
import { BreadcrumbJsonLd, TechArticleJsonLd } from '@components/SeoJsonLd';
import MethodHero from '@components/features/method/MethodHero';
import MethodCta from '@components/features/method/MethodCta';
import MethodTrustLayer from '@components/features/method/MethodTrustLayer';
import MethodHowItWorks from '@components/blocks/MethodHowItWorks';
import MethodPillars from '@components/blocks/MethodPillars';
import { getHeaderUserState } from '@lib/auth/userState.server';
import { localeHomePath } from '@lib/shared/routing/legal-path';
import { methodPath } from '@lib/shared/routing/method-path';
import { resolveBaseUrl } from '@lib/seo/shared';
import { buildMethodTechArticleSchema } from '@lib/shared/method/article-schema';
import { buildMethodMetadata } from '@lib/shared/seo/method-metadata';
import type { SupportedLocale } from '@/next-intl.locales';
import { headers } from 'next/headers';
import { getTranslations, unstable_setRequestLocale } from 'next-intl/server';

export const runtime = 'nodejs';

type MethodPageProps = {
  params: Promise<{ locale: SupportedLocale }>;
};

export async function generateMetadata({ params }: MethodPageProps): Promise<Metadata> {
  const { locale } = await params;
  return buildMethodMetadata({ locale });
}

export default async function MethodPage({ params }: MethodPageProps) {
  const { locale } = await params;
  unstable_setRequestLocale(locale);
  const headerStore = await headers();
  const nonce = headerStore.get('x-csp-nonce') ?? undefined;
  const headerUserState = await getHeaderUserState();

  const t = await getTranslations({ locale, namespace: 'method' });

  let homeLabel = locale.startsWith('de') ? 'Startseite' : 'Home';
  try {
    const common = await getTranslations({ locale, namespace: 'common' });
    homeLabel = common('breadcrumb.home');
  } catch {
    // fall back to locale heuristic defined above
  }

  const baseUrl = resolveBaseUrl();
  const localizedPath = methodPath(locale);
  const articleUrl = `${baseUrl}${localizedPath}`;
  const homeUrl = `${baseUrl}${localeHomePath(locale)}`;

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
      <BreadcrumbJsonLd
        nonce={nonce}
        items={[
          { name: homeLabel, item: homeUrl },
          { name: t('seo.title'), item: articleUrl },
        ]}
      />
      <TechArticleJsonLd schema={schema} nonce={nonce} />
      <Header userState={headerUserState} />
      <main id="main-content">
        <MethodHero />
        <MethodPillars />
        <MethodHowItWorks />
        <MethodTrustLayer />
        <MethodCta locale={locale} />
      </main>
      <Footer />
    </div>
  );
}
