import path from 'node:path';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'jsdom',
    setupFiles: ['@testing-library/jest-dom/vitest', './tests/setup.ts'],
    include: ['**/*.test.ts', '**/*.test.tsx'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html'],
      include: [
        'lib/**/*.ts',
        'config/**/*.ts',
        'components/**/*.ts',
        'components/**/*.tsx',
        'app/**/*.tsx',
      ],
      exclude: [
        '**/*.d.ts',
        '**/*.test.ts',
        '**/*.test.tsx',
        'lib/**/*.server.ts',
        'lib/**/server.ts',
        'app/**/page.tsx',
        'app/**/layout.tsx',
        'app/layout.tsx',
      ],
      thresholds: {
        lines: 26,
        functions: 22,
        branches: 18,
        statements: 26,
      },
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, '.'),
    },
  },
});
