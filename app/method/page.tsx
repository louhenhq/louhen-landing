// DEPRECATED: This legacy Method page is kept temporarily to support the
// /method redirect while the localized route migrates. Remove after the
// 301 redirect and localized implementation are fully deployed.

import type { Metadata } from 'next'
import { headers } from 'next/headers'
import { BreadcrumbJsonLd } from '@/components/SeoJsonLd'
import { DEFAULT_LOCALE } from '@/lib/i18n/locales'
import {
  buildAlternateLanguageMap,
  buildCanonicalPath,
  buildCanonicalUrl,
  resolveSiteBaseUrl,
} from '@/lib/i18n/metadata'

const trustPillars = [
  {
    title: 'Transparent fit data',
    description:
      'Families see the measurements that drive our recommendations, so it is clear how each shoe will feel before it arrives.',
  },
  {
    title: 'Privacy first scanning',
    description:
      'Images are processed on-device and converted to fit profiles — we never store raw photos of your child\'s feet.',
  },
  {
    title: 'Verified partners',
    description:
      'We work only with brands and retailers that commit to consistent sizing and responsible manufacturing.',
  },
];

const dimensionHighlights = [
  'Length, width and instep captured in under 30 seconds',
  '3D depth map calibrated for growing feet',
  'Fit profile updates automatically as your child grows',
]

const baseUrl = resolveSiteBaseUrl()
const methodPath = buildCanonicalPath(DEFAULT_LOCALE.value, '/method/')
const methodUrl = buildCanonicalUrl(DEFAULT_LOCALE.value, '/method/')
const methodTitle = 'Our Method'
const methodDescription = 'See how Louhen captures precise shoe dimensions and builds trust into every recommendation.'

export function generateMetadata(): Metadata {
  const languages = buildAlternateLanguageMap('/method/');

  return {
    title: methodTitle,
    description: methodDescription,
    alternates: {
      canonical: methodPath,
      languages,
    },
    openGraph: {
      title: `${methodTitle} — Louhen`,
      description: methodDescription,
      url: methodUrl,
      images: [
        {
          url: `${baseUrl}/opengraph-image.png`,
          width: 1200,
          height: 630,
          alt: methodTitle,
        },
      ],
    },
    twitter: {
      title: `${methodTitle} — Louhen`,
      description: methodDescription,
      images: [`${baseUrl}/opengraph-image.png`],
    },
  }
}

export default async function MethodPage() {
  const nonce = (await headers()).get('x-csp-nonce') ?? undefined;
  return (
    <>
      <BreadcrumbJsonLd
        items={[
          { name: 'Home', item: baseUrl },
          { name: 'Our Method', item: methodUrl },
        ]}
        nonce={nonce}
      />
      <main className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 py-16">
        <h1 className="text-display-lg text-text">Our Method</h1>
        <p className="mt-4 text-body text-text-muted">
          Louhen blends computer vision with human insight to make children&apos;s shoe shopping effortless. Here is how we capture
          the data, build trust, and keep families in the loop.
        </p>

        <section className="mt-12">
          <h2 className="text-h3 text-text">Capturing precise shoe dimensions</h2>
          <p className="mt-4 text-body text-text-muted">
            Our guided scan uses any smartphone camera. A quick sweep around the foot generates a 3D model that records the
            measurements that matter most for a great fit, even as feet grow between seasons.
          </p>
          <ul className="mt-6 grid gap-4 sm:grid-cols-2">
            {dimensionHighlights.map((highlight) => (
              <li key={highlight} className="rounded-xl border border-border bg-bg-card p-5 shadow-sm">
                <span className="text-body text-text">{highlight}</span>
              </li>
            ))}
          </ul>
        </section>

        <section className="mt-16">
          <h2 className="text-h3 text-text">Trust pillars</h2>
          <div className="mt-6 grid gap-6 sm:grid-cols-2">
            {trustPillars.map(({ title, description }) => (
              <article key={title} className="rounded-2xl border border-border bg-bg p-6">
                <h3 className="text-h3 text-text">{title}</h3>
                <p className="mt-3 text-body text-text-muted">{description}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="mt-16">
          <h2 className="text-h3 text-text">Why it matters</h2>
          <p className="mt-4 text-body text-text-muted">
            Shoes that do not fit cause blisters, wasted budgets, and avoidable returns. Accurate sizing data means fewer
            surprises and more confident kids exploring the world in comfort.
          </p>
          <p className="mt-4 text-body text-text-muted">
            By keeping families, retailers, and designers aligned on true fit, Louhen helps every pair feel like it was made
            for your child.
          </p>
        </section>
      </main>
    </>
  )
}
