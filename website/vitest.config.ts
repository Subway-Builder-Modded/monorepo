import path from 'node:path';
import { defineConfig } from 'vitest/config';

const packageSrc = path.resolve(__dirname, '../packages/website/src');

export default defineConfig({
  test: {
    environment: 'jsdom',
    setupFiles: ['./tests/setup.ts'],
    include: [
      'app/**/*.test.ts',
      'app/**/*.test.tsx',
      '../packages/website/src/**/*.test.ts',
      '../packages/website/src/**/*.test.tsx',
    ],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html'],
      include: [
        '../packages/website/src/lib/**/*.ts',
        '../packages/website/src/config/**/*.ts',
        '../packages/website/src/components/**/*.ts',
        '../packages/website/src/components/**/*.tsx',
        'app/**/*.tsx',
      ],
      exclude: [
        '**/*.d.ts',
        '**/*.test.ts',
        '**/*.test.tsx',
        'app/**/page.tsx',
        'app/**/layout.tsx',
        'app/layout.tsx',
      ],
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, '.'),
      '@sbm/website': packageSrc,
    },
  },
});
