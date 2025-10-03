const BASE = (process.env.PREVIEW_BASE_URL || process.env.BASE_URL || 'http://localhost:4311').replace(/\/$/, '');
const OUTPUT_DIR = process.env.LIGHTHOUSE_OUTPUT_DIR || 'lighthouse-report';
const DEFAULT_TARGET = `${BASE}/en-de/method`;
const TARGET_URL = (process.env.LHCI_URL || DEFAULT_TARGET).replace(/\/$/, '');
module.exports = {
  ci: {
    collect: {
      url: [TARGET_URL],
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
        'categories:performance': ['error', { minScore: 0.9 }],
        'categories:accessibility': ['warn', { minScore: 0.98 }],
        'categories:seo': ['error', { minScore: 0.9 }],
        'categories:best-practices': ['warn', { minScore: 0.9 }],
        'cumulative-layout-shift': ['error', { maxNumericValue: 0.01 }],
        'largest-contentful-paint': ['warn', { maxNumericValue: 2500 }],
      },
    },
  }
};
