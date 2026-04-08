import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import path from 'path';

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@sbm/railyard': path.resolve(__dirname, '../../packages/railyard/src'),
      '@railyard-app/stores': path.resolve(__dirname, './src/stores'),
      '@railyard-app/wailsjs': path.resolve(__dirname, './wailsjs'),
    },
  },
  test: {
    environment: 'node',
    coverage: {
      provider: 'v8',
      // Only measure coverage for lib utilities and stores — the tested surface area.
      // Components, pages, and Wails-integration stores are excluded because they
      // require a browser/desktop environment that isn't available in unit tests.
      include: ['../../packages/railyard/src/lib/**', 'src/stores/**'],
      exclude: [
        // React/UI files — not unit-testable without jsdom
        '../../packages/railyard/src/lib/flags.tsx',
        '../../packages/railyard/src/lib/install-path.ts',
        '../../packages/railyard/src/lib/local-accent.ts',
        // Pure type/constant declarations — no executable statements
        '../../packages/railyard/src/lib/profile-update-request-type.ts',
        '../../packages/railyard/src/lib/search.ts',
        'src/stores/asset-query-filter-store.ts',
        // Thin third-party wrappers — tested indirectly, no dedicated test file yet
        '../../packages/railyard/src/lib/semver.ts',
        '../../packages/railyard/src/lib/subscription-sync-error.ts',
        '../../packages/railyard/src/lib/utils.ts',
        // Wails-integration stores — require running desktop context
        'src/stores/config-store.ts',
        'src/stores/game-store.ts',
        'src/stores/profile-store.ts',
        'src/stores/ui-store.ts',
      ],
      reporter: ['text', 'lcov'],
      reportOnFailure: true,
      thresholds: {
        statements: 80,
        branches: 55,
        functions: 85,
        lines: 80,
      },
    },
  },
});
