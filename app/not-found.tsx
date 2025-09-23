import Link from 'next/link';
import { headers } from 'next/headers';
import { getLocale, getTranslations } from 'next-intl/server';

import { resolveBaseUrl } from '@/lib/seo/baseUrl';
import { defaultLocale, type SupportedLocale } from '@/next-intl.locales';

export default async function NotFound() {
  const locale = (await getLocale()) as SupportedLocale;
  const [helpTranslations, guidesTranslations, baseUrl] = await Promise.all([
    getTranslations({ locale, namespace: 'help' }),
    getTranslations({ locale, namespace: 'guides.hero' }),
    resolveBaseUrl(),
  ]);
  const headerList = await headers();
  const nonce = headerList.get('x-csp-nonce') ?? undefined;

  const isDefault = locale === defaultLocale;
  const homeLabel = locale === 'de' ? 'Startseite' : 'Home';
  const heading = locale === 'de' ? 'Seite nicht gefunden' : 'Page not found';
  const body =
    locale === 'de'
      ? 'Wir konnten die angeforderte Adresse nicht finden. Nutze einen der folgenden Links, um fortzufahren.'
      : 'We couldn’t find the address you requested. Use one of the following links to continue.';
  const helpLabel = helpTranslations('navLabel');
  const guidesLabel = guidesTranslations('title');

  const homeHref = isDefault ? '/' : `/${locale}`;
  const helpHref = isDefault ? '/help' : `/${locale}/help`;
  const guidesHref = isDefault ? '/guides' : `/${locale}/guides`;

  const breadcrumbJsonLd = {
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
        name: '404',
        item: `${baseUrl}${isDefault ? '/404' : `/${locale}/404`}`,
      },
    ],
  };

  return (
    <>
      <script
        type="application/ld+json"
        nonce={nonce}
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />
      <main className="mx-auto flex min-h-screen max-w-3xl flex-col items-start justify-center gap-6 px-6 py-16">
        <div>
          <p className="text-sm font-medium text-slate-500">404</p>
          <h1 className="mt-2 text-3xl font-semibold text-slate-900">{heading}</h1>
          <p className="mt-3 text-base text-slate-600">{body}</p>
        </div>
        <div className="flex flex-wrap gap-4 text-sm font-medium">
          <Link className="text-brand-primary hover:underline" href={homeHref} prefetch={false}>
            {homeLabel}
          </Link>
          <Link className="text-brand-primary hover:underline" href={helpHref} prefetch={false}>
            {helpLabel}
          </Link>
          <Link className="text-brand-primary hover:underline" href={guidesHref} prefetch={false}>
            {guidesLabel}
          </Link>
        </div>
      </main>
    </>
  );
}
