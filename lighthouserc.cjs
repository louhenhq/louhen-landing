const BASE = process.env.BASE_URL || 'http://localhost:3000';
module.exports = {
  ci: {
    collect: {
      url: [`${BASE}/en`],
      numberOfRuns: 1,
      settings: {
        formFactor: 'mobile',
        screenEmulation: { mobile: true, width: 360, height: 640, deviceScaleRatio: 2, disabled: false },
        onlyCategories: ['performance', 'accessibility', 'seo', 'best-practices']
      },
      startServerCommand: null,
    },
    assert: {
      assertions: {
        'categories:accessibility': ['warn', { minScore: 0.9 }],
        'categories:seo': ['warn', { minScore: 0.9 }],
        'cumulative-layout-shift': ['warn', { maxNumericValue: 0.01 }],
        'largest-contentful-paint': ['warn', { maxNumericValue: 2500 }],
      },
    },
    upload: { target: 'temporary-public-storage' }
  }
};