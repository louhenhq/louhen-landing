const schema = {
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': 'Organization',
      'name': 'Louhen',
      'url': 'https://louhen-app.com',
      'sameAs': [],
    },
    {
      '@type': 'WebSite',
      'name': 'Louhen',
      'url': 'https://louhen-app.com',
      'potentialAction': {
        '@type': 'SearchAction',
        'target': 'https://louhen-app.com/search?q={search_term_string}',
        'query-input': 'required name=search_term_string',
      },
    },
    {
      '@type': 'FAQPage',
      'mainEntity': [
        {
          '@type': 'Question',
          'name': 'How does Louhen recommend shoes?',
          'acceptedAnswer': {
            '@type': 'Answer',
            'text': 'Louhen combines your child\'s foot profile with podiatrist-informed fit data to show shoes that match.',
          },
        },
        {
          '@type': 'Question',
          'name': 'Who reviews the fit guidance?',
          'acceptedAnswer': {
            '@type': 'Answer',
            'text': 'Practising podiatrists help us refine the fit logic so healthy development stays central.',
          },
        },
        {
          '@type': 'Question',
          'name': 'How is family data handled?',
          'acceptedAnswer': {
            '@type': 'Answer',
            'text': 'Parents stay in control of their profiles and Louhen never sells personal data.',
          },
        },
      ],
    },
  ],
};

export default function TrustSchema() {
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }} />;
}
