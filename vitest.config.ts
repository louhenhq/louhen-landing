import { defineConfig, defineProject } from 'vitest/config';
import path from 'node:path';

export default defineConfig({
  resolve: {
    alias: {
      '@': path.resolve(__dirname, '.'),
      '@app': path.resolve(__dirname, 'app'),
      '@components': path.resolve(__dirname, 'components'),
      '@lib': path.resolve(__dirname, 'lib'),
      '@shared': path.resolve(__dirname, 'lib/shared'),
      '@server': path.resolve(__dirname, 'lib/server'),
      'server-only': path.resolve(__dirname, 'tests/unit/mocks/server-only.ts'),
      '@tests': path.resolve(__dirname, 'tests'),
    },
  },
  test: {
    setupFiles: ['./tests/unit/setup.server-mocks.ts', './tests/unit/vitest.setup.ts'],
    globals: true,
    allowOnly: !process.env.CI,
    exclude: [
      'tests/e2e/**',
      'tests/axe/**',
      'tests/accessibility/**',
      '**/*.e2e.{ts,tsx}',
      'artifacts/**',
      'playwright-report/**',
      '.next/**',
      'node_modules/**',
    ],
    watchExclude: ['artifacts/**', 'playwright-report/**', '.next/**', 'coverage/**'],
    coverage: {
      enabled: process.env.COVERAGE === '1' || process.env.CI === 'true',
      provider: 'v8',
      reporter: ['text', 'lcov'],
      include: [
        'lib/**/*.{ts,tsx}',
        'app/**/_lib/**/*.{ts,tsx}',
        'emails/**/*.{ts,tsx}',
      ],
      exclude: [
        'tests/**',
        '**/*.d.ts',
        '**/*.config.*',
        'scripts/**',
        '.next/**',
        'node_modules/**',
        'app/**/*.{page,layout,route}.tsx',
        'app/**/components/**/*.tsx',
      ],
      thresholds: {
        branches: 40,
        lines: 40,
        functions: 50,
        statements: 40,
        autoUpdate: false,
      },
    },
    include: ['tests/__never__/**/*'],
    projects: [
      defineProject({
        extends: true,
        test: {
          name: 'node',
          environment: 'node',
          include: ['tests/unit/**/*.{test,spec}.{ts,tsx}'],
          exclude: [
            'tests/unit/**/@(ui|components)/**/*.{test,spec}.{ts,tsx}',
            'tests/unit/**/*.{dom,ui}.{test,spec}.{ts,tsx}',
            'tests/unit/**/ui/**/*.{test,spec}.tsx',
            'tests/unit/analytics.spec.ts',
            'tests/unit/waitlist/referral.spec.ts',
          ],
        },
      }),
      defineProject({
        extends: true,
        test: {
          name: 'jsdom',
          environment: 'jsdom',
          include: [
            'tests/unit/**/@(ui|components)/**/*.{test,spec}.tsx',
            'tests/unit/**/*.{dom,ui}.{test,spec}.{ts,tsx}',
            'tests/unit/**/ui/**/*.{test,spec}.tsx',
            'tests/unit/analytics.spec.ts',
            'tests/unit/waitlist/referral.spec.ts',
          ],
        },
      }),
    ],
  },
});
