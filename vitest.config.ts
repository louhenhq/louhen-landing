import { defineConfig } from 'vitest/config';
import path from 'node:path';

export default defineConfig({
  resolve: {
    alias: {
      '@': path.resolve(__dirname, '.'),
      '@app': path.resolve(__dirname, 'app'),
      '@components': path.resolve(__dirname, 'components'),
      '@lib': path.resolve(__dirname, 'lib'),
      '@tests': path.resolve(__dirname, 'tests'),
    },
  },
  test: {
    include: [
      'tests/**/*.test.ts',
      'tests/**/*.test.tsx',
      'tests/**/*.spec.ts',
      'tests/**/*.spec.tsx',
      '__tests__/**/*.test.ts',
      '__tests__/**/*.test.tsx',
    ],
    environment: 'node',
    environmentMatchGlobs: [
      ['**/*.test.tsx', 'jsdom'],
      ['__tests__/**/*.test.tsx', 'jsdom'],
      ['tests/unit/**/*.spec.ts', 'jsdom'],
      ['tests/unit/**/*.unit.test.ts', 'jsdom'],
    ],
    setupFiles: ['./tests/unit/setup.server-mocks.ts', './tests/unit/vitest.setup.ts'],
    globals: true,
    coverage: {
      enabled: false,
    },
    exclude: ['e2e/**', 'playwright.config.ts', 'tests/e2e/**', 'tests/accessibility/**'],
  },
});
