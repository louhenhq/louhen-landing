const BASE = (process.env.PREVIEW_BASE_URL || process.env.BASE_URL || 'http://localhost:4311').replace(/\/$/, '');
const OUTPUT_DIR = process.env.LIGHTHOUSE_OUTPUT_DIR || 'lighthouse-report';
const METHOD_PATHS = ['/en-de/method', '/de-de/method'];

const defaultUrls = METHOD_PATHS.map((path) => `${BASE}${path}`.replace(/\/$/, ''));

const overrideUrl = process.env.LHCI_URL?.trim();
const urls = overrideUrl && overrideUrl.length > 0 ? [overrideUrl.replace(/\/$/, '')] : defaultUrls;
module.exports = {
  ci: {
    collect: {
      url: urls,
      numberOfRuns: 1,
      settings: {
        formFactor: 'desktop',
        screenEmulation: { mobile: false, width: 1366, height: 768, deviceScaleRatio: 1, disabled: false },
        throttlingMethod: 'provided',
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
        'categories:performance': ['error', { minScore: 0.85 }],
        'categories:accessibility': ['error', { minScore: 0.95 }],
        'categories:seo': ['error', { minScore: 0.95 }],
        'categories:best-practices': ['error', { minScore: 0.95 }],
        'cumulative-layout-shift': ['error', { maxNumericValue: 0.01 }],
        'largest-contentful-paint': ['warn', { maxNumericValue: 2500 }],
      },
    },
  }
};
