import Link from 'next/link';
import { getTranslations } from 'next-intl/server';

export default async function TopicHealthyFeet() {
  const [topicTranslations, articleTranslations] = await Promise.all([
    getTranslations('guides.topics.healthyFeet'),
    getTranslations('guides.articles.choosingFirst'),
  ]);

  return (
    <section className="mx-auto max-w-4xl px-6 py-12">
      <h1 className="text-3xl font-semibold">{topicTranslations('title')}</h1>
      <p className="mt-2 text-neutral-600">{topicTranslations('intro')}</p>

      <ul className="mt-6 list-disc space-y-2 pl-6">
        <li>
          <Link href="../articles/choosing-first-shoes" className="underline">
            {articleTranslations('title')}
          </Link>
        </li>
      </ul>
    </section>
  );
}
