/**
 * vitest.vanguard.config.ts
 * Config dédiée aux tests d'intégration NF525/Vanguard.
 * Ces tests utilisent le vrai CryptoService (SHA-256 réel) et MockAdapter.
 * Séparés de la suite unitaire pour ne pas alourdir `npx vitest run`.
 *
 * Usage : npx vitest run --config vitest.vanguard.config.ts
 */
import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['tests/setup.ts'],
    include: ['src/e2e/vanguard/fiscal-*.test.{ts,tsx}'],
    env: {
      NEXUS_TENANT_SECRET: 'test-secret-for-vitest',
      FISCAL_SIGNING_SECRET: 'test-fiscal-signing-secret',
    },
  },
  resolve: {
    alias: [
      { find: 'server-only', replacement: path.resolve(__dirname, './tests/stubs/empty-module.ts') },
      { find: '@/modules/intelligence', replacement: path.resolve(__dirname, './src/modules/intelligence') },
      { find: '@modules/intelligence', replacement: path.resolve(__dirname, './src/modules/intelligence') },
      { find: '@/modules/compliance', replacement: path.resolve(__dirname, './src/modules/compliance') },
      { find: '@modules/compliance', replacement: path.resolve(__dirname, './src/modules/compliance') },
      { find: '@/modules/finance', replacement: path.resolve(__dirname, './src/modules/finance') },
      { find: '@modules/finance', replacement: path.resolve(__dirname, './src/modules/finance') },
      { find: '@/modules/ops', replacement: path.resolve(__dirname, './src/modules/ops') },
      { find: '@modules/ops', replacement: path.resolve(__dirname, './src/modules/ops') },
      { find: '@/modules', replacement: path.resolve(__dirname, './src/modules') },
      { find: '@modules', replacement: path.resolve(__dirname, './src/modules') },
      { find: '@domain', replacement: path.resolve(__dirname, './src/shared') },
      { find: '@lib', replacement: path.resolve(__dirname, './src/lib') },
      { find: '@store', replacement: path.resolve(__dirname, './src/store') },
      { find: '@nexus', replacement: path.resolve(__dirname, './src/shared/nexus') },
      { find: '@shared', replacement: path.resolve(__dirname, './src/shared') },
      { find: '@ui', replacement: path.resolve(__dirname, './src/shared/components/ui') },
      { find: '@components', replacement: path.resolve(__dirname, './src/shared/components') },
      { find: '@verticals', replacement: path.resolve(__dirname, './src/verticals') },
      { find: '@app', replacement: path.resolve(__dirname, './src/app') },
      { find: '@', replacement: path.resolve(__dirname, './src') },
    ],
  },
});
