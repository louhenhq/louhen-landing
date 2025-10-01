const BASE = (process.env.PREVIEW_BASE_URL || process.env.BASE_URL || 'http://localhost:4311').replace(/\/$/, '');
const DEFAULT_LOCALE = process.env.DEFAULT_LOCALE || 'en';
const METHOD_URL = `${BASE}/${DEFAULT_LOCALE}/method/`;
const OUTPUT_DIR = process.env.LIGHTHOUSE_OUTPUT_DIR || 'lighthouse-report';
module.exports = {
  ci: {
    collect: {
      url: [`${BASE}/`, METHOD_URL],
      numberOfRuns: 1,
      settings: {
        formFactor: 'mobile',
        screenEmulation: { mobile: true, width: 360, height: 640, deviceScaleRatio: 2, disabled: false },
        throttleMethod: 'devtools',
        throttlingMethod: 'devtools',
        onlyCategories: ['performance', 'accessibility', 'seo', 'best-practices']
      },
      chromeFlags: ['--disable-dev-shm-usage', '--allow-insecure-localhost'],
      startServerCommand: null,
    },
    upload: {
      target: 'filesystem',
      outputDir: OUTPUT_DIR,
      formats: ['json', 'html'],
    },
    assert: {
      assertions: {
        'categories:performance': ['error', { minScore: 0.9 }],
        'categories:accessibility': ['error', { minScore: 0.9 }],
        'categories:seo': ['error', { minScore: 0.95 }],
        'categories:best-practices': ['warn', { minScore: 0.9 }],
        'cumulative-layout-shift': ['error', { maxNumericValue: 0.01 }],
        'largest-contentful-paint': ['warn', { maxNumericValue: 2500 }],
      },
    },
  }
};
