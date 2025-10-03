import Header from '@/app/(site)/components/Header';
import Footer from '@/app/(site)/components/Footer';
import { layout } from '@/app/(site)/_lib/ui';
import { BreadcrumbJsonLd, TechArticleJsonLd } from '@/components/SeoJsonLd';
import type { SupportedLocale } from '@/next-intl.locales';
import { headers } from 'next/headers';
import { getTranslations } from 'next-intl/server';
import { readWaitlistSession } from '@/lib/waitlist/session';
import { getPreOnboardingDraft } from '@/lib/firestore/waitlist';
import { METHOD_EXIT_NUDGE_ENABLED, METHOD_STICKY_CTA_ENABLED } from '@/lib/flags';
import MethodHero from './_components/MethodHero';
import Pillars from './_components/Pillars';
import HowItWorks from './_components/HowItWorks';
import TrustLayer from './_components/TrustLayer';
import MethodCta from './_components/MethodCta';
import Testimonial from './_components/Testimonial';
import FounderNote from './_components/FounderNote';
import FaqTeaser from './_components/FaqTeaser';
import StickyCta from './_components/StickyCta';
import ExitNudge from './_components/ExitNudge';
import { MethodExperienceProvider } from './_components/MethodExperienceProvider';
import SkipToCtaLink from './_components/SkipToCtaLink';
import { buildMethodTechArticleSchema } from './articleSchema';
import { buildMethodOgImageUrl } from './ogImage';
import {
  buildCanonicalPath,
  buildCanonicalUrl,
  resolveSiteBaseUrl,
} from '@/lib/i18n/metadata';

export const runtime = 'nodejs';

type MethodPageProps = {
  params: Promise<{ locale: SupportedLocale }>;
};

export default async function MethodPage({ params }: MethodPageProps) {
  const { locale } = await params;
  const headerStore = await headers();
  const nonce = headerStore.get('x-csp-nonce') ?? undefined;

  const t = await getTranslations({ locale, namespace: 'method' });

  const baseUrl = resolveSiteBaseUrl();
  const localizedPath = buildCanonicalPath(locale, '/method/');
  const articleUrl = buildCanonicalUrl(locale, '/method/');

  const pillarTitles = [
    t('pillars.data.title'),
    t('pillars.trust.title'),
    t('pillars.discovery.title'),
  ].filter((value) => value.trim().length > 0);

  const stepTitles = (() => {
    const raw = t.raw('steps.items');
    if (!Array.isArray(raw)) return [] as string[];
    return raw
      .map((item) => (item && typeof item === 'object' ? (item as { title?: unknown }).title : undefined))
      .filter((value): value is string => typeof value === 'string' && value.trim().length > 0);
  })();

  const metaTitle = t('meta.title');
  const metaDescription = t('meta.description');
  const ogImageUrl = buildMethodOgImageUrl(baseUrl, locale, metaTitle, metaDescription);

  const schema = buildMethodTechArticleSchema({
    url: articleUrl,
    headline: t('hero.title'),
    description: metaDescription,
    locale,
    sections: [...pillarTitles, ...stepTitles, t('trust.headline'), t('faqTeaser.title')],
    baseUrl,
    brandName: 'Louhen',
    image: ogImageUrl,
    datePublished: '2025-01-15T00:00:00.000Z',
    dateModified: '2025-01-15T00:00:00.000Z',
  });

  const sessionId = await readWaitlistSession();
  const profileDraft = sessionId ? await getPreOnboardingDraft(sessionId) : null;
  const primaryChildName = profileDraft?.children?.[0]?.name?.trim() || null;
  const variantPersonalized = Boolean(primaryChildName);
  const route = localizedPath;

  return (
    <div className={layout.page}>
      <SkipToCtaLink
        targetId="join-waitlist"
        className="sr-only focus:not-sr-only focus:absolute focus:left-sm focus:top-sm focus:z-50 focus:rounded-md focus:bg-brand-primary focus:px-sm focus:py-4 focus:text-brand-onPrimary focus:outline focus:outline-2 focus:outline-offset-2 focus:outline-border-focus"
      >
        {t('a11y.skipToCta')}
      </SkipToCtaLink>
      <TechArticleJsonLd schema={schema} nonce={nonce} />
      <BreadcrumbJsonLd
        nonce={nonce}
        items={[
          { name: 'Home', item: baseUrl },
          { name: t('hero.title'), item: articleUrl },
        ]}
      />
      <Header />
      <MethodExperienceProvider locale={locale} route={route} variantPersonalized={variantPersonalized}>
        <main id="main">
          <MethodHero locale={locale} childName={primaryChildName} />
          <Pillars />
          <HowItWorks childName={primaryChildName} />
          <TrustLayer />
          <Testimonial />
          <FounderNote />
          <FaqTeaser locale={locale} />
          <MethodCta locale={locale} />
        </main>
        {METHOD_STICKY_CTA_ENABLED ? <StickyCta locale={locale} /> : null}
        {METHOD_EXIT_NUDGE_ENABLED ? <ExitNudge faqSelector="#method-faq-teaser" /> : null}
      </MethodExperienceProvider>
      <Footer />
    </div>
  );
}
