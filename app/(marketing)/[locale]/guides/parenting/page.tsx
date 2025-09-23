import { getTranslations } from 'next-intl/server';

export default async function TopicParenting() {
  const t = await getTranslations('guides.topics.parenting');

  return (
    <section className="mx-auto max-w-4xl px-6 py-12">
      <h1 className="text-3xl font-semibold">{t('title')}</h1>
      <p className="mt-2 text-neutral-600">{t('intro')}</p>
    </section>
  );
}
