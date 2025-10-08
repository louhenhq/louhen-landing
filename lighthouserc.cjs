const { locales, defaultLocale } = require('./next-intl.locales');

const RAW_BASE = process.env.BASE_URL || 'http://127.0.0.1:4311';
const BASE = RAW_BASE.replace(/\/$/, '');

function localeUrl(locale, path) {
  const normalizedPath = path === '/' ? '' : path;
  return locale === defaultLocale ? `${BASE}${normalizedPath}` : `${BASE}/${locale}${normalizedPath}`;
}

const secondaryLocale = locales.find((locale) => locale !== defaultLocale) || defaultLocale;
const targetLocales = Array.from(new Set([defaultLocale, secondaryLocale]));

const ROUTES = ['/', '/waitlist', '/method'];

function buildCollectTargets() {
  const entries = [];
  for (const locale of targetLocales) {
    for (const route of ROUTES) {
      entries.push({
        url: localeUrl(locale, route),
        route,
        locale,
        device: 'mobile',
      });
      entries.push({
        url: localeUrl(locale, route),
        route,
        locale,
        device: 'desktop',
      });
    }
  }
  return entries;
}

const TARGETS = buildCollectTargets();

const DESKTOP_SETTINGS = {
  formFactor: 'desktop',
  screenEmulation: { disabled: true },
  throttleMethod: 'devtools',
  throttlingMethod: 'devtools',
  onlyCategories: ['performance', 'accessibility', 'seo', 'best-practices'],
};

const MOBILE_SETTINGS = {
  formFactor: 'mobile',
  screenEmulation: { mobile: true, width: 360, height: 640, deviceScaleRatio: 2, disabled: false },
  throttleMethod: 'devtools',
  throttlingMethod: 'devtools',
  onlyCategories: ['performance', 'accessibility', 'seo', 'best-practices'],
};

const config = {
  ci: {
    collect: {
      startServerCommand: null,
      numberOfRuns: 1,
      url: TARGETS.filter((entry) => entry.device === 'mobile').map((entry) => entry.url),
      settings: MOBILE_SETTINGS,
      budgetsPath: './lighthouse-budgets.json',
    },
    assert: {
      assertions: {
        'categories:performance': ['error', { minScore: 0.9 }],
        'categories:accessibility': ['error', { minScore: 0.95 }],
        'categories:seo': ['error', { minScore: 0.95 }],
        'categories:best-practices': ['warn', { minScore: 0.9 }],
        'cumulative-layout-shift': ['error', { maxNumericValue: 0.02 }],
        'largest-contentful-paint': ['error', { maxNumericValue: 3000 }],
        'total-blocking-time': ['error', { maxNumericValue: 200 }],
      },
    },
    upload: { target: 'filesystem', outputDir: '.lighthouseci' },
  },
};

config.TARGETS = TARGETS;
config.locales = locales;
config.defaultLocale = defaultLocale;
config.DESKTOP_SETTINGS = DESKTOP_SETTINGS;
config.MOBILE_SETTINGS = MOBILE_SETTINGS;
config.ROUTES = ROUTES;
config.targetLocales = targetLocales;

module.exports = config;
