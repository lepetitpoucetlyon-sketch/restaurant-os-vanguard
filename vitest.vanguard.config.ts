import { defineConfig } from 'vitest/config';
import path from 'path';

/**
 * Config Vitest dédiée aux scénarios "Vanguard" sous src/e2e/**.
 * Ces tests exercent les cascades bout-en-bout (signature fiscale, bridge financier,
 * bus d'événements, shield NF525). Ils sont exclus du run principal (durée), mais
 * il faut qu'ils tournent au moins via `npm run test:vanguard`.
 */
export default defineConfig({
    test: {
        environment: 'happy-dom',
        globals: true,
        setupFiles: [
            './tests/setup.ts',
        ],
        include: ['src/e2e/**/*.test.ts'],
        // testTimeout élevé — ces scénarios peuvent orchestrer plusieurs adapters
        testTimeout: 60_000,
        hookTimeout: 30_000,
        env: {
            NEXUS_TENANT_SECRET: 'test-secret-for-vanguard',
            STRICT_ISOLATION_TEST: '1',
        },
    },
    resolve: {
        alias: {
            '@': path.resolve(__dirname, './src'),
            '@nexus/contracts': path.resolve(__dirname, './src/shared/nexus/contracts'),
        },
    },
});
