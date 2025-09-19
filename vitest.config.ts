import { defineConfig } from 'vitest/config';
import path from 'node:path';

export default defineConfig({
  resolve: {
    alias: {
      '@': path.resolve(__dirname, '.'),
    },
  },
  test: {
    include: ['tests/**/*.test.ts', 'tests/**/*.test.tsx', '__tests__/**/*.test.ts', '__tests__/**/*.test.tsx'],
    environment: 'jsdom',
    setupFiles: ['./vitest.setup.ts'],
    globals: true,
    coverage: {
      enabled: false,
    },
    exclude: ['e2e/**', 'playwright.config.ts'],
  },
});
