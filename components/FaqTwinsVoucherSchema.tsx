'use client';

import { useMemo } from 'react';
import { useNonce } from '@/lib/csp/nonce-context';

const schema = {
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: [
    {
      '@type': 'Question',
      name: 'How does the Twins Welcome Voucher work?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Twin parents get 5% off every order in the Louhen app by applying the code TWINS5 at checkout.',
      },
    },
    {
      '@type': 'Question',
      name: 'Who can redeem the twins voucher?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'The voucher is reserved for parents or guardians of twins and stays available whenever they shop with Louhen.',
      },
    },
    {
      '@type': 'Question',
      name: 'Where do I add the voucher code?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Enter TWINS5 during in-app checkout to automatically apply the 5% savings on your order.',
      },
    },
    {
      '@type': 'Question',
      name: 'Can the voucher be combined with other offers?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'The Twins Welcome Voucher is non-stackable and cannot be combined with additional promotions or codes.',
      },
    },
    {
      '@type': 'Question',
      name: 'Does the twins voucher expire?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'The code TWINS5 is an always-on benefit for twin parents and does not have an expiry date.',
      },
    },
  ],
};

export default function FaqTwinsVoucherSchema() {
  const nonce = useNonce();
  const json = useMemo(() => JSON.stringify(schema), []);
  return <script type="application/ld+json" nonce={nonce ?? undefined} dangerouslySetInnerHTML={{ __html: json }} />;
}
