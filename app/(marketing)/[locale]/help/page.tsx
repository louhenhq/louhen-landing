import { headers } from 'next/headers';
import { getLocale, getTranslations } from 'next-intl/server';

import { FaqList, type FaqEntry } from '@/components/FaqList';
import { resolveBaseUrl } from '@/lib/seo/baseUrl';

export default async function HelpHub() {
  const [locale, helpT, headerList, baseUrl] = await Promise.all([
    getLocale(),
    getTranslations('help'),
    headers(),
    resolveBaseUrl(),
  ]);

  const nonce = headerList.get('x-csp-nonce') ?? undefined;

  const rawFaqs = helpT.raw('faqs');
  const faqs: FaqEntry[] = Array.isArray(rawFaqs)
    ? rawFaqs
        .map((item) => (item && typeof item === 'object' ? item : null))
        .filter((item): item is { q?: unknown; a?: unknown } => item !== null)
        .map((item) => ({
          q: typeof item.q === 'string' ? item.q : '',
          a: typeof item.a === 'string' ? item.a : '',
        }))
        .filter((item) => item.q && item.a)
    : [];

  const helpUrl = `${baseUrl}/${locale}/help`;
  const breadcrumbSchema = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      {
        '@type': 'ListItem',
        position: 1,
        name: 'Home',
        item: `${baseUrl}/${locale}`,
      },
      {
        '@type': 'ListItem',
        position: 2,
        name: helpT('hero.title'),
        item: helpUrl,
      },
    ],
  };

  const faqSchema = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqs.map((faq) => ({
      '@type': 'Question',
      name: faq.q,
      acceptedAnswer: {
        '@type': 'Answer',
        text: faq.a,
      },
    })),
    inLanguage: locale,
    url: helpUrl,
  };

  return (
    <>
      <script
        type="application/ld+json"
        nonce={nonce}
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />
      <script
        type="application/ld+json"
        nonce={nonce}
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
      />
      <section className="mx-auto max-w-4xl px-6 py-12">
        <h1 className="text-4xl font-semibold text-slate-900">{helpT('hero.title')}</h1>
        <p className="mt-2 text-lg text-slate-600">{helpT('hero.subtitle')}</p>

        <div className="mt-8">
          <FaqList faqs={faqs} />
        </div>
      </section>
    </>
  );
}
