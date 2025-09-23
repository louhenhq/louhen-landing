import Link from 'next/link';
import { getTranslations } from 'next-intl/server';

export default async function GuidesAliasEN() {
  const t = await getTranslations('guides');

  const items = [
    { slug: 'healthy-feet', title: t('topics.healthyFeet.title'), summary: t('topics.healthyFeet.summary') },
    { slug: 'sizing', title: t('topics.sizing.title'), summary: t('topics.sizing.summary') },
    { slug: 'parenting', title: t('topics.parenting.title'), summary: t('topics.parenting.summary') },
  ];

  return (
    <section className="mx-auto max-w-5xl px-6 py-12">
      <h1 className="text-4xl font-semibold">{t('hero.title')}</h1>
      <p className="mt-2 text-neutral-600">{t('hero.subtitle')}</p>

      <div className="mt-8 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {items.map((item) => (
          <article key={item.slug} className="rounded-2xl border p-5">
            <h2 className="text-xl font-semibold">
              <Link href={`/guides/${item.slug}`}>{item.title}</Link>
            </h2>
            <p className="mt-2 text-sm text-neutral-600">{item.summary}</p>
              <div className="mt-4">
                <Link href={`/guides/${item.slug}`} className="underline">
                  {t('cta.readMore')}
                </Link>
              </div>
          </article>
        ))}
      </div>
    </section>
  );
}
