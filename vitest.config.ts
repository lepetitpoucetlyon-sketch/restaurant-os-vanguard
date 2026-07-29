import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
    test: {
        environment: 'jsdom',
        globals: true,
        setupFiles: ['tests/setup.ts'],
        include: ['src/**/*.test.{ts,tsx}', 'tests/**/*.test.{ts,tsx}'],
        exclude: ['tests/e2e/**'],
        coverage: {
            provider: 'v8',
            reporter: ['text', 'lcov'],
            include: ['src/**/*.{ts,tsx}'],
            exclude: ['src/**/*.test.{ts,tsx}', 'src/**/*.d.ts', 'src/e2e/**'],
            thresholds: {
                lines: 70,
            },
        },
        env: {
            NEXUS_TENANT_SECRET: 'test-secret-for-vitest'
        }
    },
    resolve: {
        alias: {
            // Next.js "server-only" n'est pas résoluble sous vitest → stub vide.
            'server-only': path.resolve(__dirname, './tests/stubs/empty-module.ts'),
            '@': path.resolve(__dirname, './src'),
            '@app': path.resolve(__dirname, './src/app'),
            '@components': path.resolve(__dirname, './src/shared/components'),
            '@modules': path.resolve(__dirname, './src/modules'),
            '@domain': path.resolve(__dirname, './src/domain'),
            '@hooks': path.resolve(__dirname, './src/hooks'),
            '@lib': path.resolve(__dirname, './src/lib'),
            '@store': path.resolve(__dirname, './src/store'),
            '@nexus': path.resolve(__dirname, './src/shared/nexus'),
            '@shared': path.resolve(__dirname, './src/shared'),
            '@ui': path.resolve(__dirname, './src/shared/components/ui'),
        },
    },
});
