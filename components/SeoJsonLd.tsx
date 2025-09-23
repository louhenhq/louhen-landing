import * as React from 'react';

type JsonLdProps = {
  schema: Record<string, unknown>;
  nonce?: string;
};

function JsonLd({ schema, nonce }: JsonLdProps) {
  return (
    <script
      type="application/ld+json"
      nonce={nonce}
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}

type OrganizationJsonLdProps = {
  name: string;
  url: string;
  logo?: string;
  sameAs?: string[];
};

export function OrganizationJsonLd({ name, url, logo, sameAs, nonce }: OrganizationJsonLdProps & { nonce?: string }) {
  return (
    <JsonLd
      schema={{
        '@context': 'https://schema.org',
        '@type': 'Organization',
        name,
        url,
        logo,
        sameAs: sameAs?.length ? sameAs : undefined,
      }}
      nonce={nonce}
    />
  );
}

type WebSiteJsonLdProps = {
  url: string;
  name: string;
  searchUrl?: string;
};

export function WebSiteJsonLd({ url, name, searchUrl, nonce }: WebSiteJsonLdProps & { nonce?: string }) {
  return (
    <JsonLd
      schema={{
        '@context': 'https://schema.org',
        '@type': 'WebSite',
        url,
        name,
        potentialAction: searchUrl
          ? {
              '@type': 'SearchAction',
              target: searchUrl,
              'query-input': 'required name=search_term_string',
            }
          : undefined,
      }}
      nonce={nonce}
    />
  );
}

type BreadcrumbItem = {
  name: string;
  item: string;
};

type BreadcrumbJsonLdProps = {
  items: BreadcrumbItem[];
};

export function BreadcrumbJsonLd({ items, nonce }: BreadcrumbJsonLdProps & { nonce?: string }) {
  return (
    <JsonLd
      schema={{
        '@context': 'https://schema.org',
        '@type': 'BreadcrumbList',
        itemListElement: items.map((breadcrumb, index) => ({
          '@type': 'ListItem',
          position: index + 1,
          name: breadcrumb.name,
          item: breadcrumb.item,
        })),
      }}
      nonce={nonce}
    />
  );
}
