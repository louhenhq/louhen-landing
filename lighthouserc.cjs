const BASE = process.env.BASE_URL || 'http://localhost:4311';
module.exports = {
  ci: {
    collect: {
      url: [`${BASE}/`, `${BASE}/method`],
      numberOfRuns: 1,
      settings: {
        formFactor: 'mobile',
        screenEmulation: { mobile: true, width: 360, height: 640, deviceScaleRatio: 2, disabled: false },
        throttleMethod: 'devtools',
        throttlingMethod: 'devtools',
        onlyCategories: ['performance', 'accessibility', 'seo', 'best-practices']
      },
      startServerCommand: null,
    },
    assert: {
      assertions: {
        'categories:accessibility': ['error', { minScore: 0.9 }],
        'categories:seo': ['error', { minScore: 0.9 }],
        'cumulative-layout-shift': ['error', { maxNumericValue: 0.01 }],
        'largest-contentful-paint': ['warn', { maxNumericValue: 2500 }],
      },
    },
    upload: { target: 'temporary-public-storage' }
  }
};
