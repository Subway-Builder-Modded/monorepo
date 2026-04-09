import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import path from 'path';

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  optimizeDeps: {
    exclude: [
      '@subway-builder-modded/shared-ui',
      '@subway-builder-modded/asset-listings-ui',
      '@subway-builder-modded/stores-core',
      '@subway-builder-modded/asset-listings-state',
      '@subway-builder-modded/lifecycle-core',
      '@subway-builder-modded/lifecycle-web',
      '@subway-builder-modded/lifecycle-wails',
      '@subway-builder-modded/config',
    ],
  },
  test: {
    environment: 'node',
    coverage: {
      provider: 'v8',
      // Only measure coverage for lib utilities and stores — the tested surface area.
      // Components, pages, and Wails-integration stores are excluded because they
      // require a browser/desktop environment that isn't available in unit tests.
      include: ['src/lib/**', 'src/stores/**'],
      exclude: [
        // React/UI files — not unit-testable without jsdom
        'src/lib/flags.tsx',
        'src/lib/install-path.ts',
        'src/lib/local-accent.ts',
        // Pure type/constant declarations — no executable statements
        'src/lib/profile-update-request-type.ts',
        'src/lib/search.ts',
        'src/stores/asset-query-filter-store.ts',
        // Thin third-party wrappers — tested indirectly, no dedicated test file yet
        'src/lib/semver.ts',
        'src/lib/subscription-sync-error.ts',
        'src/lib/utils.ts',
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
